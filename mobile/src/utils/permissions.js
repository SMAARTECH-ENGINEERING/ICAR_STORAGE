import { ROLES } from './constants';

export function canManage(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function canDelete(role) {
  return role === ROLES.SUPER_ADMIN;
}

export function canControlRelays(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function canEditAutomation(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
}

export function isSuperAdmin(role) {
  return role === ROLES.SUPER_ADMIN;
}

export function roleLabel(role) {
  if (role === ROLES.SUPER_ADMIN) return 'SUPER ADMIN';
  if (role === ROLES.ADMIN) return 'ADMIN';
  return 'VIEWER';
}
