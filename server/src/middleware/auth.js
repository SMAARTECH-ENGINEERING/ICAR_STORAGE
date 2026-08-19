const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const Role = require('../models/Role');

const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Missing or invalid Authorization header', 'AUTH_TOKEN_MISSING');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { userId: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token', 'AUTH_TOKEN_INVALID');
  }
});

// Dynamic, DB-backed RBAC gate: resolves the caller's role to its current
// permission set on every request (never trusts a JWT-embedded snapshot),
// so revoking a permission takes effect immediately without waiting for
// tokens to expire. Passing multiple keys means "any one of these suffices".
function authorizePermission(...permissionKeys) {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    const role = await Role.findOne({ name: req.user.role });
    const granted = role && permissionKeys.some((key) => role.permissions.includes(key));
    if (!granted) {
      return next(ApiError.forbidden('You do not have permission to perform this action', 'FORBIDDEN'));
    }
    return next();
  });
}

// Devices authenticate to device-facing HTTP endpoints (telemetry, command
// polling, acks) with a shared API key rather than a user JWT. Per-device
// identity is established afterwards from the deviceId in the payload/URL.
const authenticateDevice = (req, res, next) => {
  const apiKey = req.headers['x-device-key'];
  if (!apiKey || apiKey !== env.DEVICE_API_KEY) {
    return next(ApiError.unauthorized('Invalid device credentials', 'DEVICE_AUTH_FAILED'));
  }
  return next();
};

module.exports = { authenticate, authorizePermission, authenticateDevice };
