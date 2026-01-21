import React, { useState, useEffect, useRef } from 'react';

/**
 * Visual Feedback Component - Provides loading indicators, change highlighting, and error recovery
 * Requirements: 6.2, 6.3, 6.5
 */

// Loading Indicator Component for synchronization
export function SyncLoadingIndicator({ 
  isLoading = false, 
  message = 'Synchronizing...', 
  size = 'small',
  inline = false 
}) {
  if (!isLoading) return null;

  const sizeStyles = {
    small: { width: '16px', height: '16px' },
    medium: { width: '24px', height: '24px' },
    large: { width: '32px', height: '32px' }
  };

  const containerStyle = inline 
    ? { display: 'inline-flex', alignItems: 'center', gap: '8px' }
    : { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' };

  return (
    <div className="sync-loading-indicator" style={containerStyle}>
      <div 
        className="sync-spinner"
        style={{
          ...sizeStyles[size],
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <span 
        className="sync-message"
        style={{
          fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
          color: '#6b7280',
          fontWeight: '500'
        }}
      >
        {message}
      </span>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Change Highlighting Component
export function ChangeHighlight({ 
  children, 
  isChanged = false, 
  duration = 2000,
  highlightColor = '#fef3c7',
  borderColor = '#f59e0b'
}) {
  const [showHighlight, setShowHighlight] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isChanged) {
      setShowHighlight(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setShowHighlight(false);
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isChanged, duration]);

  return (
    <div 
      className="change-highlight"
      style={{
        transition: 'all 0.3s ease',
        backgroundColor: showHighlight ? highlightColor : 'transparent',
        border: showHighlight ? `2px solid ${borderColor}` : '2px solid transparent',
        borderRadius: '4px',
        padding: showHighlight ? '4px' : '6px', // Adjust padding to account for border
        margin: showHighlight ? '-2px' : '0' // Adjust margin to prevent layout shift
      }}
    >
      {children}
    </div>
  );
}

// Error Message Display with Recovery Options
export function ErrorMessageDisplay({ 
  error = null, 
  onRetry = null, 
  onDismiss = null,
  showRecoveryOptions = true,
  context = 'general'
}) {
  if (!error) return null;

  const getErrorConfig = (error) => {
    const errorType = error.type || 'unknown';
    
    const configs = {
      network: {
        icon: '🌐',
        title: 'Connection Error',
        color: '#ef4444',
        bgColor: '#fee2e2',
        recoveryOptions: ['retry', 'refresh', 'offline_mode']
      },
      timeout: {
        icon: '⏱️',
        title: 'Request Timeout',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        recoveryOptions: ['retry', 'refresh']
      },
      server: {
        icon: '🔧',
        title: 'Server Error',
        color: '#ef4444',
        bgColor: '#fee2e2',
        recoveryOptions: ['retry', 'contact_support']
      },
      validation: {
        icon: '⚠️',
        title: 'Validation Error',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        recoveryOptions: ['fix_input', 'reset_form']
      },
      permission: {
        icon: '🔒',
        title: 'Permission Denied',
        color: '#ef4444',
        bgColor: '#fee2e2',
        recoveryOptions: ['login', 'contact_support']
      },
      sync: {
        icon: '🔄',
        title: 'Sync Failed',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        recoveryOptions: ['retry', 'manual_refresh', 'check_connection']
      }
    };

    return configs[errorType] || configs.server;
  };

  const config = getErrorConfig(error);

  const getRecoveryActions = () => {
    const actions = {
      retry: {
        label: 'Try Again',
        icon: '🔄',
        action: onRetry,
        primary: true
      },
      refresh: {
        label: 'Refresh Page',
        icon: '↻',
        action: () => window.location.reload(),
        primary: false
      },
      offline_mode: {
        label: 'Work Offline',
        icon: '📱',
        action: () => {
          // This would enable offline mode
          console.log('Enabling offline mode');
        },
        primary: false
      },
      contact_support: {
        label: 'Contact Support',
        icon: '🆘',
        action: () => {
          // This would open support contact
          alert('Please contact your system administrator for assistance.');
        },
        primary: false
      },
      fix_input: {
        label: 'Review Input',
        icon: '📝',
        action: () => {
          // Focus on first error field
          const errorField = document.querySelector('[aria-invalid="true"], .error');
          if (errorField) {
            errorField.focus();
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        primary: true
      },
      reset_form: {
        label: 'Reset Form',
        icon: '🔄',
        action: () => {
          // This would reset the form
          const form = document.querySelector('form');
          if (form) {
            form.reset();
          }
        },
        primary: false
      },
      login: {
        label: 'Login Again',
        icon: '🔑',
        action: () => {
          // Redirect to login
          window.location.href = '/login';
        },
        primary: true
      },
      manual_refresh: {
        label: 'Manual Refresh',
        icon: '🔄',
        action: () => {
          // Trigger manual data refresh
          if (onRetry) onRetry();
        },
        primary: true
      },
      check_connection: {
        label: 'Check Connection',
        icon: '📡',
        action: () => {
          // Open network status
          console.log('Checking network connection');
        },
        primary: false
      }
    };

    return config.recoveryOptions
      .map(option => actions[option])
      .filter(Boolean);
  };

  const recoveryActions = showRecoveryOptions ? getRecoveryActions() : [];

  return (
    <div 
      className="error-message-display"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.color}`,
        borderLeft: `4px solid ${config.color}`,
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div 
        className="error-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}
      >
        <div 
          className="error-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            color: config.color,
            fontSize: '14px'
          }}
        >
          <span style={{ fontSize: '18px' }}>{config.icon}</span>
          <span>{config.title}</span>
        </div>
        
        {onDismiss && (
          <button 
            className="error-dismiss"
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: config.color,
              opacity: 0.7,
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.opacity = '1';
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.target.style.opacity = '0.7';
              e.target.style.backgroundColor = 'transparent';
            }}
            title="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
      
      <div 
        className="error-message"
        style={{
          color: '#374151',
          fontSize: '13px',
          lineHeight: '1.4',
          marginBottom: recoveryActions.length > 0 ? '12px' : '0'
        }}
      >
        {error.message || 'An unexpected error occurred. Please try again.'}
      </div>
      
      {error.details && (
        <details 
          className="error-details"
          style={{
            marginBottom: recoveryActions.length > 0 ? '12px' : '0',
            fontSize: '12px',
            color: '#6b7280'
          }}
        >
          <summary 
            style={{
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Show technical details
          </summary>
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '4px' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {typeof error.details === 'object' 
                ? JSON.stringify(error.details, null, 2)
                : error.details
              }
            </pre>
          </div>
        </details>
      )}
      
      {recoveryActions.length > 0 && (
        <div 
          className="error-recovery-actions"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          {recoveryActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: action.primary ? 'none' : `1px solid ${config.color}`,
                borderRadius: '6px',
                background: action.primary ? config.color : 'transparent',
                color: action.primary ? 'white' : config.color,
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (action.primary) {
                  e.target.style.opacity = '0.9';
                } else {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseOut={(e) => {
                if (action.primary) {
                  e.target.style.opacity = '1';
                } else {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .error-recovery-actions {
            flex-direction: column !important;
          }
          
          .error-recovery-actions button {
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  );
}

// Update Pulse Animation Component
export function UpdatePulse({ children, isUpdating = false }) {
  return (
    <div 
      className="update-pulse"
      style={{
        animation: isUpdating ? 'pulse 1.5s ease-in-out infinite' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {children}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}

// Main Visual Feedback Component that combines all feedback types
function VisualFeedback({ 
  type = 'loading', 
  isActive = false,
  message = '',
  error = null,
  onRetry = null,
  onDismiss = null,
  children = null,
  ...props 
}) {
  switch (type) {
    case 'loading':
      return (
        <SyncLoadingIndicator 
          isLoading={isActive} 
          message={message} 
          {...props} 
        />
      );
    
    case 'highlight':
      return (
        <ChangeHighlight 
          isChanged={isActive} 
          {...props}
        >
          {children}
        </ChangeHighlight>
      );
    
    case 'error':
      return (
        <ErrorMessageDisplay 
          error={error} 
          onRetry={onRetry}
          onDismiss={onDismiss}
          {...props} 
        />
      );
    
    case 'pulse':
      return (
        <UpdatePulse 
          isUpdating={isActive}
          {...props}
        >
          {children}
        </UpdatePulse>
      );
    
    default:
      return children;
  }
}

export default VisualFeedback;