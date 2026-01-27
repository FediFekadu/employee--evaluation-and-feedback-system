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
  const [confirming, setConfirming] = useState(false);
  const [assignedCoursesForTeacher, setAssignedCoursesForTeacher] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [evalFilter, setEvalFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ status: 'all' });
  const [evalSortKey, setEvalSortKey] = useState('opened_at');
  const [evalSortDir, setEvalSortDir] = useState('desc');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(5);
  const [form, setForm] = useState({
    teacher_id: '',
    opened_at: '',
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

  const resetForm = () => {
    setForm({ teacher_id: '', opened_at: '' });
    setConfirming(false);
    setAssignedCoursesForTeacher([]);
  };

  const startCreate = () => { resetForm(); setCreating(true); setMessage(''); setError(''); };
  const cancelCreate = () => { setCreating(false); };

  // Compute academic year string from open date
  const computeAcademicYear = (openedAt) => {
    const d = new Date(openedAt);
    if (isNaN(d)) return '';
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    if (m >= 8) {
      const nextShort = String(y + 1).slice(-2);
      return `${y}/${nextShort}`;
    }
    const prev = y - 1;
    const currShort = String(y).slice(-2);
    return `${prev}/${currShort}`;
  };

  // Map semester label to numeric expected by backend
  const mapSemester = (label, openedAt) => {
    const t = String(label || '').toLowerCase();
    if (t.includes('ii')) return '2';
    if (t.includes('i')) return '1';
    const d = new Date(openedAt);
    if (!isNaN(d)) {
      const m = d.getMonth() + 1;
      return m >= 8 ? '1' : '2';
    }
    return '';
  };

  // Step: proceed to confirmation with boxes
  const proceedToConfirm = () => {
    setError('');
    setMessage('');
    const teacherId = String(form.teacher_id || '').trim();
    const openedAt = String(form.opened_at || '').trim();
    if (!teacherId) { setError('Please select instructor'); return; }
    if (!openedAt) { setError('Please set open date'); return; }
    const selectedTeacher = teachers.find(t => String(t.id) === teacherId);
    if (!selectedTeacher) { setError('Selected instructor is not available in this department'); return; }
    const deptId = selectedTeacher.department_id ?? selectedTeacher?.department?.id;
    if (Number(deptId) !== Number(id)) { setError('Instructor must belong to this department'); return; }
    const assigned = (courses || []).filter(c => {
      const sameDept = (c.department?.id ?? c.department_id) === Number(id);
      const isAssigned = (c.teachers || []).some(t => String(t.id) === teacherId);
      return sameDept && isAssigned;
    });
    setAssignedCoursesForTeacher(assigned);
    setConfirming(true);
  };

  // Finalize: create evaluations per assigned course
  const finalizeOpen = async () => {
    setError('');
    setMessage('');
    const teacherId = String(form.teacher_id);
    const openedAt = String(form.opened_at);
    if (!teacherId || !openedAt) { setError('Instructor and open date are required'); return; }
    if (assignedCoursesForTeacher.length === 0) { setError('No assigned courses found for this instructor. Assign courses first from the Courses page.'); return; }
    const academicYear = computeAcademicYear(openedAt);
    if (!academicYear) { setError('Invalid open date — cannot derive academic year'); return; }
    try {
      for (const course of assignedCoursesForTeacher) {
        const pivot = (course.teachers || []).find(t => String(t.id) === teacherId)?.pivot || {};
        const semester = mapSemester(pivot.semester, openedAt);
        const yearLevel = Number(pivot.year_level || 0);
        if (!semester || !yearLevel || yearLevel < 1 || yearLevel > 6) {
          continue;
        }
        const payload = {
          course_id: String(course.id),
          teacher_id: String(teacherId),
          academic_year: academicYear,
          semester: String(semester),
          year_level: String(yearLevel),
          opened_at: openedAt,
          closed_at: '',
        };
        try { await api.post('/evaluations', payload); } catch {}
      }
      setMessage('Evaluation(s) opened for assigned courses');
      setCreating(false);
      setConfirming(false);
      setAssignedCoursesForTeacher([]);
      await loadEvaluations();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to open evaluations');
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
            <div className="form-section" role="dialog" aria-labelledby="open-evaluation-title">
              <div className="form-header">
                <h2 id="open-evaluation-title">Open Evaluation</h2>
                <p>Select instructor and start date, then confirm.</p>
              </div>

              {!confirming && (
                <div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="teacher-select">Instructor</label>
                      <select
                        id="teacher-select"
                        className="form-select"
                        value={form.teacher_id}
                        onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                        aria-required="true"
                      >
                        <option value="">Select instructor</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="opened-at">Open date</label>
                      <input
                        id="opened-at"
                        className="form-input"
                        type="date"
                        value={form.opened_at}
                        onChange={e => setForm(f => ({ ...f, opened_at: e.target.value }))}
                        aria-required="true"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={proceedToConfirm}>Open Evaluation</button>
                    <button className="btn btn-ghost" onClick={cancelCreate}>Cancel</button>
                  </div>
                </div>
              )}

              {confirming && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 8 }}>
                    <div className="dept-card" style={{ border: '1px solid #e3e6ea' }}>
                      <h3>Student Evaluation</h3>
                      <p style={{ color: 'var(--muted)' }}>Student evaluation will be ENABLED.</p>
                      <ul style={{ marginTop: 8 }}>
                        <li>Students will only see teachers</li>
                        <li>Students will only see courses assigned to them</li>
                      </ul>
                      <div style={{ marginTop: 8 }}>
                        <strong>Your notes:</strong>
                        <p style={{ color: 'var(--muted)' }}>Display assigned courses here:</p>
                        {assignedCoursesForTeacher.length === 0 ? (
                          <p style={{ color: 'var(--muted)' }}>No assigned courses found.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {assignedCoursesForTeacher.map(c => {
                              const t = (c.teachers || []).find(t => String(t.id) === String(form.teacher_id));
                              const yl = t?.pivot?.year_level ? `Year ${t.pivot.year_level}` : '';
                              const sem = t?.pivot?.semester || '';
                              return (
                                <div key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <span className="value-chip">{c.title || c.name}</span>
                                  {(yl || sem) && (
                                    <span style={{ color: 'var(--muted)' }}>{[yl, sem].filter(Boolean).join(' • ')}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="dept-card" style={{ border: '1px solid #e3e6ea' }}>
                      <h3>Peer Evaluation</h3>
                      <p style={{ color: 'var(--muted)' }}>Peer evaluation will be ENABLED.</p>
                      <ul style={{ marginTop: 8 }}>
                        <li>Peer teachers can evaluate other teachers</li>
                        <li>Done once per semester</li>
                        <li>No course logic here — correct</li>
                      </ul>
                    </div>

                    <div className="dept-card" style={{ border: '1px solid #e3e6ea' }}>
                      <h3>HOD Evaluation</h3>
                      <p style={{ color: 'var(--muted)' }}>HOD evaluation will be ENABLED.</p>
                      <ul style={{ marginTop: 8 }}>
                        <li>Only users with HOD role can access it</li>
                        <li>Done once per semester</li>
                        <li>Simple and clean — correct</li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={finalizeOpen} disabled={assignedCoursesForTeacher.length === 0}>Confirmation → Open</button>
                    <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentManageEvaluations;