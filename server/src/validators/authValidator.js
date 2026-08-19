const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(200).required(),
  // Existence is checked against the Role collection in authService.register
  // (roles are dynamic, not a fixed enum) — this only bounds the shape.
  role: Joi.string().trim().max(60),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const registerPushTokenSchema = Joi.object({
  token: Joi.string().trim().required(),
  platform: Joi.string().valid('ios', 'android').required(),
});

const removePushTokenSchema = Joi.object({
  token: Joi.string().trim().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  registerPushTokenSchema,
  removePushTokenSchema,
};
