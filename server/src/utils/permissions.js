// The catalog of capabilities the app can enforce (what actions exist) is
// necessarily code-defined, same as AWS IAM's fixed action list — but which
// roles exist and which of these keys each one holds is entirely dynamic,
// stored in the Role collection and editable via /api/v1/roles.
const PERMISSIONS = [
  { key: 'rooms:create', resource: 'Rooms', action: 'create', label: 'Create rooms' },
  { key: 'rooms:read', resource: 'Rooms', action: 'read', label: 'View rooms' },
  { key: 'rooms:update', resource: 'Rooms', action: 'update', label: 'Edit rooms' },
  { key: 'rooms:delete', resource: 'Rooms', action: 'delete', label: 'Delete rooms' },

  { key: 'devices:create', resource: 'Devices', action: 'create', label: 'Create devices' },
  { key: 'devices:read', resource: 'Devices', action: 'read', label: 'View devices' },
  { key: 'devices:update', resource: 'Devices', action: 'update', label: 'Edit devices' },
  { key: 'devices:delete', resource: 'Devices', action: 'delete', label: 'Delete devices' },

  { key: 'relays:read', resource: 'Relays / Automation', action: 'read', label: 'View relay & automation state' },
  { key: 'relays:update', resource: 'Relays / Automation', action: 'update', label: 'Control relays & configure automation' },

  { key: 'alerts:read', resource: 'Alerts', action: 'read', label: 'View alerts' },
  { key: 'alerts:update', resource: 'Alerts', action: 'update', label: 'Resolve alerts' },

  { key: 'reports:read', resource: 'Reports', action: 'read', label: 'View reports' },

  { key: 'audit-logs:read', resource: 'Audit Log', action: 'read', label: 'View audit log' },

  { key: 'admin:manage', resource: 'Administration', action: 'manage', label: 'Manage roles, permissions & user role assignments' },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// Seeded once at startup if missing (see roleService.ensureDefaultRoles).
// Reproduces the exact access levels this app hardcoded before roles became
// dynamic, so migrating to the Role collection is a zero-regression change.
const DEFAULT_ROLE_SEEDS = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full access to every capability, including role and user management.',
    isSystem: true,
    permissions: [...PERMISSION_KEYS],
  },
  {
    name: 'ADMIN',
    description: 'Create/edit rooms, devices, relays and resolve alerts. Cannot delete rooms/devices or manage roles/users.',
    isSystem: true,
    permissions: [
      'rooms:create', 'rooms:read', 'rooms:update',
      'devices:create', 'devices:read', 'devices:update',
      'relays:read', 'relays:update',
      'alerts:read', 'alerts:update',
      'reports:read',
      'audit-logs:read',
    ],
  },
  {
    name: 'VIEWER',
    description: 'Read-only access across the app.',
    isSystem: true,
    permissions: ['rooms:read', 'devices:read', 'relays:read', 'alerts:read', 'reports:read'],
  },
];

module.exports = { PERMISSIONS, PERMISSION_KEYS, DEFAULT_ROLE_SEEDS };
