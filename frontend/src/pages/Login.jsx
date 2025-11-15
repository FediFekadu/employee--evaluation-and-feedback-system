import React, { useState } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Ensure CSRF cookie for Sanctum SPA (cookie endpoint is not under /api)
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
      await api.post('/auth/login/student', { student_id: studentId, name });
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Check ID and name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <h3>Student Login</h3>
      <form onSubmit={handleStudentLogin}>
        <div>
          <label>Student ID</label>
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
        </div>
        <div>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login as Student'}</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <hr />
      <p>Admin/Teacher login via email/password will be added next.</p>
    </div>
  );
}

export default Login;