const Joi = require('joi');
const env = require('../config/env');
const { RELAY_MODE, RELAY_STATE } = require('../utils/constants');

// Zones (upper/middle/lower/co2/...) are device-defined and dynamic, so any
// zone key is accepted via Joi.object().pattern(). Only the well-known
// measurement fields inside a zone are range-validated when present.
const zoneSchema = Joi.object({
  sensor_model: Joi.string().trim().max(50),
  temperature_c: Joi.number().min(env.TEMP_MIN_C).max(env.TEMP_MAX_C),
  humidity_percent: Joi.number().min(env.HUMIDITY_MIN_PERCENT).max(env.HUMIDITY_MAX_PERCENT),
  pressure_hpa: Joi.number().min(env.PRESSURE_MIN_HPA).max(env.PRESSURE_MAX_HPA),
  co2_ppm: Joi.number().min(env.CO2_MIN_PPM).max(env.CO2_MAX_PPM),
}).unknown(true);

const sensorsSchema = Joi.object().pattern(Joi.string(), zoneSchema).default({});

const relaySchema = Joi.object({
  mode: Joi.string().valid(...Object.values(RELAY_MODE)),
  state: Joi.string().valid(...Object.values(RELAY_STATE)),
  control_source: Joi.string().trim().max(100),
  controlling_zone: Joi.string().trim().max(100),
  highest_temperature_c: Joi.number().min(env.TEMP_MIN_C).max(env.TEMP_MAX_C),
  threshold_on_c: Joi.number(),
  threshold_off_c: Joi.number(),
}).unknown(true);

const relaysSchema = Joi.object().pattern(Joi.string(), relaySchema).default({});

const telemetrySchema = Joi.object({
  device_id: Joi.string().trim().min(1).max(120).required(),
  timestamp: Joi.string().isoDate().required(),
  sensors: sensorsSchema,
  relays: relaysSchema,
});

module.exports = { telemetrySchema };
