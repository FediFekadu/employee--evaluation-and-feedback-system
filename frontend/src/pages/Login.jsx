import React, { useState } from 'react';
import api from '../services/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Tabs, Tab, TextField, Button, Typography, Alert } from '@mui/material';

function Login() {
  const [tab, setTab] = useState(0);
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Ensure CSRF cookie for Sanctum SPA (cookie endpoint is not under /api)
      await axios.get('http://127.0.0.1:8000/sanctum/csrf-cookie', { withCredentials: true });
      const res = await api.post('/auth/login/student', { student_id: studentId, name });
      const role = res?.data?.user?.role || 'student';
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_role', role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Check ID and name.');
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
      const res = await api.post('/auth/login', { email, password });
      const role = res?.data?.user?.role;
      if (role) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_role', role);
        }
      }
      if (role === 'superadmin' || role === 'college_admin') navigate('/admin');
      else if (role === 'student') navigate('/dashboard');
      else navigate('/');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Sign in</Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="login tabs" sx={{ mb: 3 }}>
            <Tab label="Student" />
            <Tab label="Admin" />
          </Tabs>

          {tab === 0 && (
            <Box component="form" onSubmit={handleStudentLogin}>
              <TextField
                label="Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? 'Signing in…' : 'Login as Student'}
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box component="form" onSubmit={handleAdminLogin}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? 'Signing in…' : 'Login as Admin'}
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Default College Admin: admin@college.local / Admin@1234
              </Typography>
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;