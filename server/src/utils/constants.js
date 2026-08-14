const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER',
});

const ROOM_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const DEVICE_STATUS = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
});

const RELAY_MODE = Object.freeze({
  MANUAL: 'manual',
  AUTO: 'auto',
});

const RELAY_STATE = Object.freeze({
  ON: 'ON',
  OFF: 'OFF',
});

const COMMAND_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
});

const COMMAND_SOURCE = Object.freeze({
  MANUAL: 'manual',
  AUTOMATION: 'automation',
});

const ALERT_TYPE = Object.freeze({
  HIGH_TEMPERATURE: 'HIGH_TEMPERATURE',
  HIGH_HUMIDITY: 'HIGH_HUMIDITY',
  HIGH_CO2: 'HIGH_CO2',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  SENSOR_FAILURE: 'SENSOR_FAILURE',
  RELAY_FAILURE: 'RELAY_FAILURE',
});

const ALERT_SEVERITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

const ALERT_STATUS = Object.freeze({
  ACTIVE: 'active',
  RESOLVED: 'resolved',
});

const AUTOMATION_RULE_TYPE = Object.freeze({
  TEMPERATURE_HIGH: 'temperature_high',
});

const AUTOMATION_SOURCE = Object.freeze({
  MAX_OF_ZONES: 'max_of_zones',
});

module.exports = {
  ROLES,
  ROOM_STATUS,
  DEVICE_STATUS,
  RELAY_MODE,
  RELAY_STATE,
  COMMAND_STATUS,
  COMMAND_SOURCE,
  ALERT_TYPE,
  ALERT_SEVERITY,
  ALERT_STATUS,
  AUTOMATION_RULE_TYPE,
  AUTOMATION_SOURCE,
};
