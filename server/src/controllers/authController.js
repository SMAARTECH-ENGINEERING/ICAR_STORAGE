const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/authService');
const pushService = require('../services/pushService');

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, 201, result, 'User registered');
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, result, 'Login successful');
});

const refresh = catchAsync(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, 200, result, 'Token refreshed');
});

const me = catchAsync(async (req, res) => {
  return sendSuccess(res, 200, req.user);
});

const registerPushToken = catchAsync(async (req, res) => {
  await pushService.registerToken(req.user.userId, req.body.token, req.body.platform);
  return sendSuccess(res, 200, null, 'Push token registered');
});

const removePushToken = catchAsync(async (req, res) => {
  await pushService.removeToken(req.user.userId, req.body.token);
  return sendSuccess(res, 200, null, 'Push token removed');
});

module.exports = { register, login, refresh, me, registerPushToken, removePushToken };
