import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AccessDenied from '../AccessDenied';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AccessDenied Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render default access denied message', () => {
    renderWithRouter(<AccessDenied />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You do not have permission to access this resource.')).toBeInTheDocument();
  });

  it('should render custom message and title', () => {
    const customMessage = 'Custom access denied message';
    const customTitle = 'Custom Title';

    renderWithRouter(
      <AccessDenied message={customMessage} title={customTitle} />
    );

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should show user context when user is provided', () => {
    const user = {
      role: 'department_admin',
      departmentId: '123',
    };

    renderWithRouter(<AccessDenied user={user} />);

    expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
    expect(screen.getByText(/department_admin/)).toBeInTheDocument();
    expect(screen.getByText(/Department: 123/)).toBeInTheDocument();
  });

  it('should show login button when no user is provided', () => {
    renderWithRouter(<AccessDenied />);

    const loginButton = screen.getByText('Login');
    expect(loginButton).toBeInTheDocument();
  });

  it('should show switch account button when user is provided', () => {
    const user = { role: 'student' };

    renderWithRouter(<AccessDenied user={user} />);

    const switchButton = screen.getByText('Switch Account');
    expect(switchButton).toBeInTheDocument();
  });

  it('should navigate to login when login button is clicked', () => {
    renderWithRouter(<AccessDenied />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should navigate to custom login path', () => {
    const customLoginPath = '/custom-login';

    renderWithRouter(<AccessDenied loginPath={customLoginPath} />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith(customLoginPath);
  });

  it('should navigate back when back button is clicked', () => {
    renderWithRouter(<AccessDenied />);

    const backButton = screen.getByText('Go Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should navigate to appropriate dashboard when home button is clicked', () => {
    const user = {
      role: 'department_admin',
      departmentId: '123',
    };

    renderWithRouter(<AccessDenied user={user} />);

    const homeButton = screen.getByText('Go to Dashboard');
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/department/123');
  });

  it('should call onRetry when retry button is clicked', () => {
    const mockRetry = vi.fn();

    renderWithRouter(<AccessDenied onRetry={mockRetry} />);

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });

  it('should hide buttons when specified', () => {
    renderWithRouter(
      <AccessDenied showLoginButton={false} showBackButton={false} />
    );

    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Go Back')).not.toBeInTheDocument();
  });

  it('should show permission details for authenticated users', () => {
    const user = {
      role: 'student',
      departmentId: '123',
    };

    renderWithRouter(<AccessDenied user={user} />);

    expect(screen.getByText('Your Current Permissions:')).toBeInTheDocument();
    expect(screen.getByText('Need Access?')).toBeInTheDocument();
  });

  it('should show login prompt for unauthenticated users', () => {
    renderWithRouter(<AccessDenied />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText(/Please log in with an account/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = renderWithRouter(
      <AccessDenied className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});