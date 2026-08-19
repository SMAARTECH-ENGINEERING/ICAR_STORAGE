const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const roleService = require('../services/roleService');
const auditService = require('../services/auditService');
const { PERMISSIONS } = require('../utils/permissions');

const listPermissions = catchAsync(async (req, res) => {
  return sendSuccess(res, 200, PERMISSIONS);
});

const listRoles = catchAsync(async (req, res) => {
  const roles = await roleService.listRoles();
  return sendSuccess(res, 200, roles);
});

const getRole = catchAsync(async (req, res) => {
  const role = await roleService.getRoleByRoleId(req.params.roleId);
  return sendSuccess(res, 200, role);
});

const createRole = catchAsync(async (req, res) => {
  const role = await roleService.createRole(req.body);
  await auditService.record({
    userId: req.user.userId,
    action: 'ROLE_CREATED',
    newValue: { name: role.name, permissions: role.permissions },
  });
  return sendSuccess(res, 201, role, 'Role created');
});

const updateRole = catchAsync(async (req, res) => {
  const previous = await roleService.getRoleByRoleId(req.params.roleId);
  const role = await roleService.updateRole(req.params.roleId, req.body);
  await auditService.record({
    userId: req.user.userId,
    action: 'ROLE_UPDATED',
    previousValue: { name: previous.name, permissions: previous.permissions },
    newValue: { name: role.name, permissions: role.permissions },
  });
  return sendSuccess(res, 200, role, 'Role updated');
});

const deleteRole = catchAsync(async (req, res) => {
  const role = await roleService.deleteRole(req.params.roleId);
  await auditService.record({
    userId: req.user.userId,
    action: 'ROLE_DELETED',
    previousValue: { name: role.name, permissions: role.permissions },
  });
  return sendSuccess(res, 200, role, 'Role deleted');
});

module.exports = { listPermissions, listRoles, getRole, createRole, updateRole, deleteRole };
