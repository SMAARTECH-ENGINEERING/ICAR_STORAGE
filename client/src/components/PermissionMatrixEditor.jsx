import { useMemo } from 'react';

const ACTION_ORDER = ['create', 'read', 'update', 'delete', 'manage'];

// Editable checkbox grid: one row per resource, one checkbox per permission
// key that resource actually has (not every resource has all 4 CRUD ops —
// e.g. Relays only has read/update, Administration only has manage).
export default function PermissionMatrixEditor({ permissions, value, onChange, disabled = false }) {
  const grouped = useMemo(() => {
    const map = new Map();
    permissions.forEach((p) => {
      if (!map.has(p.resource)) map.set(p.resource, []);
      map.get(p.resource).push(p);
    });
    for (const list of map.values()) {
      list.sort((a, b) => ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action));
    }
    return Array.from(map.entries());
  }, [permissions]);

  function toggle(key) {
    if (disabled) return;
    if (value.includes(key)) onChange(value.filter((k) => k !== key));
    else onChange([...value, key]);
  }

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {grouped.map(([resource, perms]) => (
        <div key={resource} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-700">{resource}</span>
          <div className="flex flex-wrap gap-3">
            {perms.map((p) => (
              <label
                key={p.key}
                title={p.label}
                className={`flex items-center gap-1.5 text-xs capitalize ${
                  disabled ? 'text-slate-400' : 'cursor-pointer text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={value.includes(p.key)}
                  disabled={disabled}
                  onChange={() => toggle(p.key)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                />
                {p.action}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
