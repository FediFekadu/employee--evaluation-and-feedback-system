import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';

function TeacherHome() {
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
        if (mounted) setError('Failed to load teacher details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const courses = teacher?.courses || [];

  const metrics = useMemo(() => {
    const now = new Date();
    const currentYearLabel = now.getFullYear();
    const coursesThisSemester = courses.filter((c) => c?.pivot?.semester != null).length;
    return {
      coursesThisSemester,
      studentsEnrolled: 'N/A',
      latestEvaluationScore: 'N/A',
      currentYearLabel,
    };
  }, [courses]);

  return (
    <div className="card">
      <h3>Instructor Overview</h3>
      <p style={{ color: 'var(--muted)' }}>Summary of your courses and latest activity.</p>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && teacher && (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <strong>{teacher.name}{teacher.title ? ` — ${teacher.title}` : ''}</strong>
            <div style={{ color: 'var(--muted)' }}>{teacher.email} • {teacher?.department?.name || 'Unknown Department'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Courses this semester</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{metrics.coursesThisSemester}</div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Students enrolled</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{metrics.studentsEnrolled}</div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Latest evaluation score</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{metrics.latestEvaluationScore}</div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Academic year</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{metrics.currentYearLabel}</div>
            </div>
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Announcements</h4>
            <p style={{ color: 'var(--muted)' }}>No new announcements.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherHome;