const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const authService = require('../services/authService');

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

module.exports = { register, login, refresh, me };
