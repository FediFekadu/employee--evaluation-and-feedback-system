import React from 'react';

/**
 * Enhanced Dashboard Card Component
 * 
 * A modern, interactive card component with enhanced styling and animations.
 * Supports various states, sizes, and interactive behaviors.
 */
function DashboardCard({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  size = 'medium',
  interactive = false,
  loading = false,
  error = null,
  className = '',
  onClick = null,
  onHeaderClick = null,
  headerActions = null,
  footer = null,
  ...props
}) {
  const cardClasses = [
    'enhanced-card',
    'dashboard-card',
    `dashboard-card-${variant}`,
    `dashboard-card-${size}`,
    interactive && 'interactive',
    loading && 'loading',
    error && 'error',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (onClick && !loading && !error) {
      onClick(e);
    }
  };

  const handleHeaderClick = (e) => {
    if (onHeaderClick && !loading && !error) {
      e.stopPropagation();
      onHeaderClick(e);
    }
  };

  if (loading) {
    return (
      <div className={cardClasses} {...props}>
        <div className="dashboard-card-loading">
          <div className="enhanced-skeleton" style={{ height: '24px', marginBottom: '12px', width: '60%' }} />
          <div className="enhanced-skeleton" style={{ height: '16px', marginBottom: '8px', width: '40%' }} />
          <div className="enhanced-skeleton" style={{ height: '80px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cardClasses} {...props}>
        <div className="dashboard-card-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Error Loading Data</h4>
            <p>{error.message || 'An unexpected error occurred'}</p>
            {error.retry && (
              <button 
                className="enhanced-btn enhanced-btn-sm enhanced-btn-primary"
                onClick={error.retry}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cardClasses} 
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {(title || subtitle || icon || headerActions) && (
        <div 
          className="enhanced-card-header dashboard-card-header"
          onClick={handleHeaderClick}
        >
          <div className="header-content">
            {icon && (
              <div className="header-icon">
                {typeof icon === 'string' ? <span>{icon}</span> : icon}
              </div>
            )}
            <div className="header-text">
              {title && <h3 className="card-title text-heading-5">{title}</h3>}
              {subtitle && <p className="card-subtitle text-body-small">{subtitle}</p>}
            </div>
          </div>
          {headerActions && (
            <div className="header-actions">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      <div className="enhanced-card-body dashboard-card-body">
        {children}
      </div>
      
      {footer && (
        <div className="enhanced-card-footer dashboard-card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

export default DashboardCard;