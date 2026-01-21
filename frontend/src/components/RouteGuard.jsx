import React from 'react';
import { useAccessControl } from '../hooks/useAccessControl';
import AccessDenied from './AccessDenied';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';

/**
 * RouteGuard component for protecting routes with access control
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string[]} props.requiredRoles - Array of roles that have access
 * @param {string} props.requiredDepartmentId - Department ID that user must have access to
 * @param {boolean} props.redirectOnDenied - Whether to redirect on access denied
 * @param {string} props.redirectPath - Path to redirect to on access denied
 * @param {React.ReactNode} props.fallback - Custom fallback component for access denied
 * @param {React.ReactNode} props.loadingFallback - Custom loading component
 * @param {string} props.accessDeniedMessage - Custom access denied message
 * @param {string} props.accessDeniedTitle - Custom access denied title
 * @returns {JSX.Element} RouteGuard component
 */
function RouteGuard({
  children,
  requiredRoles = ['department_admin'],
  requiredDepartmentId = null,
  redirectOnDenied = false,
  redirectPath = '/login',
  fallback = null,
  loadingFallback = null,
  accessDeniedMessage = null,
  accessDeniedTitle = null
}) {
  const {
    hasAccess,
    isLoading,
    accessDenied,
    user,
    error,
    refreshAccess
  } = useAccessControl({
    requiredRoles,
    requiredDepartmentId,
    redirectOnDenied,
    redirectPath
  });

  // Show loading state
  if (isLoading) {
    return loadingFallback || (
      <div className="dashboard-overview">
        <div className="loading-container">
          <LoadingSpinner 
            size="large" 
            message="Verifying access permissions..." 
          />
        </div>
      </div>
    );
  }

  // Show access denied state
  if (accessDenied || !hasAccess) {
    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Use default AccessDenied component
    return (
      <AccessDenied
        message={accessDeniedMessage || error}
        title={accessDeniedTitle}
        user={user}
        onRetry={refreshAccess}
        showLoginButton={!user}
        showBackButton={true}
        loginPath={redirectPath}
      />
    );
  }

  // Access granted - render children
  return children;
}

/**
 * DepartmentRouteGuard - Specific guard for department admin routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.departmentId - Department ID to check access for
 * @param {Object} props.options - Additional options
 * @returns {JSX.Element} DepartmentRouteGuard component
 */
export function DepartmentRouteGuard({ children, departmentId, ...options }) {
  return (
    <RouteGuard
      requiredRoles={['department_admin']}
      requiredDepartmentId={departmentId}
      accessDeniedMessage="You do not have permission to access this department's data."
      accessDeniedTitle="Department Access Denied"
      {...options}
    >
      {children}
    </RouteGuard>
  );
}

/**
 * AdminRouteGuard - Guard for admin-only routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.options - Additional options
 * @returns {JSX.Element} AdminRouteGuard component
 */
export function AdminRouteGuard({ children, ...options }) {
  return (
    <RouteGuard
      requiredRoles={['superadmin', 'college_admin', 'department_admin']}
      accessDeniedMessage="You do not have administrative permissions to access this resource."
      accessDeniedTitle="Admin Access Required"
      {...options}
    >
      {children}
    </RouteGuard>
  );
}

/**
 * RoleRouteGuard - Guard for specific role-based routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string[]} props.roles - Array of allowed roles
 * @param {Object} props.options - Additional options
 * @returns {JSX.Element} RoleRouteGuard component
 */
export function RoleRouteGuard({ children, roles, ...options }) {
  return (
    <RouteGuard
      requiredRoles={roles}
      accessDeniedMessage={`Access restricted to: ${roles.join(', ')}`}
      accessDeniedTitle="Role Access Required"
      {...options}
    >
      {children}
    </RouteGuard>
  );
}

export default RouteGuard;