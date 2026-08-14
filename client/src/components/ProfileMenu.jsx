import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge, { roleVariant } from './Badge';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
          {initials(user?.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-slate-900">{user?.name}</span>
          <span className="block text-xs leading-tight text-slate-500">{user?.role}</span>
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <Badge variant={roleVariant(user?.role)} className="mt-1.5">
              {user?.role}
            </Badge>
          </div>

          <Link
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <SettingsIcon size={16} />
            Settings
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
