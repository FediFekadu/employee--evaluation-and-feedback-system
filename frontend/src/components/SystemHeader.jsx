import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/system-header.css';

function SystemHeader({ theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_role');
  const [logoReady, setLogoReady] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
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

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isLoggedIn) {
        setUnreadCount(0);
        setNotifications([]);
        return;
      }
      const role = localStorage.getItem('auth_role');
      let recipientType = null;
      let recipientId = null;
      if (role === 'student') {
        recipientType = 'student';
        recipientId = Number(localStorage.getItem('student_db_id'));
      } else if (role === 'teacher') {
        recipientType = 'teacher';
        recipientId = Number(localStorage.getItem('teacher_id'));
      } else if (role === 'department_admin') {
        recipientType = 'department';
        recipientId = Number(localStorage.getItem('department_id'));
      }
      if (!recipientType || !recipientId) return;
      try {
        const res = await api.get('/notifications', {
          params: {
            recipient_type: recipientType,
            recipient_id: recipientId,
            status: 'unread',
            limit: 5,
          },
        });
        const items = (res.data?.notifications || []).map(n => ({
          id: n.id,
          type: n.type,
          title: n.title || '',
          message: n.message || '',
          created_at: n.created_at,
          meta: n.meta || {},
        }));
        setNotifications(items);
        setUnreadCount(items.length);
      } catch (e) {
        setUnreadCount(0);
        setNotifications([]);
      }
    };
    loadNotifications();
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const handleKey = (e) => {
      if (notifOpen && e.key === 'Escape') {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [notifOpen]);

  const markRead = async (id) => {
    const role = localStorage.getItem('auth_role');
    let recipientType = null;
    let recipientId = null;
    if (role === 'student') {
      recipientType = 'student';
      recipientId = Number(localStorage.getItem('student_db_id'));
    } else if (role === 'teacher') {
      recipientType = 'teacher';
      recipientId = Number(localStorage.getItem('teacher_id'));
    } else if (role === 'department_admin') {
      recipientType = 'department';
      recipientId = Number(localStorage.getItem('department_id'));
    }
    if (!recipientType || !recipientId) return;
    try {
      await api.post(`/notifications/${id}/read`, { recipient_type: recipientType, recipient_id: recipientId });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const openNotification = async (n) => {
    const role = localStorage.getItem('auth_role');
    const deptId = Number(localStorage.getItem('department_id'));
    try {
      await markRead(n.id);
    } catch {}
    if (n.type === 'evaluation_opened') {
      if (role === 'student') {
        navigate('/dashboard/evaluations');
        return;
      }
      if (role === 'teacher') {
        navigate('/teacher/feedback');
        return;
      }
      if (role === 'department_admin' && deptId) {
        navigate(`/department/${deptId}/manage-evaluations`);
        return;
      }
    }
    if (n.type === 'reply') {
      if (role === 'student') {
        const commentId = n.meta?.comment_id;
        navigate(`/dashboard/department-comment${commentId ? `?comment_id=${commentId}` : ''}`);
        return;
      }
      if (role === 'department_admin' && deptId) {
        navigate(`/department/${deptId}/comments`);
        return;
      }
    }
    if (role === 'student') navigate('/dashboard');
    else if (role === 'teacher') navigate('/teacher');
    else if (role === 'department_admin' && deptId) navigate(`/department/${deptId}`);
  };

  return (
    <header className="system-header" role="banner" aria-label="Global header">
      <div className="system-header-inner">
        <Link to="/" className="system-brand" aria-label="Home">
          <span className="system-brand-icon" aria-hidden="true">
            {logoReady ? (
              <img
                src="/bhu-logo.jpg"
                alt="Institution logo"
                className="system-brand-logo"
                onLoad={() => setLogoReady(true)}
                onError={() => setLogoReady(false)}
              />
            ) : (
              <i className="bi bi-square" />
            )}
          </span>
          <span className="system-brand-text">Informatics College • Feedback & Evaluation</span>
        </Link>

        {!isLoggedIn && (
          <nav className="system-nav" aria-label="Primary">
            <Link to="/" className="system-link">Home</Link>
            <a href="#about" className="system-link">About</a>
            <a href="#features" className="system-link">Features</a>
            <a href="#contact" className="system-link">Contact</a>
          </nav>
        )}

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
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="system-icon-btn"
                onClick={() => setNotifOpen(v => !v)}
                aria-label="Notifications"
                title="Notifications"
              >
                <i className="bi bi-bell" />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: 8,
                      padding: '0 6px',
                      fontSize: 11,
                      lineHeight: '16px',
                      minWidth: 16,
                      textAlign: 'center'
                    }}
                    className="notification-badge"
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: 320,
                    background: 'var(--panel)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                    padding: 8,
                    color: 'var(--text)',
                  }}
                >
                  <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-soft)' }}>
                    <strong>Notifications</strong>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '12px 8px', color: 'var(--muted)' }}>No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          padding: '8px 8px',
                          borderBottom: '1px solid var(--border-soft)',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>📢</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{n.title || n.type}</div>
                          {n.message && <div style={{ fontSize: 13 }}>{n.message}</div>}
                          {n.meta?.evaluation_id && (
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              Evaluation #{n.meta.evaluation_id}
                            </div>
                          )}
                          {n.meta?.comment_id && (
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                              Comment #{n.meta.comment_id}
                            </div>
                          )}
                        </div>
                        <button
                          className="system-btn"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => markRead(n.id)}
                          aria-label="Mark as read"
                        >
                          Mark Read
                        </button>
                        <button
                          className="system-btn"
                          style={{ padding: '4px 8px', fontSize: 12, marginLeft: 6 }}
                          onClick={() => openNotification(n)}
                          aria-label="Open notification target"
                        >
                          Open
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {isLoggedIn && (
            <button className="system-btn" onClick={handleLogout} aria-label="Logout">
              Logout
            </button>
          )}
          {!isLoggedIn && (
            <Link className="system-btn system-btn-primary" to="/login" aria-label="Login">
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
