import React, { useEffect, useState } from 'react';
import api from '../services/api';

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    api
      .get('/courses')
      .then((res) => {
        if (!mounted) return;
        setCourses(res.data?.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError('Failed to load courses');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2>Student Dashboard</h2>
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Change Password</h3>
        <div style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
          <input
            className="btn btn-ghost"
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            className="btn btn-ghost"
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            className="btn btn-primary"
            disabled={pwdLoading}
            onClick={async () => {
              if (!oldPassword || !newPassword) {
                alert('Enter current and new password');
                return;
              }
              setPwdLoading(true);
              setPwdMessage('');
              try {
                await api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
                setPwdMessage('Password changed successfully');
                setOldPassword('');
                setNewPassword('');
              } catch (e) {
                setPwdMessage('Failed to change password. Check current password.');
              } finally {
                setPwdLoading(false);
              }
            }}
          >
            {pwdLoading ? 'Saving…' : 'Update Password'}
          </button>
          {pwdMessage && <p style={{ color: 'var(--muted)' }}>{pwdMessage}</p>}
        </div>
      </div>
      {loading && <p>Loading courses...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul>
          {courses.map((c) => (
            <li key={c.id}>{c.title} ({c.code})</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StudentDashboard;