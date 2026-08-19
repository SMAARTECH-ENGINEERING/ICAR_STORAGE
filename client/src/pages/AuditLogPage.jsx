import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/constants';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import { formatDateTime } from '../lib/datetime';

const ACTION_OPTIONS = [
  'ROOM_CREATED',
  'ROOM_UPDATED',
  'ROOM_DELETED',
  'DEVICE_CREATED',
  'DEVICE_UPDATED',
  'DEVICE_DELETED',
  'AUTOMATION_RULE_CONFIGURED',
  'ALERT_RESOLVED_MANUALLY',
];

function actionVariant(action) {
  if (action.endsWith('_DELETED')) return 'red';
  if (action.endsWith('_CREATED')) return 'green';
  if (action.endsWith('_UPDATED') || action.endsWith('_CONFIGURED')) return 'blue';
  if (action.includes('RESOLVED')) return 'amber';
  return 'slate';
}

export default function AuditLogPage() {
  const { push } = useToast();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState('');
  const [roomId, setRoomId] = useState('');
  const [userId, setUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const allowed = hasPermission(user, 'audit-logs:read');

  useEffect(() => {
    if (!allowed) return;
    api
      .listRooms()
      .then((res) => setRooms(res.data))
      .catch((err) => push(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function runQuery(filters) {
    setLoading(true);
    try {
      const params = {};
      if (filters.action) params.action = filters.action;
      if (filters.roomId) params.roomId = filters.roomId;
      if (filters.userId) params.userId = filters.userId;
      if (filters.fromDate) params.from = filters.fromDate;
      if (filters.toDate) {
        const end = new Date(filters.toDate);
        end.setUTCHours(23, 59, 59, 999);
        params.to = end.toISOString();
      }
      const res = await api.listAuditLogs(params);
      setLogs(res.data);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    runQuery({ action: '', roomId: '', userId: '', fromDate: '', toDate: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  function handleSubmit(e) {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      push('"From" date must be before "To" date.', 'error');
      return;
    }
    runQuery({ action, roomId, userId, fromDate, toDate });
  }

  function handleReset() {
    setAction('');
    setRoomId('');
    setUserId('');
    setFromDate('');
    setToDate('');
    runQuery({ action: '', roomId: '', userId: '', fromDate: '', toDate: '' });
  }

  const roomNameById = useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      map[r.roomId] = r.name;
    });
    return map;
  }, [rooms]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDateTime(getValue())}</span>,
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ getValue }) => <Badge variant={actionVariant(getValue())}>{getValue()}</Badge>,
      },
      {
        accessorKey: 'userId',
        header: 'User',
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{getValue() || '-'}</span>,
      },
      {
        id: 'room',
        header: 'Room',
        accessorFn: (row) => (row.roomId ? roomNameById[row.roomId] || row.roomId : ''),
        cell: ({ getValue }) => getValue() || <span className="text-slate-300">-</span>,
      },
      {
        accessorKey: 'deviceId',
        header: 'Device',
        cell: ({ getValue }) =>
          getValue() ? <span className="font-mono text-xs text-slate-500">{getValue()}</span> : <span className="text-slate-300">-</span>,
      },
      {
        accessorKey: 'relayId',
        header: 'Relay',
        cell: ({ getValue }) =>
          getValue() ? <span className="font-mono text-xs text-slate-500">{getValue()}</span> : <span className="text-slate-300">-</span>,
      },
      {
        id: 'details',
        header: 'Details',
        accessorFn: (row) => JSON.stringify(row.newValue || row.previousValue || {}),
        cell: ({ row }) => {
          const { previousValue, newValue } = row.original;
          if (!previousValue && !newValue) return <span className="text-slate-300">-</span>;
          return (
            <span
              className="cursor-help text-xs text-slate-500 underline decoration-dotted"
              title={JSON.stringify({ previousValue, newValue }, null, 2)}
            >
              view
            </span>
          );
        },
      },
    ],
    [roomNameById]
  );

  if (!allowed) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        You don't have permission to view the audit log.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-slate-500">
        Every create/update/delete and manual action taken across the system, who did it, and when.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="audit-action">
            Action
          </label>
          <select
            id="audit-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="audit-room">
            Room
          </label>
          <select
            id="audit-room"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Rooms</option>
            {rooms.map((room) => (
              <option key={room.roomId} value={room.roomId}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="audit-user">
            User ID
          </label>
          <input
            id="audit-user"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="USR-..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="audit-from">
            From
          </label>
          <input
            id="audit-from"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="audit-to">
            To
          </label>
          <input
            id="audit-to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Search size={15} /> {loading ? 'Loading...' : 'Filter'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Reset filters"
            aria-label="Reset filters"
          >
            <X size={15} />
          </button>
        </div>
      </form>

      {loading && logs.length === 0 ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          searchPlaceholder="Search audit log..."
          emptyMessage="No audit log entries match these filters."
        />
      )}
    </div>
  );
}
