import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Badge, { statusVariant } from './Badge';
import SensorZones from './SensorZones';
import RelayRow from './RelayRow';
import TelemetrySimulator from './TelemetrySimulator';
import CommandSimulator from './CommandSimulator';
import Tooltip from './Tooltip';
import ConfirmModal from './ConfirmModal';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isSuperAdmin } from '../lib/constants';

function formatDate(value) {
  if (!value) return 'never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'never' : date.toLocaleString();
}

export default function DeviceCard({ device, sensorState, relays, onDeleted }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sensors = sensorState?.sensors || {};
  const availableZones = Object.keys(sensors);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteDevice(device.deviceId);
      push('Device deleted.', 'success');
      onDeleted(device.deviceId);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{device.name}</h3>
            <Badge variant={statusVariant(device.status)}>{device.status}</Badge>
          </div>
          <p className="font-mono text-xs text-slate-400">{device.deviceId}</p>
          <p className="mt-1 text-xs text-slate-500">
            {device.deviceType && <>{device.deviceType} · </>}
            last seen {formatDate(device.lastSeen)}
          </p>
        </div>
        {isSuperAdmin(user?.role) && (
          <Tooltip label="Delete device">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-full p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
              aria-label="Delete device"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="mt-3">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sensors</h4>
        <SensorZones sensors={sensors} />
      </div>

      <div className="mt-3">
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Relays</h4>
        {relays.length === 0 ? (
          <p className="text-sm text-slate-400">No relays discovered yet — they appear once telemetry is received.</p>
        ) : (
          <div className="space-y-2">
            {relays.map((relay) => (
              <RelayRow key={relay.relayId} relay={relay} deviceId={device.deviceId} availableZones={availableZones} />
            ))}
          </div>
        )}
        {relays.length > 0 && <CommandSimulator deviceId={device.deviceId} />}
      </div>

      <TelemetrySimulator deviceId={device.deviceId} />

      {confirmOpen && (
        <ConfirmModal
          title="Delete Device"
          message={`Delete device "${device.name}" (${device.deviceId})? This also removes its history.`}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
