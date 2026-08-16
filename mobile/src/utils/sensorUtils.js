// Sensor zones and their measurement keys are fully dynamic (device-defined).
// These maps only provide nicer labels/units/icons for well-known keys;
// anything unrecognized still renders using its raw key name.
export const FIELD_LABELS = {
  temperature_c: 'Temperature',
  humidity_percent: 'Humidity',
  pressure_hpa: 'Pressure',
  co2_ppm: 'CO2',
};

export const FIELD_UNITS = {
  temperature_c: '°C',
  humidity_percent: '%',
  pressure_hpa: 'hPa',
  co2_ppm: 'ppm',
};

export const FIELD_ICONS = {
  temperature_c: 'thermometer-outline',
  humidity_percent: 'water-outline',
  pressure_hpa: 'speedometer-outline',
  co2_ppm: 'cloud-outline',
};

export function fieldLabel(key) {
  return FIELD_LABELS[key] || toTitleCase(key);
}

export function fieldUnit(key) {
  return FIELD_UNITS[key] ?? '';
}

export function fieldIcon(key) {
  return FIELD_ICONS[key] || 'analytics-outline';
}

export function toTitleCase(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatValue(value, key) {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'number') {
    const decimals = key === 'humidity_percent' || key === 'co2_ppm' || key === 'pressure_hpa' ? 0 : 1;
    return value.toFixed(decimals);
  }
  return String(value);
}

// Flattens a device's `sensors` object into a list of primary (temp/humidity/co2)
// readings for compact summaries like dashboard room cards.
export function summarizeSensors(sensorsByZone = {}) {
  const zones = Object.entries(sensorsByZone || {});
  const summary = { temperature_c: [], humidity_percent: [], co2_ppm: [] };
  zones.forEach(([, zoneData]) => {
    Object.entries(zoneData || {}).forEach(([key, value]) => {
      if (summary[key] && typeof value === 'number') summary[key].push(value);
    });
  });
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const max = (arr) => (arr.length ? Math.max(...arr) : null);
  return {
    temperature_c: avg(summary.temperature_c),
    humidity_percent: avg(summary.humidity_percent),
    co2_ppm: max(summary.co2_ppm),
  };
}

export function isZoneField(key) {
  return key !== 'sensor_model';
}
