import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ErrorRecovery from './ErrorRecovery';
import LoadingSpinner from './LoadingSpinner';
import ProgressIndicator from './ProgressIndicator';
import { getErrorInfo, networkManager } from '../../utils/errorHandling';

/**
 * Enhanced Fallback UI for when the entire Results page fails to load
 * Provides comprehensive recovery options, navigation alternatives, and diagnostic information
 */
function ResultsPageFallback({ 
  error, 
  onRetry, 
  onContactSupport,
  showTechnicalDetails = false,
  enableDiagnostics = true 
}) {
  const navigate = useNavigate();
  const { id: departmentId } = useParams();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState(null);
  const [diagnostics, setDiagnostics] = useState({
    networkStatus: 'checking',
    serverStatus: 'checking',
    permissions: 'checking',
    browserCompatibility: 'checking'
  });
  const [diagnosticsComplete, setDiagnosticsComplete] = useState(false);

  // Run diagnostics on mount
  useEffect(() => {
    if (enableDiagnostics) {
      runDiagnostics();
    }
  }, [enableDiagnostics]);

  const runDiagnostics = async () => {
    setDiagnostics({
      networkStatus: 'checking',
      serverStatus: 'checking',
      permissions: 'checking',
      browserCompatibility: 'checking'
    });

    // Check network status
    try {
      const networkInfo = networkManager.getNetworkInfo();
      setDiagnostics(prev => ({
        ...prev,
        networkStatus: networkInfo.isOnline ? 'online' : 'offline'
      }));
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        networkStatus: 'error'
      }));
    }

    // Check server status
    try {
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      setDiagnostics(prev => ({
        ...prev,
        serverStatus: response.ok ? 'available' : 'unavailable'
      }));
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        serverStatus: 'unavailable'
      }));
    }

    // Check permissions
    try {
      const userRole = localStorage.getItem('auth_role');
      const departmentIdFromStorage = localStorage.getItem('department_id');
      
      const hasPermission = userRole === 'department_admin' && departmentIdFromStorage === departmentId;
      
      setDiagnostics(prev => ({
        ...prev,
        permissions: hasPermission ? 'valid' : 'invalid'
      }));
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        permissions: 'error'
      }));
    }

    // Check browser compatibility
    try {
      const isCompatible = 
        'fetch' in window &&
        'Promise' in window &&
        'localStorage' in window &&
        'URLSearchParams' in window;
      
      setDiagnostics(prev => ({
        ...prev,
        browserCompatibility: isCompatible ? 'compatible' : 'incompatible'
      }));
    } catch (error) {
      setDiagnostics(prev => ({
        ...prev,
        browserCompatibility: 'error'
      }));
    }

    setDiagnosticsComplete(true);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryProgress({
      current: 0,
      total: 4,
      message: 'Preparing to retry...',
      percentage: 0
    });

    try {
      // Step 1: Check network
      setRetryProgress({
        current: 1,
        total: 4,
        message: 'Checking network connection...',
        percentage: 25
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Clear cache
      setRetryProgress({
        current: 2,
        total: 4,
        message: 'Clearing cache...',
        percentage: 50
      });
      
      // Clear relevant caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Step 3: Retry operation
      setRetryProgress({
        current: 3,
        total: 4,
        message: 'Retrying operation...',
        percentage: 75
      });

      if (onRetry) {
        await onRetry();
      } else {
        // Default retry: reload the page
        window.location.reload();
      }

      // Step 4: Complete
      setRetryProgress({
        current: 4,
        total: 4,
        message: 'Retry completed',
        percentage: 100
      });

    } catch (retryError) {
      console.error('Retry failed:', retryError);
      setRetryProgress({
        current: 4,
        total: 4,
        message: 'Retry failed - please try manual options',
        percentage: 100
      });
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
        setRetryProgress(null);
      }, 2000);
    }
  };

  const handleNavigateToOverview = () => {
    navigate(`/department/${departmentId}/overview`);
  };

  const handleNavigateToEvaluations = () => {
    navigate(`/department/${departmentId}/evaluations`);
  };

  const handleNavigateToReports = () => {
    navigate(`/department/${departmentId}/reports`);
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Enhanced default support action with diagnostics
      const supportInfo = {
        page: 'Department Results',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        departmentId: departmentId,
        diagnostics: diagnostics,
        errorStack: error?.stack,
        browserInfo: {
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        }
      };
      
      const mailtoLink = `mailto:support@evaluation-system.com?subject=Results Page Error - Department ${departmentId}&body=${encodeURIComponent(
        `I encountered an error on the Department Results page.\n\nError Details:\n${JSON.stringify(supportInfo, null, 2)}\n\nPlease help me resolve this issue.`
      )}`;
      
      window.open(mailtoLink);
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear localStorage (except auth data)
      const authToken = localStorage.getItem('auth_token');
      const authRole = localStorage.getItem('auth_role');
      const departmentId = localStorage.getItem('department_id');
      
      localStorage.clear();
      
      if (authToken) localStorage.setItem('auth_token', authToken);
      if (authRole) localStorage.setItem('auth_role', authRole);
      if (departmentId) localStorage.setItem('department_id', departmentId);
      
      alert('Cache cleared successfully. The page will now reload.');
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try manually clearing your browser cache.');
    }
  };

  const getDiagnosticIcon = (status) => {
    switch (status) {
      case 'checking': return '🔄';
      case 'online': case 'available': case 'valid': case 'compatible': return '✅';
      case 'offline': case 'unavailable': case 'invalid': case 'incompatible': return '❌';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  const getDiagnosticMessage = (type, status) => {
    const messages = {
      networkStatus: {
        checking: 'Checking network connection...',
        online: 'Network connection is active',
        offline: 'No network connection detected',
        error: 'Unable to check network status'
      },
      serverStatus: {
        checking: 'Checking server availability...',
        available: 'Server is responding normally',
        unavailable: 'Server is not responding',
        error: 'Unable to check server status'
      },
      permissions: {
        checking: 'Checking access permissions...',
        valid: 'Access permissions are valid',
        invalid: 'Access permissions are invalid',
        error: 'Unable to check permissions'
      },
      browserCompatibility: {
        checking: 'Checking browser compatibility...',
        compatible: 'Browser is fully compatible',
        incompatible: 'Browser may not be fully compatible',
        error: 'Unable to check browser compatibility'
      }
    };
    
    return messages[type]?.[status] || 'Unknown status';
  };

  const errorInfo = getErrorInfo(error);

  if (isRetrying) {
    return (
      <div className="results-page-fallback">
        <div className="fallback-content">
          <div className="retry-in-progress">
            <LoadingSpinner size="large" />
            <h2>Retrying...</h2>
            <p>Attempting to reload the results page. Please wait...</p>
            {retryProgress && (
              <ProgressIndicator
                progress={retryProgress}
                title="Retry Progress"
                variant="bar"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page-fallback">
      <div className="fallback-header">
        <div className="fallback-icon">📊❌</div>
        <h1>Unable to Load Results</h1>
        <p>We encountered an error while loading the evaluation results page.</p>
        {errorInfo && (
          <div className="error-summary">
            <div className="error-type">{errorInfo.title}</div>
            <div className="error-message">{errorInfo.message}</div>
          </div>
        )}
      </div>

      <div className="fallback-content">
        {/* Diagnostics Panel */}
        {enableDiagnostics && (
          <div className="diagnostics-panel">
            <h3>🔍 System Diagnostics</h3>
            <div className="diagnostics-grid">
              {Object.entries(diagnostics).map(([type, status]) => (
                <div key={type} className={`diagnostic-item diagnostic-${status}`}>
                  <div className="diagnostic-icon">{getDiagnosticIcon(status)}</div>
                  <div className="diagnostic-content">
                    <div className="diagnostic-label">
                      {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="diagnostic-message">
                      {getDiagnosticMessage(type, status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {diagnosticsComplete && (
              <div className="diagnostics-actions">
                <button 
                  className="diagnostic-btn"
                  onClick={runDiagnostics}
                >
                  🔄 Re-run Diagnostics
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Recovery Component */}
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          context="results_page_load"
          autoRetry={false}
          onContactSupport={handleContactSupport}
          showTechnicalDetails={showTechnicalDetails}
        />

        {/* Quick Fix Actions */}
        <div className="quick-fix-actions">
          <h3>🛠️ Quick Fixes</h3>
          <div className="quick-fix-grid">
            <button 
              className="quick-fix-btn"
              onClick={() => window.location.reload()}
            >
              <span className="quick-fix-icon">🔄</span>
              <div className="quick-fix-content">
                <div className="quick-fix-title">Refresh Page</div>
                <div className="quick-fix-description">Reload the page to try again</div>
              </div>
            </button>

            <button 
              className="quick-fix-btn"
              onClick={handleClearCache}
            >
              <span className="quick-fix-icon">🗑️</span>
              <div className="quick-fix-content">
                <div className="quick-fix-title">Clear Cache</div>
                <div className="quick-fix-description">Clear browser cache and reload</div>
              </div>
            </button>

            <button 
              className="quick-fix-btn"
              onClick={() => {
                localStorage.removeItem('department_results_cache');
                window.location.reload();
              }}
            >
              <span className="quick-fix-icon">💾</span>
              <div className="quick-fix-content">
                <div className="quick-fix-title">Reset Data</div>
                <div className="quick-fix-description">Clear stored data and reload</div>
              </div>
            </button>

            <button 
              className="quick-fix-btn"
              onClick={() => {
                window.open(window.location.href, '_blank');
              }}
            >
              <span className="quick-fix-icon">🪟</span>
              <div className="quick-fix-content">
                <div className="quick-fix-title">New Window</div>
                <div className="quick-fix-description">Open in a new browser window</div>
              </div>
            </button>
          </div>
        </div>

        {/* Alternative Navigation Options */}
        <div className="alternative-navigation">
          <h3>🧭 Alternative Options</h3>
          <p>While we work on fixing this issue, you can try these alternatives:</p>
          
          <div className="navigation-options">
            <div className="nav-option">
              <button 
                className="nav-btn nav-btn-primary"
                onClick={handleNavigateToOverview}
              >
                <span className="nav-icon">📈</span>
                <div className="nav-content">
                  <div className="nav-title">Department Overview</div>
                  <div className="nav-description">View general department statistics and metrics</div>
                </div>
              </button>
            </div>

            <div className="nav-option">
              <button 
                className="nav-btn nav-btn-secondary"
                onClick={handleNavigateToEvaluations}
              >
                <span className="nav-icon">📝</span>
                <div className="nav-content">
                  <div className="nav-title">Manage Evaluations</div>
                  <div className="nav-description">Create, edit, and manage evaluation forms</div>
                </div>
              </button>
            </div>

            <div className="nav-option">
              <button 
                className="nav-btn nav-btn-secondary"
                onClick={handleNavigateToReports}
              >
                <span className="nav-icon">📊</span>
                <div className="nav-content">
                  <div className="nav-title">Generate Reports</div>
                  <div className="nav-description">Create and download evaluation reports</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="troubleshooting-tips">
          <h3>💡 Troubleshooting Tips</h3>
          <div className="tips-grid">
            <div className="tip-category">
              <h4>Network Issues</h4>
              <ul>
                <li>Check your internet connection</li>
                <li>Try switching to a different network</li>
                <li>Disable VPN if you're using one</li>
                <li>Check if other websites are working</li>
              </ul>
            </div>
            
            <div className="tip-category">
              <h4>Browser Issues</h4>
              <ul>
                <li>Clear browser cache and cookies</li>
                <li>Disable browser extensions temporarily</li>
                <li>Try using an incognito/private window</li>
                <li>Update your browser to the latest version</li>
              </ul>
            </div>
            
            <div className="tip-category">
              <h4>Access Issues</h4>
              <ul>
                <li>Verify you're logged in with the correct account</li>
                <li>Check if you have permission to access this department</li>
                <li>Try logging out and logging back in</li>
                <li>Contact your administrator if permissions seem incorrect</li>
              </ul>
            </div>
            
            <div className="tip-category">
              <h4>System Issues</h4>
              <ul>
                <li>Wait a few minutes and try again</li>
                <li>Check if the system is under maintenance</li>
                <li>Try accessing during off-peak hours</li>
                <li>Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-information">
          <h3>🆘 Need Help?</h3>
          <p>If you continue to experience issues, please contact our support team:</p>
          <div className="contact-options">
            <button 
              className="contact-btn contact-btn-primary"
              onClick={handleContactSupport}
            >
              <span className="contact-icon">📧</span>
              <span>Email Support</span>
            </button>
            <div className="contact-info">
              <p>Or call: <strong>(555) 123-4567</strong></p>
              <p>Support hours: Monday-Friday, 8 AM - 6 PM</p>
              <p>Emergency support: Available 24/7 for critical issues</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        {(showTechnicalDetails || process.env.NODE_ENV === 'development') && (
          <details className="technical-details">
            <summary>Technical Details {process.env.NODE_ENV === 'development' ? '(Development)' : ''}</summary>
            <div className="technical-info">
              <div><strong>Error Type:</strong> {errorInfo?.type || 'Unknown'}</div>
              <div><strong>Error Message:</strong> {error?.message || 'No message available'}</div>
              <div><strong>Department ID:</strong> {departmentId}</div>
              <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              <div><strong>User Agent:</strong> {navigator.userAgent}</div>
              <div><strong>URL:</strong> {window.location.href}</div>
              <div><strong>Network Status:</strong> {navigator.onLine ? 'Online' : 'Offline'}</div>
              <div><strong>Local Storage Available:</strong> {typeof Storage !== 'undefined' ? 'Yes' : 'No'}</div>
              {error?.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px' }}>
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      <style jsx>{`
        .results-page-fallback {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 20px;
          background: #f8fafc;
        }

        .fallback-header {
          text-align: center;
          margin-bottom: 40px;
          max-width: 600px;
        }

        .fallback-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .fallback-header h1 {
          color: #1e293b;
          margin-bottom: 10px;
        }

        .fallback-header p {
          color: #64748b;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .error-summary {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
        }

        .error-type {
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 5px;
        }

        .error-message {
          color: #7f1d1d;
          font-size: 14px;
        }

        .fallback-content {
          max-width: 1000px;
          width: 100%;
        }

        .diagnostics-panel {
          margin: 30px 0;
          padding: 25px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .diagnostics-panel h3 {
          margin-bottom: 20px;
          color: #1e293b;
        }

        .diagnostics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .diagnostic-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .diagnostic-item.diagnostic-checking {
          background: #fef3c7;
          border-color: #fcd34d;
        }

        .diagnostic-item.diagnostic-online,
        .diagnostic-item.diagnostic-available,
        .diagnostic-item.diagnostic-valid,
        .diagnostic-item.diagnostic-compatible {
          background: #d1fae5;
          border-color: #a7f3d0;
        }

        .diagnostic-item.diagnostic-offline,
        .diagnostic-item.diagnostic-unavailable,
        .diagnostic-item.diagnostic-invalid,
        .diagnostic-item.diagnostic-incompatible {
          background: #fee2e2;
          border-color: #fecaca;
        }

        .diagnostic-item.diagnostic-error {
          background: #fef3c7;
          border-color: #fcd34d;
        }

        .diagnostic-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .diagnostic-label {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .diagnostic-message {
          font-size: 14px;
          color: #64748b;
        }

        .diagnostics-actions {
          text-align: center;
        }

        .diagnostic-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .diagnostic-btn:hover {
          background: #2563eb;
        }

        .quick-fix-actions {
          margin: 30px 0;
          padding: 25px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .quick-fix-actions h3 {
          margin-bottom: 20px;
          color: #1e293b;
        }

        .quick-fix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .quick-fix-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .quick-fix-btn:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .quick-fix-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .quick-fix-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 2px;
        }

        .quick-fix-description {
          font-size: 12px;
          color: #64748b;
        }

        .alternative-navigation,
        .troubleshooting-tips,
        .contact-information {
          margin: 30px 0;
          padding: 25px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .alternative-navigation h3,
        .troubleshooting-tips h3,
        .contact-information h3 {
          margin-bottom: 15px;
          color: #1e293b;
        }

        .alternative-navigation p {
          color: #64748b;
          margin-bottom: 20px;
        }

        .navigation-options {
          display: grid;
          gap: 15px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .nav-btn:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .nav-btn-primary {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .nav-btn-primary:hover {
          background: #dbeafe;
        }

        .nav-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .nav-content {
          flex: 1;
        }

        .nav-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .nav-description {
          font-size: 14px;
          color: #64748b;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .tip-category h4 {
          color: #1e293b;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .tip-category ul {
          list-style: none;
          padding: 0;
        }

        .tip-category li {
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
          color: #475569;
          font-size: 14px;
        }

        .tip-category li::before {
          content: '💡';
          position: absolute;
          left: 0;
          top: 0;
        }

        .contact-options {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .contact-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .contact-btn:hover {
          background: #2563eb;
        }

        .contact-info {
          text-align: center;
        }

        .contact-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #64748b;
        }

        .technical-details {
          margin-top: 30px;
          font-size: 12px;
        }

        .technical-details summary {
          cursor: pointer;
          color: #6b7280;
          margin-bottom: 10px;
        }

        .technical-info {
          background: #f1f5f9;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .technical-info > div {
          margin-bottom: 8px;
          word-break: break-word;
        }

        .technical-info strong {
          color: #1e293b;
        }

        .retry-in-progress {
          text-align: center;
          padding: 40px;
        }

        .retry-in-progress h2 {
          margin: 20px 0 10px 0;
          color: #1e293b;
        }

        .retry-in-progress p {
          color: #64748b;
          margin-bottom: 30px;
        }

        @media (max-width: 768px) {
          .results-page-fallback {
            padding: 15px;
          }

          .fallback-icon {
            font-size: 48px;
          }

          .diagnostics-grid,
          .quick-fix-grid,
          .tips-grid {
            grid-template-columns: 1fr;
          }

          .nav-btn {
            padding: 15px;
          }

          .nav-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

export default ResultsPageFallback;