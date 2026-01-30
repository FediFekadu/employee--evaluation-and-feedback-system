import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/system-header.css';

function SystemHeader({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_role');

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

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleToggleTheme = () => {
    if (typeof onToggleTheme === 'function') {
      onToggleTheme();
      return;
    }
    // Fallback: toggle directly if no handler provided
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
  };

  return (
    <header className="system-header" role="banner" aria-label="Global header">
      <div className="system-header-inner">
        <Link to="/" className="system-brand" aria-label="Home">
          <span className="system-brand-icon" aria-hidden="true">
            <i className="bi bi-square" />
          </span>
          <span className="system-brand-text">Informatics College • Feedback & Evaluation</span>
        </Link>

        <div className="system-actions">
          <button
            className="system-icon-btn"
            onClick={handleToggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`} />
          </button>
          {isLoggedIn && (
            <button className="system-btn" onClick={handleLogout} aria-label="Logout">
              Logout
            </button>
          )}
          {!isLoggedIn && (
            <Link className="system-btn" to="/login" aria-label="Login">
              Login
            </Link>
          )}
          <button className="system-icon-btn" onClick={handleRefresh} aria-label="Refresh">
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default SystemHeader;