import { NavLink } from 'react-router-dom';
import { Bell, FileText, LayoutDashboard, Radio, ScrollText, Settings as SettingsIcon, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/constants';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/devices', label: 'Devices', icon: Radio },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText, requires: 'audit-logs:read' },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, requires: 'admin:manage' },
  { to: '/users', label: 'Users', icon: Users, requires: 'admin:manage' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {item.label}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => !item.requires || hasPermission(user, item.requires));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-slate-900 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <img src="/logo-192.png" alt="Smaatech Agri" className="h-7 w-auto" />
          <span className="text-lg font-semibold text-white">Smaatech Agri</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {visibleItems.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </>
  );
}
