import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Home, Plus, Radio, Trash2, Wifi } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasPermission } from '../lib/constants';
import Badge, { statusVariant } from '../components/Badge';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import CreateRoomModal from '../components/CreateRoomModal';
import ConfirmModal from '../components/ConfirmModal';
import Tooltip from '../components/Tooltip';
import { formatDate } from '../lib/datetime';

export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();

  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listRooms(), api.listDevices(), api.listAlerts({ status: 'active' })])
      .then(([roomsRes, devicesRes, alertsRes]) => {
        if (cancelled) return;
        setRooms(roomsRes.data);
        setDevices(devicesRes.data);
        setAlertCount(alertsRes.data.length);
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

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteRoom(deleteTarget.roomId);
      setRooms((prev) => prev.filter((r) => r.roomId !== deleteTarget.roomId));
      push('Room deleted.', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const deviceCountByRoom = useMemo(() => {
    const counts = {};
    devices.forEach((d) => {
      counts[d.roomId] = (counts[d.roomId] || 0) + 1;
    });
    return counts;
  }, [devices]);

  const onlineDeviceCount = useMemo(() => devices.filter((d) => d.status === 'online').length, [devices]);

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
        accessorKey: 'roomId',
        header: 'Room ID',
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{getValue()}</span>,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ getValue }) => getValue() || <span className="text-slate-300">-</span>,
      },
      {
        id: 'devices',
        header: 'Devices',
        accessorFn: (room) => deviceCountByRoom[room.roomId] || 0,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <Badge variant={statusVariant(getValue())}>{getValue()}</Badge>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => <span className="text-slate-500">{formatDate(getValue())}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          hasPermission(user, 'rooms:delete') && (
            <Tooltip label="Delete room">
              <button
                type="button"
                onClick={() => setDeleteTarget(row.original)}
                className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete room"
              >
                <Trash2 size={15} />
              </button>
            </Tooltip>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deviceCountByRoom, user]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">System-wide overview across every room.</p>
        {hasPermission(user, 'rooms:create') && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} /> New Room
          </button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Rooms" value={rooms.length} icon={Home} />
        <StatCard label="Devices" value={devices.length} icon={Radio} />
        <StatCard label="Online Devices" value={onlineDeviceCount} icon={Wifi} accent="text-emerald-600" />
        <StatCard
          label="Active Alerts"
          value={alertCount}
          icon={Bell}
          accent={alertCount > 0 ? 'text-red-600' : 'text-slate-900'}
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable columns={columns} data={rooms} searchPlaceholder="Search rooms..." emptyMessage="No rooms yet." />
      )}

      {createOpen && (
        <CreateRoomModal
          onClose={() => setCreateOpen(false)}
          onCreated={(room) => setRooms((prev) => [room, ...prev])}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Room"
          message={`Delete room "${deleteTarget.name}"? This only works if it has no devices assigned.`}
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
