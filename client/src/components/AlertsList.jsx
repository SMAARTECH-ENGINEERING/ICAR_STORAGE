import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Badge, { severityVariant } from './Badge';
import { formatDateTime } from '../lib/datetime';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { hasPermission } from '../lib/constants';
import { api } from '../lib/apiClient';
import Tooltip from './Tooltip';
import ConfirmModal from './ConfirmModal';
import DataTable from './DataTable';

export default function AlertsList({ alerts, onResolved }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [pendingAlert, setPendingAlert] = useState(null);
  const [resolving, setResolving] = useState(false);

  async function handleConfirmResolve() {
    if (!pendingAlert) return;
    setResolving(true);
    try {
      await api.resolveAlert(pendingAlert._id);
      push('Alert resolved.', 'success');
      setPendingAlert(null);
      onResolved?.();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setResolving(false);
    }
  }

  const columns = useMemo(
    () => [
      { accessorKey: 'type', header: 'Type', cell: ({ getValue }) => <span className="font-medium text-slate-900">{getValue()}</span> },
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
              cell: ({ row }) => (
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
              ),
            },
          ]
        : []),
    ],
    [user]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={alerts || []}
        searchPlaceholder="Search alerts..."
        emptyMessage="No active alerts for this room."
      />

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
    </>
  );
}
