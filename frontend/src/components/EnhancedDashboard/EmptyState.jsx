import React from 'react';

/**
 * Enhanced Empty State Component
 * 
 * Provides informative empty states with actionable guidance and visual appeal.
 * Supports different scenarios and customizable actions.
 */
function EmptyState({
  icon = '📊',
  title = 'No Data Available',
  description = 'There is no data to display at the moment.',
  action = null,
  actionText = 'Take Action',
  secondaryAction = null,
  secondaryActionText = 'Learn More',
  variant = 'default',
  size = 'medium',
  illustration = null,
  className = '',
  ...props
}) {
  const containerClasses = [
    'empty-state',
    `empty-state-${variant}`,
    `empty-state-${size}`,
    className
  ].filter(Boolean).join(' ');

  const getVariantContent = () => {
    switch (variant) {
      case 'no-evaluations':
        return {
          icon: '📝',
          title: 'No Evaluations Found',
          description: 'Create your first evaluation to start collecting feedback from students.',
          actionText: 'Create Evaluation'
        };
      case 'no-teachers':
        return {
          icon: '👥',
          title: 'No Teachers Found',
          description: 'Add teachers to your department to start managing evaluations.',
          actionText: 'Add Teachers'
        };
      case 'no-results':
        return {
          icon: '🔍',
          title: 'No Results Found',
          description: 'Try adjusting your search criteria or filters to find what you\'re looking for.',
          actionText: 'Clear Filters'
        };
      case 'no-data':
        return {
          icon: '📊',
          title: 'No Data Available',
          description: 'Data will appear here once evaluations are completed and responses are collected.',
          actionText: 'Refresh Data'
        };
      case 'error':
        return {
          icon: '⚠️',
          title: 'Unable to Load Data',
          description: 'There was a problem loading the data. Please try again or contact support if the issue persists.',
          actionText: 'Try Again'
        };
      case 'maintenance':
        return {
          icon: '🔧',
          title: 'Under Maintenance',
          description: 'This feature is temporarily unavailable while we perform maintenance. Please check back later.',
          actionText: 'Check Status'
        };
      case 'permission':
        return {
          icon: '🔒',
          title: 'Access Restricted',
          description: 'You don\'t have permission to view this content. Contact your administrator for access.',
          actionText: 'Request Access'
        };
      case 'coming-soon':
        return {
          icon: '🚀',
          title: 'Coming Soon',
          description: 'This feature is currently in development and will be available soon.',
          actionText: 'Get Notified'
        };
      default:
        return { icon, title, description, actionText };
    }
  };

  const variantContent = getVariantContent();
  const finalIcon = icon !== '📊' ? icon : variantContent.icon;
  const finalTitle = title !== 'No Data Available' ? title : variantContent.title;
  const finalDescription = description !== 'There is no data to display at the moment.' ? description : variantContent.description;
  const finalActionText = actionText !== 'Take Action' ? actionText : variantContent.actionText;

  return (
    <div className={containerClasses} {...props}>
      <div className="empty-state-content">
        {illustration ? (
          <div className="empty-state-illustration">
            {illustration}
          </div>
        ) : (
          <div className="empty-state-icon">
            <span className="icon-emoji">{finalIcon}</span>
          </div>
        )}
        
        <div className="empty-state-text">
          <h3 className="empty-state-title text-heading-3">
            {finalTitle}
          </h3>
          <p className="empty-state-description text-body">
            {finalDescription}
          </p>
        </div>
        
        {(action || secondaryAction) && (
          <div className="empty-state-actions">
            {action && (
              <button 
                className="enhanced-btn enhanced-btn-primary"
                onClick={action}
              >
                {finalActionText}
              </button>
            )}
            {secondaryAction && (
              <button 
                className="enhanced-btn enhanced-btn-secondary"
                onClick={secondaryAction}
              >
                {secondaryActionText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized empty state components
export function NoEvaluationsState({ onCreateEvaluation, className = '' }) {
  return (
    <EmptyState
      variant="no-evaluations"
      action={onCreateEvaluation}
      className={className}
    />
  );
}

export function NoTeachersState({ onAddTeachers, className = '' }) {
  return (
    <EmptyState
      variant="no-teachers"
      action={onAddTeachers}
      className={className}
    />
  );
}

export function NoSearchResultsState({ onClearFilters, className = '' }) {
  return (
    <EmptyState
      variant="no-results"
      action={onClearFilters}
      className={className}
    />
  );
}

export function NoDataState({ onRefresh, className = '' }) {
  return (
    <EmptyState
      variant="no-data"
      action={onRefresh}
      className={className}
    />
  );
}

export function ErrorState({ onRetry, error, className = '' }) {
  return (
    <EmptyState
      variant="error"
      description={error?.message || 'There was a problem loading the data. Please try again or contact support if the issue persists.'}
      action={onRetry}
      className={className}
    />
  );
}

export function MaintenanceState({ onCheckStatus, className = '' }) {
  return (
    <EmptyState
      variant="maintenance"
      action={onCheckStatus}
      className={className}
    />
  );
}

export function PermissionState({ onRequestAccess, className = '' }) {
  return (
    <EmptyState
      variant="permission"
      action={onRequestAccess}
      className={className}
    />
  );
}

export function ComingSoonState({ onGetNotified, className = '' }) {
  return (
    <EmptyState
      variant="coming-soon"
      action={onGetNotified}
      className={className}
    />
  );
}

export default EmptyState;