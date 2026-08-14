const dotenv = require('dotenv');

dotenv.config();

function toInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toFloat(value, fallback) {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toInt(process.env.PORT, 5000),

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/icar_storage',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  DEVICE_API_KEY: process.env.DEVICE_API_KEY || 'dev_device_api_key_change_me',

  DEVICE_OFFLINE_TIMEOUT_SECONDS: toInt(process.env.DEVICE_OFFLINE_TIMEOUT_SECONDS, 60),
  DEVICE_STATUS_SWEEP_INTERVAL_SECONDS: toInt(process.env.DEVICE_STATUS_SWEEP_INTERVAL_SECONDS, 30),
  // Ack-wait window after a command is delivered via a poll of
  // GET /devices/:deviceId/commands/pending — should comfortably exceed the
  // device's polling interval plus however long it takes to actuate a relay.
  RELAY_COMMAND_TIMEOUT_MS: toInt(process.env.RELAY_COMMAND_TIMEOUT_MS, 30000),

  ALERT_TEMP_HIGH_C: toFloat(process.env.ALERT_TEMP_HIGH_C, 35),
  ALERT_HUMIDITY_HIGH_PERCENT: toFloat(process.env.ALERT_HUMIDITY_HIGH_PERCENT, 85),
  ALERT_CO2_HIGH_PPM: toFloat(process.env.ALERT_CO2_HIGH_PPM, 1500),

  SENSOR_DATA_RETENTION_DAYS: toInt(process.env.SENSOR_DATA_RETENTION_DAYS, 30),
  RETENTION_CLEANUP_CRON: process.env.RETENTION_CLEANUP_CRON || '0 3 * * *',

  TEMP_MIN_C: toFloat(process.env.TEMP_MIN_C, -40),
  TEMP_MAX_C: toFloat(process.env.TEMP_MAX_C, 125),
  HUMIDITY_MIN_PERCENT: toFloat(process.env.HUMIDITY_MIN_PERCENT, 0),
  HUMIDITY_MAX_PERCENT: toFloat(process.env.HUMIDITY_MAX_PERCENT, 100),
  CO2_MIN_PPM: toFloat(process.env.CO2_MIN_PPM, 0),
  CO2_MAX_PPM: toFloat(process.env.CO2_MAX_PPM, 10000),
  PRESSURE_MIN_HPA: toFloat(process.env.PRESSURE_MIN_HPA, 300),
  PRESSURE_MAX_HPA: toFloat(process.env.PRESSURE_MAX_HPA, 1100),

  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = env;
