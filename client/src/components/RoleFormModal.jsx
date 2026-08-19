import { useState } from 'react';
import Modal from './Modal';
import PermissionMatrixEditor from './PermissionMatrixEditor';
import { api } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';

export default function RoleFormModal({ role, permissions, onClose, onSaved }) {
  const { push } = useToast();
  const isEdit = !!role;
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selected, setSelected] = useState(role?.permissions || []);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { description, permissions: selected };
      if (!role?.isSystem) payload.name = name;

      const res = isEdit ? await api.updateRole(role.roleId, payload) : await api.createRole({ ...payload, name });
      push(res.message || (isEdit ? 'Role updated.' : 'Role created.'), 'success');
      onSaved(res.data);
      onClose();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit Role: ${role.name}` : 'Create Role'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role-name">
            Name
          </label>
          <input
            id="role-name"
            type="text"
            required
            disabled={role?.isSystem}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="Facility Manager"
          />
          {role?.isSystem && <p className="mt-1 text-xs text-slate-400">System roles can&apos;t be renamed.</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role-description">
            Description <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Permissions</label>
          <PermissionMatrixEditor permissions={permissions} value={selected} onChange={setSelected} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Role' : 'Create Role'}
        </button>
      </form>
    </Modal>
  );
}
