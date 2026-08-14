function sendSuccess(res, statusCode, data, message) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}

module.exports = { sendSuccess };
