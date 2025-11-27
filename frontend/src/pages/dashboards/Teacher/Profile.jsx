import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tid = typeof window !== 'undefined' ? localStorage.getItem('teacher_id') : null;
    if (!tid) {
      setError('No teacher account found. Please login as a teacher.');
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      try {
        const res = await api.get(`/teachers/${tid}`);
        if (mounted) setTeacher(res.data);
      } catch (e) {
        if (mounted) setError('Failed to load teacher profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card">
      <h3>Profile & Settings</h3>
      <p style={{ color: 'var(--muted)' }}>Manage your personal information and preferences.</p>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && teacher && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <label>Name<input className="btn btn-ghost" defaultValue={teacher.name} /></label>
          <label>Email<input className="btn btn-ghost" defaultValue={teacher.email} /></label>
          <label>Title<input className="btn btn-ghost" defaultValue={teacher.title || ''} /></label>
          <label>Department<input className="btn btn-ghost" defaultValue={teacher?.department?.name || ''} disabled /></label>
          <label>New Password<input className="btn btn-ghost" type="password" placeholder="Change password" /></label>
          <label>Notifications<select className="btn btn-ghost"><option>Enabled</option><option>Disabled</option></select></label>
          <label>Profile Picture<input className="btn btn-ghost" type="file" accept="image/*" /></label>
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" onClick={() => alert('Profile saved (placeholder).')}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherProfile;