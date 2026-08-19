const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const alertService = require('../services/alertService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');

const listAlerts = catchAsync(async (req, res) => {
  const alerts = await alertService.listAlerts({
    roomId: req.query.roomId,
    deviceId: req.query.deviceId,
    status: req.query.status,
    limit: parseInt(req.query.limit, 10) || undefined,
  });
  return sendSuccess(res, 200, alerts);
});

const resolveAlert = catchAsync(async (req, res) => {
  const result = await alertService.resolveAlertById(req.params.alertId);
  if (!result) {
    throw ApiError.notFound('Alert not found', 'ALERT_NOT_FOUND');
  }
  const { alert, changed } = result;
  if (changed) {
    await auditService.record({
      userId: req.user.userId,
      action: 'ALERT_RESOLVED_MANUALLY',
      roomId: alert.roomId,
      deviceId: alert.deviceId,
      newValue: { status: alert.status, resolvedAt: alert.resolvedAt },
    });
  }
  return sendSuccess(res, 200, alert, 'Alert resolved');
});

module.exports = { listAlerts, resolveAlert };
