import React, { useState, useEffect, useCallback, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ErrorStateProvider, useErrorState } from './ErrorStateManager';
import UserFeedbackSystem from './UserFeedbackSystem';
import NetworkStatus from './NetworkStatus';
import { 
  retryManager, 
  networkManager, 
  loadingStateManager,
  progressTracker,
  getErrorInfo,
  ERROR_TYPES 
} from '../../utils/errorHandling';

/**
 * Enhanced Error Recovery Manager
 * Provides comprehensive error handling and recovery coordination across the application
 */

// Global error recovery coordinator
class ErrorRecoveryCoordinator {
  constructor() {
    this.recoveryStrategies = new Map();
    this.activeRecoveries = new Map();
    this.recoveryHistory = [];
    this.listeners = new Set();
  }

  // Register recovery strategy for specific error types or contexts
  registerStrategy(key, strategy) {
    this.recoveryStrategies.set(key, strategy);
  }

  // Execute recovery for an error
  async executeRecovery(error, context, options = {}) {
    const recoveryId = `${Date.now()}_${Math.random()}`;
    const errorInfo = getErrorInfo(error);
    
    // Check if recovery is already in progress for this error type/context
    const existingRecovery = Array.from(this.activeRecoveries.values())
      .find(r => r.errorType === errorInfo.type && r.context === context);
    
    if (existingRecovery && !options.force) {
      console.log('Recovery already in progress for', errorInfo.type, context);
      return existingRecovery.promise;
    }

    // Find appropriate recovery strategy
    const strategy = this.findRecoveryStrategy(errorInfo, context);
    if (!strategy) {
      console.warn('No recovery strategy found for', errorInfo.type, context);
      return Promise.reject(new Error('No recovery strategy available'));
    }

    // Start recovery
    const recoveryInfo = {
      id: recoveryId,
      errorType: errorInfo.type,
      context,
      strategy: strategy.name,
      startTime: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts || strategy.maxAttempts || 3
    };

    const recoveryPromise = this.performRecovery(error, strategy, recoveryInfo, options);
    
    this.activeRecoveries.set(recoveryId, {
      ...recoveryInfo,
      promise: recoveryPromise
    });

    // Notify listeners
    this.notifyListeners('recovery_started', recoveryInfo);

    try {
      const result = await recoveryPromise;
      
      // Success
      this.recoveryHistory.push({
        ...recoveryInfo,
        endTime: Date.now(),
        success: true,
        result
      });
      
      this.notifyListeners('recovery_completed', { ...recoveryInfo, success: true });
      return result;
      
    } catch (recoveryError) {
      // Failure
      this.recoveryHistory.push({
        ...recoveryInfo,
        endTime: Date.now(),
        success: false,
        error: recoveryError
      });
      
      this.notifyListeners('recovery_failed', { ...recoveryInfo, success: false, error: recoveryError });
      throw recoveryError;
      
    } finally {
      this.activeRecoveries.delete(recoveryId);
    }
  }

  findRecoveryStrategy(errorInfo, context) {
    // Try context-specific strategy first
    const contextKey = `${context}_${errorInfo.type}`;
    if (this.recoveryStrategies.has(contextKey)) {
      return this.recoveryStrategies.get(contextKey);
    }

    // Try error type strategy
    if (this.recoveryStrategies.has(errorInfo.type)) {
      return this.recoveryStrategies.get(errorInfo.type);
    }

    // Try context strategy
    if (this.recoveryStrategies.has(context)) {
      return this.recoveryStrategies.get(context);
    }

    // Default strategy
    return this.recoveryStrategies.get('default');
  }

  async performRecovery(error, strategy, recoveryInfo, options) {
    const maxAttempts = recoveryInfo.maxAttempts;
    let lastError = error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      recoveryInfo.attempts = attempt;
      
      try {
        console.log(`Recovery attempt ${attempt}/${maxAttempts} for ${recoveryInfo.errorType}`);
        
        // Execute recovery strategy
        const result = await strategy.execute(lastError, recoveryInfo, options);
        
        console.log(`Recovery successful after ${attempt} attempts`);
        return result;
        
      } catch (recoveryError) {
        lastError = recoveryError;
        console.error(`Recovery attempt ${attempt} failed:`, recoveryError);
        
        // Wait before next attempt (exponential backoff)
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Recovery failed after ${maxAttempts} attempts. Last error: ${lastError.message}`);
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error recovery listener failed:', error);
      }
    });
  }

  getRecoveryStatus() {
    return {
      activeRecoveries: Array.from(this.activeRecoveries.values()),
      recentHistory: this.recoveryHistory.slice(-10),
      totalRecoveries: this.recoveryHistory.length,
      successRate: this.recoveryHistory.length > 0 
        ? this.recoveryHistory.filter(r => r.success).length / this.recoveryHistory.length 
        : 0
    };
  }
}

// Global coordinator instance
const errorRecoveryCoordinator = new ErrorRecoveryCoordinator();

// Default recovery strategies
errorRecoveryCoordinator.registerStrategy('default', {
  name: 'default',
  maxAttempts: 1,
  execute: async (error, recoveryInfo, options) => {
    // Default recovery: just log and re-throw
    console.log('Default recovery strategy - no specific recovery available');
    throw error;
  }
});

errorRecoveryCoordinator.registerStrategy(ERROR_TYPES.NETWORK, {
  name: 'network_recovery',
  maxAttempts: 3,
  execute: async (error, recoveryInfo, options) => {
    // Wait for network to be available
    if (!networkManager.getNetworkInfo().isOnline) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Network recovery timeout'));
        }, 30000); // 30 second timeout

        const unsubscribe = networkManager.addListener(({ isOnline }) => {
          if (isOnline) {
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          }
        });
      });
    }

    // Retry the original operation if provided
    if (options.retryOperation) {
      return await options.retryOperation();
    }

    return { recovered: true, strategy: 'network_recovery' };
  }
});

errorRecoveryCoordinator.registerStrategy(ERROR_TYPES.SERVER_ERROR, {
  name: 'server_error_recovery',
  maxAttempts: 2,
  execute: async (error, recoveryInfo, options) => {
    // Wait a bit for server to recover
    const delay = Math.min(5000 * recoveryInfo.attempts, 15000);
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry the original operation if provided
    if (options.retryOperation) {
      return await options.retryOperation();
    }

    return { recovered: true, strategy: 'server_error_recovery' };
  }
});

errorRecoveryCoordinator.registerStrategy('dashboard_load', {
  name: 'dashboard_load_recovery',
  maxAttempts: 2,
  execute: async (error, recoveryInfo, options) => {
    // Try to reload dashboard data with reduced scope
    if (options.reloadDashboard) {
      try {
        // First try with reduced data set
        return await options.reloadDashboard({ 
          includeAnalytics: false,
          includeRankings: false,
          limit: 10 
        });
      } catch (reducedError) {
        // If that fails, try minimal data
        return await options.reloadDashboard({ 
          minimal: true,
          limit: 5 
        });
      }
    }

    throw error;
  }
});

// Enhanced Error Recovery Manager Component
function EnhancedErrorRecoveryManager({ 
  children, 
  enableGlobalErrorBoundary = true,
  enableUserFeedback = true,
  enableNetworkStatus = true,
  showNetworkDetails = false,
  maxErrors = 10,
  autoRecovery = true 
}) {
  const [recoveryStatus, setRecoveryStatus] = useState(errorRecoveryCoordinator.getRecoveryStatus());
  const errorState = useErrorState();
  const recoveryListenerRef = useRef(null);

  // Subscribe to recovery events
  useEffect(() => {
    recoveryListenerRef.current = errorRecoveryCoordinator.addListener((event, data) => {
      setRecoveryStatus(errorRecoveryCoordinator.getRecoveryStatus());
      
      // Handle recovery events
      switch (event) {
        case 'recovery_started':
          console.log('Recovery started:', data);
          break;
        case 'recovery_completed':
          console.log('Recovery completed:', data);
          if (typeof window !== 'undefined' && window.userFeedback) {
            window.userFeedback.showSuccess(`Recovered from ${data.errorType} error`);
          }
          break;
        case 'recovery_failed':
          console.error('Recovery failed:', data);
          if (typeof window !== 'undefined' && window.userFeedback) {
            window.userFeedback.showError(`Failed to recover from ${data.errorType} error`);
          }
          break;
      }
    });

    return () => {
      if (recoveryListenerRef.current) {
        recoveryListenerRef.current();
      }
    };
  }, []);

  // Auto-recovery for certain error types
  useEffect(() => {
    if (!autoRecovery) return;

    const newErrors = errorState.errors.filter(error => 
      error.retryCount === 0 && 
      [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER_ERROR].includes(error.type)
    );

    newErrors.forEach(error => {
      // Attempt auto-recovery
      errorRecoveryCoordinator.executeRecovery(
        error.originalError, 
        error.context,
        {
          maxAttempts: 2,
          retryOperation: error.retryOperation
        }
      ).then(() => {
        // Success - remove error
        errorState.removeError(error.id);
      }).catch(recoveryError => {
        // Failed - increment retry count
        errorState.incrementRetry(error.id);
        console.error('Auto-recovery failed for error:', error.id, recoveryError);
      });
    });
  }, [errorState.errors, autoRecovery, errorState]);

  // Global error handler
  const handleGlobalError = useCallback((error, errorInfo, context = 'global') => {
    console.error('Global error caught:', error, errorInfo);
    
    // Add to error state
    const errorId = errorState.addError(error, context);
    
    // Attempt recovery if appropriate
    if (autoRecovery && retryManager.isRetryable(error)) {
      setTimeout(() => {
        errorRecoveryCoordinator.executeRecovery(error, context)
          .then(() => {
            errorState.removeError(errorId);
          })
          .catch(recoveryError => {
            console.error('Global error recovery failed:', recoveryError);
          });
      }, 1000);
    }
  }, [errorState, autoRecovery]);

  // Error boundary fallback
  const errorBoundaryFallback = useCallback(({ error, errorInfo, retry, isRetrying, context }) => {
    return (
      <div className="enhanced-error-fallback">
        <div className="error-content">
          <div className="error-icon">
            {isRetrying ? '🔄' : '⚠️'}
          </div>
          <h2>
            {isRetrying ? 'Recovering...' : 'Something went wrong'}
          </h2>
          <p>
            {isRetrying 
              ? 'Attempting to recover from the error...'
              : 'An error occurred in this part of the application.'
            }
          </p>
          
          {!isRetrying && (
            <div className="error-actions">
              <button 
                className="recovery-btn primary"
                onClick={retry}
              >
                Try Again
              </button>
              <button 
                className="recovery-btn secondary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          .enhanced-error-fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin: 16px 0;
          }

          .error-content {
            text-align: center;
            max-width: 400px;
          }

          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
            animation: ${isRetrying ? 'spin 1s linear infinite' : 'none'};
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .enhanced-error-fallback h2 {
            color: #1f2937;
            margin-bottom: 8px;
            font-size: 24px;
            font-weight: 600;
          }

          .enhanced-error-fallback p {
            color: #6b7280;
            margin-bottom: 20px;
            line-height: 1.5;
          }

          .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }

          .recovery-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .recovery-btn.primary {
            background: #3b82f6;
            color: white;
          }

          .recovery-btn.primary:hover {
            background: #2563eb;
          }

          .recovery-btn.secondary {
            background: #6b7280;
            color: white;
          }

          .recovery-btn.secondary:hover {
            background: #4b5563;
          }
        `}</style>
      </div>
    );
  }, []);

  const content = (
    <>
      {children}
      
      {/* User Feedback System */}
      {enableUserFeedback && (
        <UserFeedbackSystem 
          maxToasts={5}
          enableErrorToasts={true}
          enableProgressToasts={true}
        />
      )}
      
      {/* Network Status Indicator */}
      {enableNetworkStatus && (
        <NetworkStatus 
          showDetails={showNetworkDetails}
          position="top-right"
          compact={!showNetworkDetails}
        />
      )}
      
      {/* Recovery Status (Development Only) */}
      {process.env.NODE_ENV === 'development' && recoveryStatus.activeRecoveries.length > 0 && (
        <div className="recovery-status-dev">
          <h4>Active Recoveries ({recoveryStatus.activeRecoveries.length})</h4>
          {recoveryStatus.activeRecoveries.map(recovery => (
            <div key={recovery.id} className="recovery-item">
              {recovery.strategy} - {recovery.context} (Attempt {recovery.attempts})
            </div>
          ))}
          
          <style jsx>{`
            .recovery-status-dev {
              position: fixed;
              bottom: 20px;
              left: 20px;
              background: #1f2937;
              color: white;
              padding: 12px;
              border-radius: 6px;
              font-size: 12px;
              max-width: 300px;
              z-index: 9998;
            }

            .recovery-status-dev h4 {
              margin: 0 0 8px 0;
              font-size: 14px;
            }

            .recovery-item {
              margin-bottom: 4px;
              opacity: 0.8;
            }
          `}</style>
        </div>
      )}
    </>
  );

  if (enableGlobalErrorBoundary) {
    return (
      <ErrorBoundary
        context="global"
        enableAutoRetry={autoRecovery}
        maxAutoRetries={2}
        onError={handleGlobalError}
        fallback={errorBoundaryFallback}
        showTechnicalDetails={process.env.NODE_ENV === 'development'}
      >
        {content}
      </ErrorBoundary>
    );
  }

  return content;
}

// Main export with error state provider
export default function EnhancedErrorRecoveryManagerWithProvider(props) {
  return (
    <ErrorStateProvider maxErrors={props.maxErrors || 10}>
      <EnhancedErrorRecoveryManager {...props} />
    </ErrorStateProvider>
  );
}

// Export coordinator for external use
export { errorRecoveryCoordinator };

// Hook for using error recovery
export function useErrorRecovery() {
  const errorState = useErrorState();
  
  const recoverFromError = useCallback(async (error, context, options = {}) => {
    try {
      const result = await errorRecoveryCoordinator.executeRecovery(error, context, options);
      return result;
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      throw recoveryError;
    }
  }, []);

  const registerRecoveryStrategy = useCallback((key, strategy) => {
    errorRecoveryCoordinator.registerStrategy(key, strategy);
  }, []);

  const getRecoveryStatus = useCallback(() => {
    return errorRecoveryCoordinator.getRecoveryStatus();
  }, []);

  return {
    recoverFromError,
    registerRecoveryStrategy,
    getRecoveryStatus,
    ...errorState
  };
}