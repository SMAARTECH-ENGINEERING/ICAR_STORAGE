import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useRoomSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { canManage, isSuperAdmin } from '../lib/constants';
import Badge, { statusVariant } from '../components/Badge';
import DeviceCard from '../components/DeviceCard';
import CreateDeviceModal from '../components/CreateDeviceModal';
import ConfirmModal from '../components/ConfirmModal';
import Tooltip from '../components/Tooltip';
import AlertsList from '../components/AlertsList';

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [live, setLive] = useState(false);
  const refetchTimer = useRef(null);

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const res = await api.getRoomCurrent(roomId);
        setData(res.data);
      } catch (err) {
        push(err.message, 'error');
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [roomId, push]
  );

  useEffect(() => {
    load(true);
  }, [load]);

  // Any relevant socket event just triggers a fresh fetch of /current — simplest
  // way to stay correct without manually patching nested state by hand.
  const scheduleRefetch = useCallback(() => {
    setLive(true);
    clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => load(false), 250);
  }, [load]);

  useRoomSocket(roomId, { onAny: scheduleRefetch });

  async function handleDeleteRoom() {
    setDeletingRoom(true);
    try {
      await api.deleteRoom(roomId);
      push('Room deleted.', 'success');
      navigate('/');
    } catch (err) {
      push(err.message, 'error');
      setDeletingRoom(false);
      setDeleteRoomOpen(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading room...</p>;
  if (!data) return <p className="text-sm text-red-600">Room not found.</p>;

  const { room, devices, sensorData, relays, alerts } = data;

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to rooms
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{room.name}</h2>
            <Badge variant={statusVariant(room.status)}>{room.status}</Badge>
            {live && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-slate-400">{room.roomId}</p>
          {room.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <MapPin size={14} /> {room.location}
            </p>
          )}
          {room.description && <p className="text-sm text-slate-500">{room.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          {canManage(user?.role) && (
            <button
              type="button"
              onClick={() => setAddDeviceOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus size={16} /> Add Device
            </button>
          )}
          {isSuperAdmin(user?.role) && (
            <Tooltip label="Delete room">
              <button
                type="button"
                onClick={() => setDeleteRoomOpen(true)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete room"
              >
                <Trash2 size={18} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Devices ({devices.length})
      </h2>
      {devices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No devices assigned to this room yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard
              key={device.deviceId}
              device={device}
              sensorState={sensorData.find((s) => s.deviceId === device.deviceId)}
              relays={relays.filter((r) => r.deviceId === device.deviceId)}
              onDeleted={() => load(false)}
            />
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Active Alerts ({alerts.length})
      </h2>
      <AlertsList alerts={alerts} />

      {addDeviceOpen && (
        <CreateDeviceModal roomId={roomId} onClose={() => setAddDeviceOpen(false)} onCreated={() => load(false)} />
      )}

      {deleteRoomOpen && (
        <ConfirmModal
          title="Delete Room"
          message={`Delete room "${room.name}"? This only works if it has no devices assigned.`}
          loading={deletingRoom}
          onConfirm={handleDeleteRoom}
          onClose={() => setDeleteRoomOpen(false)}
        />
      )}
    </div>
  );
}
