const Role = require('../models/Role');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { generateId } = require('../utils/idGenerator');
const { PERMISSION_KEYS, DEFAULT_ROLE_SEEDS } = require('../utils/permissions');
const logger = require('../config/logger');

// Idempotent: only creates roles that don't already exist by name, so an
// admin's edits to a seeded role's permissions survive server restarts.
async function ensureDefaultRoles() {
  for (const seed of DEFAULT_ROLE_SEEDS) {
    const existing = await Role.findOne({ name: seed.name });
    if (existing) continue;
    await Role.create({
      roleId: generateId('ROLE'),
      name: seed.name,
      description: seed.description,
      isSystem: seed.isSystem,
      permissions: seed.permissions,
    });
    logger.info('Seeded default role: %s', seed.name);
  }
}

function validatePermissionKeys(permissions = []) {
  const invalid = permissions.filter((p) => !PERMISSION_KEYS.includes(p));
  if (invalid.length > 0) {
    throw ApiError.badRequest(`Unknown permission key(s): ${invalid.join(', ')}`, 'INVALID_PERMISSION_KEY');
  }
}

// Guards against an update/delete leaving zero roles able to manage
// roles/users at all — that would permanently lock every admin out of ever
// fixing it again through the app.
async function assertAdminManageSurvives(excludeRoleId, resultingPermissions) {
  if (resultingPermissions && resultingPermissions.includes('admin:manage')) return;
  const otherHolder = await Role.findOne({ roleId: { $ne: excludeRoleId }, permissions: 'admin:manage' });
  if (!otherHolder) {
    throw ApiError.badRequest(
      'Cannot remove admin:manage — no other role would be left able to manage roles and users.',
      'LAST_ADMIN_ROLE'
    );
  }
}

async function listRoles() {
  return Role.find().sort({ name: 1 });
}

async function getRoleByRoleId(roleId) {
  const role = await Role.findOne({ roleId });
  if (!role) {
    throw ApiError.notFound('Role not found', 'ROLE_NOT_FOUND');
  }
  return role;
}

async function createRole({ name, description, permissions = [] }) {
  validatePermissionKeys(permissions);
  const existing = await Role.findOne({ name });
  if (existing) {
    throw ApiError.conflict('A role with this name already exists', 'ROLE_NAME_EXISTS');
  }
  return Role.create({
    roleId: generateId('ROLE'),
    name,
    description,
    permissions,
    isSystem: false,
  });
}

async function updateRole(roleId, { name, description, permissions }) {
  const role = await getRoleByRoleId(roleId);

  if (name !== undefined && name !== role.name) {
    if (role.isSystem) {
      throw ApiError.badRequest('System roles cannot be renamed', 'SYSTEM_ROLE_IMMUTABLE');
    }
    const existing = await Role.findOne({ name, roleId: { $ne: roleId } });
    if (existing) {
      throw ApiError.conflict('A role with this name already exists', 'ROLE_NAME_EXISTS');
    }
    role.name = name;
  }

  if (permissions !== undefined) {
    validatePermissionKeys(permissions);
    await assertAdminManageSurvives(roleId, permissions);
    role.permissions = permissions;
  }

  if (description !== undefined) {
    role.description = description;
  }

  await role.save();
  return role;
}

async function deleteRole(roleId) {
  const role = await getRoleByRoleId(roleId);
  if (role.isSystem) {
    throw ApiError.badRequest('System roles cannot be deleted', 'SYSTEM_ROLE_IMMUTABLE');
  }
  const assignedCount = await User.countDocuments({ role: role.name });
  if (assignedCount > 0) {
    throw ApiError.conflict(
      `${assignedCount} user(s) are still assigned to this role. Reassign them first.`,
      'ROLE_IN_USE'
    );
  }
  await Role.deleteOne({ roleId });
  return role;
}

async function getRoleNamesWithPermission(permissionKey) {
  const roles = await Role.find({ permissions: permissionKey }).select('name');
  return roles.map((r) => r.name);
}

async function roleExists(name) {
  const role = await Role.findOne({ name });
  return !!role;
}

// Resolved fresh from the DB (never from a JWT snapshot) so a permission
// change takes effect for a user immediately, not just after they re-login.
async function getPermissionsForRoleName(name) {
  const role = await Role.findOne({ name });
  return role ? role.permissions : [];
}

module.exports = {
  ensureDefaultRoles,
  listRoles,
  getRoleByRoleId,
  createRole,
  updateRole,
  deleteRole,
  getRoleNamesWithPermission,
  roleExists,
  getPermissionsForRoleName,
};
