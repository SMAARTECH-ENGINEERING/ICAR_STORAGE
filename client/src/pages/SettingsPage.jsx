import ApiSettingsForm from '../components/ApiSettingsForm';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Badge, { roleVariant } from '../components/Badge';

export default function SettingsPage() {
  const { push } = useToast();
  const { user } = useAuth();

  return (
    <div className="">
      <p className="mb-6 text-sm text-slate-500">Connection settings for this browser, stored locally.</p>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Signed in as</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <Badge variant={roleVariant(user?.role)}>{user?.role}</Badge>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">API Connection</h2>
        <ApiSettingsForm onSaved={() => push('Settings saved.', 'success')} />
      </div>
    </div>
  );
}
