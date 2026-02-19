import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../styles/sb-admin-unified.css';

function StudentLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage
    try {
      const saved = localStorage.getItem('studentSidebarCollapsed');
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
          try { localStorage.setItem('studentSidebarCollapsed', next ? 'true' : 'false'); } catch {}
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

  const handleLogout = async () => {
    try { /* optional API: await api.post('/auth/logout') */ } catch {}
    try {
      localStorage.removeItem('auth_role');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('department_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('student_id');
      localStorage.removeItem('teacher_id');
    } catch {}
    navigate('/login');
  };

  const navigationItems = [
    { to: '/dashboard', label: 'Home', iconClass: 'bi-house' },
    { to: '/dashboard/evaluations', label: 'Evaluations', iconClass: 'bi-clipboard-check' },
    { to: '/dashboard/department-comment', label: 'Dept Comment', iconClass: 'bi-chat-dots' },
    { to: '/dashboard/profile', label: 'Profile', iconClass: 'bi-person-circle' }
  ];

  return (
    <div className={`sb-layout ${sidebarCollapsed ? 'sb-collapsed' : ''} ${sidebarOpen ? 'overlay-open' : ''}`}>
      {/* Sidebar: unified layout under system header */}
      <aside className="sb-sidebar" aria-label="Student navigation">
        <div className="sb-side-header">
          <div className="sb-brand">
            <div className="sb-brand-icon"><i className="bi bi-mortarboard"></i></div>
            <span className="sb-brand-text">Student Portal</span>
          </div>
          <button
            className="sb-collapse-btn"
            onClick={() => {
              setSidebarCollapsed(v => {
                const next = !v;
                try { localStorage.setItem('studentSidebarCollapsed', next ? 'true' : 'false'); } catch {}
                return next;
              });
            }}
            title={sidebarCollapsed ? 'Expand (Ctrl+B)' : 'Collapse (Ctrl+B)'}
            aria-label="Toggle collapse"
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>
        <nav className="sb-nav">
          <ul className="nav flex-column">
            {navigationItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
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

      {/* Content next to sidebar */}
      <div className="sb-content" role="main">
        <div className="sb-page">
          <Outlet />
        </div>
      </div>

      {/* Mobile overlay */}
      <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />
    </div>
  );
}

export default StudentLayout;
