import { useState } from 'react';
import { ChevronDown, ChevronRight, Power, PowerOff, SlidersHorizontal } from 'lucide-react';
import Badge, { relayStateVariant } from './Badge';
import AutomationForm from './AutomationForm';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { canManage } from '../lib/constants';

export default function RelayRow({ relay, deviceId, availableZones }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [sending, setSending] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);

  async function handleCommand(state) {
    setSending(true);
    try {
      const res = await api.sendRelayCommand(deviceId, relay.relayId, { mode: 'manual', state });
      push(`Command sent: ${relay.relayId} -> ${state} (status: ${res.data.status})`, 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-slate-900">{relay.relayId}</span>
          <Badge variant="blue">{relay.mode}</Badge>
          <Badge variant={relayStateVariant(relay.state)}>{relay.state}</Badge>
        </div>

        {canManage(user?.role) && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={sending}
              onClick={() => handleCommand('ON')}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Power size={13} /> Turn ON
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={() => handleCommand('OFF')}
              className="flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              <PowerOff size={13} /> Turn OFF
            </button>
            <button
              type="button"
              onClick={() => setShowAutomation((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
            >
              <SlidersHorizontal size={13} />
              Automation
              {showAutomation ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>
        )}
      </div>

      {relay.controlSource && (
        <p className="mt-1 text-xs text-slate-400">
          source: {relay.controlSource}
          {relay.controllingZone ? ` · zone: ${relay.controllingZone}` : ''}
        </p>
      )}

      {showAutomation && canManage(user?.role) && (
        <div className="mt-3">
          <AutomationForm deviceId={deviceId} relayId={relay.relayId} availableZones={availableZones} />
        </div>
      )}
    </div>
  );
}
