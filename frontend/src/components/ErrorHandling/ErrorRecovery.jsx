import React, { useState, useEffect } from 'react';
import { retryManager, networkManager, getErrorInfo } from '../../utils/errorHandling';
import LoadingSpinner from './LoadingSpinner';
import ProgressIndicator from './ProgressIndicator';

/**
 * Enhanced Error Recovery Component - Provides comprehensive error recovery options
 * Supports submission scenarios, network failures, and large dataset operations
 */
function ErrorRecovery({ 
  error, 
  onRetry, 
  onCancel, 
  context = '',
  autoRetry = false,
  maxAutoRetries = 2,
  onSaveDraft = null,
  onReduceDataset = null,
  onContactSupport = null,
  showTechnicalDetails = false
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryProgress, setRetryProgress] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(networkManager.getNetworkInfo());

  useEffect(() => {
    const unsubscribe = networkManager.addListener(setNetworkInfo);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Auto-retry for certain error types
    if (autoRetry && retryCount < maxAutoRetries && canAutoRetry()) {
      const delay = retryManager.getRetryDelay(retryCount);
      const timer = setTimeout(() => {
        handleRetry(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, autoRetry, maxAutoRetries]);

  const errorInfo = getErrorInfo(error);

  const canAutoRetry = () => {
    return retryManager.isRetryable(error) && networkInfo.isOnline;
  };

  const canManualRetry = () => {
    return errorInfo.canRetry && networkInfo.isOnline;
  };

  const handleRetry = async (isAutoRetry = false) => {
    if (!onRetry) return;

    setIsRetrying(true);
    setRetryProgress({
      current: 0,
      total: 3,
      message: isAutoRetry ? 'Auto-retrying...' : 'Retrying...',
      percentage: 0
    });

    try {
      // Simulate progress steps
      setRetryProgress(prev => ({ ...prev, current: 1, percentage: 33, message: 'Checking connection...' }));
      await new Promise(resolve => setTimeout(resolve, 500));

      setRetryProgress(prev => ({ ...prev, current: 2, percentage: 66, message: 'Attempting request...' }));
      await new Promise(resolve => setTimeout(resolve, 300));

      setRetryProgress(prev => ({ ...prev, current: 3, percentage: 100, message: 'Completing...' }));
      
      await onRetry();
      
      // Success - component will unmount or error will clear
    } catch (retryError) {
      setRetryCount(prev => prev + 1);
      console.error('Retry failed:', retryError);
      
      // If this was an auto-retry and we haven't exceeded max attempts, 
      // the useEffect will trigger another retry
    } finally {
      setIsRetrying(false);
      setRetryProgress(null);
    }
  };

  const getRecoveryOptions = () => {
    const options = [];

    // Primary retry option
    if (canManualRetry() && !isRetrying) {
      options.push({
        type: 'primary',
        label: errorInfo.action || 'Try Again',
        action: () => handleRetry(false),
        icon: '🔄'
      });
    }

    // Network-specific options
    if (errorInfo.type === 'network') {
      if (!networkInfo.isOnline) {
        options.push({
          type: 'info',
          label: 'Check Network Settings',
          action: () => {
            if (navigator.onLine !== undefined) {
              window.open('chrome://settings/internet', '_blank');
            } else {
              alert('Please check your internet connection and try again.');
            }
          },
          icon: '🌐'
        });
      } else if (networkInfo.connectionQuality === 'poor') {
        options.push({
          type: 'warning',
          label: 'Switch to Better Network',
          action: () => {
            alert('Consider switching to a more stable internet connection (WiFi vs mobile data).');
          },
          icon: '📶'
        });
      }
    }

    // Validation error options
    if (errorInfo.type === 'validation') {
      options.push({
        type: 'info',
        label: 'Review Input',
        action: () => {
          // Scroll to first error field if available
          const errorField = document.querySelector('.error-message, .field-error, [aria-invalid="true"]');
          if (errorField) {
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorField.focus?.();
          }
        },
        icon: '📝'
      });
    }

    // Duplicate submission specific options
    if (errorInfo.type === 'duplicate_submission') {
      options.push({
        type: 'info',
        label: 'View Submitted Evaluations',
        action: () => {
          // Navigate to submitted evaluations view
          const submittedSection = document.querySelector('.evaluation-card .status-badge.completed');
          if (submittedSection) {
            submittedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        icon: '✅'
      });
    }

    // Export error options
    if (errorInfo.type === 'export_failed') {
      options.push({
        type: 'secondary',
        label: 'Try Different Format',
        action: () => {
          // This would need to be handled by parent component
          console.log('Suggest trying different export format');
        },
        icon: '📄'
      });

      if (onReduceDataset) {
        options.push({
          type: 'warning',
          label: 'Reduce Dataset Size',
          action: onReduceDataset,
          icon: '📊'
        });
      }
    }

    // Large dataset handling
    if (errorInfo.type === 'timeout' || context.includes('large_dataset')) {
      if (onReduceDataset) {
        options.push({
          type: 'warning',
          label: 'Try Smaller Dataset',
          action: onReduceDataset,
          icon: '⚡'
        });
      }

      options.push({
        type: 'info',
        label: 'Apply Filters',
        action: () => {
          // Scroll to filter controls if available
          const filterSection = document.querySelector('.filters, .search-filters, .report-filters');
          if (filterSection) {
            filterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            alert('Try applying date range or department filters to reduce the dataset size.');
          }
        },
        icon: '🔍'
      });
    }

    // Submission-specific options
    if (context.includes('submission') && onSaveDraft) {
      options.push({
        type: 'warning',
        label: 'Save Draft',
        action: onSaveDraft,
        icon: '💾'
      });
    }

    // Access denied options
    if (errorInfo.type === 'access_denied') {
      if (onContactSupport) {
        options.push({
          type: 'info',
          label: 'Contact Administrator',
          action: onContactSupport,
          icon: '📞'
        });
      }

      options.push({
        type: 'secondary',
        label: 'Check Permissions',
        action: () => {
          alert('Please verify you are logged in with the correct account and have the necessary permissions.');
        },
        icon: '🔒'
      });
    }

    // Server error options
    if (errorInfo.type === 'server_error') {
      if (onContactSupport) {
        options.push({
          type: 'info',
          label: 'Report Issue',
          action: onContactSupport,
          icon: '🐛'
        });
      }

      options.push({
        type: 'secondary',
        label: 'Try Later',
        action: () => {
          alert('Server issues are usually temporary. Please try again in a few minutes.');
        },
        icon: '⏰'
      });
    }

    // Generic refresh option for load/fetch contexts
    if (context.includes('load') || context.includes('fetch')) {
      options.push({
        type: 'secondary',
        label: 'Refresh Page',
        action: () => window.location.reload(),
        icon: '🔄'
      });
    }

    // Support option for persistent errors
    if (retryCount >= maxAutoRetries && onContactSupport) {
      options.push({
        type: 'info',
        label: 'Get Help',
        action: onContactSupport,
        icon: '🆘'
      });
    }

    // Cancel/dismiss option
    if (onCancel) {
      options.push({
        type: 'tertiary',
        label: 'Cancel',
        action: onCancel,
        icon: '✕'
      });
    }

    return options;
  };

  const getRecoveryMessage = () => {
    if (isRetrying) {
      return 'Attempting to recover...';
    }

    if (autoRetry && retryCount > 0 && retryCount < maxAutoRetries) {
      const nextRetryDelay = Math.round(retryManager.getRetryDelay(retryCount) / 1000);
      return `Auto-retry ${retryCount}/${maxAutoRetries} failed. Next attempt in ${nextRetryDelay}s...`;
    }

    if (retryCount >= maxAutoRetries) {
      return 'Auto-retry attempts exhausted. Please choose a recovery option below.';
    }

    // Error-specific messages
    if (errorInfo.type === 'duplicate_submission') {
      return 'This evaluation has already been submitted. You can only submit once per evaluation.';
    }

    if (errorInfo.type === 'export_failed') {
      return 'Export generation failed. This may be due to large dataset size or server limitations.';
    }

    if (errorInfo.type === 'insufficient_data') {
      return 'There is not enough data available to generate the requested report or analysis.';
    }

    if (errorInfo.type === 'access_denied') {
      return 'You do not have permission to perform this action. Please contact your administrator.';
    }

    if (errorInfo.type === 'timeout') {
      return 'The operation timed out. This may be due to large dataset size or server load.';
    }

    // Network-specific messages
    if (!networkInfo.isOnline) {
      return 'No internet connection detected. Please check your network settings.';
    }

    if (networkInfo.connectionQuality === 'poor') {
      return 'Poor network connection may be causing issues. Consider switching networks.';
    }

    return 'Choose a recovery option below:';
  };

  const recoveryOptions = getRecoveryOptions();

  return (
    <div className="error-recovery">
      <div className="error-recovery-content">
        {/* Progress indicator for retry attempts */}
        {isRetrying && retryProgress && (
          <div className="retry-progress">
            <ProgressIndicator
              progress={retryProgress}
              title="Recovering from error..."
              variant="bar"
            />
          </div>
        )}

        {/* Recovery message */}
        <div className="recovery-message">
          <div className="recovery-icon">
            {isRetrying ? '🔄' : 
             !networkInfo.isOnline ? '📡❌' :
             networkInfo.connectionQuality === 'poor' ? '📡⚠️' :
             '🛠️'}
          </div>
          <p>{getRecoveryMessage()}</p>
        </div>

        {/* Auto-retry countdown */}
        {autoRetry && retryCount < maxAutoRetries && !isRetrying && canAutoRetry() && (
          <div className="auto-retry-countdown">
            <LoadingSpinner size="small" />
            <span>Auto-retry in progress...</span>
          </div>
        )}

        {/* Recovery options */}
        {!isRetrying && recoveryOptions.length > 0 && (
          <div className="recovery-options">
            {recoveryOptions.map((option, index) => (
              <button
                key={index}
                className={`recovery-btn recovery-btn-${option.type}`}
                onClick={option.action}
                disabled={isRetrying}
              >
                <span className="recovery-btn-icon">{option.icon}</span>
                <span className="recovery-btn-text">{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Technical details for developers */}
        {(process.env.NODE_ENV === 'development' || showTechnicalDetails) && (
          <details className="recovery-technical-details">
            <summary>Technical Details {process.env.NODE_ENV === 'development' ? '(Development)' : ''}</summary>
            <div className="technical-info">
              <div><strong>Error Type:</strong> {errorInfo.type}</div>
              <div><strong>Context:</strong> {context}</div>
              <div><strong>Retry Count:</strong> {retryCount}</div>
              <div><strong>Network Status:</strong> {networkInfo.isOnline ? 'Online' : 'Offline'}</div>
              <div><strong>Connection Quality:</strong> {networkInfo.connectionQuality}</div>
              <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              <div><strong>User Agent:</strong> {navigator.userAgent}</div>
              {error.response?.status && (
                <div><strong>HTTP Status:</strong> {error.response.status}</div>
              )}
              {error.retryInfo && (
                <div><strong>Retry Info:</strong> {JSON.stringify(error.retryInfo, null, 2)}</div>
              )}
              {error.networkInfo && (
                <div><strong>Network Info:</strong> {JSON.stringify(error.networkInfo, null, 2)}</div>
              )}
              {errorInfo.details && (
                <div>
                  <strong>Error Details:</strong>
                  <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(errorInfo.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      <style jsx>{`
        .error-recovery {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 16px 0;
        }

        .retry-progress {
          margin-bottom: 16px;
        }

        .recovery-message {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .recovery-icon {
          font-size: 24px;
        }

        .recovery-message p {
          margin: 0;
          color: #475569;
          line-height: 1.5;
        }

        .auto-retry-countdown {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #fef3c7;
          border-radius: 6px;
          font-size: 14px;
          color: #92400e;
        }

        .recovery-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .recovery-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .recovery-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .recovery-btn-primary {
          background: #3b82f6;
          color: white;
        }

        .recovery-btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .recovery-btn-secondary {
          background: #6b7280;
          color: white;
        }

        .recovery-btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .recovery-btn-tertiary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .recovery-btn-tertiary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .recovery-btn-info {
          background: #0ea5e9;
          color: white;
        }

        .recovery-btn-info:hover:not(:disabled) {
          background: #0284c7;
        }

        .recovery-btn-warning {
          background: #f59e0b;
          color: white;
        }

        .recovery-btn-warning:hover:not(:disabled) {
          background: #d97706;
        }

        .recovery-technical-details {
          margin-top: 16px;
          font-size: 12px;
        }

        .recovery-technical-details summary {
          cursor: pointer;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .technical-info {
          background: #f8fafc;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .technical-info > div {
          margin-bottom: 4px;
        }

        @media (max-width: 768px) {
          .recovery-options {
            flex-direction: column;
          }

          .recovery-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default ErrorRecovery;