import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasPermission } from '../lib/constants';
import Badge, { statusVariant } from '../components/Badge';
import DataTable from '../components/DataTable';
import CreateDeviceModal from '../components/CreateDeviceModal';
import ConfirmModal from '../components/ConfirmModal';
import Tooltip from '../components/Tooltip';
import { formatDateTime } from '../lib/datetime';

export default function DevicesPage() {
  const { user } = useAuth();
  const { push } = useToast();

  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listDevices(), api.listRooms()])
      .then(([devicesRes, roomsRes]) => {
        if (cancelled) return;
        setDevices(devicesRes.data);
        setRooms(roomsRes.data);
      })
      .catch((err) => push(err.message, 'error'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomNameById = useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      map[r.roomId] = r.name;
    });
    return map;
  }, [rooms]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteDevice(deleteTarget.deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deleteTarget.deviceId));
      push('Device deleted.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link to={`/rooms/${row.original.roomId}`} className="font-medium text-emerald-700 hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'deviceId',
        header: 'Device ID',
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{getValue()}</span>,
      },
      {
        id: 'room',
        header: 'Room',
        accessorFn: (device) => roomNameById[device.roomId] || device.roomId,
        cell: ({ row }) => (
          <Link to={`/rooms/${row.original.roomId}`} className="text-slate-600 hover:underline">
            {roomNameById[row.original.roomId] || row.original.roomId}
          </Link>
        ),
      },
      {
        accessorKey: 'deviceType',
        header: 'Type',
        cell: ({ getValue }) => getValue() || <span className="text-slate-300">-</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <Badge variant={statusVariant(getValue())}>{getValue()}</Badge>,
      },
      {
        accessorKey: 'lastSeen',
        header: 'Last Seen',
        cell: ({ getValue }) => <span className="text-slate-500">{formatDateTime(getValue(), 'never')}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          hasPermission(user, 'devices:delete') && (
            <Tooltip label="Delete device">
              <button
                type="button"
                onClick={() => setDeleteTarget(row.original)}
                className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete device"
              >
                <Trash2 size={15} />
              </button>
            </Tooltip>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomNameById, user]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">Every device across every room.</p>
        {hasPermission(user, 'devices:create') && rooms.length > 0 && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} /> Add Device
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={devices}
          searchPlaceholder="Search devices..."
          emptyMessage="No devices yet."
        />
      )}

      {createOpen && (
        <CreateDeviceModal
          rooms={rooms}
          onClose={() => setCreateOpen(false)}
          onCreated={(device) => setDevices((prev) => [device, ...prev])}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Device"
          message={`Delete device "${deleteTarget.name}" (${deleteTarget.deviceId})? This also removes its history.`}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
