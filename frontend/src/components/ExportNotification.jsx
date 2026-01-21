import React, { useState, useEffect } from 'react';

function ExportNotification({ 
  notification, 
  onDismiss, 
  autoHide = true, 
  autoHideDelay = 5000 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      if (autoHide && notification.type === 'success') {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [notification, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Allow fade out animation
  };

  const handleRetry = () => {
    if (notification?.onRetry) {
      notification.onRetry();
    }
    handleDismiss();
  };

  if (!notification) return null;

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📄';
    }
  };

  const getNotificationClass = () => {
    return `export-notification export-notification-${notification.type} ${
      isVisible ? 'export-notification-visible' : 'export-notification-hidden'
    }`;
  };

  return (
    <div className={getNotificationClass()}>
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-icon">{getNotificationIcon()}</span>
          <span className="notification-title">
            {notification.title || 
             (notification.type === 'success' ? 'Export Successful' : 
              notification.type === 'error' ? 'Export Failed' : 
              'Export Notification')}
          </span>
          <button 
            className="notification-close"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        
        {notification.message && (
          <div className="notification-message">
            {notification.message}
          </div>
        )}
        
        {notification.details && (
          <div className="notification-details">
            {notification.details}
          </div>
        )}
        
        {notification.type === 'error' && notification.onRetry && (
          <div className="notification-actions">
            <button 
              className="dept-btn dept-btn-small dept-btn-primary"
              onClick={handleRetry}
            >
              Retry Export
            </button>
          </div>
        )}
        
        {notification.downloadUrl && (
          <div className="notification-actions">
            <a 
              href={notification.downloadUrl}
              download={notification.filename}
              className="dept-btn dept-btn-small dept-btn-primary"
            >
              Download File
            </a>
          </div>
        )}
      </div>
      
      {notification.progress !== undefined && (
        <div className="notification-progress">
          <div 
            className="progress-bar"
            style={{ width: `${notification.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default ExportNotification;