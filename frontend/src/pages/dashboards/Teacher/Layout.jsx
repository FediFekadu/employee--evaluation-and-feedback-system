import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage
    try {
      const saved = localStorage.getItem('teacherSidebarCollapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
    } catch {}
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => {
          const next = !prev;
          try { localStorage.setItem('teacherSidebarCollapsed', next ? 'true' : 'false'); } catch {}
          return next;
        });
      }
      // Escape to close mobile sidebar
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const navigationItems = [
    { to: '/teacher', label: 'Home', icon: '🏠' },
    { to: '/teacher/courses', label: 'My Courses', icon: '📚' },
    { to: '/teacher/feedback', label: 'Feedback', icon: '📊' },
    { to: '/teacher/peer-evaluations', label: 'Peer Evaluations', icon: '👥' },
    { to: '/teacher/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div className="teacher-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className={`mobile-menu-toggle ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <h1 className="mobile-title">Teacher Portal</h1>
      </div>

      {/* Sidebar */}
      <aside className={`teacher-sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">👨‍🏫</div>
            <div className="brand-text">
              <h3>Teacher Portal</h3>
              <p>Feedback & Analytics</p>
            </div>
          </div>
          <button 
            className="sidebar-minimize"
            onClick={() => {
              setSidebarCollapsed(v => {
                const next = !v;
                try { localStorage.setItem('teacherSidebarCollapsed', next ? 'true' : 'false'); } catch {}
                return next;
              });
            }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand (Ctrl+B)' : 'Minimize (Ctrl+B)'}
          >
            {sidebarCollapsed ? '▸' : '◂'}
          </button>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">T</div>
            <div className="user-details">
              <p className="user-name">Teacher</p>
              <p className="user-role">Instructor Portal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="teacher-main">
        <Outlet />
      </main>
    </div>
  );
}

export default TeacherLayout;