const AutomationRule = require('../models/AutomationRule');
const Relay = require('../models/Relay');
const ApiError = require('../utils/ApiError');
const { RELAY_STATE, RELAY_MODE, AUTOMATION_SOURCE } = require('../utils/constants');

function extractZoneTemperature(sensors, zone) {
  const zoneData = sensors && sensors[zone];
  if (!zoneData || typeof zoneData.temperature_c !== 'number') return null;
  return zoneData.temperature_c;
}

// Computes the driving value for a rule from the raw sensor payload. Zones
// are whatever the rule was configured with (device/room-defined), never hardcoded.
function computeSourceValue(rule, sensors) {
  if (rule.source === AUTOMATION_SOURCE.MAX_OF_ZONES) {
    const zones = rule.zones && rule.zones.length ? rule.zones : Object.keys(sensors || {});
    const values = zones
      .map((zone) => extractZoneTemperature(sensors, zone))
      .filter((v) => typeof v === 'number');
    if (!values.length) return null;
    return Math.max(...values);
  }
  return null;
}

// Hysteresis: value >= thresholdOn -> ON, value <= thresholdOff -> OFF,
// otherwise keep the previous state to avoid relay oscillation.
function resolveDesiredState(value, thresholdOn, thresholdOff, previousState) {
  if (value >= thresholdOn) return RELAY_STATE.ON;
  if (value <= thresholdOff) return RELAY_STATE.OFF;
  return previousState || RELAY_STATE.OFF;
}

async function evaluateDevice(deviceId, sensors) {
  const rules = await AutomationRule.find({ deviceId, enabled: true });
  if (!rules.length) return [];

  const results = [];
  for (const rule of rules) {
    const value = computeSourceValue(rule, sensors);
    if (value === null) continue;

    const relay = await Relay.findOne({ deviceId, relayId: rule.relayId });
    if (!relay || relay.mode !== RELAY_MODE.AUTO) continue;

    const desiredState = resolveDesiredState(value, rule.thresholdOn, rule.thresholdOff, relay.state);
    results.push({
      relayId: rule.relayId,
      previousState: relay.state,
      desiredState,
      changed: desiredState !== relay.state,
      value,
      rule,
    });
  }
  return results;
}

async function getRule(deviceId, relayId) {
  const rule = await AutomationRule.findOne({ deviceId, relayId });
  if (!rule) {
    throw ApiError.notFound(
      `Automation rule not found for relay ${relayId} on device ${deviceId}`,
      'AUTOMATION_RULE_NOT_FOUND'
    );
  }
  return rule;
}

async function listRulesForDevice(deviceId) {
  return AutomationRule.find({ deviceId });
}

async function upsertRule(deviceId, relayId, payload) {
  const rule = await AutomationRule.findOneAndUpdate(
    { deviceId, relayId },
    { $set: payload, $setOnInsert: { deviceId, relayId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return rule;
}

module.exports = {
  evaluateDevice,
  getRule,
  listRulesForDevice,
  upsertRule,
  computeSourceValue,
  resolveDesiredState,
};
