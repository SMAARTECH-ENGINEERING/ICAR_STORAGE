import { useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../lib/apiClient';
import { getDeviceApiKey } from '../lib/config';
import { useToast } from '../context/ToastContext';

// There's no MQTT broker (or any push transport) in this backend — relay
// commands sit at PENDING until a device polls GET /commands/pending and
// posts an ack (see server/README.md §13). Without real firmware, a manual
// Turn ON/OFF click would otherwise never visibly complete. This stands in
// for that device, so relay control can be tested end-to-end from the browser.
export default function CommandSimulator({ deviceId }) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      const deviceApiKey = getDeviceApiKey();
      const pendingRes = await api.getPendingCommands(deviceId, deviceApiKey);
      const commands = pendingRes.data;

      if (commands.length === 0) {
        push('No pending commands for this device.', 'info');
        return;
      }

      for (const command of commands) {
        await api.acknowledgeCommand(
          deviceId,
          command.commandId,
          { state: command.requestedState, success: true },
          deviceApiKey
        );
      }

      push(`Simulated device: acknowledged ${commands.length} command(s).`, 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Simulate Device (Process Pending Commands)
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-slate-500">
            Polls for pending relay commands and acknowledges each as successful, authenticated with the Device API
            Key from Settings — useful without real hardware.
          </p>
          <button
            type="button"
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
            {running ? 'Processing...' : 'Poll & Acknowledge'}
          </button>
        </div>
      )}
    </div>
  );
}
