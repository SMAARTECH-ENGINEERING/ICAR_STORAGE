const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const roleService = require('../services/roleService');
const auditService = require('../services/auditService');

const listUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('userId name email role active createdAt').sort({ createdAt: -1 });
  return sendSuccess(res, 200, users);
});

const assignRole = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (userId === req.user.userId) {
    throw ApiError.badRequest('You cannot change your own role — ask another administrator.', 'CANNOT_SELF_ASSIGN');
  }

  if (!(await roleService.roleExists(role))) {
    throw ApiError.badRequest(`Unknown role "${role}"`, 'ROLE_NOT_FOUND');
  }

  const user = await User.findOne({ userId });
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await auditService.record({
    userId: req.user.userId,
    action: 'USER_ROLE_ASSIGNED',
    previousValue: { userId, role: previousRole },
    newValue: { userId, role },
  });

  return sendSuccess(res, 200, { userId: user.userId, name: user.name, email: user.email, role: user.role }, 'Role assigned');
});

module.exports = { listUsers, assignRole };
