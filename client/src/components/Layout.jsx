import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';

const TITLES = [
  { test: (p) => p === '/', title: 'Dashboard' },
  { test: (p) => p.startsWith('/devices'), title: 'Devices' },
  { test: (p) => p.startsWith('/reports'), title: 'Reports' },
  { test: (p) => p.startsWith('/alerts'), title: 'Alerts' },
  { test: (p) => p.startsWith('/settings'), title: 'Settings' },
  { test: (p) => p.startsWith('/rooms/'), title: 'Room Detail' },
];

function pageTitle(pathname) {
  return TITLES.find((t) => t.test(pathname))?.title || '';
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-slate-900">{pageTitle(location.pathname)}</h1>
          </div>

          <ProfileMenu />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
