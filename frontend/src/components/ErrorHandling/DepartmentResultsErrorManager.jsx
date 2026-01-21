import React, { useState, useCallback, useEffect } from 'react';
import ErrorAlert from './ErrorAlert';
import ErrorRecovery from './ErrorRecovery';
import LoadingSpinner from './LoadingSpinner';
import ProgressIndicator from './ProgressIndicator';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { 
  getErrorInfo, 
  gracefulDegradationManager, 
  networkManager,
  retryManager 
} from '../../utils/errorHandling';

/**
 * Enhanced Error Manager for Department Results Feature
 * Provides centralized error handling, recovery coordination, and user guidance
 */
function DepartmentResultsErrorManager({ 
  children, 
  context = 'department_results',
  onDataReduction = null,
  onFormatChange = null,
  onFilterReset = null,
  onContactSupport = null,
  enableAutoRecovery = true,
  maxAutoRetries = 3,
  showPerformanceOptimizations = true
}) {
  const { errors, removeError, clearErrors } = useErrorHandling();
  
  // Enhanced state management
  const [recoveryState, setRecoveryState] = useState({
    isRecovering: false,
    recoveryType: null,
    recoveryProgress: null,
    lastRecoveryAttempt: null,
    recoveryHistory: []
  });
  
  const [performanceState, setPerformanceState] = useState({
    degradationApplied: false,
    optimizationLevel: 'normal',
    datasetSize: 0,
    performanceMetrics: null
  });

  const [networkState, setNetworkState] = useState({
    isOnline: navigator.onLine,
    connectionQuality: 'unknown',
    lastConnectivityCheck: null
  });

  // Filter errors relevant to this context
  const contextErrors = errors.filter(error => 
    error.context.includes(context) || 
    error.context.includes('department') ||
    error.context.includes('evaluation') ||
    error.context.includes('results')
  );

  // Network monitoring
  useEffect(() => {
    const unsubscribe = networkManager.addListener((networkInfo) => {
      setNetworkState(prev => ({
        ...prev,
        ...networkInfo,
        lastConnectivityCheck: new Date()
      }));
    });

    return unsubscribe;
  }, []);

  // Auto-recovery logic
  useEffect(() => {
    if (!enableAutoRecovery || contextErrors.length === 0) return;

    const autoRecoverableErrors = contextErrors.filter(error => {
      const errorInfo = getErrorInfo(error.error);
      return ['network', 'timeout', 'server_error'].includes(errorInfo.type) &&
             error.retryCount < maxAutoRetries;
    });

    if (autoRecoverableErrors.length > 0) {
      const error = autoRecoverableErrors[0];
      const delay = retryManager.getRetryDelay(error.retryCount);
      
      const timer = setTimeout(() => {
        handleAutoRecovery(error);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [contextErrors, enableAutoRecovery, maxAutoRetries]);

  // Track recovery attempt
  const trackRecoveryAttempt = useCallback((type, errorId, details = {}) => {
    const attempt = {
      id: Date.now(),
      type,
      errorId,
      timestamp: new Date(),
      details,
      success: false
    };

    setRecoveryState(prev => ({
      ...prev,
      recoveryHistory: [...prev.recoveryHistory, attempt],
      lastRecoveryAttempt: attempt
    }));

    return attempt.id;
  }, []);

  // Update recovery attempt status
  const updateRecoveryAttempt = useCallback((attemptId, success, details = {}) => {
    setRecoveryState(prev => ({
      ...prev,
      recoveryHistory: prev.recoveryHistory.map(attempt =>
        attempt.id === attemptId 
          ? { ...attempt, success, completedAt: new Date(), ...details }
          : attempt
      )
    }));
  }, []);

  // Auto-recovery handler
  const handleAutoRecovery = async (errorEntry) => {
    const attemptId = trackRecoveryAttempt('auto_retry', errorEntry.id);
    
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryType: 'auto_retry',
      recoveryProgress: {
        current: 0,
        total: 3,
        message: 'Attempting automatic recovery...',
        percentage: 0
      }
    }));

    try {
      // Simulate recovery steps with progress
      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: {
          ...prev.recoveryProgress,
          current: 1,
          percentage: 33,
          message: 'Checking network connection...'
        }
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));

      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: {
          ...prev.recoveryProgress,
          current: 2,
          percentage: 66,
          message: 'Retrying operation...'
        }
      }));

      // Attempt the retry
      if (errorEntry.retryFunction) {
        await errorEntry.retryFunction();
      }

      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: {
          ...prev.recoveryProgress,
          current: 3,
          percentage: 100,
          message: 'Recovery successful'
        }
      }));

      // Success - remove the error
      removeError(errorEntry.id);
      updateRecoveryAttempt(attemptId, true);

      // Clear recovery state after a brief success display
      setTimeout(() => {
        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          recoveryType: null,
          recoveryProgress: null
        }));
      }, 1500);

    } catch (recoveryError) {
      console.error('Auto-recovery failed:', recoveryError);
      updateRecoveryAttempt(attemptId, false, { error: recoveryError.message });
      
      setRecoveryState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryType: null,
        recoveryProgress: null
      }));
    }
  };

  // Handle data reduction for large datasets
  const handleDataReduction = useCallback(async (strategy) => {
    const attemptId = trackRecoveryAttempt('data_reduction', null, { strategy });
    
    setRecoveryState({
      isRecovering: true,
      recoveryType: 'data_reduction',
      recoveryProgress: { current: 1, total: 3, message: 'Reducing dataset size...', percentage: 33 }
    });

    try {
      // Apply graceful degradation
      const degradationStrategy = strategy || gracefulDegradationManager.getDegradationStrategy('evaluations', 1000, context);
      
      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: { current: 2, total: 3, message: 'Applying performance optimizations...', percentage: 66 }
      }));

      if (onDataReduction) {
        await onDataReduction(degradationStrategy);
      }

      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: { current: 3, total: 3, message: 'Completing recovery...', percentage: 100 }
      }));

      setPerformanceState(prev => ({
        ...prev,
        degradationApplied: true,
        optimizationLevel: degradationStrategy.strategy || 'optimized'
      }));

      // Clear relevant errors
      clearErrors();
      updateRecoveryAttempt(attemptId, true);

    } catch (error) {
      console.error('Data reduction recovery failed:', error);
      updateRecoveryAttempt(attemptId, false, { error: error.message });
    } finally {
      setTimeout(() => {
        setRecoveryState(prev => ({
          ...prev,
          isRecovering: false,
          recoveryType: null,
          recoveryProgress: null
        }));
      }, 1000);
    }
  }, [context, onDataReduction, clearErrors, trackRecoveryAttempt, updateRecoveryAttempt]);

  // Handle format change for export errors
  const handleFormatChange = useCallback(async (newFormat = 'csv') => {
    const attemptId = trackRecoveryAttempt('format_change', null, { newFormat });
    
    setRecoveryState({
      isRecovering: true,
      recoveryType: 'format_change',
      recoveryProgress: { current: 1, total: 2, message: `Switching to ${newFormat.toUpperCase()} format...`, percentage: 50 }
    });

    try {
      if (onFormatChange) {
        await onFormatChange(newFormat);
      }

      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: { current: 2, total: 2, message: 'Format changed successfully', percentage: 100 }
      }));

      // Clear export-related errors
      contextErrors.forEach(error => {
        const errorInfo = getErrorInfo(error.error);
        if (errorInfo.type === 'export_failed' || error.context.includes('export')) {
          removeError(error.id);
        }
      });

      updateRecoveryAttempt(attemptId, true);

    } catch (error) {
      console.error('Format change recovery failed:', error);
      updateRecoveryAttempt(attemptId, false, { error: error.message });
    } finally {
      setTimeout(() => {
        setRecoveryState({
          isRecovering: false,
          recoveryType: null,
          recoveryProgress: null
        });
      }, 1000);
    }
  }, [onFormatChange, contextErrors, removeError, trackRecoveryAttempt, updateRecoveryAttempt]);

  // Handle filter reset for filter-related errors
  const handleFilterReset = useCallback(async () => {
    const attemptId = trackRecoveryAttempt('filter_reset', null);
    
    setRecoveryState({
      isRecovering: true,
      recoveryType: 'filter_reset',
      recoveryProgress: { current: 1, total: 2, message: 'Resetting filters...', percentage: 50 }
    });

    try {
      if (onFilterReset) {
        await onFilterReset();
      }

      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: { current: 2, total: 2, message: 'Filters reset successfully', percentage: 100 }
      }));

      // Clear filter-related errors
      contextErrors.forEach(error => {
        if (error.context.includes('filter') || error.context.includes('search')) {
          removeError(error.id);
        }
      });

      updateRecoveryAttempt(attemptId, true);

    } catch (error) {
      console.error('Filter reset recovery failed:', error);
      updateRecoveryAttempt(attemptId, false, { error: error.message });
    } finally {
      setTimeout(() => {
        setRecoveryState({
          isRecovering: false,
          recoveryType: null,
          recoveryProgress: null
        });
      }, 1000);
    }
  }, [onFilterReset, contextErrors, removeError, trackRecoveryAttempt, updateRecoveryAttempt]);

  // Handle network recovery
  const handleNetworkRecovery = useCallback(async () => {
    const attemptId = trackRecoveryAttempt('network_recovery', null);
    
    setRecoveryState({
      isRecovering: true,
      recoveryType: 'network_recovery',
      recoveryProgress: { current: 1, total: 3, message: 'Checking network connection...', percentage: 33 }
    });

    try {
      // Wait for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      setRecoveryState(prev => ({
        ...prev,
        recoveryProgress: { current: 2, total: 3, message: 'Reconnecting to server...', percentage: 66 }
      }));

      // Test connection with a simple API call
      const response = await fetch('/api/health-check', { 
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (response.ok) {
        setRecoveryState(prev => ({
          ...prev,
          recoveryProgress: { current: 3, total: 3, message: 'Connection restored', percentage: 100 }
        }));

        // Clear network-related errors
        contextErrors.forEach(error => {
          const errorInfo = getErrorInfo(error.error);
          if (errorInfo.type === 'network' || errorInfo.type === 'timeout') {
            removeError(error.id);
          }
        });

        updateRecoveryAttempt(attemptId, true);
      } else {
        throw new Error('Connection test failed');
      }

    } catch (error) {
      console.error('Network recovery failed:', error);
      updateRecoveryAttempt(attemptId, false, { error: error.message });
    } finally {
      setTimeout(() => {
        setRecoveryState({
          isRecovering: false,
          recoveryType: null,
          recoveryProgress: null
        });
      }, 1500);
    }
  }, [contextErrors, removeError, trackRecoveryAttempt, updateRecoveryAttempt]);

  // Get recovery options based on error types
  const getRecoveryOptions = useCallback((error) => {
    const options = [];
    const errorInfo = getErrorInfo(error.error);

    switch (errorInfo.type) {
      case 'export_failed':
        options.push({
          label: 'Try CSV Format',
          action: () => handleFormatChange('csv'),
          icon: '📄',
          type: 'primary'
        });
        options.push({
          label: 'Reduce Dataset',
          action: () => handleDataReduction(),
          icon: '📊',
          type: 'secondary'
        });
        break;

      case 'timeout':
        if (context.includes('export') || context.includes('report')) {
          options.push({
            label: 'Reduce Dataset Size',
            action: () => handleDataReduction(),
            icon: '⚡',
            type: 'primary'
          });
        }
        options.push({
          label: 'Reset Filters',
          action: handleFilterReset,
          icon: '🔄',
          type: 'secondary'
        });
        break;

      case 'network':
        options.push({
          label: 'Test Connection',
          action: handleNetworkRecovery,
          icon: '🌐',
          type: 'primary'
        });
        break;

      case 'validation':
        if (context.includes('filter') || context.includes('search')) {
          options.push({
            label: 'Reset Filters',
            action: handleFilterReset,
            icon: '🔄',
            type: 'primary'
          });
        }
        break;

      case 'insufficient_data':
        options.push({
          label: 'Reset Filters',
          action: handleFilterReset,
          icon: '🔍',
          type: 'primary'
        });
        break;

      default:
        // Generic recovery options
        if (context.includes('load') || context.includes('fetch')) {
          options.push({
            label: 'Refresh Page',
            action: () => window.location.reload(),
            icon: '🔄',
            type: 'secondary'
          });
        }
        break;
    }

    // Always add support option for persistent errors
    options.push({
      label: 'Contact Support',
      action: onContactSupport || (() => {
        const supportInfo = {
          error: error.error?.message,
          context: error.context,
          timestamp: error.timestamp,
          userAgent: navigator.userAgent,
          url: window.location.href,
          recoveryHistory: recoveryState.recoveryHistory,
          performanceState,
          networkState
        };
        
        const mailtoLink = `mailto:support@evaluation-system.com?subject=Department Results Error&body=${encodeURIComponent(
          `Error Details:\n${JSON.stringify(supportInfo, null, 2)}`
        )}`;
        
        window.open(mailtoLink);
      }),
      icon: '🆘',
      type: 'tertiary'
    });

    return options;
  }, [context, handleDataReduction, handleFormatChange, handleFilterReset, handleNetworkRecovery, onContactSupport, recoveryState.recoveryHistory, performanceState, networkState]);

  // Get performance recommendations
  const getPerformanceRecommendations = () => {
    if (!showPerformanceOptimizations) return [];

    const recommendations = [];

    if (performanceState.datasetSize > 50) {
      recommendations.push({
        type: 'performance',
        title: 'Large Dataset Detected',
        message: `Processing ${performanceState.datasetSize} items may impact performance`,
        suggestions: [
          'Apply date range filters to reduce data',
          'Use pagination with smaller page sizes',
          'Consider exporting data in chunks'
        ],
        action: {
          label: 'Optimize Performance',
          onClick: () => handleDataReduction()
        }
      });
    }

    if (networkState.connectionQuality === 'poor') {
      recommendations.push({
        type: 'network',
        title: 'Poor Network Connection',
        message: 'Slow network detected - some features may be limited',
        suggestions: [
          'Switch to a more stable connection',
          'Disable live updates to reduce bandwidth',
          'Use smaller page sizes for better loading'
        ]
      });
    }

    return recommendations;
  };

  const performanceRecommendations = getPerformanceRecommendations();

  // Render recovery UI if recovering
  if (recoveryState.isRecovering) {
    return (
      <div className="error-recovery-overlay">
        <div className="recovery-content">
          <h3>Recovering from Error</h3>
          <ProgressIndicator
            progress={recoveryState.recoveryProgress}
            title="Recovery in progress..."
            variant="bar"
          />
        </div>
      </div>
    );
  }

  // Render error alerts for unresolved errors
  const renderErrorAlerts = () => {
    if (contextErrors.length === 0) return null;

    return (
      <div className="error-alerts-container">
        {/* Performance Recommendations */}
        {performanceRecommendations.length > 0 && (
          <div className="performance-recommendations">
            {performanceRecommendations.map((rec, index) => (
              <div key={index} className={`performance-notice performance-${rec.type}`}>
                <div className="performance-header">
                  <span className="performance-icon">
                    {rec.type === 'performance' ? '⚡' : '📡'}
                  </span>
                  <div className="performance-content">
                    <div className="performance-title">{rec.title}</div>
                    <div className="performance-message">{rec.message}</div>
                  </div>
                  {rec.action && (
                    <button 
                      className="performance-action"
                      onClick={rec.action.onClick}
                    >
                      {rec.action.label}
                    </button>
                  )}
                </div>
                {rec.suggestions && (
                  <div className="performance-suggestions">
                    <ul>
                      {rec.suggestions.map((suggestion, suggestionIndex) => (
                        <li key={suggestionIndex}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {contextErrors.map(error => {
          const recoveryOptions = getRecoveryOptions(error);
          
          return (
            <div key={error.id} className="error-alert-wrapper">
              <ErrorAlert
                error={error.error}
                onRetry={() => {
                  // Try the primary recovery option if available
                  const primaryOption = recoveryOptions.find(opt => opt.type === 'primary');
                  if (primaryOption) {
                    primaryOption.action();
                  }
                }}
                onDismiss={() => removeError(error.id)}
                context={error.context}
                showRecoveryOptions={true}
                autoHide={false}
              />
              
              {/* Custom recovery options */}
              {recoveryOptions.length > 0 && (
                <div className="custom-recovery-options">
                  <h4>Recovery Options:</h4>
                  <div className="recovery-buttons">
                    {recoveryOptions.map((option, index) => (
                      <button
                        key={index}
                        className={`recovery-btn recovery-btn-${option.type}`}
                        onClick={option.action}
                        disabled={recoveryState.isRecovering}
                      >
                        <span className="recovery-btn-icon">{option.icon}</span>
                        <span className="recovery-btn-text">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="department-results-error-manager">
      {renderErrorAlerts()}
      
      {/* Recovery History (Development Only) */}
      {process.env.NODE_ENV === 'development' && recoveryState.recoveryHistory.length > 0 && (
        <details className="recovery-history-details">
          <summary>Recovery History (Development Only)</summary>
          <div className="recovery-history">
            {recoveryState.recoveryHistory.slice(-10).map((attempt) => (
              <div key={attempt.id} className={`recovery-attempt ${attempt.success ? 'success' : 'failed'}`}>
                <div className="attempt-header">
                  <span className="attempt-type">{attempt.type}</span>
                  <span className="attempt-time">{attempt.timestamp.toLocaleTimeString()}</span>
                  <span className={`attempt-status ${attempt.success ? 'success' : 'failed'}`}>
                    {attempt.success ? '✅' : '❌'}
                  </span>
                </div>
                {attempt.details && Object.keys(attempt.details).length > 0 && (
                  <div className="attempt-details">
                    <pre>{JSON.stringify(attempt.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {children}
    </div>
  );
}

export default DepartmentResultsErrorManager;