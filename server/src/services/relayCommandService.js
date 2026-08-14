const RelayCommand = require('../models/RelayCommand');
const Relay = require('../models/Relay');
const socketService = require('../sockets');
const auditService = require('./auditService');
const ApiError = require('../utils/ApiError');
const { generateId } = require('../utils/idGenerator');
const { COMMAND_STATUS, COMMAND_SOURCE } = require('../utils/constants');
const env = require('../config/env');
const logger = require('../config/logger');

const pendingTimeouts = new Map();

// The ack-wait clock starts once a command is actually delivered to the
// device (i.e. picked up by a poll), not when it's created — a slow-polling
// device shouldn't time out before it ever had a chance to see the command.
function scheduleTimeout(commandId) {
  const timer = setTimeout(async () => {
    pendingTimeouts.delete(commandId);
    const command = await RelayCommand.findOne({ commandId });
    if (!command) return;
    if ([COMMAND_STATUS.SENT, COMMAND_STATUS.PENDING].includes(command.status)) {
      command.status = COMMAND_STATUS.TIMEOUT;
      command.error = 'No acknowledgement received from device within timeout window';
      await command.save();
      socketService.emitToRoomAndDevice(command.roomId, command.deviceId, 'relay:command', {
        commandId: command.commandId,
        deviceId: command.deviceId,
        relayId: command.relayId,
        status: command.status,
      });
      logger.warn('Relay command %s timed out', commandId);
    }
  }, env.RELAY_COMMAND_TIMEOUT_MS);
  pendingTimeouts.set(commandId, timer);
}

function clearScheduledTimeout(commandId) {
  const timer = pendingTimeouts.get(commandId);
  if (timer) {
    clearTimeout(timer);
    pendingTimeouts.delete(commandId);
  }
}

// Queues a relay command for the device to pick up on its next poll of
// GET /devices/:deviceId/commands/pending (see deviceController.getPendingCommands).
async function issueCommand({ roomId, deviceId, relayId, requestedState, source, requestedBy, mode }) {
  const relay = await Relay.findOne({ deviceId, relayId });
  if (!relay) {
    throw ApiError.notFound(`Relay not found: ${relayId} on device ${deviceId}`, 'RELAY_NOT_FOUND');
  }

  const commandId = generateId('CMD');
  const command = await RelayCommand.create({
    commandId,
    roomId,
    deviceId,
    relayId,
    requestedState,
    previousState: relay.state,
    source,
    requestedBy,
    status: COMMAND_STATUS.PENDING,
  });

  if (mode) {
    relay.mode = mode;
    await relay.save();
  }

  socketService.emitToRoomAndDevice(roomId, deviceId, 'relay:command', {
    commandId,
    deviceId,
    relayId,
    status: command.status,
    requestedState,
  });

  if (source === COMMAND_SOURCE.MANUAL) {
    await auditService.record({
      userId: requestedBy,
      action: 'RELAY_MANUAL_CONTROL',
      roomId,
      deviceId,
      relayId,
      previousValue: { state: command.previousState },
      newValue: { state: requestedState, mode },
    });
  }

  return command;
}

// Called when a device polls GET /devices/:deviceId/commands/pending. Marks
// newly-delivered commands SENT and starts their ack-timeout clock.
async function listPendingCommands(deviceId) {
  const commands = await RelayCommand.find({
    deviceId,
    status: { $in: [COMMAND_STATUS.PENDING, COMMAND_STATUS.SENT] },
  }).sort({ createdAt: 1 });

  const now = new Date();
  await Promise.all(
    commands
      .filter((c) => c.status === COMMAND_STATUS.PENDING)
      .map(async (c) => {
        c.status = COMMAND_STATUS.SENT;
        c.sentAt = now;
        await c.save();
        scheduleTimeout(c.commandId);
      })
  );

  return commands;
}

// Handles POST /devices/:deviceId/commands/:commandId/ack.
// Expected body: { state, success, error? }
async function handleAck(deviceId, payload) {
  const { commandId, state, success } = payload || {};
  if (!commandId) {
    logger.warn('Ack from device %s missing commandId', deviceId);
    return null;
  }

  const command = await RelayCommand.findOne({ commandId, deviceId });
  if (!command) {
    logger.warn('Ack for unknown command %s from device %s', commandId, deviceId);
    return null;
  }

  clearScheduledTimeout(commandId);
  command.acknowledgedAt = new Date();

  if (success === false) {
    command.status = COMMAND_STATUS.FAILED;
    command.error = payload.error || 'Device reported command failure';
    await command.save();
    socketService.emitToRoomAndDevice(command.roomId, command.deviceId, 'relay:command', {
      commandId,
      deviceId,
      relayId: command.relayId,
      status: command.status,
      error: command.error,
    });
    return command;
  }

  command.status = COMMAND_STATUS.ACKNOWLEDGED;
  command.completedAt = new Date();
  command.status = COMMAND_STATUS.CONFIRMED;
  await command.save();

  const finalState = state || command.requestedState;
  const relay = await Relay.findOneAndUpdate(
    { deviceId, relayId: command.relayId },
    { $set: { state: finalState } },
    { new: true }
  );

  socketService.emitToRoomAndDevice(command.roomId, command.deviceId, 'relay:stateChanged', {
    deviceId,
    relayId: command.relayId,
    state: finalState,
    mode: relay ? relay.mode : undefined,
    commandId,
  });

  socketService.emitToRoomAndDevice(command.roomId, command.deviceId, 'relay:command', {
    commandId,
    deviceId,
    relayId: command.relayId,
    status: command.status,
  });

  return command;
}

async function listCommandHistory(deviceId, relayId, limit = 50) {
  const query = { deviceId };
  if (relayId) query.relayId = relayId;
  return RelayCommand.find(query).sort({ createdAt: -1 }).limit(limit);
}

module.exports = { issueCommand, listPendingCommands, handleAck, listCommandHistory };
