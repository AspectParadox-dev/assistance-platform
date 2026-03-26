import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getDefaultDashboardPath } from '../utils/roleHelpers';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
