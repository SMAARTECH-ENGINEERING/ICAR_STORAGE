const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const alertService = require('../services/alertService');

const listAlerts = catchAsync(async (req, res) => {
  const alerts = await alertService.listAlerts({
    roomId: req.query.roomId,
    deviceId: req.query.deviceId,
    status: req.query.status,
    limit: parseInt(req.query.limit, 10) || undefined,
  });
  return sendSuccess(res, 200, alerts);
});

module.exports = { listAlerts };
