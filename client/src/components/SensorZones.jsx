// Renders whatever sensor zones/fields the device actually sent (e.g. upper/
// middle/lower/co2, or any other names) — nothing here is hardcoded to a
// fixed zone list or fixed measurement set.
const FIELD_LABELS = {
  temperature_c: 'Temp',
  humidity_percent: 'Humidity',
  pressure_hpa: 'Pressure',
  co2_ppm: 'CO2',
};

const FIELD_UNITS = {
  temperature_c: '°C',
  humidity_percent: '%',
  pressure_hpa: 'hPa',
  co2_ppm: 'ppm',
};

export default function SensorZones({ sensors }) {
  const zoneNames = Object.keys(sensors || {});

  if (zoneNames.length === 0) {
    return <p className="text-sm text-slate-400">No sensor data received yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {zoneNames.map((zoneName) => {
        const zone = sensors[zoneName] || {};
        const fields = Object.entries(zone).filter(([key]) => key !== 'sensor_model');
        return (
          <div key={zoneName} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{zoneName}</span>
              {zone.sensor_model && <span className="text-[10px] text-slate-400">{zone.sensor_model}</span>}
            </div>
            <dl className="mt-1 space-y-0.5">
              {fields.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between text-sm">
                  <dt className="text-slate-500">{FIELD_LABELS[key] || key}</dt>
                  <dd className="font-medium text-slate-900">
                    {value}
                    {FIELD_UNITS[key] || ''}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
