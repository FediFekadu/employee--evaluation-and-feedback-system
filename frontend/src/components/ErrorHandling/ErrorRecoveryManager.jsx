import React, { useState, useEffect, useCallback } from 'react';
import connectionManager from '../../services/connectionManager';
import { retryManager } from '../../utils/errorHandling';

/**
 * Comprehensive Error Recovery Manager Component
 * Provides user-friendly error messages and recovery options for real-time connections
 */
function ErrorRecoveryManager({ children }) {
  const [errors, setErrors] = useState([]);
  const [recoveryStatus, setRecoveryStatus] = useState({});
  const [connectionHealth, setConnectionHealth] = useState({});

  useEffect(() => {
    // Listen for error recovery events
    // Note: Real-time error recovery has been removed
    // This is now handled through manual refresh mechanisms

    // Listen for connection status changes
    const unsubscribeConnection = connectionManager.addStatusListener((status, additionalData) => {
      handleConnectionStatusChange(status, additionalData);
    });

    // Listen for retry events
    const handleRetryEvent = (event) => {
      handleRetryAttempt(event.detail);
    };

    const handleRecoveryEvent = (event) => {
      handleOperationRecovery(event.detail);
    };

    window.addEventListener('retryAttempt', handleRetryEvent);
    window.addEventListener('operationRecovered', handleRecoveryEvent);

    // Initial connection health check
    updateConnectionHealth();

    return () => {
      // Cleanup connection listener
      unsubscribeConnection();
      window.removeEventListener('retryAttempt', handleRetryEvent);
      window.removeEventListener('operationRecovered', handleRecoveryEvent);
    };
  }, []);

  const handleErrorRecoveryEvent = useCallback((data) => {
    const { type, errorId, context, timestamp } = data;

    switch (type) {
      case 'error_occurred':
        setErrors(prev => [...prev, {
          id: errorId,
          context,
          timestamp,
          userMessage: data.userFriendlyMessage,
          status: 'occurred',
          recoveryAttempts: 0
        }]);
        break;

      case 'recovery_started':
        setRecoveryStatus(prev => ({
          ...prev,
          [errorId]: {
            status: 'recovering',
            strategy: data.strategy,
            attempt: data.attempt,
            maxAttempts: data.maxAttempts,
            estimatedTime: data.estimatedTime,
            userMessage: data.userMessage,
            userAction: data.userAction
          }
        }));
        
        // Update error status
        setErrors(prev => prev.map(error => 
          error.id === errorId 
            ? { ...error, status: 'recovering', recoveryAttempts: data.attempt }
            : error
        ));
        break;

      case 'recovery_success':
        setRecoveryStatus(prev => ({
          ...prev,
          [errorId]: {
            status: 'recovered',
            recoveryTime: data.recoveryTime,
            strategy: data.strategy
          }
        }));
        
        // Remove error after successful recovery
        setTimeout(() => {
          setErrors(prev => prev.filter(error => error.id !== errorId));
          setRecoveryStatus(prev => {
            const { [errorId]: removed, ...rest } = prev;
            return rest;
          });
        }, 3000);
        break;

      case 'recovery_failed':
        setRecoveryStatus(prev => ({
          ...prev,
          [errorId]: {
            status: 'failed',
            strategy: data.strategy,
            attempt: data.attempt,
            error: data.error,
            nextAttemptIn: data.nextAttemptIn
          }
        }));
        
        setErrors(prev => prev.map(error => 
          error.id === errorId 
            ? { ...error, status: 'recovery_failed', recoveryAttempts: data.attempt }
            : error
        ));
        break;

      case 'max_attempts_exceeded':
        setRecoveryStatus(prev => ({
          ...prev,
          [errorId]: {
            status: 'max_attempts_exceeded',
            fallbackAction: data.fallbackAction,
            userMessage: data.userMessage,
            userAction: data.userAction
          }
        }));
        
        setErrors(prev => prev.map(error => 
          error.id === errorId 
            ? { ...error, status: 'unrecoverable' }
            : error
        ));
        break;

      case 'unrecoverable_error':
        setErrors(prev => [...prev, {
          id: errorId || `unrecoverable_${Date.now()}`,
          context,
          timestamp,
          userMessage: {
            title: data.errorInfo.title,
            message: data.userMessage,
            action: data.userAction,
            severity: 'high',
            category: 'system'
          },
          status: 'unrecoverable',
          recoveryAttempts: 0
        }]);
        break;
    }
  }, []);

  const handleConnectionStatusChange = useCallback((status, additionalData) => {
    updateConnectionHealth();
    
    // Handle partial degradation notifications
    if (status === 'partial_degradation' && additionalData) {
      setErrors(prev => [...prev, {
        id: `partial_${Date.now()}`,
        context: `channel_${additionalData.channel}`,
        timestamp: new Date(),
        userMessage: {
          title: '⚠️ Partial Connection Issue',
          message: `Channel "${additionalData.channel}" is experiencing issues and has switched to polling mode.`,
          action: 'Continue using the application',
          severity: 'low',
          category: 'connection'
        },
        status: 'partial_degradation',
        recoveryAttempts: 0
      }]);
    } else if (status === 'channel_restored' && additionalData) {
      // Remove partial degradation errors for restored channels
      setErrors(prev => prev.filter(error => 
        !(error.context === `channel_${additionalData.channel}` && error.status === 'partial_degradation')
      ));
    }
  }, []);

  const handleRetryAttempt = useCallback((detail) => {
    const { context, attempt, maxRetries, delay, errorType, error } = detail;
    
    // Add or update retry status
    const retryId = `retry_${context}_${Date.now()}`;
    setErrors(prev => {
      const existingIndex = prev.findIndex(e => e.context === context && e.status === 'retrying');
      
      if (existingIndex >= 0) {
        // Update existing retry error
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          recoveryAttempts: attempt,
          userMessage: {
            ...updated[existingIndex].userMessage,
            message: `Retrying operation... (${attempt}/${maxRetries})`,
            action: `Next attempt in ${Math.round(delay / 1000)} seconds`
          }
        };
        return updated;
      } else {
        // Add new retry error
        return [...prev, {
          id: retryId,
          context,
          timestamp: new Date(),
          userMessage: {
            title: '🔄 Retrying Operation',
            message: `Retrying ${context}... (${attempt}/${maxRetries})`,
            action: `Next attempt in ${Math.round(delay / 1000)} seconds`,
            severity: 'low',
            category: 'retry'
          },
          status: 'retrying',
          recoveryAttempts: attempt
        }];
      }
    });
  }, []);

  const handleOperationRecovery = useCallback((detail) => {
    const { context, attempts, totalTime, finalSuccess } = detail;
    
    if (finalSuccess) {
      // Remove retry errors for this context
      setErrors(prev => prev.filter(error => 
        !(error.context === context && error.status === 'retrying')
      ));
      
      // Show success message briefly if there were multiple attempts
      if (attempts > 1) {
        const successId = `success_${context}_${Date.now()}`;
        setErrors(prev => [...prev, {
          id: successId,
          context,
          timestamp: new Date(),
          userMessage: {
            title: '✅ Operation Recovered',
            message: `${context} succeeded after ${attempts} attempts`,
            action: 'Continue',
            severity: 'low',
            category: 'success'
          },
          status: 'recovered',
          recoveryAttempts: attempts
        }]);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
          setErrors(prev => prev.filter(error => error.id !== successId));
        }, 3000);
      }
    }
  }, []);

  const updateConnectionHealth = useCallback(() => {
    const health = connectionManager.getConnectionHealth();
    setConnectionHealth(health);
  }, []);

  const dismissError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
    setRecoveryStatus(prev => {
      const { [errorId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const retryOperation = useCallback(async (errorId) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;
    
    try {
      // Mark as retrying
      setErrors(prev => prev.map(e => 
        e.id === errorId 
          ? { ...e, status: 'manual_retry' }
          : e
      ));
      
      // Attempt manual retry based on context
      if (error.context.includes('connection')) {
        connectionManager.reconnect();
      } else if (error.context.includes('channel')) {
        const channelName = error.context.replace('channel_', '');
        await connectionManager.retryChannelSubscription(channelName);
      }
      
      // Remove error after manual retry attempt
      setTimeout(() => {
        dismissError(errorId);
      }, 2000);
      
    } catch (retryError) {
      console.error('Manual retry failed:', retryError);
      
      // Update error status
      setErrors(prev => prev.map(e => 
        e.id === errorId 
          ? { 
              ...e, 
              status: 'manual_retry_failed',
              userMessage: {
                ...e.userMessage,
                message: 'Manual retry failed. Please refresh the page.',
                action: 'Refresh Page'
              }
            }
          : e
      ));
    }
  }, [errors, dismissError]);

  const refreshPage = useCallback(() => {
    window.location.reload();
  }, []);

  const renderError = useCallback((error) => {
    const recovery = recoveryStatus[error.id];
    const { userMessage, status, recoveryAttempts } = error;
    
    if (!userMessage) return null;
    
    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'high': return '#e74c3c';
        case 'medium': return '#f39c12';
        case 'low': return '#3498db';
        default: return '#95a5a6';
      }
    };
    
    const getStatusIcon = (status) => {
      switch (status) {
        case 'recovering': return '🔄';
        case 'recovered': return '✅';
        case 'recovery_failed': return '❌';
        case 'unrecoverable': return '🚫';
        case 'retrying': return '⏳';
        case 'partial_degradation': return '⚠️';
        default: return '❗';
      }
    };
    
    return (
      <div 
        key={error.id}
        className="error-recovery-item"
        style={{
          backgroundColor: '#fff',
          border: `2px solid ${getSeverityColor(userMessage.severity)}`,
          borderRadius: '8px',
          padding: '16px',
          margin: '8px 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{getStatusIcon(status)}</span>
          
          <div style={{ flex: 1 }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: getSeverityColor(userMessage.severity),
              fontSize: '16px'
            }}>
              {userMessage.title}
            </h4>
            
            <p style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>
              {userMessage.message}
            </p>
            
            {recovery && recovery.status === 'recovering' && (
              <div style={{ 
                backgroundColor: '#ecf0f1', 
                padding: '8px', 
                borderRadius: '4px',
                marginBottom: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#7f8c8d' }}>
                  Recovery in progress: {recovery.userMessage} 
                  {recovery.estimatedTime && ` (Est. ${Math.round(recovery.estimatedTime / 1000)}s)`}
                </p>
                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  backgroundColor: '#bdc3c7',
                  borderRadius: '2px',
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  <div 
                    style={{
                      width: `${(recovery.attempt / recovery.maxAttempts) * 100}%`,
                      height: '100%',
                      backgroundColor: '#3498db',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}
            
            {userMessage.suggestions && userMessage.suggestions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>
                  Suggestions:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                  {userMessage.suggestions.map((suggestion, index) => (
                    <li key={index} style={{ marginBottom: '2px' }}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {status === 'unrecoverable' && (
                <button
                  onClick={refreshPage}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Page
                </button>
              )}
              
              {(status === 'recovery_failed' || status === 'partial_degradation') && (
                <button
                  onClick={() => retryOperation(error.id)}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}
              
              <button
                onClick={() => dismissError(error.id)}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [recoveryStatus, retryOperation, dismissError, refreshPage]);

  // Don't render if no errors
  if (errors.length === 0) {
    return children;
  }

  return (
    <>
      {children}
      
      {/* Error Recovery Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 10000,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {errors.map(renderError)}
      </div>
      
      {/* Connection Health Indicator */}
      {connectionHealth.overall && connectionHealth.overall !== 'connected' && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: connectionHealth.overall === 'polling' ? '#f39c12' : '#e74c3c',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            zIndex: 9999
          }}
        >
          {connectionManager.getStatusMessage()}
        </div>
      )}
    </>
  );
}

export default ErrorRecoveryManager;