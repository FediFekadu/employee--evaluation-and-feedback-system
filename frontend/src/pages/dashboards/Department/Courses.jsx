import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentCourses() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courseForm, setCourseForm] = useState({ title: '', code: '', description: '', teacher_ids: [] });
  const [courseSubmitting, setCourseSubmitting] = useState(false);

  const [assignForm, setAssignForm] = useState({ course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api
      .get(`/departments/${deptId}`)
      .then((res) => { if (mounted) setDepartment(res.data); })
      .catch(() => { if (mounted) setError('Failed to load department'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [deptId]);

  const teacherOptions = department?.teachers || [];
  const courseOptions = department?.courses || [];

  const submitCourse = async () => {
    if (!courseForm.title || !courseForm.code) {
      alert('Course title and code are required');
      return;
    }
    setCourseSubmitting(true);
    try {
      const res = await api.post('/courses', {
        department_id: deptId,
        title: courseForm.title,
        code: courseForm.code,
        description: courseForm.description || undefined,
        teacher_ids: courseForm.teacher_ids.map((t) => Number(t)),
      });
      setDepartment((prev) => prev ? { ...prev, courses: [res.data, ...(prev.courses || [])] } : prev);
      setCourseForm({ title: '', code: '', description: '', teacher_ids: [] });
      alert('Course created and instructors assigned');
    } catch (e) {
      alert('Failed to create course');
    } finally {
      setCourseSubmitting(false);
    }
  };

  const assignInstructor = async () => {
    if (!assignForm.course_id || !assignForm.teacher_id) {
      alert('Select course and instructor');
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await api.post(`/courses/${assignForm.course_id}/assign-teacher`, {
        teacher_id: Number(assignForm.teacher_id),
        year_level: Number(assignForm.year_level),
        semester: assignForm.semester,
      });
      const updatedCourse = res.data?.course;
      setDepartment((prev) => {
        if (!prev) return prev;
        const courses = (prev.courses || []).map((c) => c.id === updatedCourse.id ? updatedCourse : c);
        return { ...prev, courses };
      });
      setAssignForm({ course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });
      alert('Instructor assigned');
    } catch (e) {
      alert('Failed to assign instructor');
    } finally {
      setAssignSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;

  return (
    <div className="dept-card">
      <h3>Post Course & Assign Instructor</h3>
      <p style={{ color: 'var(--muted)' }}>Create a course in this department and attach instructors.</p>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <input className="dept-input" placeholder="Course title" value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} />
        <input className="dept-input" placeholder="Course code" value={courseForm.code} onChange={(e) => setCourseForm((f) => ({ ...f, code: e.target.value }))} />
        <textarea className="dept-textarea" placeholder="Description (optional)" value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
        <label>
          Instructors
          <select className="dept-select" multiple size={Math.min(6, Math.max(3, teacherOptions.length))} value={courseForm.teacher_ids} onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
            setCourseForm((f) => ({ ...f, teacher_ids: opts }));
          }}>
            {teacherOptions.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.name} ({t.email})</option>
            ))}
          </select>
        </label>
        <button className="dept-btn dept-btn-primary" onClick={submitCourse} disabled={courseSubmitting}>
          {courseSubmitting ? 'Creating…' : 'Create Course'}
        </button>
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Assign Instructor to Course (Year & Semester)</h4>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <label>
            Course
            <select className="dept-select" value={assignForm.course_id} onChange={(e) => setAssignForm((f) => ({ ...f, course_id: e.target.value }))}>
              <option value="">Select course</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.title} ({c.code})</option>
              ))}
            </select>
          </label>
          <label>
            Instructor
            <select className="dept-select" value={assignForm.teacher_id} onChange={(e) => setAssignForm((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">Select instructor</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              Year
              <select className="dept-select" value={assignForm.year_level} onChange={(e) => setAssignForm((f) => ({ ...f, year_level: e.target.value }))}>
                {[1,2,3,4,5].map((y) => (
                  <option key={y} value={String(y)}>Year {y}</option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Semester
              <select className="dept-select" value={assignForm.semester} onChange={(e) => setAssignForm((f) => ({ ...f, semester: e.target.value }))}>
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
              </select>
            </label>
          </div>
          <button className="dept-btn dept-btn-primary" disabled={assignSubmitting} onClick={assignInstructor}>
            {assignSubmitting ? 'Assigning…' : 'Assign Instructor'}
          </button>
        </div>
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Department Courses</h4>
        {courseOptions.length === 0 && <p style={{ color: 'var(--muted)' }}>No courses yet.</p>}
        {courseOptions.length > 0 && (
          <ul>
            {courseOptions.map((c) => (
              <li key={c.id}>
                {c.title} ({c.code})
                {(c.teachers || []).length > 0 && (
                  <div style={{ marginTop: 4, color: 'var(--muted)' }}>
                    Assigned:
                    <ul>
                      {(c.teachers || []).map((t) => (
                        <li key={`${c.id}-${t.id}`}>{t.name} — Year {t?.pivot?.year_level ?? '-'}, {t?.pivot?.semester ?? '-'}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DepartmentCourses;