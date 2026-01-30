import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../../styles/teacher-layout.css';
import '../../styles/sb-admin.css';

function TeacherLayout() {
  const navigate = useNavigate();
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
    { to: '/teacher', label: 'Home', iconClass: 'bi-house' },
    { to: '/teacher/courses', label: 'My Courses', iconClass: 'bi-journal-bookmark' },
    { to: '/teacher/feedback', label: 'Feedback', iconClass: 'bi-graph-up' },
    { to: '/teacher/peer-evaluations', label: 'Peer Evaluations', iconClass: 'bi-people' },
    { to: '/teacher/profile', label: 'Profile', iconClass: 'bi-person-circle' }
  ];

  return (
    <div className="container-fluid p-0">
      {/* Topbar for mobile toggler */}
      <div className="d-flex d-lg-none align-items-center justify-content-between px-3 py-2 border-bottom bg-light">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>
        <h1 className="h5 m-0">Teacher Portal</h1>
      </div>

      {/* Fixed Sidebar */}
      <nav
        className="bg-light vh-100 position-fixed d-flex flex-column border-end"
        style={{ width: sidebarCollapsed ? 72 : 260, left: 0, top: 0, paddingTop: 56 }}
        aria-label="Teacher navigation"
      >
        <div className="px-3 py-2 d-none d-lg-flex align-items-center border-bottom position-fixed top-0 w-100 bg-light" style={{ height: 56 }}>
          <i className="bi bi-mortarboard fs-5 me-2"></i>
          <div className="flex-grow-1">
            <div className="fw-semibold">Teacher Portal</div>
            <div className="text-muted small">Feedback & Analytics</div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setSidebarCollapsed(v => {
                const next = !v;
                try { localStorage.setItem('teacherSidebarCollapsed', next ? 'true' : 'false'); } catch {}
                return next;
              });
            }}
            title={sidebarCollapsed ? 'Expand (Ctrl+B)' : 'Collapse (Ctrl+B)'}
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        <div className={`flex-grow-1 ${sidebarOpen ? '' : 'd-none d-lg-block'} overflow-auto`}>
          <ul className="nav nav-pills flex-column mt-3">
            {navigationItems.map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <i className={`bi ${item.iconClass} me-2`}></i>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
            <li className="nav-item mt-2">
              <button className="nav-link d-flex align-items-center" onClick={handleLogout} type="button">
                <i className="bi bi-box-arrow-right me-2"></i>
                {!sidebarCollapsed && <span>Logout</span>}
              </button>
            </li>
          </ul>
        </div>

        <div className="border-top px-3 py-3 text-muted small d-none d-lg-block">
          <i className="bi bi-person-circle me-2"></i>
          {!sidebarCollapsed && <span>Instructor Portal</span>}
        </div>
      </nav>

      {/* Main content wrapper: fixed offset, sticky topbar */}
      <main className="content-wrapper">
        <div className="content-topbar border-bottom mb-3">
          <div className="d-flex align-items-center justify-content-between py-2">
            <div className="fw-semibold">Teacher Portal</div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default TeacherLayout;