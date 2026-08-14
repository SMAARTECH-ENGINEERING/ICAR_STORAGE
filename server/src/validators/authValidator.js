const Joi = require('joi');
const { ROLES } = require('../utils/constants');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(200).required(),
  role: Joi.string().valid(...Object.values(ROLES)),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema, refreshSchema };
