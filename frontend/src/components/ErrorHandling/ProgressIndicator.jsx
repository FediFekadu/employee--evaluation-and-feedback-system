import React from 'react';

/**
 * Progress Indicator for long-running operations
 */
function ProgressIndicator({ 
  progress, 
  title = 'Processing...', 
  showPercentage = true,
  showDetails = true,
  variant = 'bar' // 'bar', 'circle', 'steps'
}) {
  if (!progress) {
    return null;
  }

  const { current = 0, total = 100, percentage = 0, message = '' } = progress;

  const renderBarProgress = () => (
    <div className="progress-indicator progress-bar-indicator">
      <div className="progress-header">
        <span className="progress-title">{title}</span>
        {showPercentage && (
          <span className="progress-percentage">{percentage}%</span>
        )}
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      
      {showDetails && (
        <div className="progress-details">
          {total > 0 && (
            <span className="progress-count">
              {current} of {total} completed
            </span>
          )}
          {message && (
            <span className="progress-message">{message}</span>
          )}
        </div>
      )}
    </div>
  );

  const renderCircleProgress = () => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="progress-indicator progress-circle-indicator">
        <div className="progress-circle-container">
          <svg className="progress-circle" width="100" height="100">
            <circle
              className="progress-circle-bg"
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              fill="none"
            />
            <circle
              className="progress-circle-fill"
              cx="50"
              cy="50"
              r={radius}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="progress-circle-text">
            <span className="progress-circle-percentage">{percentage}%</span>
          </div>
        </div>
        
        <div className="progress-circle-info">
          <div className="progress-title">{title}</div>
          {showDetails && message && (
            <div className="progress-message">{message}</div>
          )}
        </div>
      </div>
    );
  };

  const renderStepsProgress = () => {
    const steps = Array.isArray(progress.steps) ? progress.steps : [];
    const currentStep = progress.currentStep || 0;

    return (
      <div className="progress-indicator progress-steps-indicator">
        <div className="progress-title">{title}</div>
        
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`progress-step ${
                index < currentStep ? 'completed' : 
                index === currentStep ? 'active' : 'pending'
              }`}
            >
              <div className="step-indicator">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="step-label">{step}</div>
            </div>
          ))}
        </div>
        
        {showDetails && message && (
          <div className="progress-message">{message}</div>
        )}
      </div>
    );
  };

  switch (variant) {
    case 'circle':
      return renderCircleProgress();
    case 'steps':
      return renderStepsProgress();
    case 'bar':
    default:
      return renderBarProgress();
  }
}

export default ProgressIndicator;