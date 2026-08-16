/*
  ESP32 Multi-Sensor + 4-Channel Relay + GSM Telemetry Push
  ----------------------------------------------------------------
  Sensors (I2C, shared SDA=21 / SCL=22):
    upper  -> SHT20  (0x40) - manual no-hold driver (avoids clock stretch)
    middle -> SHT40  (0x44)
    lower  -> BME280 (0x76) - temp/hum/pressure
    co2    -> SCD40  (0x62)

  Relays:
    Relay 1 (GPIO 25) - AUTO: ON when highest of the 3 temps >= 30C,
                               OFF when it drops <= 28C (hysteresis band
                               between 28-30C keeps prior state).
    Relay 2 (GPIO 26) - MANUAL: Serial command  R2 ON / R2 OFF
    Relay 3 (GPIO 27) - MANUAL: Serial command  R3 ON / R3 OFF
    Relay 4 (GPIO 14) - MANUAL: Serial command  R4 ON / R4 OFF
    (Type commands in Serial Monitor, e.g.:  R2 ON )

  GSM Telemetry:
    Every TELEMETRY_INTERVAL_MS, POSTs a JSON payload (matching your
    schema) to icarstorage.smaatechengineering.com over the GSM modem.

    NOTE: the API server sits behind a reverse proxy that permanently
    redirects plain HTTP to HTTPS (HTTP 308, empty body). ArduinoHttpClient
    does not follow redirects, so the telemetry POST must go out over TLS
    on port 443 directly - see TinyGsmClientSecure + port 443 below.

  ====================== REQUIRED LIBRARIES ======================
    - "Adafruit SHT4x Library"          -> SHT40
    - "Adafruit BME280 Library"         -> BME280
    - "Adafruit Unified Sensor"         -> (BME280 dependency)
    - "SparkFun SCD4x Arduino Library"  -> SCD40
    - "TinyGSM"                         -> GSM modem
    - "ArduinoHttpClient"               -> HTTP over GSM
    - "ArduinoJson"                     -> JSON building
  ==================================================================

  ====================== SET YOUR GSM MODULE ======================
  You said you're not sure which GSM module you have - check the
  text printed on the module's PCB/chip and uncomment ONE line below.
  If truly unsure, SIM800L is left active as the default (most common
  low-cost module used with ESP32).
*/
//#define TINY_GSM_MODEM_SIM800        // <-- default (most common)
 #define TINY_GSM_MODEM_SIM7600     // uncomment if you have SIM7600 (4G)
// #define TINY_GSM_MODEM_A7670       // uncomment if you have A7670C/A7670E (4G)

#include <Wire.h>
#include <Adafruit_SHT4x.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <SparkFun_SCD4x_Arduino_Library.h>
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// ================= I2C SENSOR CONFIG =================
#define SDA_PIN 21
#define SCL_PIN 22

#define SHT20_ADDR           0x40
#define SHT20_TRIG_T_NOHOLD  0xF3
#define SHT20_TRIG_RH_NOHOLD 0xF5

Adafruit_SHT4x sht40 = Adafruit_SHT4x();
Adafruit_BME280 bme280;
#define BME280_ADDR 0x76   // change to 0x77 if needed
SCD4x scd40;

bool sht40Found  = false;
bool bme280Found = false;
bool scd40Found  = false;

// ================= RELAY CONFIG =================
#define RELAY1_PIN 4   // AUTO  - temperature controlled
#define RELAY2_PIN 5   // MANUAL
#define RELAY3_PIN 18   // MANUAL
#define RELAY4_PIN 19   // MANUAL

// Set true if your relay board is ACTIVE-LOW (most cheap relay
// modules are - i.e. LOW turns the relay ON). Flip if relays behave backwards.
#define RELAY_ACTIVE_LOW true

const float THRESHOLD_ON_C  = 30.0;  // relay1 turns ON at/above this
const float THRESHOLD_OFF_C = 28.0;  // relay1 turns OFF at/below this

bool relay1State = false;  // auto
bool relay2State = false;  // manual
bool relay3State = true;   // manual (example default ON, matches your sample)
bool relay4State = false;  // manual

void writeRelay(uint8_t pin, bool on) {
  bool level = RELAY_ACTIVE_LOW ? !on : on;
  digitalWrite(pin, level ? HIGH : LOW);
}

// ================= GSM / SERVER CONFIG =================
// UART pins to the GSM modem (adjust to your wiring)
#define MODEM_RX_PIN 16   // ESP32 RX  <- modem TX
#define MODEM_TX_PIN 17   // ESP32 TX  -> modem RX
#define MODEM_PWRKEY_PIN -1   // set to a GPIO if your module needs a power-key pulse, else -1

HardwareSerial SerialAT(1);
TinyGsm modem(SerialAT);

// Server enforces HTTPS (plain HTTP on :80 gets 308-redirected and dropped,
// since ArduinoHttpClient can't follow redirects) - use the TLS client.
TinyGsmClientSecure gsmClient(modem);

// ---- SIM / network ----
const char apn[]      = "internet";      // <-- SET YOUR SIM CARD'S APN
const char gprsUser[] = "";
const char gprsPass[] = "";

// ---- API target (from your example) ----
const char server[]   = "icarstorage.smaatechengineering.com";
const int  port       = 443;             // HTTPS - server 308-redirects plain :80
const char endpoint[] = "/api/v1/devices/telemetry";
const char deviceKey[] = "change_this_shared_device_key";  // <-- SET YOUR REAL DEVICE KEY
const char deviceId[]  = "7semi_env_ctrl_1786715059";       // <-- SET YOUR DEVICE ID

HttpClient http(gsmClient, server, port);

const unsigned long TELEMETRY_INTERVAL_MS = 30000; // push every 30s
unsigned long lastTelemetryMs = 0;

// ================= SHT20 MANUAL READ =================
float readSHT20(uint8_t command) {
  Wire.beginTransmission(SHT20_ADDR);
  Wire.write(command);
  if (Wire.endTransmission() != 0) return NAN;

  delay(command == SHT20_TRIG_T_NOHOLD ? 85 : 29);

  if (Wire.requestFrom((int)SHT20_ADDR, 3) != 3) return NAN;

  uint16_t raw = (Wire.read() << 8);
  raw |= Wire.read();
  raw &= 0xFFFC;
  Wire.read(); // CRC, not checked

  if (command == SHT20_TRIG_T_NOHOLD) {
    return -46.85 + 175.72 * ((float)raw / 65536.0);
  } else {
    return -6.0 + 125.0 * ((float)raw / 65536.0);
  }
}

// ================= SERIAL COMMANDS (manual relays) =================
// Type in Serial Monitor: R2 ON | R2 OFF | R3 ON | R3 OFF | R4 ON | R4 OFF
void handleSerialCommands() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  line.toUpperCase();

  if (line.length() == 0) return;

  bool on = line.endsWith("ON");
  bool off = line.endsWith("OFF");
  if (!on && !off) {
    Serial.println("Unknown command. Use: R2 ON / R2 OFF / R3 ON / R3 OFF / R4 ON / R4 OFF");
    return;
  }

  if (line.startsWith("R2")) {
    relay2State = on;
    Serial.printf("Relay 2 set to %s (manual)\n", on ? "ON" : "OFF");
  } else if (line.startsWith("R3")) {
    relay3State = on;
    Serial.printf("Relay 3 set to %s (manual)\n", on ? "ON" : "OFF");
  } else if (line.startsWith("R4")) {
    relay4State = on;
    Serial.printf("Relay 4 set to %s (manual)\n", on ? "ON" : "OFF");
  } else {
    Serial.println("Unknown relay. Use R2 / R3 / R4 (relay 1 is auto-only).");
  }
}

// ================= TIMESTAMP (from GSM network time) =================
String getIsoTimestamp() {
  int year, month, day, hour, min, sec;
  float timezone;
  if (modem.getNetworkTime(&year, &month, &day, &hour, &min, &sec, &timezone)
      && year >= 2020 && year <= 2100) {
    char buf[32];
    snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02d.000Z",
             year, month, day, hour, min, sec);
    return String(buf);
  }
  return "1970-01-01T00:00:00.000Z"; // fallback if network time unavailable/unsynced
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== ESP32 Env Controller: Sensors + Relays + GSM Telemetry ===");

  // ---- Relays ----
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  pinMode(RELAY3_PIN, OUTPUT);
  pinMode(RELAY4_PIN, OUTPUT);
  writeRelay(RELAY1_PIN, relay1State);
  writeRelay(RELAY2_PIN, relay2State);
  writeRelay(RELAY3_PIN, relay3State);
  writeRelay(RELAY4_PIN, relay4State);

  // ---- I2C sensors ----
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);
#if defined(ESP32)
  Wire.setTimeOut(100);
#endif
  Serial.println("SHT20  : ready (addr 0x40, no-hold mode)");

  if (sht40.begin()) {
    sht40.setPrecision(SHT4X_HIGH_PRECISION);
    sht40.setHeater(SHT4X_NO_HEATER);
    sht40Found = true;
    Serial.println("SHT40  : found (addr 0x44)");
  } else {
    Serial.println("SHT40  : NOT FOUND");
  }

  if (bme280.begin(BME280_ADDR)) {
    bme280Found = true;
    Serial.println("BME280 : found");
  } else {
    Serial.println("BME280 : NOT FOUND (try addr 0x77)");
  }

  if (scd40.begin()) {
    scd40Found = true;
    scd40.startPeriodicMeasurement();
    Serial.println("SCD40  : found, periodic measurement started");
  } else {
    Serial.println("SCD40  : NOT FOUND");
  }

  // ---- GSM modem ----
  if (MODEM_PWRKEY_PIN >= 0) {
    pinMode(MODEM_PWRKEY_PIN, OUTPUT);
    digitalWrite(MODEM_PWRKEY_PIN, LOW);
    delay(1000);
    digitalWrite(MODEM_PWRKEY_PIN, HIGH);
    delay(1000);
    digitalWrite(MODEM_PWRKEY_PIN, LOW);
  }

  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX_PIN, MODEM_TX_PIN);
  delay(3000);

  Serial.println("Initializing GSM modem...");
  modem.restart();

  Serial.print("Waiting for network...");
  if (!modem.waitForNetwork(60000L)) {
    Serial.println(" FAILED. Check SIM/antenna/signal.");
  } else {
    Serial.println(" OK");
  }

  Serial.print("Connecting GPRS (APN: ");
  Serial.print(apn);
  Serial.print(")...");
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    Serial.println(" FAILED. Check APN.");
  } else {
    Serial.println(" OK");
  }

  // HTTPS handshakes over cellular can be slow - give it more room than
  // ArduinoHttpClient's default before declaring the request dead.
  http.setHttpResponseTimeout(15000);

  Serial.println("=============================================\n");
}

// ================= LOOP =================
void loop() {
  handleSerialCommands();

  // ---------- Read sensors ----------
  float upperTemp = readSHT20(SHT20_TRIG_T_NOHOLD);
  float upperHum  = readSHT20(SHT20_TRIG_RH_NOHOLD);

  float middleTemp = NAN, middleHum = NAN;
  if (sht40Found) {
    sensors_event_t humidity, temp;
    sht40.getEvent(&humidity, &temp);
    middleTemp = temp.temperature;
    middleHum  = humidity.relative_humidity;
  }

  float lowerTemp = NAN, lowerHum = NAN, lowerPres = NAN;
  if (bme280Found) {
    lowerTemp = bme280.readTemperature();
    lowerHum  = bme280.readHumidity();
    lowerPres = bme280.readPressure() / 100.0F;
  }

  uint16_t co2 = 0;
  if (scd40Found && scd40.readMeasurement()) {
    co2 = scd40.getCO2();
  }

  // ---------- Relay 1: AUTO temperature control ----------
  // Highest valid temp among the 3 sensors (ignore any that failed / NaN)
  float highestTemp = -1000;
  bool haveValidTemp = false;
  for (float t : {upperTemp, middleTemp, lowerTemp}) {
    if (!isnan(t) && t > highestTemp) { highestTemp = t; haveValidTemp = true; }
  }
  if (haveValidTemp) {
    if (highestTemp >= THRESHOLD_ON_C) relay1State = true;
    else if (highestTemp <= THRESHOLD_OFF_C) relay1State = false;
    // else: within hysteresis band -> keep previous state
  }

  writeRelay(RELAY1_PIN, relay1State);
  writeRelay(RELAY2_PIN, relay2State);
  writeRelay(RELAY3_PIN, relay3State);
  writeRelay(RELAY4_PIN, relay4State);

  // ---------- Print locally ----------
  Serial.println("---------------------------------------------");
  Serial.printf("Upper (SHT20)  T:%.2fC H:%.2f%%\n", upperTemp, upperHum);
  Serial.printf("Middle(SHT40)  T:%.2fC H:%.2f%%\n", middleTemp, middleHum);
  Serial.printf("Lower (BME280) T:%.2fC H:%.2f%% P:%.2fhPa\n", lowerTemp, lowerHum, lowerPres);
  Serial.printf("CO2  (SCD40)   %u ppm\n", co2);
  Serial.printf("Relay1(auto)=%s  Relay2=%s  Relay3=%s  Relay4=%s  [highestT=%.2fC]\n",
                relay1State ? "ON" : "OFF", relay2State ? "ON" : "OFF",
                relay3State ? "ON" : "OFF", relay4State ? "ON" : "OFF", highestTemp);

  // ---------- Push telemetry over GSM every TELEMETRY_INTERVAL_MS ----------
  if (millis() - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = millis();
    sendTelemetry(upperTemp, upperHum, middleTemp, middleHum,
                  lowerTemp, lowerHum, lowerPres, co2, highestTemp);
  }

  Serial.println("---------------------------------------------\n");
  delay(3000);
}

// ================= BUILD + POST JSON =================
void sendTelemetry(float upperTemp, float upperHum,
                    float middleTemp, float middleHum,
                    float lowerTemp, float lowerHum, float lowerPres,
                    uint16_t co2, float highestTemp) {

  if (!modem.isGprsConnected()) {
    Serial.println("GPRS not connected - attempting reconnect...");
    modem.gprsConnect(apn, gprsUser, gprsPass);
  }

  StaticJsonDocument<1024> doc;
  doc["device_id"] = deviceId;
  doc["timestamp"] = getIsoTimestamp();

  JsonObject sensors = doc.createNestedObject("sensors");

  JsonObject upper = sensors.createNestedObject("upper");
  upper["sensor_model"] = "SHT20";
  upper["temperature_c"] = isnan(upperTemp) ? 0 : upperTemp;
  upper["humidity_percent"] = isnan(upperHum) ? 0 : upperHum;

  JsonObject middle = sensors.createNestedObject("middle");
  middle["sensor_model"] = "SHT40";
  middle["temperature_c"] = isnan(middleTemp) ? 0 : middleTemp;
  middle["humidity_percent"] = isnan(middleHum) ? 0 : middleHum;

  JsonObject lower = sensors.createNestedObject("lower");
  lower["sensor_model"] = "BME280";
  lower["temperature_c"] = isnan(lowerTemp) ? 0 : lowerTemp;
  lower["humidity_percent"] = isnan(lowerHum) ? 0 : lowerHum;
  lower["pressure_hpa"] = isnan(lowerPres) ? 0 : lowerPres;

  JsonObject co2Obj = sensors.createNestedObject("co2");
  co2Obj["sensor_model"] = "SCD40";
  co2Obj["co2_ppm"] = co2;

  JsonObject relays = doc.createNestedObject("relays");

  JsonObject r1 = relays.createNestedObject("relay_1");
  r1["mode"] = "auto";
  r1["state"] = relay1State ? "ON" : "OFF";
  r1["control_source"] = "temperature_high";
  r1["controlling_zone"] = "max_of_upper_middle_lower";
  r1["highest_temperature_c"] = highestTemp;
  r1["threshold_on_c"] = THRESHOLD_ON_C;
  r1["threshold_off_c"] = THRESHOLD_OFF_C;

  JsonObject r2 = relays.createNestedObject("relay_2");
  r2["mode"] = "manual";
  r2["state"] = relay2State ? "ON" : "OFF";

  JsonObject r3 = relays.createNestedObject("relay_3");
  r3["mode"] = "manual";
  r3["state"] = relay3State ? "ON" : "OFF";

  JsonObject r4 = relays.createNestedObject("relay_4");
  r4["mode"] = "manual";
  r4["state"] = relay4State ? "ON" : "OFF";

  String payload;
  serializeJson(doc, payload);

  Serial.println("Telemetry JSON:");
  Serial.println(payload);

  http.beginRequest();
  http.post(endpoint);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("x-device-key", deviceKey);
  http.sendHeader("Content-Length", payload.length());
  http.beginBody();
  http.print(payload);
  http.endRequest();

  int statusCode = http.responseStatusCode();
  String response = http.responseBody();
  Serial.printf("HTTP POST status: %d\n", statusCode);
  Serial.println("Response: " + response);
}
