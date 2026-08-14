import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Send } from 'lucide-react';
import { api } from '../lib/apiClient';
import { getDeviceApiKey } from '../lib/config';
import { useToast } from '../context/ToastContext';

function buildTemplate(deviceId) {
  return JSON.stringify(
    {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      sensors: {
        upper: { sensor_model: 'SHT20', temperature_c: 31.6, humidity_percent: 57.8 },
        middle: { sensor_model: 'SHT40', temperature_c: 29.4, humidity_percent: 60.9 },
        lower: { sensor_model: 'BME280', temperature_c: 28.1, humidity_percent: 64.2, pressure_hpa: 1008.3 },
        co2: { sensor_model: 'SCD40', co2_ppm: 875 },
      },
      relays: {
        relay_1: { mode: 'auto', state: 'ON', threshold_on_c: 30, threshold_off_c: 28 },
        relay_2: { mode: 'manual', state: 'OFF' },
      },
    },
    null,
    2
  );
}

export default function TelemetrySimulator({ deviceId }) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(() => buildTemplate(deviceId));
  const [sending, setSending] = useState(false);

  function refreshTemplate() {
    setPayload(buildTemplate(deviceId));
  }

  async function handleSend(e) {
    e.preventDefault();
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      push('Payload is not valid JSON.', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await api.sendTelemetry(parsed, getDeviceApiKey());
      push(res.message || 'Telemetry accepted.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3">
      <button
        type="button"
        onClick={() => {
          if (!open) refreshTemplate();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Send Test Telemetry
      </button>
      {open && (
        <form onSubmit={handleSend} className="mt-2 space-y-2">
          <p className="text-xs text-slate-500">
            Simulates a device POSTing to <code>/devices/telemetry</code>, authenticated with the Device API Key from
            Settings — useful without real hardware.
          </p>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Send size={13} />
              {sending ? 'Sending...' : 'Send Telemetry'}
            </button>
            <button
              type="button"
              onClick={refreshTemplate}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw size={13} /> Reset Template
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
