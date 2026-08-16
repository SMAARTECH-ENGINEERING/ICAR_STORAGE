export const ALERT_META = {
  HIGH_TEMPERATURE: { label: 'High Temperature', icon: 'thermometer' },
  HIGH_HUMIDITY: { label: 'High Humidity', icon: 'water' },
  HIGH_CO2: { label: 'High CO2', icon: 'cloud' },
  DEVICE_OFFLINE: { label: 'Device Offline', icon: 'cloud-offline' },
  SENSOR_FAILURE: { label: 'Sensor Failure', icon: 'warning' },
  RELAY_FAILURE: { label: 'Relay Failure', icon: 'flash-off' },
};

export const SEVERITY_TONE = {
  low: 'info',
  medium: 'warning',
  high: 'warning',
  critical: 'danger',
};

export function alertMeta(type) {
  return ALERT_META[type] || { label: type, icon: 'alert-circle' };
}

export function alertUnit(type) {
  if (type === 'HIGH_TEMPERATURE') return '°C';
  if (type === 'HIGH_HUMIDITY') return '%';
  if (type === 'HIGH_CO2') return 'ppm';
  return '';
}
