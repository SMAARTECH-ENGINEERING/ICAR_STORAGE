const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const deviceService = require('../services/deviceService');
const relayService = require('../services/relayService');
const relayCommandService = require('../services/relayCommandService');
const automationService = require('../services/automationService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');
const { COMMAND_SOURCE } = require('../utils/constants');

const listRelays = catchAsync(async (req, res) => {
  await deviceService.getDeviceByDeviceId(req.params.deviceId);
  const relays = await relayService.listRelaysForDevice(req.params.deviceId);
  return sendSuccess(res, 200, relays);
});

const sendRelayCommand = catchAsync(async (req, res) => {
  const { deviceId, relayId } = req.params;
  const { mode, state } = req.body;

  const device = await deviceService.getDeviceByDeviceId(deviceId);
  const relay = await relayService.getRelay(deviceId, relayId);

  if (relay.deviceId !== deviceId) {
    throw ApiError.badRequest('Relay does not belong to the specified device', 'RELAY_DEVICE_MISMATCH');
  }

  const command = await relayCommandService.issueCommand({
    roomId: device.roomId,
    deviceId,
    relayId,
    requestedState: state,
    mode,
    source: COMMAND_SOURCE.MANUAL,
    requestedBy: req.user.userId,
  });

  return sendSuccess(res, 202, command, 'Relay command issued');
});

const getRelayCommandHistory = catchAsync(async (req, res) => {
  await deviceService.getDeviceByDeviceId(req.params.deviceId);
  const history = await relayCommandService.listCommandHistory(
    req.params.deviceId,
    req.params.relayId,
    parseInt(req.query.limit, 10) || 50
  );
  return sendSuccess(res, 200, history);
});

const getAutomationRule = catchAsync(async (req, res) => {
  const rule = await automationService.getRule(req.params.deviceId, req.params.relayId);
  return sendSuccess(res, 200, rule);
});

const listAutomationRules = catchAsync(async (req, res) => {
  await deviceService.getDeviceByDeviceId(req.params.deviceId);
  const rules = await automationService.listRulesForDevice(req.params.deviceId);
  return sendSuccess(res, 200, rules);
});

const upsertAutomationRule = catchAsync(async (req, res) => {
  const { deviceId, relayId } = req.params;
  await deviceService.getDeviceByDeviceId(deviceId);
  await relayService.getRelay(deviceId, relayId);

  const rule = await automationService.upsertRule(deviceId, relayId, req.body);

  await auditService.record({
    userId: req.user.userId,
    action: 'AUTOMATION_RULE_CONFIGURED',
    deviceId,
    relayId,
    newValue: req.body,
  });

  return sendSuccess(res, 200, rule, 'Automation rule saved');
});

module.exports = {
  listRelays,
  sendRelayCommand,
  getRelayCommandHistory,
  getAutomationRule,
  listAutomationRules,
  upsertAutomationRule,
};
