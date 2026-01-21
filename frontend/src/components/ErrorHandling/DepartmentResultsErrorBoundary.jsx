import React from 'react';
import ErrorRecovery from './ErrorRecovery';
import { getErrorInfo, gracefulDegradationManager } from '../../utils/errorHandling';

/**
 * Enhanced Error Boundary for Department Results Feature
 * Provides comprehensive error handling with context-specific recovery options
 * and graceful degradation for large datasets
 */
class DepartmentResultsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      context: props.context || 'department_results',
      recoveryAttempts: [],
      lastRecoveryTime: null,
      degradationApplied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      lastRecoveryTime: new Date()
    });

    // Enhanced error logging with context
    const errorContext = {
      context: this.state.context,
      props: this.props,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'DepartmentResultsErrorBoundary'
    };

    console.error(`DepartmentResultsErrorBoundary caught error in ${this.state.context}:`, {
      error,
      errorInfo,
      context: errorContext
    });

    // Report to error tracking service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorContext);
    }

    // Track recovery attempt
    this.trackRecoveryAttempt('error_caught', { error: error.message });
  }

  trackRecoveryAttempt = (type, details = {}) => {
    this.setState(prevState => ({
      recoveryAttempts: [
        ...prevState.recoveryAttempts,
        {
          type,
          timestamp: new Date(),
          details,
          retryCount: prevState.retryCount
        }
      ]
    }));
  };

  handleRetry = async () => {
    this.trackRecoveryAttempt('manual_retry');
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      lastRecoveryTime: new Date()
    }));

    // Call parent retry handler if provided
    if (this.props.onRetry) {
      try {
        await this.props.onRetry();
        this.trackRecoveryAttempt('retry_success');
      } catch (retryError) {
        this.trackRecoveryAttempt('retry_failed', { error: retryError.message });
        // Re-throw to trigger error boundary again
        throw retryError;
      }
    }
  };

  handleReduceDataset = async (strategy) => {
    this.trackRecoveryAttempt('dataset_reduction', { strategy });
    
    try {
      // Apply graceful degradation strategy
      if (this.props.onReduceDataset) {
        await this.props.onReduceDataset(strategy);
      }
      
      this.setState({
        degradationApplied: true
      });
      
      // Retry after applying degradation
      await this.handleRetry();
      
      this.trackRecoveryAttempt('degradation_success', { strategy });
    } catch (error) {
      this.trackRecoveryAttempt('degradation_failed', { 
        strategy, 
        error: error.message 
      });
      console.error('Dataset reduction failed:', error);
    }
  };

  handleContactSupport = () => {
    this.trackRecoveryAttempt('contact_support');
    
    // Open support modal or redirect
    if (this.props.onContactSupport) {
      this.props.onContactSupport();
    } else {
      // Enhanced default support action with comprehensive error info
      const supportInfo = {
        error: this.state.error?.message,
        context: this.state.context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: this.state.retryCount,
        recoveryAttempts: this.state.recoveryAttempts,
        degradationApplied: this.state.degradationApplied,
        componentStack: this.state.errorInfo?.componentStack,
        errorStack: this.state.error?.stack,
        props: {
          context: this.props.context,
          autoRetry: this.props.autoRetry,
          maxAutoRetries: this.props.maxAutoRetries
        }
      };
      
      const mailtoLink = `mailto:support@evaluation-system.com?subject=Error Report - Department Results (${this.state.context})&body=${encodeURIComponent(
        `I encountered an error in the Department Results feature.\n\nError Details:\n${JSON.stringify(supportInfo, null, 2)}\n\nPlease help me resolve this issue.`
      )}`;
      
      window.open(mailtoLink);
    }
  };

  handleSaveDraft = async () => {
    this.trackRecoveryAttempt('save_draft');
    
    if (this.props.onSaveDraft) {
      try {
        await this.props.onSaveDraft();
        this.trackRecoveryAttempt('draft_saved');
      } catch (error) {
        this.trackRecoveryAttempt('draft_save_failed', { error: error.message });
        console.error('Save draft failed:', error);
      }
    }
  };

  getContextSpecificSuggestions = () => {
    const suggestions = [];
    const context = this.state.context;

    if (context.includes('load') || context.includes('fetch')) {
      suggestions.push(
        'Check your internet connection',
        'Verify you have permission to access this department',
        'Try refreshing the page',
        'Clear browser cache and cookies'
      );
    }

    if (context.includes('export')) {
      suggestions.push(
        'Try exporting a smaller date range',
        'Use CSV format for better performance',
        'Apply filters to reduce dataset size',
        'Export data in smaller chunks'
      );
    }

    if (context.includes('filter') || context.includes('search')) {
      suggestions.push(
        'Clear all filters and try again',
        'Use simpler filter criteria',
        'Check for special characters in search terms',
        'Try searching with fewer keywords'
      );
    }

    if (context.includes('connection') || context.includes('network')) {
      suggestions.push(
        'Disable live updates temporarily',
        'Check your network connection stability',
        'Try manual refresh instead',
        'Switch to polling mode if available'
      );
    }

    if (context.includes('pagination') || context.includes('large_dataset')) {
      suggestions.push(
        'Reduce the number of items per page',
        'Apply date range filters',
        'Use search to find specific items',
        'Try viewing data in smaller chunks'
      );
    }

    // Add general suggestions if no specific ones apply
    if (suggestions.length === 0) {
      suggestions.push(
        'Try refreshing the page',
        'Check your internet connection',
        'Clear browser cache',
        'Try again in a few minutes'
      );
    }

    return suggestions;
  };

  getPerformanceRecommendations = () => {
    const errorInfo = getErrorInfo(this.state.error);
    
    if (errorInfo.type === 'timeout' || this.state.context.includes('large_dataset')) {
      return gracefulDegradationManager.getPerformanceRecommendations('evaluations', 100);
    }
    
    return [];
  };

  render() {
    if (this.state.hasError) {
      const errorInfo = getErrorInfo(this.state.error);
      const suggestions = this.getContextSpecificSuggestions();
      const performanceRecommendations = this.getPerformanceRecommendations();
      
      // Custom fallback UI for department results
      return (
        <div className="department-results-error-boundary">
          <div className="error-boundary-header">
            <div className="error-icon">📊❌</div>
            <h2>Unable to Load Department Results</h2>
            <p>An error occurred while loading the evaluation results for this department.</p>
            {this.state.degradationApplied && (
              <div className="degradation-notice">
                <span className="degradation-icon">⚡</span>
                <span>Performance optimizations have been applied</span>
              </div>
            )}
          </div>

          <ErrorRecovery
            error={this.state.error}
            onRetry={this.handleRetry}
            onCancel={this.props.onCancel}
            context={this.state.context}
            autoRetry={this.props.autoRetry}
            maxAutoRetries={this.props.maxAutoRetries || 2}
            onReduceDataset={this.handleReduceDataset}
            onContactSupport={this.handleContactSupport}
            onSaveDraft={this.handleSaveDraft}
            showTechnicalDetails={process.env.NODE_ENV === 'development'}
          />

          {/* Context-specific recovery suggestions */}
          <div className="context-specific-suggestions">
            <h4>💡 Troubleshooting Tips:</h4>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>

          {/* Performance recommendations */}
          {performanceRecommendations.length > 0 && (
            <div className="performance-recommendations">
              <h4>⚡ Performance Recommendations:</h4>
              {performanceRecommendations.map((rec, index) => (
                <div key={index} className={`recommendation recommendation-${rec.type}`}>
                  <div className="recommendation-message">{rec.message}</div>
                  <ul className="recommendation-suggestions">
                    {rec.suggestions.map((suggestion, suggestionIndex) => (
                      <li key={suggestionIndex}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Recovery attempts history (development only) */}
          {process.env.NODE_ENV === 'development' && this.state.recoveryAttempts.length > 0 && (
            <details className="recovery-history">
              <summary>Recovery Attempts History (Development Only)</summary>
              <div className="recovery-attempts">
                {this.state.recoveryAttempts.map((attempt, index) => (
                  <div key={index} className="recovery-attempt">
                    <div className="attempt-header">
                      <span className="attempt-type">{attempt.type}</span>
                      <span className="attempt-time">{attempt.timestamp.toLocaleTimeString()}</span>
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

          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="error-technical-details">
              <summary>Technical Details (Development Only)</summary>
              <div className="technical-info">
                <div><strong>Error:</strong> {this.state.error?.toString()}</div>
                <div><strong>Error Type:</strong> {errorInfo.type}</div>
                <div><strong>Context:</strong> {this.state.context}</div>
                <div><strong>Retry Count:</strong> {this.state.retryCount}</div>
                <div><strong>Degradation Applied:</strong> {this.state.degradationApplied ? 'Yes' : 'No'}</div>
                <div><strong>Last Recovery:</strong> {this.state.lastRecoveryTime?.toLocaleString()}</div>
                <div><strong>Component Stack:</strong></div>
                <pre>{this.state.errorInfo?.componentStack}</pre>
                <div><strong>Error Stack:</strong></div>
                <pre>{this.state.error?.stack}</pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default DepartmentResultsErrorBoundary;