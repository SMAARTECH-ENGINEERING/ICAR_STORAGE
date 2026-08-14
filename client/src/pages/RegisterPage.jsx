import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../lib/constants';

export default function RegisterPage() {
  const { user, initializing, register } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.VIEWER);
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      push('Account created.', 'success');
      navigate('/');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Sprout className="mx-auto text-emerald-600" size={40} strokeWidth={1.5} />
          <h1 className="mt-2 text-xl font-semibold text-slate-900">Create an account</h1>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value={ROLES.VIEWER}>Viewer (read-only)</option>
                <option value={ROLES.ADMIN}>Admin (manage rooms/devices/relays)</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admin (full access)</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                The backend does not restrict self-registration by role — pick Super Admin to unlock everything for testing.
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
