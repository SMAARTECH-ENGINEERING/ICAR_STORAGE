const Joi = require('joi');
const { DEVICE_STATUS } = require('../utils/constants');

const createDeviceSchema = Joi.object({
  deviceId: Joi.string().trim().min(1).max(120).required(),
  roomId: Joi.string().trim().min(1).max(120).required(),
  name: Joi.string().trim().min(1).max(120).required(),
  deviceType: Joi.string().trim().max(100).allow('', null),
  firmwareVersion: Joi.string().trim().max(50).allow('', null),
  status: Joi.string().valid(...Object.values(DEVICE_STATUS)),
});

const updateDeviceSchema = Joi.object({
  roomId: Joi.string().trim().min(1).max(120),
  name: Joi.string().trim().min(1).max(120),
  deviceType: Joi.string().trim().max(100).allow('', null),
  firmwareVersion: Joi.string().trim().max(50).allow('', null),
  status: Joi.string().valid(...Object.values(DEVICE_STATUS)),
}).min(1);

module.exports = { createDeviceSchema, updateDeviceSchema };
