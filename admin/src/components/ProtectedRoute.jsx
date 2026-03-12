import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, requiredPermission, requireSuperAdmin = false }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Checking access...
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isSuper = admin?.role === 'super_admin';
  if (requireSuperAdmin && !isSuper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        You do not have access to this page.
      </div>
    );
  }

  const perms = admin?.permissions || {};
  const allowed = isSuper || !requiredPermission || perms[requiredPermission];

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        You do not have access to this page.
      </div>
    );
  }

  return children;
}
