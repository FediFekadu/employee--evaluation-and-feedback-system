import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentManageEvaluations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [evalFilter, setEvalFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ status: 'all' });
  const [evalSortKey, setEvalSortKey] = useState('opened_at');
  const [evalSortDir, setEvalSortDir] = useState('desc');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(5);
  const [form, setForm] = useState({
    course_id: '',
    teacher_id: '',
    academic_year: '',
    semester: '',
    year_level: '',
    opened_at: '',
    closed_at: '',
  });

  const loadEvaluations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/evaluations?department_id=${id}`);
      setEvaluations(res.data?.data || res.data || []);
      setLastUpdate(new Date());
    } catch (e) {
      setError('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvaluations(); }, [id]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [crs, tch] = await Promise.all([
          api.get('/courses'),
          api.get('/teachers'),
        ]);
        const courseList = (crs.data?.data || crs.data || []).filter(c => (c.department?.id || c.department_id) === Number(id));
        const teacherList = (tch.data?.data || tch.data || []).filter(t => (t.department_id ?? t.department?.id) === Number(id));
        setCourses(courseList);
        setTeachers(teacherList);
      } catch (e) {
        // Ignore meta load errors
      }
    };
    loadMeta();
  }, [id]);

  const resetForm = () => setForm({ course_id: '', teacher_id: '', academic_year: '', semester: '', year_level: '', opened_at: '', closed_at: '' });

  const startCreate = () => { resetForm(); setCreating(true); setMessage(''); setError(''); };
  const cancelCreate = () => { setCreating(false); };

  const submitCreate = async () => {
    setError('');
    setMessage('');
    try {
      const payload = { ...form };
      // Basic normalization
      payload.academic_year = String(payload.academic_year).trim();
      payload.semester = String(payload.semester).trim();
      payload.year_level = String(payload.year_level).trim();
      payload.opened_at = String(payload.opened_at).trim();
      payload.closed_at = payload.closed_at ? String(payload.closed_at).trim() : '';

      // Required fields
      if (!payload.course_id || !payload.teacher_id || !payload.academic_year || !payload.semester || !payload.year_level || !payload.opened_at) {
        setError('Please fill in all required fields');
        return;
      }

      // Academic year format: 2025/26 or 2025-2026
      const yearOk = /^(\d{4})([\/-])(\d{2}|\d{4})$/.test(payload.academic_year);
      if (!yearOk) {
        setError('Academic year should be like 2025/26 or 2025-2026');
        return;
      }

      // Semester must be 1 or 2
      if (!(payload.semester === '1' || payload.semester === '2')) {
        setError('Semester must be 1 or 2');
        return;
      }

      // Year level 1-6
      const yl = Number(payload.year_level);
      if (!Number.isInteger(yl) || yl < 1 || yl > 6) {
        setError('Year level must be an integer between 1 and 6');
        return;
      }
      payload.year_level = String(yl);

      // Date check: opened_at <= closed_at (if provided)
      if (payload.closed_at) {
        const opened = new Date(payload.opened_at);
        const closed = new Date(payload.closed_at);
        if (!isNaN(opened) && !isNaN(closed) && opened > closed) {
          setError('Closed date must be the same or after opened date');
          return;
        }
      }

      // Validate instructor assignment to selected course (client-side)
      const selectedCourse = courses.find(c => String(c.id) === String(payload.course_id));
      if (!selectedCourse) {
        setError('Selected course is not available in this department');
        return;
      }
      const selectedTeacher = teachers.find(t => String(t.id) === String(payload.teacher_id));
      if (!selectedTeacher) {
        setError('Selected instructor is not available in this department');
        return;
      }
      const sameDept = (selectedTeacher.department_id ?? selectedTeacher?.department?.id) === (selectedCourse.department?.id ?? selectedCourse.department_id);
      if (!sameDept) {
        setError('Instructor must belong to the same department as the course');
        return;
      }
      const isAssigned = (selectedCourse.teachers || []).some(t => String(t.id) === String(selectedTeacher.id));
      if (!isAssigned) {
        setError('Instructor is not assigned to the selected course. Assign the instructor from the Courses page first.');
        return;
      }

      const res = await api.post('/evaluations', payload);
      setMessage('Evaluation created');
      setCreating(false);
      await loadEvaluations();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create evaluation');
    }
  };

  const deleteEvaluation = async (evaluationId) => {
    if (!window.confirm('Delete this evaluation? This will remove related feedbacks.')) return;
    try {
      await api.delete(`/evaluations/${evaluationId}`);
      setMessage('Evaluation deleted');
      await loadEvaluations();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete evaluation');
    }
  };

  const editFormQuestions = (evaluationId) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('deptSelectedEvalId', String(evaluationId));
      }
    } catch {}
    navigate(`/department/${id}/evaluations`);
  };

  const columns = useMemo(() => ([
    { key: 'id', label: 'ID' },
    { key: 'course', label: 'Course' },
    { key: 'teacher', label: 'Teacher' },
    { key: 'year_level', label: 'Year' },
    { key: 'semester', label: 'Semester' },
    { key: 'opened_at', label: 'Opened' },
    { key: 'closed_at', label: 'Closed' },
    { key: 'actions', label: 'Actions' },
  ]), []);

  const filteredAndSortedEvaluations = useMemo(() => {
    let list = [...(evaluations || [])];

    // Text filter across course and teacher
    const term = evalFilter.trim().toLowerCase();
    if (term) {
      list = list.filter(ev =>
        (ev.course?.title || ev.course?.name || '').toLowerCase().includes(term) ||
        (ev.teacher?.name || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (advancedFilters.status === 'active') {
      list = list.filter(ev => !ev.closed_at);
    } else if (advancedFilters.status === 'closed') {
      list = list.filter(ev => !!ev.closed_at);
    }

    // Sorting
    list.sort((a, b) => {
      const dir = evalSortDir === 'asc' ? 1 : -1;
      const getVal = (ev) => {
        switch (evalSortKey) {
          case 'opened_at': return ev.opened_at || '';
          case 'closed_at': return ev.closed_at || '';
          case 'course': return ev.course?.title || ev.course?.name || '';
          case 'teacher': return ev.teacher?.name || '';
          default: return ev.opened_at || '';
        }
      };
      const av = getVal(a);
      const bv = getVal(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return list;
  }, [evaluations, evalFilter, advancedFilters, evalSortKey, evalSortDir]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Manage Evaluations</h2>
        <button className="btn btn-primary" onClick={startCreate}>Add Evaluation</button>
      </div>

      {/* Session Evaluations card moved here */}
      <div className="dept-card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4>Session Evaluations</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, fontSize: '0.8em', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
              <span>🔄</span>
              <span style={{ color: '#6c757d' }}>Manual Refresh Mode</span>
            </div>
            <button className="dept-btn dept-btn-primary" onClick={loadEvaluations} title="Refresh data">🔄 Refresh</button>
            <button className="dept-btn dept-btn-ghost" onClick={loadEvaluations} title="Manually refresh all data">🔄 Refresh</button>
            {lastUpdate && (
              <span style={{ color: 'var(--muted)', fontSize: '0.8em' }}>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
          <input className="dept-input" placeholder="Filter by course/instructor" value={evalFilter} onChange={(e) => { setEvalPage(1); setEvalFilter(e.target.value); }} />
          <select className="dept-select" value={advancedFilters.status} onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="closed">Closed Only</option>
          </select>
        </div>

        {/* Sort and Display Options */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
          <label>
            Sort by
            <select className="dept-select" value={evalSortKey} onChange={(e) => setEvalSortKey(e.target.value)}>
              <option value="opened_at">Opened Date</option>
              <option value="closed_at">Closed Date</option>
              <option value="course">Course</option>
              <option value="teacher">Instructor</option>
            </select>
          </label>
          <button className="dept-btn dept-btn-ghost" onClick={() => setEvalSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>
            {evalSortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <label>
            Page size
            <select className="dept-select" value={evalPageSize} onChange={(e) => { setEvalPage(1); setEvalPageSize(Number(e.target.value)); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>
        </div>

        {loading && <p>Loading evaluations…</p>}
        {!loading && filteredAndSortedEvaluations.length === 0 && <p style={{ color: 'var(--muted)' }}>No evaluations for this session.</p>}
        {!loading && filteredAndSortedEvaluations.length > 0 && (
          (() => {
            const total = filteredAndSortedEvaluations.length;
            const start = (evalPage - 1) * evalPageSize;
            const pageItems = filteredAndSortedEvaluations.slice(start, start + evalPageSize);
            const pageCount = Math.max(1, Math.ceil(total / evalPageSize));
            return (
              <div>
                <div className="dept-table-responsive">
                  <table className="dept-table-fixed">
                    <thead>
                      <tr>
                        <th align="left">Course</th>
                        <th align="left">Instructor</th>
                        <th align="left">Year</th>
                        <th align="left">Status</th>
                        <th align="left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((ev) => (
                        <tr key={ev.id}>
                          <td>{ev.course?.title || ev.course?.name} ({ev.course?.code})</td>
                          <td>{ev.teacher?.name}</td>
                          <td>{ev.year_level ? `Year ${ev.year_level}` : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ev.closed_at ? '#95a5a6' : '#27ae60', display: 'inline-block' }} />
                              {ev.closed_at ? 'Closed' : 'Active'}
                            </div>
                          </td>
                          <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button className="dept-btn dept-btn-primary" onClick={() => editFormQuestions(ev.id)}>Edit Form</button>
                            <button className="dept-btn dept-btn-ghost" onClick={() => navigate(`/department/${id}/results?evaluation_id=${ev.id}`)}>View Results</button>
                            {!ev.closed_at && (
                              <button className="dept-btn dept-btn-ghost" onClick={() => navigate(`/department/${id}/evaluations`)}>Close</button>
                            )}
                            <button className="dept-btn dept-btn-danger" onClick={() => deleteEvaluation(ev.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9em' }}>
                    Showing {start + 1}-{Math.min(start + evalPageSize, total)} of {total} evaluations
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="dept-btn dept-btn-ghost" disabled={evalPage <= 1} onClick={() => setEvalPage(1)}>First</button>
                    <button className="dept-btn dept-btn-ghost" disabled={evalPage <= 1} onClick={() => setEvalPage(p => Math.max(1, p - 1))}>Prev</button>
                    <span style={{ color: 'var(--muted)' }}>Page {evalPage} of {pageCount}</span>
                    <button className="dept-btn dept-btn-ghost" disabled={evalPage >= pageCount} onClick={() => setEvalPage(p => Math.min(pageCount, p + 1))}>Next</button>
                    <button className="dept-btn dept-btn-ghost" disabled={evalPage >= pageCount} onClick={() => setEvalPage(pageCount)}>Last</button>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
      {message && <div className="alert alert-success" role="status">{message}</div>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <p>Loading…</p>}

      {creating && (
        <div className="modal">
          <div className="modal-content">
            <div className="form-section" role="dialog" aria-labelledby="create-evaluation-title">
              <div className="form-header">
                <h2 id="create-evaluation-title">Create Evaluation</h2>
                <p>Fill out the details to open a new course evaluation.</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="course-select">Course</label>
                  <select
                    id="course-select"
                    className="form-select"
                    value={form.course_id}
                    onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                    aria-required="true"
                  >
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title || c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="teacher-select">Teacher</label>
                  <select
                    id="teacher-select"
                    className="form-select"
                    value={form.teacher_id}
                    onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                    aria-required="true"
                  >
                    <option value="">Select teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="academic-year">Academic Year</label>
                  <input
                    id="academic-year"
                    className="form-input"
                    type="text"
                    placeholder="2025/26"
                    value={form.academic_year}
                    onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))}
                    aria-required="true"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="semester-select">Semester</label>
                  <select
                    id="semester-select"
                    className="form-select"
                    value={form.semester}
                    onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                    aria-required="true"
                  >
                    <option value="">Select semester</option>
                    <option value="1">Semester I</option>
                    <option value="2">Semester II</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="year-level">Year Level</label>
                  <input
                    id="year-level"
                    className="form-input"
                    type="number"
                    min="1"
                    max="6"
                    placeholder="1-6"
                    value={form.year_level}
                    onChange={e => setForm(f => ({ ...f, year_level: e.target.value }))}
                    aria-required="true"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="opened-at">Opened At</label>
                  <input
                    id="opened-at"
                    className="form-input"
                    type="date"
                    value={form.opened_at}
                    onChange={e => setForm(f => ({ ...f, opened_at: e.target.value }))}
                    aria-required="true"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="closed-at">Closed At (optional)</label>
                  <input
                    id="closed-at"
                    className="form-input"
                    type="date"
                    value={form.closed_at}
                    onChange={e => setForm(f => ({ ...f, closed_at: e.target.value }))}
                    aria-required="false"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={submitCreate}>Create</button>
                <button className="btn btn-ghost" onClick={cancelCreate}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentManageEvaluations;