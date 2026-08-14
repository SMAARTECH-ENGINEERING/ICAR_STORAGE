const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error.name === 'ValidationError') {
      error = ApiError.badRequest(error.message, 'VALIDATION_ERROR');
    } else if (error.name === 'CastError') {
      error = ApiError.badRequest(`Invalid value for ${error.path}`, 'INVALID_PARAMETER');
    } else if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      error = ApiError.conflict(`Duplicate value for ${field}`, 'DUPLICATE_KEY');
    } else {
      error = ApiError.internal(error.message || 'Internal server error');
    }
  }

  if (!error.isOperational || error.statusCode >= 500) {
    logger.error('%s %s -> %s', req.method, req.originalUrl, error.message, {
      stack: err.stack,
    });
  } else {
    logger.warn('%s %s -> %s', req.method, req.originalUrl, error.message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errorCode: error.errorCode || 'INTERNAL_ERROR',
    ...(error.details ? { details: error.details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
