// Mirrors src/utils/constants.js in the backend (server/src/utils/constants.js).
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  VIEWER: "VIEWER",
};

export function canManage(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function isSuperAdmin(role) {
  return role === ROLES.SUPER_ADMIN;
}
