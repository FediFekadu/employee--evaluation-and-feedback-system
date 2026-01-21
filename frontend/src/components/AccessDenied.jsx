import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AccessDenied component for displaying unauthorized access messages
 * @param {Object} props - Component props
 * @param {string} props.message - Custom error message
 * @param {string} props.title - Custom title
 * @param {boolean} props.showLoginButton - Whether to show login button
 * @param {boolean} props.showBackButton - Whether to show back button
 * @param {string} props.loginPath - Path to redirect for login
 * @param {Function} props.onRetry - Callback for retry action
 * @param {Object} props.user - User information for context
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} AccessDenied component
 */
function AccessDenied({
  message = 'You do not have permission to access this resource.',
  title = 'Access Denied',
  showLoginButton = true,
  showBackButton = true,
  loginPath = '/login',
  onRetry = null,
  user = null,
  className = ''
}) {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate(loginPath);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => {
    // Navigate to appropriate dashboard based on user role
    if (user?.role === 'department_admin' && user?.departmentId) {
      navigate(`/department/${user.departmentId}`);
    } else if (user?.role === 'college_admin' || user?.role === 'superadmin') {
      navigate('/admin');
    } else if (user?.role === 'teacher') {
      navigate('/teacher');
    } else if (user?.role === 'student') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className={`dashboard-overview access-denied ${className}`}>
      <div className="dashboard-header">
        <div>
          <h1>{title}</h1>
          <p style={{ color: 'var(--accent)' }}>
            {message}
          </p>
          {user && (
            <div className="access-context">
              <p className="user-context">
                Logged in as: <strong>{user.role}</strong>
                {user.departmentId && (
                  <span> (Department: {user.departmentId})</span>
                )}
              </p>
            </div>
          )}
        </div>
        <div className="access-denied-actions">
          {onRetry && (
            <button 
              className="dept-btn dept-btn-ghost"
              onClick={onRetry}
            >
              <span className="btn-icon">🔄</span>
              Retry
            </button>
          )}
          {showBackButton && (
            <button 
              className="dept-btn dept-btn-ghost"
              onClick={handleBack}
            >
              <span className="btn-icon">←</span>
              Go Back
            </button>
          )}
          {user && (
            <button 
              className="dept-btn dept-btn-secondary"
              onClick={handleHome}
            >
              <span className="btn-icon">🏠</span>
              Go to Dashboard
            </button>
          )}
          {showLoginButton && (
            <button 
              className="dept-btn dept-btn-primary"
              onClick={handleLogin}
            >
              <span className="btn-icon">🔐</span>
              {user ? 'Switch Account' : 'Login'}
            </button>
          )}
        </div>
      </div>
      
      <div className="access-denied-content">
        <div className="access-denied-illustration">
          <div className="access-icon">🚫</div>
          <div className="access-details">
            <h3>Access Restricted</h3>
            <p>
              This resource requires specific permissions that your current account does not have.
            </p>
            
            {user ? (
              <div className="permission-details">
                <h4>Your Current Permissions:</h4>
                <ul>
                  <li>Role: <code>{user.role}</code></li>
                  {user.departmentId && (
                    <li>Department Access: <code>{user.departmentId}</code></li>
                  )}
                </ul>
                
                <div className="help-text">
                  <h4>Need Access?</h4>
                  <p>
                    Contact your system administrator to request the necessary permissions 
                    for this resource.
                  </p>
                </div>
              </div>
            ) : (
              <div className="login-prompt">
                <h4>Authentication Required</h4>
                <p>
                  Please log in with an account that has the necessary permissions 
                  to access this resource.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;