import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ApiSettingsForm from '../components/ApiSettingsForm';

export default function LoginPage() {
  const { user, initializing, login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      push('Logged in.', 'success');
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
          <h1 className="mt-2 text-xl font-semibold text-slate-900">ICAR Storage</h1>
          <p className="text-sm text-slate-500">Multi-room IoT environmental dashboard</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="admin@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            No account yet?{' '}
            <Link to="/register" className="font-medium text-emerald-600 hover:underline">
              Register
            </Link>
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className="flex w-full items-center gap-1 text-left text-sm font-medium text-slate-600"
          >
            {showSettings ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            API Settings
          </button>
          {showSettings && (
            <div className="mt-3">
              <ApiSettingsForm onSaved={() => push('Settings saved.', 'success')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
