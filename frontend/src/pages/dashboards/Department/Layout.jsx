import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentLayout() {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const navItems = [
    { path: '', label: 'Overview', icon: '📊' },
    { path: '/courses', label: 'Courses', icon: '📚' },
    { path: '/instructors', label: 'Instructors', icon: '👨‍🏫' },
    { path: '/students', label: 'Students', icon: '👨‍🎓' },
    { path: '/evaluations', label: 'Open Evaluations', icon: '📝' },
    { path: '/manage-evaluations', label: 'Manage Evaluations', icon: '⚙️' },
    { path: '/hod-evaluations', label: 'HOD Evaluations', icon: '👨‍' },
 
    { path: '/results', label: 'Results', icon: '📊' },
    { path: '/reports', label: 'Reports', icon: '🗂️' }
  ];

  return (
    <div className="department-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className={`mobile-menu-toggle ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>
        <h1 className="mobile-title">
          {department?.name || 'Department Dashboard'}
        </h1>
      </div>

      {/* Sidebar */}
      <aside className={`department-sidebar ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">🏛️</div>
            <div className="brand-text">
              <h3>{department?.name || 'Department'}</h3>
              <p>Management Dashboard</p>
            </div>
          </div>
          <button 
            className="sidebar-minimize"
            onClick={() => {
              setSidebarCollapsed(v => {
                const next = !v;
                try { localStorage.setItem('departmentSidebarCollapsed', next ? 'true' : 'false'); } catch {}
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
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav" role="navigation" aria-label="Department navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
              to={`/department/${id}${item.path}`}
              onClick={() => setSidebarOpen(false)}
              aria-label={`Navigate to ${item.label}`}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {department?.name?.charAt(0) || 'D'}
            </div>
            <div className="user-details">
              <p className="user-name">{department?.name || 'Department'}</p>
              <p className="user-role">Department Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="department-main" role="main">
        <Outlet />
      </main>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default DepartmentLayout;