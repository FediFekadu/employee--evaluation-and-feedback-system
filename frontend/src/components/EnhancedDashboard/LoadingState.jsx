import React from 'react';

/**
 * Enhanced Loading State Component
 * 
 * Provides various loading states with smooth animations and skeleton screens.
 * Supports different types of loading indicators and customizable messages.
 */
function LoadingState({
  type = 'skeleton',
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
  progress = null,
  estimatedTime = null,
  className = '',
  children = null,
  showMessage = false,
  showElapsed = false,
  ...props
}) {
  const containerClasses = [
    'loading-state',
    `loading-state-${type}`,
    `loading-state-${size}`,
    `loading-state-${variant}`,
    className
  ].filter(Boolean).join(' ');

  // Render spinner loading
  const renderSpinner = () => (
    <div className="loading-spinner-container">
      <div className="enhanced-spinner" />
      {showMessage && message && (
        <p className="loading-message text-body-small">{message}</p>
      )}
      {showElapsed && estimatedTime && (
        <p className="loading-time text-caption">
          Estimated time: {estimatedTime}
        </p>
      )}
    </div>
  );

  // Render progress loading
  const renderProgress = () => (
    <div className="loading-progress-container">
      <div className="progress-content">
        {showMessage && message && (
          <p className="loading-message text-body">{message}</p>
        )}
        <div className="enhanced-progress">
          <div 
            className="enhanced-progress-bar"
            style={{ width: `${progress || 0}%` }}
          />
        </div>
        <div className="progress-details">
          <span className="progress-percentage text-body-small">
            {Math.round(progress || 0)}%
          </span>
          {estimatedTime && (
            <span className="progress-time text-body-small">
              {estimatedTime} remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Render skeleton loading
  const renderSkeleton = () => (
    <div className="loading-skeleton-container">
      {children || (
        <div className="skeleton-content">
          <div className="skeleton-header">
            <div className="enhanced-skeleton skeleton-title" />
            <div className="enhanced-skeleton skeleton-subtitle" />
          </div>
          <div className="skeleton-body">
            <div className="enhanced-skeleton skeleton-line" />
            <div className="enhanced-skeleton skeleton-line" />
            <div className="enhanced-skeleton skeleton-line short" />
          </div>
          <div className="skeleton-footer">
            <div className="enhanced-skeleton skeleton-button" />
            <div className="enhanced-skeleton skeleton-button secondary" />
          </div>
        </div>
      )}
      {message && (
        <p className="skeleton-message text-body-small fade-in">
          {message}
        </p>
      )}
    </div>
  );

  // Render dots loading
  const renderDots = () => (
    <div className="loading-dots-container">
      <div className="loading-dots">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      {showMessage && message && (
        <p className="loading-message text-body-small">{message}</p>
      )}
    </div>
  );

  // Render pulse loading
  const renderPulse = () => (
    <div className="loading-pulse-container">
      <div className="pulse-circle" />
      {message && <p className="loading-message text-body-small">{message}</p>}
    </div>
  );

  const renderLoadingContent = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'progress':
        return renderProgress();
      case 'skeleton':
        return renderSkeleton();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSkeleton();
    }
  };

  return (
    <div className={containerClasses} {...props}>
      {renderLoadingContent()}
    </div>
  );
}

// Skeleton components for specific use cases
export function CardSkeleton({ count = 1, className = '' }) {
  return (
    <div className={`card-skeleton-grid ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="enhanced-card">
          <div className="enhanced-card-header">
            <div className="enhanced-skeleton" style={{ height: '20px', width: '60%' }} />
          </div>
          <div className="enhanced-card-body">
            <div className="enhanced-skeleton" style={{ height: '40px', marginBottom: '12px' }} />
            <div className="enhanced-skeleton" style={{ height: '16px', marginBottom: '8px' }} />
            <div className="enhanced-skeleton" style={{ height: '16px', width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`table-skeleton ${className}`}>
      <div className="table-skeleton-header">
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="enhanced-skeleton header-cell" />
        ))}
      </div>
      <div className="table-skeleton-body">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="table-skeleton-row">
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="enhanced-skeleton body-cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ className = '' }) {
  return (
    <div className={`chart-skeleton ${className}`}>
      <div className="enhanced-skeleton chart-title" />
      <div className="chart-skeleton-content">
        <div className="chart-skeleton-bars">
          {Array.from({ length: 6 }, (_, index) => (
            <div 
              key={index} 
              className="enhanced-skeleton chart-bar"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
          ))}
        </div>
      </div>
      <div className="enhanced-skeleton chart-legend" />
    </div>
  );
}

export default LoadingState;