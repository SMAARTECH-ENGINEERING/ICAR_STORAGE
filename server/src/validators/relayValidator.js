const Joi = require('joi');
const { RELAY_MODE, RELAY_STATE } = require('../utils/constants');

const relayCommandSchema = Joi.object({
  mode: Joi.string().valid(...Object.values(RELAY_MODE)).required(),
  state: Joi.string().valid(...Object.values(RELAY_STATE)).required(),
});

const commandAckSchema = Joi.object({
  state: Joi.string().valid(...Object.values(RELAY_STATE)),
  success: Joi.boolean().required(),
  error: Joi.string().max(500),
});

const automationRuleSchema = Joi.object({
  enabled: Joi.boolean(),
  ruleType: Joi.string(),
  zones: Joi.array().items(Joi.string()),
  source: Joi.string(),
  thresholdOn: Joi.number().required(),
  thresholdOff: Joi.number().required(),
}).custom((value, helpers) => {
  if (value.thresholdOff >= value.thresholdOn) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'thresholdOff must be less than thresholdOn');

module.exports = { relayCommandSchema, automationRuleSchema, commandAckSchema };
