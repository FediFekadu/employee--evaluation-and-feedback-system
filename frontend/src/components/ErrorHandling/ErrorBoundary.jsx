import React from 'react';
import { getErrorInfo, retryManager } from '../../utils/errorHandling';
import ErrorRecovery from './ErrorRecovery';

/**
 * Enhanced Error Boundary Component with comprehensive recovery mechanisms
 * Supports automatic retry, exponential backoff, and context-aware error handling
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null,
      errorContext: props.context || 'component'
    };
    
    // Bind methods
    this.handleRetry = this.handleRetry.bind(this);
    this.handleAutoRetry = this.handleAutoRetry.bind(this);
    this.handleRecovery = this.handleRecovery.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const enhancedError = this.enhanceErrorWithContext(error, errorInfo);
    
    this.setState({
      error: enhancedError,
      errorInfo,
      lastRetryTime: Date.now()
    });

    // Log error with enhanced context
    this.logError(enhancedError, errorInfo);

    // Trigger auto-retry for retryable errors
    if (this.props.enableAutoRetry && this.canAutoRetry(enhancedError)) {
      this.scheduleAutoRetry();
    }

    // Call error callback if provided
    if (this.props.onError) {
      this.props.onError(enhancedError, errorInfo, this.state.errorContext);
    }
  }

  enhanceErrorWithContext(error, errorInfo) {
    const context = this.state.errorContext;
    const componentStack = errorInfo.componentStack;
    
    // Add context information to error
    const enhancedError = new Error(error.message);
    enhancedError.name = error.name;
    enhancedError.stack = error.stack;
    enhancedError.originalError = error;
    enhancedError.context = context;
    enhancedError.componentStack = componentStack;
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.userAgent = navigator.userAgent;
    enhancedError.url = window.location.href;
    
    // Categorize error based on context and content
    if (context.includes('dashboard') || context.includes('evaluation')) {
      enhancedError.category = 'dashboard_error';
    } else if (context.includes('submission') || context.includes('form')) {
      enhancedError.category = 'submission_error';
    } else if (context.includes('api') || context.includes('network')) {
      enhancedError.category = 'network_error';
    } else {
      enhancedError.category = 'component_error';
    }
    
    return enhancedError;
  }

  logError(error, errorInfo) {
    const logData = {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        category: error.category,
        context: error.context
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      metadata: {
        timestamp: error.timestamp,
        url: error.url,
        userAgent: error.userAgent,
        retryCount: this.state.retryCount
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary caught an error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.table(logData.metadata);
      console.groupEnd();
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production' && this.props.onErrorReport) {
      this.props.onErrorReport(logData);
    }
  }

  canAutoRetry(error) {
    // Don't auto-retry if we've already tried too many times
    if (this.state.retryCount >= (this.props.maxAutoRetries || 2)) {
      return false;
    }

    // Don't auto-retry certain error types
    const nonRetryableCategories = ['submission_error', 'validation_error'];
    if (nonRetryableCategories.includes(error.category)) {
      return false;
    }

    // Check if error is retryable based on content
    return retryManager.isRetryable(error);
  }

  scheduleAutoRetry() {
    const delay = retryManager.getRetryDelay(this.state.retryCount);
    
    setTimeout(() => {
      if (this.state.hasError && !this.state.isRetrying) {
        this.handleAutoRetry();
      }
    }, delay);
  }

  async handleAutoRetry() {
    if (this.state.isRetrying) return;

    this.setState({ isRetrying: true });

    try {
      // Wait a moment for any cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset error state
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        lastRetryTime: Date.now()
      }));

      console.log(`ErrorBoundary: Auto-retry ${this.state.retryCount + 1} successful`);
      
    } catch (retryError) {
      console.error('ErrorBoundary: Auto-retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  }

  async handleRetry() {
    if (this.state.isRetrying) return;

    this.setState({ isRetrying: true });

    try {
      // Call retry callback if provided
      if (this.props.onRetry) {
        await this.props.onRetry(this.state.error, this.state.retryCount);
      }

      // Reset error state
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        lastRetryTime: Date.now()
      }));

      console.log(`ErrorBoundary: Manual retry ${this.state.retryCount + 1} successful`);
      
    } catch (retryError) {
      console.error('ErrorBoundary: Manual retry failed:', retryError);
      this.setState({ 
        isRetrying: false,
        error: retryError 
      });
    }
  }

  handleRecovery(recoveryType) {
    switch (recoveryType) {
      case 'refresh':
        window.location.reload();
        break;
      case 'reset':
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
          isRetrying: false
        });
        break;
      case 'navigate_back':
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/';
        }
        break;
      case 'contact_support':
        if (this.props.onContactSupport) {
          this.props.onContactSupport(this.state.error);
        } else {
          // Default support action
          const subject = encodeURIComponent(`Error Report: ${this.state.error?.category || 'Component Error'}`);
          const body = encodeURIComponent(`
Error Details:
- Message: ${this.state.error?.message}
- Context: ${this.state.errorContext}
- Time: ${this.state.error?.timestamp}
- URL: ${this.state.error?.url}

Please describe what you were doing when this error occurred:
          `);
          window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
        }
        break;
      default:
        console.warn('Unknown recovery type:', recoveryType);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          isRetrying: this.state.isRetrying,
          retryCount: this.state.retryCount,
          context: this.state.errorContext
        });
      }

      // Use enhanced error recovery component
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-header">
              <div className="error-icon">
                {this.state.isRetrying ? '🔄' : '⚠️'}
              </div>
              <h2>
                {this.state.isRetrying ? 'Recovering...' : 'Something went wrong'}
              </h2>
              <p className="error-description">
                {this.getErrorDescription()}
              </p>
            </div>

            {/* Enhanced Error Recovery Component */}
            <ErrorRecovery
              error={this.state.error}
              onRetry={this.handleRetry}
              onCancel={() => this.handleRecovery('navigate_back')}
              context={this.state.errorContext}
              autoRetry={this.props.enableAutoRetry}
              maxAutoRetries={this.props.maxAutoRetries || 2}
              onContactSupport={() => this.handleRecovery('contact_support')}
              showTechnicalDetails={this.props.showTechnicalDetails}
            />

            {/* Development-only error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-debug-info">
                  <div><strong>Error:</strong> {this.state.error?.toString()}</div>
                  <div><strong>Category:</strong> {this.state.error?.category}</div>
                  <div><strong>Context:</strong> {this.state.errorContext}</div>
                  <div><strong>Retry Count:</strong> {this.state.retryCount}</div>
                  <div><strong>Timestamp:</strong> {this.state.error?.timestamp}</div>
                  <pre className="component-stack">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}

            {/* Quick action buttons */}
            <div className="error-actions">
              <button 
                className="error-btn primary" 
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
              >
                {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
              <button 
                className="error-btn secondary" 
                onClick={() => this.handleRecovery('refresh')}
                disabled={this.state.isRetrying}
              >
                Refresh Page
              </button>
              {this.state.retryCount > 2 && (
                <button 
                  className="error-btn tertiary" 
                  onClick={() => this.handleRecovery('contact_support')}
                >
                  Get Help
                </button>
              )}
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 200px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin: 16px 0;
            }

            .error-boundary-content {
              max-width: 600px;
              text-align: center;
            }

            .error-header {
              margin-bottom: 24px;
            }

            .error-icon {
              font-size: 48px;
              margin-bottom: 16px;
              animation: ${this.state.isRetrying ? 'spin 1s linear infinite' : 'none'};
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            .error-boundary h2 {
              color: #1f2937;
              margin-bottom: 8px;
              font-size: 24px;
              font-weight: 600;
            }

            .error-description {
              color: #6b7280;
              margin-bottom: 0;
              line-height: 1.5;
            }

            .error-details {
              margin: 20px 0;
              text-align: left;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 12px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              color: #475569;
              margin-bottom: 8px;
            }

            .error-debug-info {
              font-size: 12px;
              color: #374151;
            }

            .error-debug-info > div {
              margin-bottom: 4px;
            }

            .component-stack {
              background: #ffffff;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              padding: 8px;
              font-size: 11px;
              overflow-x: auto;
              margin-top: 8px;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
              margin-top: 20px;
            }

            .error-btn {
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              min-width: 120px;
            }

            .error-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            .error-btn.primary {
              background: #3b82f6;
              color: white;
            }

            .error-btn.primary:hover:not(:disabled) {
              background: #2563eb;
            }

            .error-btn.secondary {
              background: #6b7280;
              color: white;
            }

            .error-btn.secondary:hover:not(:disabled) {
              background: #4b5563;
            }

            .error-btn.tertiary {
              background: #f1f5f9;
              color: #475569;
              border: 1px solid #cbd5e1;
            }

            .error-btn.tertiary:hover:not(:disabled) {
              background: #e2e8f0;
            }

            @media (max-width: 768px) {
              .error-actions {
                flex-direction: column;
                align-items: center;
              }

              .error-btn {
                width: 100%;
                max-width: 200px;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }

  getErrorDescription() {
    if (this.state.isRetrying) {
      return 'Attempting to recover from the error...';
    }

    const context = this.state.errorContext;
    const error = this.state.error;

    if (context.includes('dashboard')) {
      return 'An error occurred while loading the dashboard. This may be due to a temporary server issue or network problem.';
    } else if (context.includes('evaluation')) {
      return 'An error occurred while processing evaluation data. Your progress has been saved.';
    } else if (context.includes('submission')) {
      return 'An error occurred during submission. Please check your responses and try again.';
    } else if (error?.category === 'network_error') {
      return 'A network error occurred. Please check your internet connection and try again.';
    } else {
      return 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';
    }
  }
}

export default ErrorBoundary;