import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import '../../styles/sb-admin.css';
import '../../styles/sb-admin-unified.css';

function DepartmentLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const loadDepartment = async () => {
      try {
        const res = await api.get(`/departments/${id}`);
        setDepartment(res.data);
      } catch (e) {
        console.error('Failed to load department');
      }
    };
    if (id) loadDepartment();
    // Load collapsed state from localStorage
    try {
      const saved = localStorage.getItem('departmentSidebarCollapsed');
      if (saved !== null) setSidebarCollapsed(saved === 'true');
    } catch {}
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => {
          const next = !prev;
          try { localStorage.setItem('departmentSidebarCollapsed', next ? 'true' : 'false'); } catch {}
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
    try { await api.post('/auth/logout'); } catch {}
    try {
      localStorage.removeItem('auth_role');
      localStorage.removeItem('department_id');
      localStorage.removeItem('user_id');
      localStorage.removeItem('student_id');
      localStorage.removeItem('teacher_id');
    } catch {}
    navigate('/login');
  };

  const navItems = [
    { path: '', label: 'Overview', iconClass: 'bi-speedometer' },
    { path: '/courses-instructors', label: 'Courses & Instructors', iconClass: 'bi-journal-bookmark' },

    { path: '/students', label: 'Students', iconClass: 'bi-mortarboard' },
    { path: '/evaluations', label: 'Open Evaluations', iconClass: 'bi-pencil-square' },
    { path: '/manage-evaluations', label: 'Manage Evaluations', iconClass: 'bi-gear' },
    { path: '/hod-evaluations', label: 'HOD Evaluations', iconClass: 'bi-person-workspace' },
    { path: '/results', label: 'Results', iconClass: 'bi-bar-chart' },
    { path: '/reports', label: 'Reports', iconClass: 'bi-folder2-open' }
  ];

  return (
    <div className={`sb-layout ${sidebarCollapsed ? 'sb-collapsed' : ''} ${overlayOpen ? 'overlay-open' : ''}`}>
      {/* Sidebar inside the unified wrapper */}
      <aside className="sb-sidebar" aria-label="Department navigation">
        <div className="sb-side-header">
          <div className="sb-brand">
            <div className="sb-brand-icon"><i className="bi bi-building"></i></div>
            <div className="sb-brand-text">{department?.name || 'Department'}</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="sb-collapse-btn"
              onClick={() => {
                setSidebarCollapsed(v => {
                  const next = !v;
                  try { localStorage.setItem('departmentSidebarCollapsed', next ? 'true' : 'false'); } catch {}
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
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={`/department/${id}${item.path}`}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setOverlayOpen(false)}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <i className={`bi ${item.iconClass}`}></i>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li className="nav-item mt-2">
              <button className="nav-link" onClick={handleLogout} type="button" aria-label="Logout">
                <i className="bi bi-box-arrow-right"></i>
                <span className="nav-label">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Content wrapper next to sidebar */}
      <div className="sb-content" role="main">
        <div className="sb-page">
          <Outlet />
        </div>
      </div>

      {/* Mobile overlay */}
      <div className="sb-overlay" onClick={() => setOverlayOpen(false)} />
    </div>
  );
}

export default DepartmentLayout;