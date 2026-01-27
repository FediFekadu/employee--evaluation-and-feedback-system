import React, { useState, useEffect } from 'react';

function ProfessionalTaskbar({ 
  title, 
  subtitle, 
  onMinimize, 
  isMinimized, 
  showNotifications = true,
  showThemeToggle = true,
  showFullscreen = true,
  customActions = []
}) {
  const [notifications, setNotifications] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="professional-taskbar">
      <div className="taskbar-left">
        <div className="taskbar-brand">
          <div className="brand-info">
            <h1 className="taskbar-title">{title}</h1>
            {subtitle && <p className="taskbar-subtitle">{subtitle}</p>}
          </div>
        </div>
        
        <button
          className="taskbar-minimize"
          onClick={onMinimize}
          title={isMinimized ? 'Expand Sidebar (Ctrl+B)' : 'Minimize Sidebar (Ctrl+B)'}
          aria-label={isMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
        >
          <span className="minimize-icon">
            {isMinimized ? '▸' : '◂'}
          </span>
        </button>
      </div>

      <div className="taskbar-center">
        <div className="breadcrumb-nav">
          {/* Breadcrumb navigation can be added here */}
        </div>
      </div>

      <div className="taskbar-right">
        {/* Custom Actions */}
        {customActions.map((action, index) => (
          <button
            key={index}
            className="taskbar-action"
            onClick={action.onClick}
            title={action.title}
            aria-label={action.label}
          >
            <span className="action-icon">{action.icon}</span>
          </button>
        ))}

        {/* Notifications */}
        {showNotifications && (
          <div className="taskbar-notifications">
            <button 
              className="taskbar-action"
              title="Notifications"
              aria-label="View notifications"
            >
              <span className="action-icon">🔔</span>
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        {showThemeToggle && (
          <button
            className="taskbar-action"
            onClick={toggleTheme}
            title="Toggle Theme"
            aria-label="Toggle dark/light theme"
          >
            <span className="action-icon">🌓</span>
          </button>
        )}

        {/* Fullscreen Toggle */}
        {showFullscreen && (
          <button
            className="taskbar-action"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
          >
            <span className="action-icon">
              {isFullscreen ? '🗗' : '🗖'}
            </span>
          </button>
        )}

        {/* System Info */}
        <div className="taskbar-system-info">
          <div className="system-time">
            <div className="time-display">{formatTime(currentTime)}</div>
            <div className="date-display">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalTaskbar;