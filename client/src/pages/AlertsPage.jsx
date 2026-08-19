import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/constants';
import Badge, { severityVariant, statusVariant } from '../components/Badge';
import DataTable from '../components/DataTable';
import Tooltip from '../components/Tooltip';
import ConfirmModal from '../components/ConfirmModal';
import { formatDateTime } from '../lib/datetime';

const CRITICAL_SEVERITIES = new Set(['high', 'critical']);

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: '', label: 'All' },
];

export default function AlertsPage() {
  const { push } = useToast();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [resolving, setResolving] = useState(false);

  const refetchAlerts = () => api.listAlerts(status ? { status } : {}).then((res) => setAlerts(res.data));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listAlerts(status ? { status } : {}), api.listRooms()])
      .then(([alertsRes, roomsRes]) => {
        if (cancelled) return;
        setAlerts(alertsRes.data);
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
  }, [status]);

  async function handleConfirmResolve() {
    if (!pendingAlert) return;
    setResolving(true);
    try {
      await api.resolveAlert(pendingAlert._id);
      push('Alert resolved.', 'success');
      setPendingAlert(null);
      await refetchAlerts();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setResolving(false);
    }
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
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 font-medium">
            {CRITICAL_SEVERITIES.has(row.original.severity) && <AlertTriangle size={14} className="text-red-500" />}
            {row.original.type}
          </span>
        ),
      },
      {
        id: 'room',
        header: 'Room',
        accessorFn: (alert) => roomNameById[alert.roomId] || alert.roomId,
        cell: ({ row }) => (
          <Link to={`/rooms/${row.original.roomId}`} className="text-emerald-700 hover:underline">
            {roomNameById[row.original.roomId] || row.original.roomId}
          </Link>
        ),
      },
      {
        accessorKey: 'deviceId',
        header: 'Device',
        cell: ({ getValue }) => <span className="font-mono text-xs text-slate-500">{getValue()}</span>,
      },
      { accessorKey: 'parameter', header: 'Parameter', cell: ({ getValue }) => getValue() || '-' },
      {
        id: 'valueThreshold',
        header: 'Value / Threshold',
        accessorFn: (alert) => alert.value ?? 0,
        cell: ({ row }) => (
          <span>
            {row.original.value ?? '-'} / {row.original.threshold ?? '-'}
          </span>
        ),
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ getValue }) => <Badge variant={severityVariant(getValue())}>{getValue()}</Badge>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <Badge variant={statusVariant(getValue())}>{getValue()}</Badge>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Since',
        cell: ({ getValue }) => <span className="text-xs text-slate-500">{formatDateTime(getValue())}</span>,
      },
      ...(hasPermission(user, 'alerts:update')
        ? [
            {
              id: 'actions',
              header: '',
              enableSorting: false,
              cell: ({ row }) =>
                row.original.status === 'active' ? (
                  <div className="text-right">
                    <Tooltip label="Resolve alert">
                      <button
                        type="button"
                        onClick={() => setPendingAlert(row.original)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        aria-label="Resolve alert"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                ) : null,
            },
          ]
        : []),
    ],
    [roomNameById, user?.role]
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Every alert across every room.</p>
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                status === opt.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={alerts}
          searchPlaceholder="Search alerts..."
          emptyMessage="No alerts found."
        />
      )}

      {pendingAlert && (
        <ConfirmModal
          title="Resolve alert"
          message={`Mark this ${pendingAlert.type} alert as resolved?`}
          confirmLabel="Resolve"
          danger={false}
          loading={resolving}
          onConfirm={handleConfirmResolve}
          onClose={() => setPendingAlert(null)}
        />
      )}
    </div>
  );
}
