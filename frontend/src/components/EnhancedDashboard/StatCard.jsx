import React from 'react';

/**
 * Enhanced Stat Card Component
 * 
 * Displays key metrics with enhanced visual design, trend indicators,
 * and interactive capabilities.
 */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend = null,
  change = null,
  variant = 'default',
  size = 'medium',
  format = 'number',
  precision = 1,
  loading = false,
  className = '',
  onClick = null,
  ...props
}) {
  const cardClasses = [
    'enhanced-card',
    'stat-card',
    `stat-card-${variant}`,
    `stat-card-${size}`,
    onClick && 'interactive',
    loading && 'loading',
    className
  ].filter(Boolean).join(' ');

  // Format the value based on the specified format
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    
    switch (format) {
      case 'percentage':
        return `${Number(val).toFixed(precision)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(val);
      case 'decimal':
        return Number(val).toFixed(precision);
      case 'integer':
        return Math.round(val).toLocaleString();
      default:
        return val.toLocaleString();
    }
  };

  // Get trend indicator
  const getTrendIndicator = () => {
    if (!trend || !change) return null;
    
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    let trendClass = 'trend-neutral';
    let trendIcon = '→';
    
    if (trend === 'up' || (trend === 'auto' && isPositive)) {
      trendClass = 'trend-positive';
      trendIcon = '↗';
    } else if (trend === 'down' || (trend === 'auto' && isNegative)) {
      trendClass = 'trend-negative';
      trendIcon = '↘';
    }
    
    return (
      <div className={`trend-indicator ${trendClass}`}>
        <span className="trend-icon">{trendIcon}</span>
        <span className="trend-value">
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cardClasses} {...props}>
        <div className="stat-card-loading">
          <div className="stat-header">
            <div className="enhanced-skeleton stat-icon-skeleton" />
            <div className="enhanced-skeleton trend-skeleton" />
          </div>
          <div className="enhanced-skeleton stat-value-skeleton" />
          <div className="enhanced-skeleton stat-title-skeleton" />
          <div className="enhanced-skeleton stat-subtitle-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      <div className="stat-header">
        {icon && (
          <div className="stat-icon">
            {typeof icon === 'string' ? <span>{icon}</span> : icon}
          </div>
        )}
        {getTrendIndicator()}
      </div>
      
      <div className="stat-content">
        <div className="stat-value text-heading-1">
          {formatValue(value)}
        </div>
        
        <div className="stat-title text-heading-6">
          {title}
        </div>
        
        {subtitle && (
          <div className="stat-subtitle text-body-small">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;