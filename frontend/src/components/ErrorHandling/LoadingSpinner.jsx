import React, { useState, useEffect } from 'react';

/**
 * Enhanced Loading Spinner with progress indication and submission-specific states
 */
function LoadingSpinner({ 
  size = 'medium', 
  message = 'Loading...', 
  progress = null,
  showProgress = false,
  overlay = false,
  context = '',
  estimatedTime = null,
  onCancel = null 
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      
      // Show cancel option after 10 seconds for long operations
      if (elapsed > 10 && onCancel && !showCancel) {
        setShowCancel(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onCancel, showCancel]);

  const getContextualMessage = () => {
    if (context === 'submission') {
      if (elapsedTime < 3) return 'Validating submission...';
      if (elapsedTime < 6) return 'Processing evaluation data...';
      if (elapsedTime < 10) return 'Saving your responses...';
      return 'Finalizing submission...';
    }
    
    if (context === 'report_generation') {
      if (elapsedTime < 5) return 'Collecting evaluation data...';
      if (elapsedTime < 10) return 'Processing analytics...';
      if (elapsedTime < 15) return 'Generating report...';
      return 'Finalizing export...';
    }
    
    if (context === 'load_evaluations') {
      if (elapsedTime < 3) return 'Loading evaluations...';
      if (elapsedTime < 6) return 'Checking submission status...';
      return 'Preparing evaluation list...';
    }
    
    return message;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const sizeClasses = {
    small: 'loading-spinner-small',
    medium: 'loading-spinner-medium',
    large: 'loading-spinner-large'
  };

  const spinnerContent = (
    <div className={`loading-spinner ${sizeClasses[size]}`}>
      <div className="spinner-circle">
        <div className="spinner-inner"></div>
      </div>
      
      <div className="loading-message">
        {getContextualMessage()}
      </div>
      
      {showProgress && progress !== null && (
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress.percentage || 0}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {progress.current && progress.total ? (
              `${progress.current} of ${progress.total} (${progress.percentage || 0}%)`
            ) : (
              `${progress.percentage || 0}%`
            )}
          </div>
          {progress.message && (
            <div className="progress-message">
              {progress.message}
            </div>
          )}
        </div>
      )}
      
      {elapsedTime > 0 && (
        <div className="loading-time">
          Elapsed: {formatTime(elapsedTime)}
          {estimatedTime && elapsedTime < estimatedTime && (
            <span className="estimated-time">
              {' '}(~{formatTime(estimatedTime - elapsedTime)} remaining)
            </span>
          )}
        </div>
      )}
      
      {showCancel && onCancel && (
        <div className="loading-actions">
          <button 
            className="cancel-btn"
            onClick={onCancel}
            title="Cancel operation"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-overlay-content">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
}

export default LoadingSpinner;