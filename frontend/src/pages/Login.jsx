import React, { useState } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [activeTab, setActiveTab] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.get('http://127.0.0.1:8000/sanctum/csrf-cookie', { withCredentials: true });
      const res = await api.post('/auth/login/student-password', { 
        student_id: studentId, 
        password: studentPassword 
      }, { withCredentials: true });
      
      const role = res?.data?.user?.role || 'student';
      const deptId = res?.data?.user?.department_id;
      const studentDeptId = res?.data?.student?.department_id;
      const studentDbId = res?.data?.student?.id; // Fixed: get the student's database ID
      const studentInfo = res?.data?.student;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_role', role);
        if (studentId) localStorage.setItem('student_id', String(studentId));
        // Ensure department_id is set. Fallback to student's department if user.department_id is missing.
        const effectiveDeptId = deptId || studentDeptId;
        if (effectiveDeptId) localStorage.setItem('department_id', String(effectiveDeptId));
        if (studentDbId) localStorage.setItem('student_db_id', String(studentDbId));
        if (studentInfo?.year_level) localStorage.setItem('year_level', String(studentInfo.year_level));
        if (studentInfo?.semester) localStorage.setItem('semester', String(studentInfo.semester));
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your Student ID and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.get('http://127.0.0.1:8000/sanctum/csrf-cookie', { withCredentials: true });
      const res = await api.post('/auth/login', { email, password }, { withCredentials: true });
      
      const role = res?.data?.user?.role;
      const deptId = res?.data?.user?.department_id;
      const teacherId = res?.data?.user?.teacher_id;
      
      if (role) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_role', role);
          if (deptId) localStorage.setItem('department_id', String(deptId));
          if (teacherId) localStorage.setItem('teacher_id', String(teacherId));
        }
      }
      
      if (role === 'superadmin' || role === 'college_admin') navigate('/admin');
      else if (role === 'department_admin' && deptId) navigate(`/department/${deptId}`);
      else if (role === 'teacher' && teacherId) navigate('/teacher');
      else if (role === 'student') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
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

        {/* Tab Navigation */}
        <div className="login-tabs">
          <button
            className={`tab-button ${activeTab === 'student' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <span className="tab-icon">👨‍🎓</span>
            <span>Student</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'admin' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <span className="tab-icon">👨‍💼</span>
            <span>Staff</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Student Login Form */}
        {activeTab === 'student' && (
          <form className="login-form" onSubmit={handleStudentLogin}>
            <div className="form-group">
              <label htmlFor="studentId" className="form-label">
                Student ID
              </label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input
                  id="studentId"
                  type="text"
                  className="form-input"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>
            </div>

          <div className="form-group">
            <label htmlFor="studentPassword" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="studentPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
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
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In as Student</span>
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

            <div className="login-help">
          
              <p className="help-subtext">
                Contact your department if you need assistance
              </p>
            </div>
          </form>
        )}

        {/* Admin Login Form */}
        {activeTab === 'admin' && (
          <form className="login-form" onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adminPassword" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  id="adminPassword"
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
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In as Staff</span>
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

            {/* Removed demo accounts section for a cleaner, professional UI */}
          </form>
        )}

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