const Device = require('../models/Device');
const SensorReading = require('../models/SensorReading');
const DeviceState = require('../models/DeviceState');
const ApiError = require('../utils/ApiError');
const { telemetrySchema } = require('../validators/telemetryValidator');
const { DEVICE_STATUS, COMMAND_SOURCE } = require('../utils/constants');
const relayService = require('./relayService');
const automationService = require('./automationService');
const relayCommandService = require('./relayCommandService');
const alertService = require('./alertService');
const socketService = require('../sockets');
const logger = require('../config/logger');

async function processTelemetry(rawPayload) {
  const { error, value: payload } = telemetrySchema.validate(rawPayload, { abortEarly: false });
  if (error) {
    throw ApiError.badRequest(
      'Invalid telemetry payload',
      'INVALID_TELEMETRY_PAYLOAD',
      error.details.map((d) => d.message)
    );
  }

  const deviceId = payload.device_id;
  const device = await Device.findOne({ deviceId });
  if (!device) {
    throw ApiError.notFound(`Unknown device: ${deviceId}`, 'UNKNOWN_DEVICE');
  }

  const roomId = device.roomId;
  const timestamp = new Date(payload.timestamp);
  const wasOffline = device.status !== DEVICE_STATUS.ONLINE;

  await SensorReading.create({
    roomId,
    deviceId,
    timestamp,
    sensors: payload.sensors || {},
    relays: payload.relays || {},
  });

  const deviceState = await DeviceState.findOneAndUpdate(
    { deviceId },
    {
      $set: {
        roomId,
        sensors: payload.sensors || {},
        relays: payload.relays || {},
        lastUpdated: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  device.lastSeen = new Date();
  device.status = DEVICE_STATUS.ONLINE;
  await device.save();

  await relayService.syncRelaysFromTelemetry(deviceId, payload.relays || {});

  if (wasOffline) {
    socketService.emitToRoomAndDevice(roomId, deviceId, 'device:online', {
      deviceId,
      roomId,
      lastSeen: device.lastSeen,
    });
    await alertService.resolveDeviceOfflineAlert(deviceId);
  }

  socketService.emitToRoomAndDevice(roomId, deviceId, 'device:telemetry', {
    deviceId,
    roomId,
    timestamp,
    sensors: payload.sensors,
    relays: payload.relays,
  });

  // Automation runs after persistence so it always evaluates against the
  // latest stored state, then issues commands only for relays that actually change.
  try {
    const decisions = await automationService.evaluateDevice(deviceId, payload.sensors || {});
    for (const decision of decisions) {
      if (!decision.changed) continue;
      await relayCommandService.issueCommand({
        roomId,
        deviceId,
        relayId: decision.relayId,
        requestedState: decision.desiredState,
        source: COMMAND_SOURCE.AUTOMATION,
        requestedBy: 'automation-engine',
      });
    }
  } catch (err) {
    logger.error('Automation evaluation failed for device %s: %s', deviceId, err.message);
  }

  try {
    await alertService.evaluateSensorAlerts(roomId, deviceId, payload.sensors || {});
  } catch (err) {
    logger.error('Alert evaluation failed for device %s: %s', deviceId, err.message);
  }

  return {
    deviceId,
    roomId,
    stored: true,
    timestamp,
    state: deviceState,
  };
}

module.exports = { processTelemetry };
