import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function CollegeAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { to: '/admin', label: 'Overview', icon: '📊' },
    { to: '/admin/departments', label: 'Departments', icon: '🏢' },
    { to: '/admin/admins', label: 'Department Admins', icon: '👨‍💼' },
    { to: '/admin/instructors', label: 'Instructors', icon: '👨‍🏫' },
    { to: '/admin/students', label: 'Students', icon: '👥' },
    { to: '/admin/courses', label: 'Courses', icon: '📚' },
    { to: '/admin/evaluations', label: 'Evaluations', icon: '📝' },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: '📈' },
    { to: '/admin/settings', label: 'System Settings', icon: '⚙️' },
    { to: '/admin/communication', label: 'Communication', icon: '💬' },
    { to: '/admin/notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="admin-layout">
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
        <h1 className="mobile-title">College Admin</h1>
      </div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">🎓</div>
            <div className="brand-text">
              <h3>College Admin</h3>
              <p>Management Portal</p>
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
            <div className="user-avatar">A</div>
            <div className="user-details">
              <p className="user-name">Admin User</p>
              <p className="user-role">System Administrator</p>
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
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default CollegeAdminLayout;