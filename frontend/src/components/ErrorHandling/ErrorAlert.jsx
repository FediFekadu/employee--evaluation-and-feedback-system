import { useState, useEffect } from 'react';
import { getErrorInfo } from '../../utils/errorHandling';

/**
 * Enhanced Error Alert Component with retry functionality and submission-specific handling
 */
function ErrorAlert({ 
  error, 
  onRetry, 
  onDismiss, 
  autoHide = false, 
  hideDelay = 5000,
  showDetails = false,
  context = '',
  showRecoveryOptions = true 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, onDismiss]);

  if (!error || !isVisible) {
    return null;
  }

  const errorInfo = getErrorInfo(error);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getContextualActions = () => {
    const actions = [];

    // Primary retry action
    if (errorInfo.canRetry && onRetry) {
      actions.push({
        type: 'primary',
        label: errorInfo.action || 'Try Again',
        onClick: handleRetry,
        icon: '🔄'
      });
    }

    // Context-specific actions
    if (context === 'submission') {
      if (errorInfo.type === 'duplicate_submission') {
        actions.push({
          type: 'info',
          label: 'View Submitted Evaluations',
          onClick: () => {
            const submittedSection = document.querySelector('.evaluation-card .status-badge.completed');
            if (submittedSection) {
              submittedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          },
          icon: '✅'
        });
      } else if (errorInfo.type === 'validation') {
        actions.push({
          type: 'info',
          label: 'Review Form',
          onClick: () => {
            const errorField = document.querySelector('.error-message, .field-error, [aria-invalid="true"]');
            if (errorField) {
              errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              errorField.focus?.();
            }
          },
          icon: '📝'
        });
      }
    }

    if (context === 'report_generation') {
      if (errorInfo.type === 'export_failed') {
        actions.push({
          type: 'warning',
          label: 'Try Different Format',
          onClick: () => {
            // This would be handled by parent component
            console.log('Suggest trying different export format');
          },
          icon: '📄'
        });
      } else if (errorInfo.type === 'timeout' || errorInfo.type === 'insufficient_data') {
        actions.push({
          type: 'info',
          label: 'Apply Filters',
          onClick: () => {
            const filterSection = document.querySelector('.filters, .search-filters, .report-filters');
            if (filterSection) {
              filterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          },
          icon: '🔍'
        });
      }
    }

    // Generic help action for persistent errors
    if (errorInfo.type === 'access_denied' || errorInfo.type === 'server_error') {
      actions.push({
        type: 'secondary',
        label: 'Contact Support',
        onClick: () => {
          // This would open a support modal or redirect to help
          alert('Please contact your system administrator for assistance.');
        },
        icon: '🆘'
      });
    }

    return actions;
  };

  const contextualActions = showRecoveryOptions ? getContextualActions() : [];

  return (
    <div className={`error-alert error-alert-${errorInfo.type}`}>
      <div className="error-alert-content">
        <div className="error-alert-header">
          <div className="error-alert-title">
            {errorInfo.title}
          </div>
          <button 
            className="error-alert-close"
            onClick={handleDismiss}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
        
        <div className="error-alert-message">
          {errorInfo.message}
        </div>

        {errorInfo.details && showDetails && (
          <div className="error-alert-details">
            <button
              className="error-details-toggle"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
            >
              {showErrorDetails ? 'Hide Details' : 'Show Details'}
            </button>
            
            {showErrorDetails && (
              <div className="error-details-content">
                {typeof errorInfo.details === 'object' ? (
                  <pre>{JSON.stringify(errorInfo.details, null, 2)}</pre>
                ) : (
                  <p>{errorInfo.details}</p>
                )}
              </div>
            )}
          </div>
        )}

        {contextualActions.length > 0 && (
          <div className="error-alert-actions">
            {contextualActions.map((action, index) => (
              <button 
                key={index}
                className={`error-btn ${action.type}`}
                onClick={action.onClick}
              >
                <span className="error-btn-icon">{action.icon}</span>
                <span className="error-btn-text">{action.label}</span>
              </button>
            ))}
            
            <button 
              className="error-btn dismiss"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorAlert;