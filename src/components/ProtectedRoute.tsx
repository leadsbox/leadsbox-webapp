import { useAuth } from '../context/AuthContext';
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className='p-8 text-center text-slate-600'>Loading…</div>;
  if (!user) return <Navigate to='/login' replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
