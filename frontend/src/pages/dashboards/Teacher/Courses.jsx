import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function TeacherCourses() {
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
        if (mounted) setError('Failed to load assigned courses.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const courses = teacher?.courses || [];

  return (
    <div className="card">
      <h3>Assigned Courses</h3>
      <p style={{ color: 'var(--muted)' }}>Your current course assignments.</p>
      {loading && <LoadingSpinner size="small" showMessage={false} showElapsed={false} />}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: 8 }}>
          {courses.length === 0 && (
            <p style={{ color: 'var(--muted)' }}>No course assignments yet.</p>
          )}
          {courses.map((c) => (
            <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.code}</strong> — {c.title}
                  <div style={{ color: 'var(--muted)' }}>{c?.department?.name ? `Department: ${c.department.name}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Year: {c.pivot?.year_level ?? 'N/A'}</div>
                  <div>Semester: {c.pivot?.semester ?? 'N/A'}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TeacherCourses;