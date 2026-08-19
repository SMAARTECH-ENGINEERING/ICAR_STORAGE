const Alert = require('../models/Alert');
const socketService = require('../sockets');
const pushService = require('./pushService');
const env = require('../config/env');
const { ALERT_TYPE, ALERT_SEVERITY, ALERT_STATUS } = require('../utils/constants');

function buildDedupeKey(deviceId, type, parameter) {
  return `${deviceId}:${type}:${parameter || ''}`;
}

async function raiseAlert({ roomId, deviceId, type, parameter, value, threshold, severity }) {
  const dedupeKey = buildDedupeKey(deviceId, type, parameter);

  const existing = await Alert.findOne({ dedupeKey, status: ALERT_STATUS.ACTIVE });
  if (existing) {
    return existing;
  }

  const alert = await Alert.create({
    roomId,
    deviceId,
    type,
    parameter,
    value,
    threshold,
    severity: severity || ALERT_SEVERITY.MEDIUM,
    status: ALERT_STATUS.ACTIVE,
    dedupeKey,
  });

  socketService.emitToRoomAndDevice(roomId, deviceId, 'alert:created', alert);
  // Fire-and-forget: push delivery must never add latency or risk to the
  // telemetry/alert-evaluation path that triggered this.
  pushService.notifyAlertCreated(alert);
  return alert;
}

async function resolveAlert(deviceId, type, parameter) {
  const dedupeKey = buildDedupeKey(deviceId, type, parameter);
  const alert = await Alert.findOneAndUpdate(
    { dedupeKey, status: ALERT_STATUS.ACTIVE },
    { status: ALERT_STATUS.RESOLVED, resolvedAt: new Date() },
    { new: true }
  );
  if (alert) {
    socketService.emitToRoomAndDevice(alert.roomId, alert.deviceId, 'alert:resolved', alert);
  }
  return alert;
}

// Compares an individual zone's readings against globally configured thresholds
// (env-driven, not per-device hardcoded) and raises/resolves alerts accordingly.
async function evaluateZoneAlerts(roomId, deviceId, zoneName, zoneData) {
  if (!zoneData) return;

  if (typeof zoneData.temperature_c === 'number') {
    if (zoneData.temperature_c >= env.ALERT_TEMP_HIGH_C) {
      await raiseAlert({
        roomId,
        deviceId,
        type: ALERT_TYPE.HIGH_TEMPERATURE,
        parameter: zoneName,
        value: zoneData.temperature_c,
        threshold: env.ALERT_TEMP_HIGH_C,
        severity: ALERT_SEVERITY.HIGH,
      });
    } else {
      await resolveAlert(deviceId, ALERT_TYPE.HIGH_TEMPERATURE, zoneName);
    }
  }

  if (typeof zoneData.humidity_percent === 'number') {
    if (zoneData.humidity_percent >= env.ALERT_HUMIDITY_HIGH_PERCENT) {
      await raiseAlert({
        roomId,
        deviceId,
        type: ALERT_TYPE.HIGH_HUMIDITY,
        parameter: zoneName,
        value: zoneData.humidity_percent,
        threshold: env.ALERT_HUMIDITY_HIGH_PERCENT,
        severity: ALERT_SEVERITY.MEDIUM,
      });
    } else {
      await resolveAlert(deviceId, ALERT_TYPE.HIGH_HUMIDITY, zoneName);
    }
  }

  if (typeof zoneData.co2_ppm === 'number') {
    if (zoneData.co2_ppm >= env.ALERT_CO2_HIGH_PPM) {
      await raiseAlert({
        roomId,
        deviceId,
        type: ALERT_TYPE.HIGH_CO2,
        parameter: zoneName,
        value: zoneData.co2_ppm,
        threshold: env.ALERT_CO2_HIGH_PPM,
        severity: ALERT_SEVERITY.CRITICAL,
      });
    } else {
      await resolveAlert(deviceId, ALERT_TYPE.HIGH_CO2, zoneName);
    }
  }
}

async function evaluateSensorAlerts(roomId, deviceId, sensors = {}) {
  const zoneNames = Object.keys(sensors);
  await Promise.all(zoneNames.map((zoneName) => evaluateZoneAlerts(roomId, deviceId, zoneName, sensors[zoneName])));
}

async function raiseDeviceOfflineAlert(roomId, deviceId) {
  return raiseAlert({
    roomId,
    deviceId,
    type: ALERT_TYPE.DEVICE_OFFLINE,
    parameter: 'connectivity',
    severity: ALERT_SEVERITY.HIGH,
  });
}

async function resolveDeviceOfflineAlert(deviceId) {
  return resolveAlert(deviceId, ALERT_TYPE.DEVICE_OFFLINE, 'connectivity');
}

async function listAlerts(filter = {}) {
  const query = {};
  if (filter.roomId) query.roomId = filter.roomId;
  if (filter.deviceId) query.deviceId = filter.deviceId;
  if (filter.status) query.status = filter.status;
  return Alert.find(query).sort({ createdAt: -1 }).limit(filter.limit || 200);
}

module.exports = {
  raiseAlert,
  resolveAlert,
  evaluateSensorAlerts,
  raiseDeviceOfflineAlert,
  resolveDeviceOfflineAlert,
  listAlerts,
};
