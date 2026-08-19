import Badge, { severityVariant } from './Badge';
import { formatDateTime } from '../lib/datetime';

export default function AlertsList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No active alerts for this room.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Device</th>
            <th className="px-4 py-2">Parameter</th>
            <th className="px-4 py-2">Value / Threshold</th>
            <th className="px-4 py-2">Severity</th>
            <th className="px-4 py-2">Since</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <tr key={alert._id}>
              <td className="px-4 py-2 font-medium text-slate-900">{alert.type}</td>
              <td className="px-4 py-2 font-mono text-xs text-slate-500">{alert.deviceId}</td>
              <td className="px-4 py-2 text-slate-600">{alert.parameter || '-'}</td>
              <td className="px-4 py-2 text-slate-600">
                {alert.value ?? '-'} / {alert.threshold ?? '-'}
              </td>
              <td className="px-4 py-2">
                <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
              </td>
              <td className="px-4 py-2 text-xs text-slate-500">{formatDateTime(alert.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
