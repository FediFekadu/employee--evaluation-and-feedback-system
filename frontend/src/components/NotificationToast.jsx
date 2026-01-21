import React, { useState, useEffect } from 'react';

/**
 * Notification Toast Component - Display real-time notifications to users
 * Requirements: 4.1, 4.2, 4.3, 6.1
 */
function NotificationToast({ 
  notifications = [], 
  onDismiss = null,
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000,
  maxVisible = 5,
  className = ''
}) {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // Update visible notifications when notifications prop changes
    const newNotifications = notifications.slice(0, maxVisible).map(notification => ({
      ...notification,
      id: notification.id || Date.now() + Math.random(),
      timestamp: notification.timestamp || new Date(),
      visible: true
    }));
    
    setVisibleNotifications(newNotifications);
  }, [notifications, maxVisible]);

  useEffect(() => {
    if (!autoHide) return;

    const timers = visibleNotifications.map(notification => {
      if (notification.type === 'urgent' || notification.type === 'error') {
        // Don't auto-hide urgent or error notifications
        return null;
      }

      return setTimeout(() => {
        handleDismiss(notification.id);
      }, hideDelay);
    });

    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
    };
  }, [visibleNotifications, autoHide, hideDelay]);

  const handleDismiss = (notificationId) => {
    setVisibleNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    
    if (onDismiss) {
      onDismiss(notificationId);
    }
  };

  const getNotificationConfig = (type) => {
    const configs = {
      deadline_extended: {
        icon: '⏰',
        title: 'Deadline Extended',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#92400e'
      },
      closed: {
        icon: '🔒',
        title: 'Evaluation Closed',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        textColor: '#991b1b'
      },
      updated: {
        icon: '📝',
        title: 'Evaluation Updated',
        bgColor: '#dbeafe',
        borderColor: '#3b82f6',
        textColor: '#1e40af'
      },
      maintenance: {
        icon: '🔧',
        title: 'System Maintenance',
        bgColor: '#f3f4f6',
        borderColor: '#6b7280',
        textColor: '#374151'
      },
      urgent: {
        icon: '⚠️',
        title: 'Urgent Notice',
        bgColor: '#fef2f2',
        borderColor: '#dc2626',
        textColor: '#991b1b'
      },
      success: {
        icon: '✅',
        title: 'Success',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        textColor: '#065f46'
      },
      info: {
        icon: 'ℹ️',
        title: 'Information',
        bgColor: '#e0f2fe',
        borderColor: '#0891b2',
        textColor: '#0c4a6e'
      },
      error: {
        icon: '❌',
        title: 'Error',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        textColor: '#991b1b'
      }
    };

    return configs[type] || configs.info;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return notificationTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const positionStyles = {
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div 
      className={`notification-container ${className}`}
      style={{
        position: 'fixed',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '400px',
        width: '90%',
        ...positionStyles[position]
      }}
    >
      {visibleNotifications.map((notification) => {
        const config = getNotificationConfig(notification.type);
        
        return (
          <div 
            key={notification.id}
            className={`notification-toast notification-${notification.type}`}
            style={{
              background: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              borderLeft: `4px solid ${config.borderColor}`,
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              animation: 'slideInFromRight 0.3s ease-out',
              position: 'relative',
              color: config.textColor
            }}
          >
            <div className="notification-content">
              <div 
                className="notification-header"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}
              >
                <div 
                  className="notification-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  <span className="notification-icon" style={{ fontSize: '16px' }}>
                    {config.icon}
                  </span>
                  <span>{notification.title || config.title}</span>
                </div>
                
                <button 
                  className="notification-dismiss"
                  onClick={() => handleDismiss(notification.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: config.textColor,
                    opacity: 0.7,
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.opacity = '0.7';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
              
              <div 
                className="notification-message"
                style={{
                  fontSize: '13px',
                  lineHeight: '1.4',
                  marginBottom: '8px',
                  color: config.textColor,
                  opacity: 0.9
                }}
              >
                {notification.message}
              </div>
              
              {notification.evaluationId && (
                <div 
                  className="notification-meta"
                  style={{
                    fontSize: '11px',
                    color: config.textColor,
                    opacity: 0.7,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Evaluation ID: {notification.evaluationId}</span>
                  <span>{formatTimestamp(notification.timestamp)}</span>
                </div>
              )}
              
              {!notification.evaluationId && (
                <div 
                  className="notification-timestamp"
                  style={{
                    fontSize: '11px',
                    color: config.textColor,
                    opacity: 0.7,
                    textAlign: 'right'
                  }}
                >
                  {formatTimestamp(notification.timestamp)}
                </div>
              )}
            </div>
            
            {/* Progress bar for auto-hide */}
            {autoHide && notification.type !== 'urgent' && notification.type !== 'error' && (
              <div 
                className="notification-progress"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  height: '2px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '0 0 8px 8px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="notification-progress-bar"
                  style={{
                    height: '100%',
                    backgroundColor: config.borderColor,
                    animation: `shrinkWidth ${hideDelay}ms linear`,
                    transformOrigin: 'left'
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      
      {notifications.length > maxVisible && (
        <div 
          className="notification-overflow"
          style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}
        >
          +{notifications.length - maxVisible} more notification{notifications.length - maxVisible > 1 ? 's' : ''}
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shrinkWidth {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        
        @media (max-width: 768px) {
          .notification-container {
            width: 95% !important;
            max-width: none !important;
          }
          
          .notification-toast {
            padding: 10px !important;
          }
          
          .notification-title {
            font-size: 13px !important;
          }
          
          .notification-message {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default NotificationToast;