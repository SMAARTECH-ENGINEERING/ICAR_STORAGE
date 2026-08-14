const Room = require('../models/Room');
const Device = require('../models/Device');
const ApiError = require('../utils/ApiError');
const { generateId } = require('../utils/idGenerator');

async function createRoom(payload) {
  const roomId = generateId('ROOM');
  const room = await Room.create({ ...payload, roomId });
  return room;
}

async function listRooms(filter = {}) {
  const query = {};
  if (filter.status) query.status = filter.status;
  return Room.find(query).sort({ createdAt: -1 });
}

async function getRoomByRoomId(roomId) {
  const room = await Room.findOne({ roomId });
  if (!room) {
    throw ApiError.notFound(`Room not found: ${roomId}`, 'ROOM_NOT_FOUND');
  }
  return room;
}

async function updateRoom(roomId, updates) {
  const room = await Room.findOneAndUpdate({ roomId }, updates, {
    new: true,
    runValidators: true,
  });
  if (!room) {
    throw ApiError.notFound(`Room not found: ${roomId}`, 'ROOM_NOT_FOUND');
  }
  return room;
}

async function deleteRoom(roomId) {
  const deviceCount = await Device.countDocuments({ roomId });
  if (deviceCount > 0) {
    throw ApiError.conflict(
      `Cannot delete room ${roomId}: ${deviceCount} device(s) are still assigned to it`,
      'ROOM_HAS_DEVICES'
    );
  }
  const room = await Room.findOneAndDelete({ roomId });
  if (!room) {
    throw ApiError.notFound(`Room not found: ${roomId}`, 'ROOM_NOT_FOUND');
  }
  return room;
}

async function getRoomDevices(roomId) {
  await getRoomByRoomId(roomId);
  return Device.find({ roomId }).sort({ createdAt: 1 });
}

async function assertRoomExists(roomId) {
  const exists = await Room.exists({ roomId });
  if (!exists) {
    throw ApiError.badRequest(`Room does not exist: ${roomId}`, 'ROOM_NOT_FOUND');
  }
}

module.exports = {
  createRoom,
  listRooms,
  getRoomByRoomId,
  updateRoom,
  deleteRoom,
  getRoomDevices,
  assertRoomExists,
};
