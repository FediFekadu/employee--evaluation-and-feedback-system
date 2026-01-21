import React from 'react';

function ParticipationIndicator({ 
  rate, 
  showPercentage = true, 
  showLabel = true, 
  size = 'medium',
  variant = 'badge' // 'badge', 'bar', 'circle'
}) {
  // Helper function to get participation level
  const getParticipationLevel = (rate) => {
    const numRate = parseFloat(rate) || 0;
    if (numRate >= 80) return { level: 'high', label: 'High', color: '#10b981' };
    if (numRate >= 60) return { level: 'medium', label: 'Medium', color: '#f59e0b' };
    return { level: 'low', label: 'Low', color: '#ef4444' };
  };

  // Helper function to get participation class
  const getParticipationClass = (rate) => {
    const numRate = parseFloat(rate) || 0;
    if (numRate >= 80) return 'participation-high';
    if (numRate >= 60) return 'participation-medium';
    return 'participation-low';
  };

  const participation = getParticipationLevel(rate);
  const participationClass = getParticipationClass(rate);
  const numRate = parseFloat(rate) || 0;

  // Badge variant
  if (variant === 'badge') {
    return (
      <span 
        className={`participation-badge ${participationClass} ${size}`}
        role="status"
        aria-label={`Participation rate: ${Math.round(numRate)}% - ${participation.label}`}
      >
        {showPercentage && `${Math.round(numRate)}%`}
        {showPercentage && showLabel && ' - '}
        {showLabel && participation.label}
      </span>
    );
  }

  // Bar variant
  if (variant === 'bar') {
    return (
      <div 
        className={`participation-bar-container ${size}`}
        role="progressbar"
        aria-valuenow={Math.round(numRate)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Participation rate: ${Math.round(numRate)}% - ${participation.label}`}
      >
        {showLabel && (
          <div className="participation-bar-header">
            <span className="participation-bar-label" id={`participation-label-${Math.random()}`}>
              Participation
            </span>
            {showPercentage && (
              <span className={`participation-bar-value ${participationClass}`}>
                {Math.round(numRate)}%
              </span>
            )}
          </div>
        )}
        <div className="participation-bar-track">
          <div 
            className={`participation-bar-fill ${participationClass}`}
            style={{ width: `${Math.min(numRate, 100)}%` }}
          ></div>
        </div>
        {showLabel && !showPercentage && (
          <div className={`participation-bar-status ${participationClass}`}>
            {participation.label}
          </div>
        )}
      </div>
    );
  }

  // Circle variant
  if (variant === 'circle') {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (numRate / 100) * circumference;

    return (
      <div 
        className={`participation-circle-container ${size}`}
        role="progressbar"
        aria-valuenow={Math.round(numRate)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Participation rate: ${Math.round(numRate)}% - ${participation.label}`}
      >
        <div className="participation-circle">
          <svg 
            width="40" 
            height="40" 
            className="participation-circle-svg"
            aria-hidden="true"
          >
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="var(--border-soft)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke={participation.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 20 20)"
              className="participation-circle-progress"
            />
          </svg>
          {showPercentage && (
            <div className="participation-circle-text" aria-hidden="true">
              <span className={`participation-circle-value ${participationClass}`}>
                {Math.round(numRate)}%
              </span>
            </div>
          )}
        </div>
        {showLabel && (
          <div className={`participation-circle-label ${participationClass}`}>
            {participation.label}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ParticipationIndicator;