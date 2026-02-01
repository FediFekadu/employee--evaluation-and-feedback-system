import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleSave = async () => {
    setMessage('');
    // Only handle photo upload for now
    if (!photoFile) {
      setMessage('Select a profile photo to upload.');
      return;
    }
    // Client-side type and size validation for better UX
    const allowed = /^(image\/(jpeg|png|webp|gif))$/i;
    if (!allowed.test(photoFile.type)) {
      setMessage('Please select a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    const maxBytes = 8 * 1024 * 1024; // 8 MB
    if (photoFile.size > maxBytes) {
      setMessage('The photo may not be greater than 8 MB.');
      return;
    }
    try {
      setSaving(true);
      const tid = typeof window !== 'undefined' ? localStorage.getItem('teacher_id') : null;
      const fd = new FormData();
      fd.append('photo', photoFile);
      const res = await api.post(`/teachers/${tid}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTeacher(res.data);
      setPhotoFile(null);
      setMessage('✅ Profile photo updated successfully');
    } catch (e) {
      const backendMsg = e?.response?.data?.errors?.photo?.[0]
        || e?.response?.data?.message
        || e?.message;
      setMessage(`❌ Failed to update profile photo${backendMsg ? `: ${backendMsg}` : ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h3>Profile & Settings</h3>
      <p style={{ color: 'var(--muted)' }}>Manage your personal information and preferences.</p>
      {loading && <LoadingSpinner size="small" showMessage={false} showElapsed={false} />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && teacher && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <label>Name<input className="btn btn-ghost" defaultValue={teacher.name} /></label>
          <label>Email<input className="btn btn-ghost" defaultValue={teacher.email} /></label>
          <label>Title<input className="btn btn-ghost" defaultValue={teacher.title || ''} /></label>
          <label>Department<input className="btn btn-ghost" defaultValue={teacher?.department?.name || ''} disabled /></label>
          <label>New Password<input className="btn btn-ghost" type="password" placeholder="Change password" /></label>
          <label>Notifications<select className="btn btn-ghost"><option>Enabled</option><option>Disabled</option></select></label>
          <label>Profile Picture
            <input
              className="btn btn-ghost"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
          </label>
          {teacher.photo_url && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={teacher.photo_url} alt={teacher.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ color: 'var(--muted)' }}>Current profile photo</span>
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save Changes'}</button>
            {message && <p style={{ marginTop: 8 }}>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherProfile;