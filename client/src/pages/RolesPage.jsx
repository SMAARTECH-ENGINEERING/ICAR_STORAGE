import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/constants';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Tooltip from '../components/Tooltip';
import ConfirmModal from '../components/ConfirmModal';
import RoleFormModal from '../components/RoleFormModal';
import { formatDateTime } from '../lib/datetime';

export default function RolesPage() {
  const { push } = useToast();
  const { user } = useAuth();

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState(null); // null = closed, {} = create, role = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const allowed = hasPermission(user, 'admin:manage');

  const load = () =>
    Promise.all([api.listRoles(), api.listPermissions()])
      .then(([rolesRes, permsRes]) => {
        setRoles(rolesRes.data);
        setPermissions(permsRes.data);
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

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteRole(deleteTarget.roleId);
      push('Role deleted.', 'success');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 font-medium text-slate-900">
            {row.original.name}
            {row.original.isSystem && <Badge variant="purple">system</Badge>}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ getValue }) => <span className="text-slate-500">{getValue() || '-'}</span>,
      },
      {
        id: 'permissionCount',
        header: 'Permissions',
        accessorFn: (role) => role.permissions.length,
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.permissions.length} / {permissions.length}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ getValue }) => <span className="text-xs text-slate-500">{formatDateTime(getValue())}</span>,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Tooltip label="Edit role">
              <button
                type="button"
                onClick={() => setFormTarget(row.original)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Edit role"
              >
                <Pencil size={15} />
              </button>
            </Tooltip>
            {!row.original.isSystem && (
              <Tooltip label="Delete role">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row.original)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete role"
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            )}
          </div>
        ),
      },
    ],
    [permissions.length]
  );

  if (!allowed) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        You don't have permission to manage roles.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <ShieldCheck size={15} className="text-slate-400" />
          Create roles and assign exactly the permissions each one needs — nothing is hardcoded.
        </p>
        <button
          type="button"
          onClick={() => setFormTarget({})}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={16} /> New Role
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable columns={columns} data={roles} searchPlaceholder="Search roles..." emptyMessage="No roles found." />
      )}

      {formTarget !== null && (
        <RoleFormModal
          role={formTarget.roleId ? formTarget : null}
          permissions={permissions}
          onClose={() => setFormTarget(null)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete role"
          message={`Delete role "${deleteTarget.name}"? Users currently assigned to it must be reassigned first.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
