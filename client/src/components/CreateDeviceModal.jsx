import { useState } from 'react';
import Modal from './Modal';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';

// If `roomId` is passed (room detail context), the room is fixed and hidden.
// Otherwise (global Devices page), `rooms` is used to render a room picker.
export default function CreateDeviceModal({ roomId, rooms, onClose, onCreated }) {
  const { push } = useToast();
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || rooms?.[0]?.roomId || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createDevice({
        deviceId,
        roomId: roomId || selectedRoomId,
        name,
        deviceType: deviceType || undefined,
      });
      push(res.message || 'Device created.', 'success');
      onCreated(res.data);
      onClose();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Add Device" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!roomId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="device-room">
              Room
            </label>
            <select
              id="device-room"
              required
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              {(rooms || []).map((room) => (
                <option key={room.roomId} value={room.roomId}>
                  {room.name} ({room.roomId})
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="device-id">
            Device ID
          </label>
          <input
            id="device-id"
            type="text"
            required
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="7semi_env_ctrl_01"
          />
          <p className="mt-1 text-xs text-slate-500">
            Must match the <code>device_id</code> the physical/simulated device sends in its telemetry payload.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="device-name">
            Name
          </label>
          <input
            id="device-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Env Controller 1"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="device-type">
            Device Type <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="device-type"
            type="text"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="env_ctrl"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Device'}
        </button>
      </form>
    </Modal>
  );
}
