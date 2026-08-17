const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const SensorReading = require('../models/SensorReading');
const ApiError = require('../utils/ApiError');

// Global equivalent of GET /rooms/:roomId/history — same date-range
// validation and shape, but filterable across every room/device at once
// (or narrowed via roomId/deviceId) instead of being scoped to one room.
const getSensorHistory = catchAsync(async (req, res) => {
  const { roomId, deviceId, from, to } = req.query;
  const query = {};
  if (roomId) query.roomId = roomId;
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

module.exports = { getSensorHistory };
