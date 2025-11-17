import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from './services/api';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/CollegeAdminDashboard';

function App() {
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersLight = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = stored || (prefersLight ? 'light' : 'dark');
    setTheme(initial);
  }, []);

  // Apply theme and persist
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_role');

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Proceed even if API call fails
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_role');
      }
      navigate('/login');
    }
  };

  return (
    <div>
      <header className="navbar">
        <div className="container nav-inner">
          <div className="brand">
            <span className="brand-badge" />
            <span>Informatics College • Feedback & Evaluation</span>
          </div>
          <nav className="nav-links">
            <Link className="link" to="/">Home</Link>
            {isLoggedIn ? (
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            ) : (
              <Link className="btn btn-ghost" to="/login">Login</Link>
            )}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? (
                // Sun icon
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4a1 1 0 011-1h0a1 1 0 010 2h0a1 1 0 01-1-1zm0 16a1 1 0 011 1h0a1 1 0 010-2h0a1 1 0 01-1 1zm8-8a1 1 0 011-1h0a1 1 0 010 2h0a1 1 0 01-1-1zM4 12a1 1 0 011 1h0a1 1 0 010-2h0a1 1 0 01-1 1zm12.95-5.657a1 1 0 011.414 0h0a1 1 0 01-1.414 1.414h0a1 1 0 010-1.414zM6.636 17.364a1 1 0 011.414 0h0a1 1 0 01-1.414 1.414h0a1 1 0 010-1.414zM17.364 17.364a1 1 0 010 1.414h0a1 1 0 11-1.414-1.414h0a1 1 0 011.414 0zM7.05 6.343a1 1 0 010 1.414h0A1 1 0 115.636 6.343h0A1 1 0 017.05 6.343zM12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
              ) : (
                // Moon icon
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3c.26 0 .5.15.62.38a1 1 0 01-.17 1.1A7 7 0 1019.52 13a1 1 0 011.1-.17c.23.12.38.36.38.62z"/></svg>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route
            path="/"
            element={
              <div className="hero">
                <h1>Student Feedback & Teacher Evaluation System</h1>
                <p>
                  A secure, role‑based platform for collecting student feedback, managing
                  department courses and evaluations, and providing insightful reports for teachers
                  and administrators.
                </p>
                <div className="cta">
                  <Link className="btn btn-primary" to="/login">Get Started</Link>
                  <a className="btn btn-ghost" href="#features">Learn More</a>
                </div>
                <section id="features" className="grid">
                  <div className="card">
                    <h3>Students</h3>
                    <p>Evaluate assigned courses with privacy by default; optionally reveal identity.</p>
                  </div>
                  <div className="card">
                    <h3>Department Admin</h3>
                    <p>Manage semesters, post courses, assign teachers, and open evaluations.</p>
                  </div>
                  <div className="card">
                    <h3>Teachers</h3>
                    <p>View aggregated feedback and peer evaluations to improve teaching quality.</p>
                  </div>
                </section>
              </div>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/superadmin" element={<AdminDashboard />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Informatics College. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;