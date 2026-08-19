import { useEffect, useMemo, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/constants';
import Badge, { roleVariant, statusVariant } from '../components/Badge';
import DataTable from '../components/DataTable';
import { formatDateTime } from '../lib/datetime';

function RoleSelect({ user, roles, disabled, onAssigned }) {
  const { push } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const role = e.target.value;
    if (role === user.role) return;
    setSaving(true);
    try {
      await api.assignUserRole(user.userId, role);
      push(`${user.name} is now ${role}.`, 'success');
      onAssigned();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={user.role}
      disabled={disabled || saving}
      onChange={handleChange}
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
    >
      {!roles.find((r) => r.name === user.role) && <option value={user.role}>{user.role}</option>}
      {roles.map((r) => (
        <option key={r.roleId} value={r.name}>
          {r.name}
        </option>
      ))}
    </select>
  );
}

export default function UsersPage() {
  const { push } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const allowed = hasPermission(currentUser, 'admin:manage');

  const load = () =>
    Promise.all([api.listUsers(), api.listRoles()])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data);
        setRoles(rolesRes.data);
      })
      .catch((err) => push(err.message, 'error'))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const columns = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name', cell: ({ getValue }) => <span className="font-medium text-slate-900">{getValue()}</span> },
      { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => <span className="text-slate-500">{getValue()}</span> },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) =>
          row.original.userId === currentUser?.userId ? (
            <Badge variant={roleVariant(row.original.role)}>{row.original.role}</Badge>
          ) : (
            <RoleSelect user={row.original} roles={roles} onAssigned={load} />
          ),
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ getValue }) => <Badge variant={statusVariant(getValue() ? 'online' : 'offline')}>{getValue() ? 'Active' : 'Inactive'}</Badge>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ getValue }) => <span className="text-xs text-slate-500">{formatDateTime(getValue())}</span>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles, currentUser]
  );

  if (!allowed) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        You don't have permission to manage users.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
        <UsersIcon size={15} className="text-slate-400" />
        Every registered user and their assigned role. You can't change your own role — ask another administrator.
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable columns={columns} data={users} searchPlaceholder="Search users..." emptyMessage="No users found." />
      )}
    </div>
  );
}
