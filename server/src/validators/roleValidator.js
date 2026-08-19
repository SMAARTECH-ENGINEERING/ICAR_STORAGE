const Joi = require('joi');

const createRoleSchema = Joi.object({
  name: Joi.string().trim().min(1).max(60).required(),
  description: Joi.string().trim().max(300).allow('', null),
  permissions: Joi.array().items(Joi.string()).default([]),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim().min(1).max(60),
  description: Joi.string().trim().max(300).allow('', null),
  permissions: Joi.array().items(Joi.string()),
}).min(1);

module.exports = { createRoleSchema, updateRoleSchema };
