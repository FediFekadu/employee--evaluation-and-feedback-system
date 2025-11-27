import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function TeacherFeedback() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);

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
        if (mounted) setError('Failed to load teacher and courses.');
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
      <h3>Course Feedback</h3>
      <p style={{ color: 'var(--muted)' }}>Select a course to view participation, scores, and comments.</p>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ marginTop: 8 }}>
          <label>
            Course
            <select
              className="btn btn-ghost"
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value) || null)}
            >
              <option value="">Choose…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
          </label>
          {!selectedCourseId && <p style={{ color: 'var(--muted)' }}>Pick a course to view feedback and participation.</p>}
          {selectedCourseId && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>Participation: N/A</div>
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>Avg Score: N/A</div>
                <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>Comments: N/A</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherFeedback;