// Protected Route Component for LeadsBox Dashboard

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { getOrgId } from '@/api/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'OWNER' | 'MANAGER' | 'AGENT';
  redirectTo?: string;
  requireOrganization?: boolean;
  organizationRedirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = '/login',
  requireOrganization = true,
  organizationRedirectTo = '/onboarding/organization',
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto' />
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const hasOrganization = (() => {
    if (!user) return false;
    const userHasOrg =
      Boolean(user.orgId) ||
      Boolean(user.currentOrgId) ||
      (Array.isArray(user.organizations) && user.organizations.length > 0);
    if (userHasOrg) return true;
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(getOrgId());
    } catch {
      return false;
    }
  })();

  if (requireAuth && requireOrganization && user && !hasOrganization) {
    if (location.pathname !== organizationRedirectTo) {
      return <Navigate to={organizationRedirectTo} state={{ from: location }} replace />;
    }
  }

  // Check role requirement
  if (requiredRole && user) {
    const roleHierarchy = {
      OWNER: 3,
      MANAGER: 2,
      AGENT: 1,
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='text-center space-y-4 max-w-md mx-auto p-6'>
            <div className='h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto'>
              <span className='text-destructive text-xl'>⚠️</span>
            </div>
            <h2 className='text-2xl font-semibold text-foreground'>Access Denied</h2>
            <p className='text-muted-foreground'>
              You don't have permission to access this page.
              {requiredRole && ` This page requires ${requiredRole} role or higher.`}
            </p>
            <button
              onClick={() => window.history.back()}
              className='mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors'
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (!requireAuth && user && ['/login', '/register', '/'].includes(location.pathname)) {
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
