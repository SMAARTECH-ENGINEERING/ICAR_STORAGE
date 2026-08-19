const Joi = require('joi');

const assignRoleSchema = Joi.object({
  role: Joi.string().trim().min(1).max(60).required(),
});

module.exports = { assignRoleSchema };
