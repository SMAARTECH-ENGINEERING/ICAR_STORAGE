const Joi = require('joi');
const { ROOM_STATUS } = require('../utils/constants');

const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  code: Joi.string().trim().max(50).allow('', null),
  description: Joi.string().trim().max(500).allow('', null),
  location: Joi.string().trim().max(200).allow('', null),
  status: Joi.string().valid(...Object.values(ROOM_STATUS)),
});

const updateRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  code: Joi.string().trim().max(50).allow('', null),
  description: Joi.string().trim().max(500).allow('', null),
  location: Joi.string().trim().max(200).allow('', null),
  status: Joi.string().valid(...Object.values(ROOM_STATUS)),
}).min(1);

module.exports = { createRoomSchema, updateRoomSchema };
