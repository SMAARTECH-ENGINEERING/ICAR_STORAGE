export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER',
};

export const ROOM_STATUS = { ACTIVE: 'active', INACTIVE: 'inactive' };
export const DEVICE_STATUS = { ONLINE: 'online', OFFLINE: 'offline', UNKNOWN: 'unknown' };
export const RELAY_MODE = { MANUAL: 'manual', AUTO: 'auto' };
export const RELAY_STATE = { ON: 'ON', OFF: 'OFF' };
export const COMMAND_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
};

export const ALERT_TYPE = {
  HIGH_TEMPERATURE: 'HIGH_TEMPERATURE',
  HIGH_HUMIDITY: 'HIGH_HUMIDITY',
  HIGH_CO2: 'HIGH_CO2',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  SENSOR_FAILURE: 'SENSOR_FAILURE',
  RELAY_FAILURE: 'RELAY_FAILURE',
};

export const ALERT_SEVERITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };
export const ALERT_STATUS = { ACTIVE: 'active', RESOLVED: 'resolved' };
