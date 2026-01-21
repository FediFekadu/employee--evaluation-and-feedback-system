import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../../../../App';
import DepartmentLayout from '../Layout';

// Mock API calls
vi.mock('../../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Department Results Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('department_admin');
  });

  test('should display Results menu item in department sidebar', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockResolvedValue({
      data: { id: 1, name: 'Computer Science Department' }
    });

    render(
      <MemoryRouter initialEntries={['/department/1']}>
        <DepartmentLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
    });

    // Verify the Results menu item has the correct icon
    const resultsLink = screen.getByLabelText('Navigate to Results');
    expect(resultsLink).toBeInTheDocument();
    expect(resultsLink).toHaveAttribute('href', '/department/1/results');
  });

  test('should navigate to Results dashboard when Results menu item is clicked', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockResolvedValue({
      data: { id: 1, name: 'Computer Science Department' }
    });

    render(
      <MemoryRouter initialEntries={['/department/1']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
    });

    // Click on Results menu item
    const resultsLink = screen.getByLabelText('Navigate to Results');
    fireEvent.click(resultsLink);

    // Verify navigation occurred by checking URL or page content
    await waitFor(() => {
      // The Results component should be rendered
      expect(window.location.pathname).toBe('/department/1/results');
    });
  });

  test('should handle department ID parameter correctly in Results routes', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockResolvedValue({
      data: { id: 123, name: 'Engineering Department' }
    });

    render(
      <MemoryRouter initialEntries={['/department/123/results']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Verify the department ID is correctly passed to the API call
      expect(mockApi.default.get).toHaveBeenCalledWith('/departments/123');
    });
  });

  test('should navigate to detailed evaluation results with correct URL structure', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockResolvedValue({
      data: { id: 1, name: 'Computer Science Department' }
    });

    render(
      <MemoryRouter initialEntries={['/department/1/results/456']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Verify both department and evaluation API calls are made
      expect(mockApi.default.get).toHaveBeenCalledWith('/departments/1');
      expect(mockApi.default.get).toHaveBeenCalledWith('/evaluations/456/results');
    });
  });

  test('should maintain URL parameters during navigation', () => {
    const mockApi = vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Computer Science Department' }
    });

    render(
      <MemoryRouter initialEntries={['/department/1/results?page=2&sortBy=course&status=Active']}>
        <App />
      </MemoryRouter>
    );

    // Verify URL parameters are preserved
    expect(window.location.search).toContain('page=2');
    expect(window.location.search).toContain('sortBy=course');
    expect(window.location.search).toContain('status=Active');
  });

  test('should handle browser back/forward navigation correctly', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockResolvedValue({
      data: { id: 1, name: 'Computer Science Department' }
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Simulate navigation history
    window.history.pushState({}, '', '/department/1');
    window.history.pushState({}, '', '/department/1/results');
    window.history.pushState({}, '', '/department/1/results/123');

    // Simulate back navigation
    window.history.back();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/department/1/results');
    });

    // Simulate forward navigation
    window.history.forward();
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/department/1/results/123');
    });
  });

  test('should handle invalid department IDs gracefully', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockRejectedValue({
      response: { status: 404, data: { message: 'Department not found' } }
    });

    render(
      <MemoryRouter initialEntries={['/department/999/results']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should attempt to load the department
      expect(mockApi.default.get).toHaveBeenCalledWith('/departments/999');
    });

    // Should handle the error gracefully (error boundary or fallback UI)
    await waitFor(() => {
      expect(screen.getByText(/Department not found/i) || screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('should preserve navigation state across route changes', async () => {
    const mockApi = await import('../../../../services/api');
    mockApi.default.get.mockResolvedValue({
      data: { id: 1, name: 'Computer Science Department' }
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/department/1/results']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
    });

    // Navigate to a different department page
    rerender(
      <MemoryRouter initialEntries={['/department/1/courses']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Courses')).toBeInTheDocument();
    });

    // Navigate back to Results
    rerender(
      <MemoryRouter initialEntries={['/department/1/results']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
    });
  });
});