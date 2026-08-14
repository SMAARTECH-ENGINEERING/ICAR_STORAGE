const VARIANTS = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-500/20',
  red: 'bg-red-100 text-red-700 ring-red-500/20',
  amber: 'bg-amber-100 text-amber-700 ring-amber-500/20',
  blue: 'bg-blue-100 text-blue-700 ring-blue-500/20',
  purple: 'bg-purple-100 text-purple-700 ring-purple-500/20',
};

export default function Badge({ children, variant = 'slate', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${VARIANTS[variant] || VARIANTS.slate} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusVariant(status) {
  switch (status) {
    case 'online':
      return 'green';
    case 'offline':
      return 'red';
    case 'active':
      return 'green';
    case 'resolved':
      return 'slate';
    default:
      return 'slate';
  }
}

export function relayStateVariant(state) {
  return state === 'ON' ? 'green' : 'slate';
}

export function severityVariant(severity) {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'high':
      return 'amber';
    case 'medium':
      return 'blue';
    default:
      return 'slate';
  }
}

export function roleVariant(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'purple';
    case 'ADMIN':
      return 'blue';
    default:
      return 'slate';
  }
}

export function commandStatusVariant(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'green';
    case 'FAILED':
    case 'TIMEOUT':
      return 'red';
    case 'SENT':
    case 'ACKNOWLEDGED':
      return 'amber';
    default:
      return 'slate';
  }
}
