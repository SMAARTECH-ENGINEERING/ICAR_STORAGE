const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const deviceService = require('../services/deviceService');
const telemetryService = require('../services/telemetryService');
const relayCommandService = require('../services/relayCommandService');
const auditService = require('../services/auditService');

const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body);
  await auditService.record({
    userId: req.user.userId,
    action: 'DEVICE_CREATED',
    roomId: device.roomId,
    deviceId: device.deviceId,
    newValue: req.body,
  });
  return sendSuccess(res, 201, device, 'Device created');
});

const listDevices = catchAsync(async (req, res) => {
  const devices = await deviceService.listDevices({
    roomId: req.query.roomId,
    status: req.query.status,
  });
  return sendSuccess(res, 200, devices);
});

const getDevice = catchAsync(async (req, res) => {
  const device = await deviceService.getDeviceByDeviceId(req.params.deviceId);
  return sendSuccess(res, 200, device);
});

const updateDevice = catchAsync(async (req, res) => {
  const previous = await deviceService.getDeviceByDeviceId(req.params.deviceId);
  const device = await deviceService.updateDevice(req.params.deviceId, req.body);
  await auditService.record({
    userId: req.user.userId,
    action: 'DEVICE_UPDATED',
    roomId: device.roomId,
    deviceId: device.deviceId,
    previousValue: previous.toObject(),
    newValue: req.body,
  });
  return sendSuccess(res, 200, device, 'Device updated');
});

const deleteDevice = catchAsync(async (req, res) => {
  const device = await deviceService.deleteDevice(req.params.deviceId);
  await auditService.record({
    userId: req.user.userId,
    action: 'DEVICE_DELETED',
    roomId: device.roomId,
    deviceId: device.deviceId,
    previousValue: device.toObject(),
  });
  return sendSuccess(res, 200, device, 'Device deleted');
});

const postTelemetry = catchAsync(async (req, res) => {
  const result = await telemetryService.processTelemetry(req.body);
  return sendSuccess(res, 201, result, 'Telemetry received');
});

// Device-authenticated: the device polls this to discover relay commands
// issued since its last check (replaces the MQTT command topic's push).
const getPendingCommands = catchAsync(async (req, res) => {
  await deviceService.getDeviceByDeviceId(req.params.deviceId);
  const commands = await relayCommandService.listPendingCommands(req.params.deviceId);
  return sendSuccess(res, 200, commands);
});

// Device-authenticated: the device POSTs the result after executing a
// pending command (replaces the MQTT ack topic).
const acknowledgeCommand = catchAsync(async (req, res) => {
  await deviceService.getDeviceByDeviceId(req.params.deviceId);
  const command = await relayCommandService.handleAck(req.params.deviceId, {
    commandId: req.params.commandId,
    ...req.body,
  });
  return sendSuccess(res, 200, command, 'Acknowledgement processed');
});

module.exports = {
  createDevice,
  listDevices,
  getDevice,
  updateDevice,
  deleteDevice,
  postTelemetry,
  getPendingCommands,
  acknowledgeCommand,
};
