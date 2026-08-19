const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateId } = require('../utils/idGenerator');
const { ROLES } = require('../utils/constants');
const roleService = require('./roleService');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user.userId, role: user.role, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

// permissions are resolved fresh from the Role collection for the response
// payload only — never trusted from the JWT for actual access control (see
// authorizePermission in middleware/auth.js).
async function userView(user) {
  const permissions = await roleService.getPermissionsForRoleName(user.role);
  return { userId: user.userId, name: user.name, email: user.email, role: user.role, permissions };
}

async function register({ name, email, password, role }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists', 'USER_EXISTS');
  }

  const roleName = role || ROLES.VIEWER;
  if (!(await roleService.roleExists(roleName))) {
    throw ApiError.badRequest(`Unknown role "${roleName}"`, 'ROLE_NOT_FOUND');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    userId: generateId('USR'),
    name,
    email,
    passwordHash,
    role: roleName,
  });

  return {
    user: await userView(user),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.active) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  return {
    user: await userView(user),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
  }

  const user = await User.findOne({ userId: payload.sub });
  if (!user || !user.active) {
    throw ApiError.unauthorized('User not found or inactive', 'USER_INACTIVE');
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

async function me(userId) {
  const user = await User.findOne({ userId });
  if (!user || !user.active) {
    throw ApiError.unauthorized('User not found or inactive', 'USER_INACTIVE');
  }
  return userView(user);
}

module.exports = { register, login, refresh, me };
