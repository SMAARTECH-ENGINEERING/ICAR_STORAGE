const Relay = require('../models/Relay');
const ApiError = require('../utils/ApiError');

// Ensures a Relay document exists for every relayId seen in an incoming
// telemetry payload, without assuming any fixed number/name of relays.
async function syncRelaysFromTelemetry(deviceId, relaysPayload = {}) {
  const relayIds = Object.keys(relaysPayload);
  await Promise.all(
    relayIds.map(async (relayId) => {
      const incoming = relaysPayload[relayId] || {};
      const update = {};
      if (incoming.mode) update.mode = incoming.mode;
      if (incoming.state) update.state = incoming.state;
      if (incoming.control_source !== undefined) update.controlSource = incoming.control_source;
      if (incoming.controlling_zone !== undefined) update.controllingZone = incoming.controlling_zone;
      if (incoming.threshold_on_c !== undefined) update.thresholdOnC = incoming.threshold_on_c;
      if (incoming.threshold_off_c !== undefined) update.thresholdOffC = incoming.threshold_off_c;

      await Relay.findOneAndUpdate(
        { deviceId, relayId },
        { $set: update, $setOnInsert: { deviceId, relayId } },
        { upsert: true, new: true }
      );
    })
  );
  return Relay.find({ deviceId });
}

async function listRelaysForDevice(deviceId) {
  return Relay.find({ deviceId }).sort({ relayId: 1 });
}

async function listRelaysForDevices(deviceIds) {
  if (!deviceIds.length) return [];
  return Relay.find({ deviceId: { $in: deviceIds } }).sort({ deviceId: 1, relayId: 1 });
}

async function getRelay(deviceId, relayId) {
  const relay = await Relay.findOne({ deviceId, relayId });
  if (!relay) {
    throw ApiError.notFound(`Relay not found: ${relayId} on device ${deviceId}`, 'RELAY_NOT_FOUND');
  }
  return relay;
}

async function setRelayModeState(deviceId, relayId, { mode, state }) {
  const relay = await Relay.findOneAndUpdate(
    { deviceId, relayId },
    { $set: { mode, state } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return relay;
}

module.exports = {
  syncRelaysFromTelemetry,
  listRelaysForDevice,
  listRelaysForDevices,
  getRelay,
  setRelayModeState,
};
