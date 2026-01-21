import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for handling access control and permissions
 * @param {Object} options - Configuration options
 * @param {string[]} options.requiredRoles - Array of roles that have access
 * @param {string} options.requiredDepartmentId - Department ID that user must have access to
 * @param {boolean} options.redirectOnDenied - Whether to redirect on access denied
 * @param {string} options.redirectPath - Path to redirect to on access denied
 * @returns {Object} Access control state and methods
 */
export function useAccessControl(options = {}) {
  const {
    requiredRoles = ['department_admin'],
    requiredDepartmentId = null,
    redirectOnDenied = false,
    redirectPath = '/login'
  } = options;

  const navigate = useNavigate();
  const [accessState, setAccessState] = useState({
    hasAccess: false,
    isLoading: true,
    accessDenied: false,
    user: null,
    error: null
  });

  useEffect(() => {
    checkAccess();
  }, [requiredDepartmentId]);

  const checkAccess = () => {
    try {
      setAccessState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get user information from localStorage
      const userRole = localStorage.getItem('auth_role');
      const departmentId = localStorage.getItem('department_id');
      const userId = localStorage.getItem('user_id');

      // Create user object
      const user = {
        role: userRole,
        departmentId: departmentId,
        userId: userId
      };

      // Check if user is authenticated
      if (!userRole) {
        setAccessState({
          hasAccess: false,
          isLoading: false,
          accessDenied: true,
          user: null,
          error: 'User not authenticated. Please log in.'
        });

        if (redirectOnDenied) {
          navigate(redirectPath);
        }
        return false;
      }

      // Check role permissions
      const hasValidRole = requiredRoles.includes(userRole);
      if (!hasValidRole) {
        setAccessState({
          hasAccess: false,
          isLoading: false,
          accessDenied: true,
          user: user,
          error: `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole}`
        });

        if (redirectOnDenied) {
          navigate(redirectPath);
        }
        return false;
      }

      // Check department access if required
      if (requiredDepartmentId && departmentId !== requiredDepartmentId) {
        setAccessState({
          hasAccess: false,
          isLoading: false,
          accessDenied: true,
          user: user,
          error: `Access denied. You do not have permission to access this department's data.`
        });

        if (redirectOnDenied) {
          navigate(redirectPath);
        }
        return false;
      }

      // Access granted
      setAccessState({
        hasAccess: true,
        isLoading: false,
        accessDenied: false,
        user: user,
        error: null
      });

      return true;

    } catch (error) {
      console.error('Access control check failed:', error);
      setAccessState({
        hasAccess: false,
        isLoading: false,
        accessDenied: true,
        user: null,
        error: 'Failed to verify access permissions. Please try again.'
      });

      if (redirectOnDenied) {
        navigate(redirectPath);
      }
      return false;
    }
  };

  const refreshAccess = () => {
    checkAccess();
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_role');
    localStorage.removeItem('department_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('student_id');
    localStorage.removeItem('teacher_id');
    
    // Navigate to login
    navigate('/login');
  };

  return {
    ...accessState,
    refreshAccess,
    logout,
    checkAccess
  };
}

/**
 * Hook specifically for department admin access control
 * @param {string} departmentId - Department ID to check access for
 * @param {Object} options - Additional options
 * @returns {Object} Access control state and methods
 */
export function useDepartmentAdminAccess(departmentId, options = {}) {
  return useAccessControl({
    requiredRoles: ['department_admin'],
    requiredDepartmentId: departmentId,
    ...options
  });
}

/**
 * Hook for checking if user has any admin role
 * @param {Object} options - Additional options
 * @returns {Object} Access control state and methods
 */
export function useAdminAccess(options = {}) {
  return useAccessControl({
    requiredRoles: ['superadmin', 'college_admin', 'department_admin'],
    ...options
  });
}

/**
 * Hook for checking multiple role access
 * @param {string[]} roles - Array of allowed roles
 * @param {Object} options - Additional options
 * @returns {Object} Access control state and methods
 */
export function useRoleAccess(roles, options = {}) {
  return useAccessControl({
    requiredRoles: roles,
    ...options
  });
}