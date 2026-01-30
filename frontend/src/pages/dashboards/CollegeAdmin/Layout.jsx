import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../styles/sb-admin.css';
import '../../styles/sb-admin-unified.css';

function CollegeAdminLayout() {
  const navigate = useNavigate();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage
    try {
      const saved = localStorage.getItem('adminSidebarCollapsed');
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
          try { localStorage.setItem('adminSidebarCollapsed', next ? 'true' : 'false'); } catch {}
          return next;
        });
      }
      // Escape to close mobile sidebar
      if (e.key === 'Escape' && overlayOpen) {
        setOverlayOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [overlayOpen]);

  const handleLogout = async () => {
    try { /* optional API: await api.post('/auth/logout') */ } catch {}
    try {
      localStorage.removeItem('auth_role');
      localStorage.removeItem('department_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('student_id');
      localStorage.removeItem('teacher_id');
    } catch {}
    navigate('/login');
  };

  const navigationItems = [
    { to: '/admin', label: 'Overview', iconClass: 'bi-speedometer' },
    { to: '/admin/departments', label: 'Departments', iconClass: 'bi-building' },
    { to: '/admin/admins', label: 'Department Admins', iconClass: 'bi-person-badge' },
    { to: '/admin/instructors', label: 'Instructors', iconClass: 'bi-people' },
    { to: '/admin/students', label: 'Students', iconClass: 'bi-people-fill' },
    { to: '/admin/courses', label: 'Courses', iconClass: 'bi-journal-bookmark' },
    { to: '/admin/evaluations', label: 'Evaluations', iconClass: 'bi-clipboard-data' },
    { to: '/admin/reports', label: 'Reports & Analytics', iconClass: 'bi-graph-up' },
    { to: '/admin/settings', label: 'System Settings', iconClass: 'bi-gear' },
    { to: '/admin/communication', label: 'Communication', iconClass: 'bi-chat-dots' },
    { to: '/admin/notifications', label: 'Notifications', iconClass: 'bi-bell' }
  ];

  return (
    <div className={`sb-layout ${sidebarCollapsed ? 'sb-collapsed' : ''} ${overlayOpen ? 'overlay-open' : ''}`}>
      {/* Sidebar inside the layout wrapper */}
      <aside className="sb-sidebar" aria-label="Admin navigation">
        <div className="sb-side-header">
          <div className="sb-brand">
            <div className="sb-brand-icon"><i className="bi bi-building"></i></div>
            <div className="sb-brand-text">College Admin</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="sb-collapse-btn"
              onClick={() => {
                setSidebarCollapsed(v => {
                  const next = !v;
                  try { localStorage.setItem('adminSidebarCollapsed', next ? 'true' : 'false'); } catch {}
                  return next;
                });
              }}
              title={sidebarCollapsed ? 'Expand (Ctrl+B)' : 'Collapse (Ctrl+B)'}
              aria-label="Toggle sidebar collapse"
            >
              <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
            <button
              className="sb-collapse-btn d-lg-none"
              onClick={() => setOverlayOpen(false)}
              aria-label="Close menu"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <nav className="sb-nav">
          <ul className="nav nav-pills flex-column">
            {navigationItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOverlayOpen(false)}
                >
                  <i className={`bi ${item.iconClass}`}></i>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li className="nav-item mt-2">
              <button className="nav-link" onClick={handleLogout} type="button">
                <i className="bi bi-box-arrow-right"></i>
                <span className="nav-label">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Content wrapper next to sidebar */}
      <div className="sb-content">
        <div className="sb-page">
          <Outlet />
        </div>
      </div>

      {/* Mobile overlay */}
      <div className="sb-overlay" onClick={() => setOverlayOpen(false)} />
    </div>
  );
}

export default CollegeAdminLayout;