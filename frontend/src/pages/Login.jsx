import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Theme management
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSmartLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const input = String(credential || '').trim();
    try {
      await axios.get('http://127.0.0.1:8000/sanctum/csrf-cookie', { withCredentials: true });

      if (isEmail(input)) {
        // Staff/admin/teacher login via email
        const res = await api.post('/auth/login', { email: input, password }, { withCredentials: true });

        const role = res?.data?.user?.role;
        const deptId = res?.data?.user?.department_id;
        const teacherId = res?.data?.user?.teacher_id;

        if (role && typeof window !== 'undefined') {
          localStorage.setItem('auth_role', role);
          if (deptId) localStorage.setItem('department_id', String(deptId));
          if (teacherId) localStorage.setItem('teacher_id', String(teacherId));
        }

        if (role === 'superadmin' || role === 'college_admin') navigate('/admin');
        else if (role === 'department_admin' && deptId) navigate(`/department/${deptId}`);
        else if (role === 'teacher' && teacherId) navigate('/teacher');
        else if (role === 'student') navigate('/dashboard');
        else navigate('/');
      } else {
        // Student login via student ID
        const res = await api.post('/auth/login/student-password', {
          student_id: input,
          password
        }, { withCredentials: true });

        const role = res?.data?.user?.role || 'student';
        const deptId = res?.data?.user?.department_id;
        const studentDeptId = res?.data?.student?.department_id;
        const studentDbId = res?.data?.student?.id;
        const studentInfo = res?.data?.student;

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_role', role);
          localStorage.setItem('student_id', String(input));
          const effectiveDeptId = deptId || studentDeptId;
          if (effectiveDeptId) localStorage.setItem('department_id', String(effectiveDeptId));
          if (studentDbId) localStorage.setItem('student_db_id', String(studentDbId));
          if (studentInfo?.year_level) localStorage.setItem('year_level', String(studentInfo.year_level));
          if (studentInfo?.semester) localStorage.setItem('semester', String(studentInfo.semester));
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Theme Toggle */}
      <button 
        className="theme-toggle login-theme-toggle" 
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="theme-icon">
          {theme === 'dark' ? '☀️' : '🌙'}
        </span>
      </button>

      {/* Background Elements */}
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">🎓</div>
            <div className="logo-text">
              <h1>Welcome Back</h1>
              <p>Log in to your evaluation portal</p>
            </div>
          </div>
        </div>

        {/* Smart Single Input – No role tabs */}

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Unified Login Form */}
        <form className="login-form" onSubmit={handleSmartLogin}>
          <div className="form-group">
            <label htmlFor="credential" className="form-label">
              Email or Student ID
            </label>
            <div className="input-wrapper">
              <input
                id="credential"
                type="text"
                className="form-input"
                placeholder="Enter email or student ID"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                <span>Log In</span>
                <span className="button-arrow">→</span>
              </>
            )}
          </button>

          <div className="login-help">
            <p className="help-subtext">Contact your department if you need assistance</p>
          </div>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <p className="footer-text">
            Informatics College Evaluation System
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;