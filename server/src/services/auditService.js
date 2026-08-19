const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

async function record({ userId, action, roomId, deviceId, relayId, previousValue, newValue }) {
  try {
    await AuditLog.create({
      userId,
      action,
      roomId,
      deviceId,
      relayId,
      previousValue,
      newValue,
      timestamp: new Date(),
    });
  } catch (err) {
    // Auditing must never break the primary request flow.
    logger.error('Failed to write audit log for action %s: %s', action, err.message);
  }
}

async function list(filter = {}) {
  const query = {};
  if (filter.userId) query.userId = filter.userId;
  if (filter.action) query.action = filter.action;
  if (filter.roomId) query.roomId = filter.roomId;
  if (filter.deviceId) query.deviceId = filter.deviceId;
  if (filter.from || filter.to) {
    query.timestamp = {};
    if (filter.from) query.timestamp.$gte = filter.from;
    if (filter.to) query.timestamp.$lte = filter.to;
  }
  return AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(filter.limit || 200);
}

module.exports = { record, list };
