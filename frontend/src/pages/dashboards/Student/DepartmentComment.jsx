import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentComment() {
  const navigate = useNavigate();
  const [deptId, setDeptId] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [visibleTeachers, setVisibleTeachers] = useState([]);
  const [visibleCourses, setVisibleCourses] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    target_type: 'general',
    target_id: '',
    teacher_id: '',
    course_id: '',
    text: '',
  });
  const [myComments, setMyComments] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    const dId = typeof window !== 'undefined' ? Number(localStorage.getItem('department_id')) : null;
    setDeptId(dId || null);
    loadLists(dId);
  }, []);

  const loadLists = async (departmentId) => {
    setLoadingLists(true);
    setError(null);
    try {
      const teacherPromise = api.get('/teachers', { params: { department_id: departmentId } });
      const coursesPromise = api.get('/courses');
      const [tRes, cRes] = await Promise.all([teacherPromise, coursesPromise]);
      const tList = Array.isArray(tRes.data) ? tRes.data : [];
      const cAll = (cRes.data?.data || []);
      const cList = cAll.filter(c => Number(c.department_id) === Number(departmentId));
      setTeachers(tList);
      setCourses(cList);

      const yearLevel = typeof window !== 'undefined' ? String(localStorage.getItem('year_level') || '') : '';
      const semesterKey = typeof window !== 'undefined' ? String(localStorage.getItem('semester') || '') : '';
      const semLabel = semesterKey === '2' ? 'Semester II' : 'Semester I';

      const matchesCoursePeriod = (course) => {
        const courseYear = String(course.year_level || '');
        const courseSem = String(course.semester || '');
        // match by course fields or by any teacher pivot on this course
        const baseMatch = (courseYear === yearLevel) && (courseSem === semLabel);
        if (baseMatch) return true;
        if (Array.isArray(course.teachers)) {
          return course.teachers.some(t => {
            const pvYear = String(t.pivot?.year_level || '');
            const pvSem = String(t.pivot?.semester || '');
            return (pvYear === yearLevel) && (pvSem === semLabel);
          });
        }
        return false;
      };

      const filteredCourses = cList.filter(matchesCoursePeriod);
      const teacherIdSet = new Set();
      filteredCourses.forEach(c => {
        (c.teachers || []).forEach(t => {
          teacherIdSet.add(Number(t.id));
        });
      });
      const filteredTeachers = tList.filter(t => teacherIdSet.has(Number(t.id)));

      setVisibleCourses(filteredCourses);
      setVisibleTeachers(filteredTeachers);
    } catch (e) {
      setError('Failed to load teachers/courses. You can still submit a general comment.');
    } finally {
      setLoadingLists(false);
    }
  };

  const loadMyComments = async (departmentId) => {
    setLoadingMy(true);
    try {
      const studentDbId = typeof window !== 'undefined' ? localStorage.getItem('student_db_id') : null;
      const res = await api.get(`/departments/${departmentId}/comments/mine`, { params: { student_id: studentDbId } });
      setMyComments(res.data?.comments || []);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMy(false);
    }
  };

  const semesterLabel = () => {
    const sem = typeof window !== 'undefined' ? localStorage.getItem('semester') : null;
    return sem === '2' ? 'Semester II' : 'Semester I';
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'target_type') {
      setForm(prev => ({ ...prev, target_id: '', teacher_id: '', course_id: '' }));
    }
    // Keep target_id aligned with the selected primary target
    if (field === 'teacher_id' && form.target_type === 'teacher') {
      setForm(prev => ({ ...prev, target_id: value }));
    }
    if (field === 'target_id' && form.target_type === 'course') {
      // already correct; ensure teacher_id cleared
      setForm(prev => ({ ...prev, teacher_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deptId) {
      setError('Missing department. Please log in again.');
      return;
    }
    if (!form.text.trim()) {
      setError('Please enter your comment.');
      return;
    }
    if ((form.target_type === 'teacher' || form.target_type === 'course') && !form.target_id) {
      setError('Please select a target for your comment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const yearLevel = typeof window !== 'undefined' ? localStorage.getItem('year_level') : null;
      const studentDbId = typeof window !== 'undefined' ? localStorage.getItem('student_db_id') : null;
      const payload = {
        anonymous: true,
        student_id: studentDbId || null,
        target_type: form.target_type,
        target_id: form.target_id || null,
        teacher_id: form.target_type === 'teacher' ? (form.teacher_id || form.target_id || null) : null,
        course_id: form.course_id || (form.target_type === 'course' ? (form.target_id || null) : null),
        semester: semesterLabel(),
        year_level: yearLevel || null,
        text: form.text.trim(),
      };
      const res = await api.post(`/departments/${deptId}/comments`, payload);
      if (res.status === 201) {
        setSuccess('Your comment has been submitted to the department.');
        setForm({ target_type: 'general', target_id: '', teacher_id: '', course_id: '', text: '' });
        await loadMyComments(deptId);
      } else {
        setError('Submission failed. Please try again.');
      }
    } catch (e) {
      const message = e?.response?.data?.message || 'Submission failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (deptId) loadMyComments(deptId);
  }, [deptId]);

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text || '');
  };

  const saveEdit = async () => {
    if (!editingId || !deptId) return;
    try {
      const studentDbId = typeof window !== 'undefined' ? localStorage.getItem('student_db_id') : null;
      await api.put(`/departments/${deptId}/comments/${editingId}`, { student_id: studentDbId, text: editText });
      setEditingId(null);
      setEditText('');
      await loadMyComments(deptId);
    } catch (e) {
      alert('Failed to save changes');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const deleteComment = async (id) => {
    if (!deptId) return;
    if (!window.confirm('Delete this comment?')) return;
    try {
      const studentDbId = typeof window !== 'undefined' ? localStorage.getItem('student_db_id') : null;
      await api.delete(`/departments/${deptId}/comments/${id}`, { data: { student_id: studentDbId } });
      await loadMyComments(deptId);
    } catch (e) {
      alert('Failed to delete comment');
    }
  };

  const targetOptions = () => {
    if (form.target_type === 'teacher') {
      const teacherCourses = visibleCourses.filter(c =>
        (c.teachers || []).some(t => String(t.id) === String(form.teacher_id))
      );
      return (
        <>
          <select
            className="dept-select"
            value={form.teacher_id}
            onChange={(e) => handleChange('teacher_id', e.target.value)}
          >
            <option value="">Select instructor</option>
            {visibleTeachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            className="dept-select"
            value={form.course_id}
            onChange={(e) => handleChange('course_id', e.target.value)}
            style={{ marginTop: 8 }}
          >
            <option value="">Select course (optional)</option>
            {(form.teacher_id ? teacherCourses : visibleCourses).map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
            ))}
          </select>
        </>
      );
    }
    if (form.target_type === 'course') {
      return (
        <select
          className="dept-select"
          value={form.target_id}
          onChange={(e) => handleChange('target_id', e.target.value)}
        >
          <option value="">Select course</option>
          {visibleCourses.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
          ))}
        </select>
      );
    }
    return null;
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-section">
        <h2>Submit Department Comment</h2>
        <p style={{ marginBottom: 16 }}>
          Your comment is sent anonymously to the department. Teachers cannot view these comments.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Comment Type</label>
            <div className="btn-group" role="group" aria-label="Target type">
              <button
                type="button"
                className={`dept-btn ${form.target_type === 'general' ? 'dept-btn-primary' : 'dept-btn-ghost'}`}
                onClick={() => handleChange('target_type', 'general')}
              >
                General
              </button>
              <button
                type="button"
                className={`dept-btn ${form.target_type === 'teacher' ? 'dept-btn-primary' : 'dept-btn-ghost'}`}
                onClick={() => handleChange('target_type', 'teacher')}
              >
                About Instructor
              </button>
              <button
                type="button"
                className={`dept-btn ${form.target_type === 'course' ? 'dept-btn-primary' : 'dept-btn-ghost'}`}
                onClick={() => handleChange('target_type', 'course')}
              >
                About Course
              </button>
            </div>
          </div>

          {(form.target_type === 'teacher' || form.target_type === 'course') && (
            <div className="form-field">
              <label>{form.target_type === 'teacher' ? 'Select Instructor' : 'Select Course'}</label>
              {loadingLists ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading options...</p>
                </div>
              ) : targetOptions()}
            </div>
          )}

          <div className="form-field">
            <label>Your Comment</label>
            <textarea
              className="dept-textarea"
              rows={6}
              value={form.text}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder="Write your feedback to the department..."
            />
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="dept-btn dept-btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button type="button" className="dept-btn dept-btn-ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>

          {error && (
            <div className="error-banner" role="alert" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
          {success && (
            <div className="success-banner" role="status" style={{ marginTop: 12 }}>
              {success}
            </div>
          )}
        </form>
      </div>
      <div className="dashboard-section">
        <h2>My Comments</h2>
        {loadingMy ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your comments...</p>
          </div>
        ) : myComments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No Comments Yet</h3>
            <p>Submit your first comment to see it here.</p>
          </div>
        ) : (
          <div className="comments-list">
            {myComments.map(c => (
              <div key={c.id} className="comment-item" style={{ border: '1px solid var(--border-soft)', borderRadius: 8, padding: 12, marginBottom: 12, background: 'var(--panel)', color: 'var(--text)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span className="badge" style={{ background: 'var(--hover-bg)', color: 'var(--text)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '2px 8px' }}>
                      {c.target_type === 'general' ? 'General' : c.target_type === 'teacher' ? `Instructor: ${c.teacher?.name || 'Unknown'}` : `Course: ${c.course?.title || 'Unknown'}`}
                    </span>
                    <span className="badge" style={{ marginLeft: 8, background: 'var(--hover-bg)', color: 'var(--text)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '2px 8px' }}>
                      {c.semester || 'Semester Unknown'}
                    </span>
                    <span className="badge" style={{ marginLeft: 8, background: 'var(--hover-bg)', color: 'var(--text)', border: '1px solid var(--border-soft)', borderRadius: 8, padding: '2px 8px' }}>
                      {c.year_level ? `Year ${c.year_level}` : 'Year Unknown'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {editingId !== c.id ? (
                      <>
                        <button className="dept-btn dept-btn-primary" type="button" onClick={() => startEdit(c)}>Edit</button>
                        <button className="dept-btn dept-btn-danger" type="button" onClick={() => deleteComment(c.id)}>Delete</button>
                      </>
                    ) : (
                      <>
                        <button className="dept-btn dept-btn-primary" type="button" onClick={saveEdit}>Save</button>
                        <button className="dept-btn dept-btn-ghost" type="button" onClick={cancelEdit}>Cancel</button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {editingId === c.id ? (
                    <textarea className="dept-textarea" rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} />
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{c.text}</p>
                  )}
                </div>
                {c.department_reply && (
                  <div style={{ marginTop: 12, borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
                    <strong style={{ color: 'var(--text)' }}>Department Reply:</strong>
                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{c.department_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentComment;
