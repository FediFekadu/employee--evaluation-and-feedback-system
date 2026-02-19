import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../../styles/sb-admin-unified.css';

function TeacherLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('teacherSidebarCollapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => {
          const next = !prev;
          try { localStorage.setItem('teacherSidebarCollapsed', next ? 'true' : 'false'); } catch {}
          return next;
        });
      }
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
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

  return (
    <div className={`sb-layout ${sidebarCollapsed ? 'sb-collapsed' : ''} ${sidebarOpen ? 'overlay-open' : ''}`}>
      <aside className="sb-sidebar" aria-label="Teacher navigation">
        <div className="sb-side-header">
          <div className="sb-brand">
            <div className="sb-brand-icon"><i className="bi bi-person-circle"></i></div>
            <span className="sb-brand-text">Instructor Portal</span>
          </div>
          <button
            className="sb-collapse-btn"
            onClick={() => {
              setSidebarCollapsed(v => {
                const next = !v;
                try { localStorage.setItem('teacherSidebarCollapsed', next ? 'true' : 'false'); } catch {}
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
            <li className="nav-item">
              <NavLink to="/teacher" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <i className="bi bi-house"></i>
                <span className="nav-label">Home</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/teacher/courses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <i className="bi bi-journal-bookmark"></i>
                <span className="nav-label">My Courses</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/teacher/feedback" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <i className="bi bi-graph-up"></i>
                <span className="nav-label">Feedback</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/teacher/peer-evaluations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <i className="bi bi-people"></i>
                <span className="nav-label">Peer Evaluations</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/teacher/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <i className="bi bi-person-circle"></i>
                <span className="nav-label">Profile</span>
              </NavLink>
            </li>
            <li className="nav-item mt-2">
              <button className="nav-link" onClick={handleLogout} type="button">
                <i className="bi bi-box-arrow-right"></i>
                <span className="nav-label">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="sb-content" role="main">
        <div className="sb-page">
          <Outlet />
        </div>
      </div>

      <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />
    </div>
  );
}

export default TeacherLayout;