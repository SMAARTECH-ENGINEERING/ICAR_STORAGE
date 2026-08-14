import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';

export default function AutomationForm({ deviceId, relayId, availableZones }) {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [zones, setZones] = useState([]);
  const [thresholdOn, setThresholdOn] = useState(30);
  const [thresholdOff, setThresholdOff] = useState(28);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getAutomationRule(deviceId, relayId)
      .then((res) => {
        if (cancelled) return;
        setEnabled(res.data.enabled);
        setZones(res.data.zones || []);
        setThresholdOn(res.data.thresholdOn);
        setThresholdOff(res.data.thresholdOff);
        setExists(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status !== 404) push(err.message, 'error');
        setExists(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, relayId]);

  function toggleZone(zone) {
    setZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]));
  }

  const invalid = Number(thresholdOff) >= Number(thresholdOn);

  async function handleSave(e) {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    try {
      const res = await api.upsertAutomationRule(deviceId, relayId, {
        enabled,
        zones,
        thresholdOn: Number(thresholdOn),
        thresholdOff: Number(thresholdOff),
      });
      push(res.message || 'Automation rule saved.', 'success');
      setExists(true);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-xs text-slate-400">Loading automation rule...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
      {!exists && (
        <p className="text-xs text-amber-600">No rule configured yet for this relay — fill in the fields and save one.</p>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-600">
          Zones driving this rule (max temperature across selected zones)
        </span>
        <div className="flex flex-wrap gap-2">
          {availableZones.length === 0 && <span className="text-xs text-slate-400">No sensor zones seen yet.</span>}
          {availableZones.map((zone) => (
            <label
              key={zone}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs ring-1 ${
                zones.includes(zone)
                  ? 'bg-emerald-600 text-white ring-emerald-600'
                  : 'bg-white text-slate-600 ring-slate-300'
              }`}
            >
              <input type="checkbox" className="hidden" checked={zones.includes(zone)} onChange={() => toggleZone(zone)} />
              {zone}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`threshold-on-${relayId}`}>
            Threshold ON (°C)
          </label>
          <input
            id={`threshold-on-${relayId}`}
            type="number"
            step="0.1"
            value={thresholdOn}
            onChange={(e) => setThresholdOn(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={`threshold-off-${relayId}`}>
            Threshold OFF (°C)
          </label>
          <input
            id={`threshold-off-${relayId}`}
            type="number"
            step="0.1"
            value={thresholdOff}
            onChange={(e) => setThresholdOff(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>
      {invalid && <p className="text-xs text-red-600">Threshold OFF must be less than threshold ON.</p>}

      <button
        type="submit"
        disabled={saving || invalid}
        className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Automation Rule'}
      </button>
    </form>
  );
}
