import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useErrorState } from './ErrorStateManager';
import { getErrorInfo, ERROR_TYPES } from '../../utils/errorHandling';
import LoadingSpinner from './LoadingSpinner';
import ProgressIndicator from './ProgressIndicator';

/**
 * Enhanced User Feedback System
 * Provides comprehensive user feedback through toast notifications, progress indicators, and status updates
 */

// Toast notification component
function ToastNotification({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  persistent = false,
  actions = [],
  onDismiss,
  onAction 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-dismiss if not persistent
    if (!persistent && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      clearTimeout(timer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, persistent]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.(id);
    }, 300); // Match animation duration
  }, [id, onDismiss]);

  const handleActionClick = useCallback((action) => {
    if (action.dismissOnClick !== false) {
      handleDismiss();
    }
    onAction?.(action, id);
  }, [handleDismiss, onAction, id]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'loading': return <LoadingSpinner size="small" />;
      default: return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      case 'info': return 'toast-info';
      case 'loading': return 'toast-loading';
      default: return 'toast-info';
    }
  };

  return (
    <div 
      className={`toast-notification ${getTypeClass()} ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-text">
          {title && <div className="toast-title">{title}</div>}
          <div className="toast-message">{message}</div>
        </div>
        {!persistent && (
          <button 
            className="toast-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        )}
      </div>
      
      {actions.length > 0 && (
        <div className="toast-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`toast-action ${action.type || 'secondary'}`}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .toast-notification {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin-bottom: 12px;
          max-width: 400px;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.3s ease;
          border-left: 4px solid #e2e8f0;
        }

        .toast-visible {
          opacity: 1;
          transform: translateX(0);
        }

        .toast-exiting {
          opacity: 0;
          transform: translateX(100%);
        }

        .toast-success {
          border-left-color: #10b981;
        }

        .toast-error {
          border-left-color: #ef4444;
        }

        .toast-warning {
          border-left-color: #f59e0b;
        }

        .toast-info {
          border-left-color: #3b82f6;
        }

        .toast-loading {
          border-left-color: #6b7280;
        }

        .toast-content {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
        }

        .toast-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .toast-text {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .toast-message {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }

        .toast-dismiss {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .toast-dismiss:hover {
          background: #f3f4f6;
          color: #6b7280;
        }

        .toast-actions {
          display: flex;
          gap: 8px;
          padding: 0 16px 16px;
          justify-content: flex-end;
        }

        .toast-action {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toast-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toast-action.primary {
          background: #3b82f6;
          color: white;
        }

        .toast-action.primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .toast-action.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .toast-action.secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .toast-action.danger {
          background: #ef4444;
          color: white;
        }

        .toast-action.danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .action-icon {
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

// Toast container component
function ToastContainer({ toasts, onDismiss, onAction }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Create container if it doesn't exist
    if (!containerRef.current) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(container);
      containerRef.current = container;
    }

    return () => {
      // Cleanup on unmount
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
    };
  }, []);

  if (!containerRef.current) return null;

  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>,
    containerRef.current
  );
}

// Main user feedback system component
export function UserFeedbackSystem({ 
  maxToasts = 5,
  defaultDuration = 5000,
  enableErrorToasts = true,
  enableProgressToasts = true 
}) {
  const [toasts, setToasts] = useState([]);
  const errorState = useErrorState();
  const toastIdCounter = useRef(0);

  // Listen for new errors and create toasts
  useEffect(() => {
    if (!enableErrorToasts) return;

    const newErrors = errorState.errors.filter(error => 
      !toasts.some(toast => toast.errorId === error.id)
    );

    newErrors.forEach(error => {
      const toast = createErrorToast(error);
      addToast(toast);
    });
  }, [errorState.errors, enableErrorToasts, toasts]);

  const createErrorToast = useCallback((error) => {
    const actions = [];

    // Add retry action if error is retryable
    if (errorState.canRetry(error.id)) {
      actions.push({
        label: 'Retry',
        type: 'primary',
        icon: '🔄',
        action: 'retry',
        errorId: error.id
      });
    }

    // Add context-specific actions
    if (error.context.includes('submission')) {
      actions.push({
        label: 'Save Draft',
        type: 'secondary',
        icon: '💾',
        action: 'save_draft',
        errorId: error.id
      });
    }

    if (error.context.includes('export')) {
      actions.push({
        label: 'Try CSV',
        type: 'secondary',
        icon: '📄',
        action: 'try_csv',
        errorId: error.id
      });
    }

    // Add help action for persistent errors
    if (error.retryCount > 2) {
      actions.push({
        label: 'Get Help',
        type: 'secondary',
        icon: '🆘',
        action: 'get_help',
        errorId: error.id
      });
    }

    return {
      id: `error_${error.id}`,
      errorId: error.id,
      type: 'error',
      title: error.title,
      message: error.message,
      persistent: error.type === ERROR_TYPES.ACCESS_DENIED || error.retryCount > 2,
      duration: error.type === ERROR_TYPES.NETWORK ? 3000 : defaultDuration,
      actions
    };
  }, [errorState, defaultDuration]);

  const addToast = useCallback((toast) => {
    const id = toast.id || `toast_${++toastIdCounter.current}`;
    const newToast = { ...toast, id };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      return updated.slice(-maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const handleToastAction = useCallback((action, toastId) => {
    const toast = toasts.find(t => t.id === toastId);
    if (!toast) return;

    switch (action.action) {
      case 'retry':
        if (action.errorId) {
          errorState.incrementRetry(action.errorId);
          // Trigger retry logic here or emit event
          window.dispatchEvent(new CustomEvent('errorRetry', {
            detail: { errorId: action.errorId }
          }));
        }
        break;

      case 'save_draft':
        // Emit save draft event
        window.dispatchEvent(new CustomEvent('saveDraft', {
          detail: { errorId: action.errorId }
        }));
        break;

      case 'try_csv':
        // Emit try CSV export event
        window.dispatchEvent(new CustomEvent('tryCsvExport', {
          detail: { errorId: action.errorId }
        }));
        break;

      case 'get_help':
        // Open help or support
        window.dispatchEvent(new CustomEvent('getHelp', {
          detail: { errorId: action.errorId }
        }));
        break;

      default:
        console.warn('Unknown toast action:', action.action);
    }
  }, [toasts, errorState]);

  // Public API for creating toasts
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      duration: 3000,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      persistent: true,
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      duration: 4000,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  const showLoading = useCallback((message, options = {}) => {
    return addToast({
      type: 'loading',
      message,
      persistent: true,
      ...options
    });
  }, [addToast]);

  const showProgress = useCallback((message, progress, options = {}) => {
    const existingToast = toasts.find(t => t.progressId === options.progressId);
    
    if (existingToast) {
      // Update existing progress toast
      setToasts(prev => prev.map(toast => 
        toast.id === existingToast.id 
          ? { ...toast, message, progress }
          : toast
      ));
      return existingToast.id;
    } else {
      // Create new progress toast
      return addToast({
        type: 'loading',
        message,
        progress,
        persistent: true,
        progressId: options.progressId,
        ...options
      });
    }
  }, [toasts, addToast]);

  const clearToasts = useCallback((type) => {
    if (type) {
      setToasts(prev => prev.filter(toast => toast.type !== type));
    } else {
      setToasts([]);
    }
  }, []);

  return (
    <>
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        onAction={handleToastAction}
      />
      
      {/* Expose API through window for global access */}
      {typeof window !== 'undefined' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.userFeedback = {
                showSuccess: ${showSuccess.toString()},
                showError: ${showError.toString()},
                showWarning: ${showWarning.toString()},
                showInfo: ${showInfo.toString()},
                showLoading: ${showLoading.toString()},
                showProgress: ${showProgress.toString()},
                clearToasts: ${clearToasts.toString()}
              };
            `
          }}
        />
      )}
    </>
  );
}

// Hook for using the feedback system
export function useUserFeedback() {
  const [toasts, setToasts] = useState([]);

  const showSuccess = useCallback((message, options = {}) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.showSuccess(message, options);
    }
    console.log('Success:', message);
  }, []);

  const showError = useCallback((message, options = {}) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.showError(message, options);
    }
    console.error('Error:', message);
  }, []);

  const showWarning = useCallback((message, options = {}) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.showWarning(message, options);
    }
    console.warn('Warning:', message);
  }, []);

  const showInfo = useCallback((message, options = {}) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.showInfo(message, options);
    }
    console.info('Info:', message);
  }, []);

  const showLoading = useCallback((message, options = {}) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.showLoading(message, options);
    }
    console.log('Loading:', message);
  }, []);

  const showProgress = useCallback((message, progress, options = {}) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.showProgress(message, progress, options);
    }
    console.log('Progress:', message, progress);
  }, []);

  const clearToasts = useCallback((type) => {
    if (typeof window !== 'undefined' && window.userFeedback) {
      return window.userFeedback.clearToasts(type);
    }
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showProgress,
    clearToasts
  };
}

export default UserFeedbackSystem;