const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');

const listAuditLogs = catchAsync(async (req, res) => {
  const { userId, action, roomId, deviceId, from, to } = req.query;
  const filter = { userId, action, roomId, deviceId };

  if (from) {
    const fromDate = new Date(from);
    if (Number.isNaN(fromDate.getTime())) {
      throw ApiError.badRequest('Invalid "from" date', 'INVALID_DATE_RANGE');
    }
    filter.from = fromDate;
  }
  if (to) {
    const toDate = new Date(to);
    if (Number.isNaN(toDate.getTime())) {
      throw ApiError.badRequest('Invalid "to" date', 'INVALID_DATE_RANGE');
    }
    filter.to = toDate;
  }

  filter.limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);

  const logs = await auditService.list(filter);
  return sendSuccess(res, 200, logs);
});

module.exports = { listAuditLogs };
