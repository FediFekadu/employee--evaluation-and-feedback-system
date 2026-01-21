import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAccessControl, useDepartmentAdminAccess } from '../useAccessControl';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAccessControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockNavigate.mockClear();
  });

  describe('Basic Access Control', () => {
    it('should grant access for valid department admin', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_role':
            return 'department_admin';
          case 'department_id':
            return '123';
          case 'user_id':
            return 'user123';
          default:
            return null;
        }
      });

      const { result } = renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
          requiredDepartmentId: '123',
        })
      );

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.accessDenied).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual({
        role: 'department_admin',
        departmentId: '123',
        userId: 'user123',
      });
    });

    it('should deny access for wrong role', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_role':
            return 'student';
          case 'department_id':
            return '123';
          case 'user_id':
            return 'user123';
          default:
            return null;
        }
      });

      const { result } = renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
          requiredDepartmentId: '123',
        })
      );

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.accessDenied).toBe(true);
      expect(result.current.error).toContain('Access denied');
    });

    it('should deny access for wrong department', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_role':
            return 'department_admin';
          case 'department_id':
            return '456';
          case 'user_id':
            return 'user123';
          default:
            return null;
        }
      });

      const { result } = renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
          requiredDepartmentId: '123',
        })
      );

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.accessDenied).toBe(true);
      expect(result.current.error).toContain('Access denied');
    });

    it('should deny access for unauthenticated user', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
        })
      );

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.accessDenied).toBe(true);
      expect(result.current.error).toContain('User not authenticated');
    });
  });

  describe('Department Admin Access Hook', () => {
    it('should work correctly for department admin access', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_role':
            return 'department_admin';
          case 'department_id':
            return '123';
          case 'user_id':
            return 'user123';
          default:
            return null;
        }
      });

      const { result } = renderHook(() => useDepartmentAdminAccess('123'));

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.accessDenied).toBe(false);
    });
  });

  describe('Access Control Actions', () => {
    it('should refresh access when refreshAccess is called', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_role':
            return 'department_admin';
          case 'department_id':
            return '123';
          default:
            return null;
        }
      });

      const { result } = renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
          requiredDepartmentId: '123',
        })
      );

      expect(result.current.hasAccess).toBe(true);

      // Change localStorage to deny access
      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'auth_role':
            return 'student';
          case 'department_id':
            return '123';
          default:
            return null;
        }
      });

      act(() => {
        result.current.refreshAccess();
      });

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.accessDenied).toBe(true);
    });

    it('should logout and navigate when logout is called', () => {
      const { result } = renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
        })
      );

      act(() => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_role');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('department_id');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_id');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect when redirectOnDenied is true', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
          redirectOnDenied: true,
          redirectPath: '/custom-login',
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith('/custom-login');
    });

    it('should not redirect when redirectOnDenied is false', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderHook(() =>
        useAccessControl({
          requiredRoles: ['department_admin'],
          redirectOnDenied: false,
        })
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});