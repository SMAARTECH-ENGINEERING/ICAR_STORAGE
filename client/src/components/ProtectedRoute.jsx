import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
