// The 3 seeded system roles (server/src/utils/permissions.js -> DEFAULT_ROLE_SEEDS).
// Roles themselves are dynamic/DB-driven now — this is only used to offer a
// safe, fixed set of choices on the public self-registration form.
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  VIEWER: "VIEWER",
};

// UI gating is permission-based, not role-name-based, so a custom role (e.g.
// "Facility Manager") gets exactly the buttons/pages its granted keys allow.
// `user` is the object from AuthContext (has a `permissions: string[]` array
// resolved live from the Role collection — see server authService.userView).
export function hasPermission(user, key) {
  return !!user?.permissions?.includes(key);
}

export function hasAnyPermission(user, keys) {
  return keys.some((key) => hasPermission(user, key));
}
