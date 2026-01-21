import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { to: '/teacher', label: 'Home', icon: '🏠' },
    { to: '/teacher/courses', label: 'My Courses', icon: '📚' },
    { to: '/teacher/feedback', label: 'Feedback', icon: '📊' },
    { to: '/teacher/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <div className="teacher-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="mobile-menu-toggle"
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
      <aside className={`teacher-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">👨‍🏫</div>
            <div className="brand-text">
              <h3>Teacher Portal</h3>
              <p>Feedback & Analytics</p>
            </div>
          </div>
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