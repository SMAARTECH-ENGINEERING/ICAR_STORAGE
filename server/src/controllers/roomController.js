const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const roomService = require('../services/roomService');
const deviceService = require('../services/deviceService');
const relayService = require('../services/relayService');
const alertService = require('../services/alertService');
const auditService = require('../services/auditService');
const DeviceState = require('../models/DeviceState');
const SensorReading = require('../models/SensorReading');
const ApiError = require('../utils/ApiError');
const { ALERT_STATUS } = require('../utils/constants');

const createRoom = catchAsync(async (req, res) => {
  const room = await roomService.createRoom(req.body);
  await auditService.record({
    userId: req.user.userId,
    action: 'ROOM_CREATED',
    roomId: room.roomId,
    newValue: req.body,
  });
  return sendSuccess(res, 201, room, 'Room created');
});

const listRooms = catchAsync(async (req, res) => {
  const rooms = await roomService.listRooms({ status: req.query.status });
  return sendSuccess(res, 200, rooms);
});

const getRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomByRoomId(req.params.roomId);
  return sendSuccess(res, 200, room);
});

const updateRoom = catchAsync(async (req, res) => {
  const previous = await roomService.getRoomByRoomId(req.params.roomId);
  const room = await roomService.updateRoom(req.params.roomId, req.body);
  await auditService.record({
    userId: req.user.userId,
    action: 'ROOM_UPDATED',
    roomId: room.roomId,
    previousValue: previous.toObject(),
    newValue: req.body,
  });
  return sendSuccess(res, 200, room, 'Room updated');
});

const deleteRoom = catchAsync(async (req, res) => {
  const room = await roomService.deleteRoom(req.params.roomId);
  await auditService.record({
    userId: req.user.userId,
    action: 'ROOM_DELETED',
    roomId: room.roomId,
    previousValue: room.toObject(),
  });
  return sendSuccess(res, 200, room, 'Room deleted');
});

const getRoomDevices = catchAsync(async (req, res) => {
  const devices = await roomService.getRoomDevices(req.params.roomId);
  return sendSuccess(res, 200, devices);
});

const getRoomCurrent = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const room = await roomService.getRoomByRoomId(roomId);
  const devices = await deviceService.listDevices({ roomId });

  const deviceIds = devices.map((d) => d.deviceId);
  const [states, relays, alerts] = await Promise.all([
    DeviceState.find({ deviceId: { $in: deviceIds } }),
    relayService.listRelaysForDevices(deviceIds),
    alertService.listAlerts({ roomId, status: ALERT_STATUS.ACTIVE }),
  ]);

  return sendSuccess(res, 200, {
    room,
    devices,
    sensorData: states,
    relays,
    alerts,
  });
});

const getRoomHistory = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  await roomService.getRoomByRoomId(roomId);

  const { from, to, deviceId } = req.query;
  const query = { roomId };
  if (deviceId) query.deviceId = deviceId;
  if (from || to) {
    query.timestamp = {};
    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw ApiError.badRequest('Invalid "from" date', 'INVALID_DATE_RANGE');
      }
      query.timestamp.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw ApiError.badRequest('Invalid "to" date', 'INVALID_DATE_RANGE');
      }
      query.timestamp.$lte = toDate;
    }
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);
  const readings = await SensorReading.find(query).sort({ timestamp: -1 }).limit(limit);
  return sendSuccess(res, 200, readings);
});

module.exports = {
  createRoom,
  listRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomDevices,
  getRoomCurrent,
  getRoomHistory,
};
