class ApiError extends Error {
  constructor(statusCode, errorCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = 'BAD_REQUEST', details) {
    return new ApiError(400, errorCode, message, details);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, errorCode, message);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new ApiError(403, errorCode, message);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, errorCode, message);
  }

  static conflict(message = 'Conflict', errorCode = 'CONFLICT') {
    return new ApiError(409, errorCode, message);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, errorCode, message);
  }
}

module.exports = ApiError;
