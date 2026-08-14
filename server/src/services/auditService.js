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

module.exports = { record };
