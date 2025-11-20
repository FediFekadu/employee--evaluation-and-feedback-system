import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function DepartmentDashboard() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deptUpdate, setDeptUpdate] = useState({ name: '', code: '' });
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Session controls
  const currentYear = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  }, []);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('Semester I');

  // Courses form
  const [courseForm, setCourseForm] = useState({ title: '', code: '', description: '', teacher_ids: [] });
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  // Instructor assignment form (year & semester)
  const [assignForm, setAssignForm] = useState({ course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Evaluations form
  const [evalForm, setEvalForm] = useState({ course_id: '', teacher_id: '', opened_at: '', closed_at: '' });
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [evalDetail, setEvalDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newInstructor, setNewInstructor] = useState({ name: '', email: '', title: '' });
  const [instructorMessage, setInstructorMessage] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', email: '', student_id: '' });
  const [studentMessage, setStudentMessage] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  // Sidebar tabs
  const tabs = useMemo(() => ([
    { key: 'overview', label: '📊 Overview' },
    { key: 'courses', label: '📚 Courses' },
    { key: 'evaluations', label: '📝 Evaluations' },
    { key: 'analytics', label: '📈 Analytics' },
    { key: 'reports', label: '📑 Reports' },
    { key: 'instructors', label: '👨‍🏫 Instructors' },
    { key: 'students', label: '🎓 Students' },
    { key: 'announcements', label: '🔔 Announcements' },
    { key: 'settings', label: '⚙️ Settings' },
  ]), []);
  const [activeTab, setActiveTab] = useState(() => (window.location?.hash?.slice(1) || 'overview'));
  useEffect(() => {
    const onHashChange = () => setActiveTab(window.location?.hash?.slice(1) || 'overview');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const selectTab = (key) => {
    setActiveTab(key);
    try { window.location.hash = key; } catch {}
  };
  const [notifOpen, setNotifOpen] = useState(false);
  const alerts = useMemo(() => {
    const low = (summary?.questions || []).filter((q) => (q.average_rating ?? 5) < 2.5).length;
    return [
      ...(low > 0 ? [{ id: 'low', text: `Low performance detected on ${low} question(s).` }] : []),
      ...(announcements.length > 0 ? [{ id: 'ann', text: `${announcements.length} announcement(s) posted.` }] : []),
    ];
  }, [summary, announcements]);

  // Table controls (filters, sorting, pagination)
  const [evalFilter, setEvalFilter] = useState('');
  const [evalSortKey, setEvalSortKey] = useState('opened_at');
  const [evalSortDir, setEvalSortDir] = useState('desc');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(5);

  useEffect(() => {
    setAcademicYear(currentYear);
  }, [currentYear]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api
      .get(`/departments/${deptId}`)
      .then((res) => {
        if (!mounted) return;
        setDepartment(res.data);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Failed to load department');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [deptId]);

  const loadEvaluations = async () => {
    setEvalLoading(true);
    try {
      const res = await api.get('/evaluations', {
        params: { department_id: deptId, academic_year: academicYear, semester }
      });
      setEvaluations(res.data?.data || []);
    } catch (e) {
      // silent error, keep UX simple
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    if (deptId && academicYear && semester) {
      loadEvaluations();
    }
  }, [deptId, academicYear, semester]);

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

  const submitEvaluation = async () => {
    if (!evalForm.course_id || !evalForm.teacher_id || !academicYear || !semester || !evalForm.opened_at) {
      alert('Course, teacher, academic year, semester, and opened date are required');
      return;
    }
    setEvalSubmitting(true);
    try {
      const payload = {
        course_id: Number(evalForm.course_id),
        teacher_id: Number(evalForm.teacher_id),
        academic_year: academicYear,
        semester,
        opened_at: evalForm.opened_at,
        closed_at: evalForm.closed_at || null,
      };
      const res = await api.post('/evaluations', payload);
      setEvaluations((prev) => [res.data, ...prev]);
      setEvalForm({ course_id: '', teacher_id: '', opened_at: '', closed_at: '' });
      alert('Evaluation opened successfully');
    } catch (e) {
      alert('Failed to open evaluation');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const closeEvaluation = async (evaluation) => {
    try {
      await api.put(`/evaluations/${evaluation.id}`, { closed_at: new Date().toISOString().slice(0, 10) });
      setEvaluations((prev) => prev.map((ev) => ev.id === evaluation.id ? { ...ev, closed_at: new Date().toISOString().slice(0, 10) } : ev));
      alert('Evaluation closed');
    } catch (e) {
      alert('Failed to close evaluation');
    }
  };

  const loadSummary = async (evaluationId) => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await api.get(`/evaluations/${evaluationId}/summary`);
      setSummary(res.data);
    } catch (e) {
      // ignore
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadEvaluationDetail = async (evaluationId) => {
    setDetailLoading(true);
    setEvalDetail(null);
    try {
      const res = await api.get(`/evaluations/${evaluationId}`);
      setEvalDetail(res.data);
    } catch (e) {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEvalId) {
      loadSummary(selectedEvalId);
      loadEvaluationDetail(selectedEvalId);
    }
  }, [selectedEvalId]);

  const evaluationStatus = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return 'Not started';
    const anyOpen = evaluations.some((ev) => ev.opened_at <= todayStr && (!ev.closed_at || ev.closed_at >= todayStr));
    const allClosed = evaluations.length > 0 && evaluations.every((ev) => ev.closed_at && ev.closed_at < todayStr);
    if (anyOpen) return 'Ongoing';
    if (allClosed) return 'Completed';
    return 'Scheduled';
  }, [evaluations, todayStr]);

  const exportSummaryCSV = () => {
    if (!summary) {
      alert('No summary to export');
      return;
    }
    const rows = [['question_id','average_rating','responses_count']];
    (summary.questions || []).forEach((q) => rows.push([q.question_id, q.average_rating ?? '', q.responses_count]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_${summary.evaluation_id}_summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addAnnouncement = () => {
    if (!announcementText.trim()) return;
    setAnnouncements((prev) => [{ id: Date.now(), text: announcementText.trim() }, ...prev]);
    setAnnouncementText('');
  };

  const updateDepartment = async () => {
    try {
      const res = await api.put(`/departments/${deptId}`, { name: deptUpdate.name, code: deptUpdate.code });
      setDepartment(res.data);
      alert('Department updated');
    } catch (e) {
      alert('Failed to update department');
    }
  };

  return (
    <div>
      <h2>Department Admin Dashboard</h2>
      {loading && <p>Loading department…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && department && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12 }}>
          <aside className="card" style={{ width: 240, position: 'sticky', top: 12, alignSelf: 'flex-start' }}>
            <h3>Navigation</h3>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className="btn btn-ghost"
                  onClick={() => selectTab(t.key)}
                  style={{
                    justifyContent: 'flex-start',
                    background: activeTab === t.key ? 'var(--surface)' : undefined,
                    fontWeight: activeTab === t.key ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </aside>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">🔔</button>
            </div>
            {notifOpen && (
              <div className="card" style={{ position: 'absolute', right: 12, zIndex: 10 }}>
                <h4>Notifications</h4>
                {alerts.length === 0 && <p style={{ color: 'var(--muted)' }}>No notifications.</p>}
                {alerts.length > 0 && (
                  <ul>
                    {alerts.map((n) => <li key={n.id}>{n.text}</li>)}
                  </ul>
                )}
              </div>
            )}
          {activeTab === 'overview' && (
          <div className="card" style={{ marginTop: 0 }}>
            <h3>Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 8 }}>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Instructors</div>
                <div style={{ fontSize: 20 }}>{department.teachers?.length ?? 0}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Students</div>
                <div style={{ fontSize: 20 }}>{department.students?.length ?? 0}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Courses</div>
                <div style={{ fontSize: 20 }}>{department.courses?.length ?? 0}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Evaluation Status</div>
                <div style={{ fontSize: 20 }}>{evaluationStatus}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Notifications</div>
                <div style={{ fontSize: 20 }}>{alerts.length}</div>
              </div>
            </div>
            {summary && (
              <div className="card" style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Recent feedbacks (selected evaluation)</div>
                <div style={{ fontSize: 16 }}>{summary.total_feedbacks}</div>
                {(summary.questions || []).some((q) => (q.average_rating ?? 5) < 2.5) && (
                  <div style={{ marginTop: 6, color: 'var(--danger)' }}>Alert: Low-performing instructor detected in recent results</div>
                )}
              </div>
            )}
          </div>
          )}

          {activeTab === 'settings' && (
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Department</h3>
            <p style={{ color: 'var(--muted)' }}>{department.name} ({department.code})</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <label>
                Academic Year
                <input className="btn btn-ghost" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025/26" />
              </label>
              <label>
                Semester
                <select className="btn btn-ghost" value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option>Semester I</option>
                  <option>Semester II</option>
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              <h4>Update Department Info</h4>
              <input className="btn btn-ghost" value={deptUpdate.name} onChange={(e) => setDeptUpdate((u) => ({ ...u, name: e.target.value }))} />
              <input className="btn btn-ghost" value={deptUpdate.code} onChange={(e) => setDeptUpdate((u) => ({ ...u, code: e.target.value }))} />
              <button className="btn btn-ghost" onClick={updateDepartment}>Save</button>
            </div>
          </div>
          )}

          <section className="grid" style={{ marginTop: 20 }}>
            {activeTab === 'analytics' && (
            <div className="card">
              <h3>Feedback Analytics</h3>
              {!selectedEvalId && <p style={{ color: 'var(--muted)' }}>Select an evaluation to view analytics.</p>}
              {summary && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: 'var(--muted)' }}>Average ratings per question</div>
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: 160, background: 'var(--surface)' }}>
                    {summary.questions?.map((q, i) => {
                      const bw = 100 / Math.max(1, summary.questions.length);
                      const x = i * bw + 2;
                      const h = Math.max(2, Math.min(35, (q.average_rating ?? 0) * 7));
                      const y = 38 - h;
                      return (
                        <g key={q.question_id}>
                          <rect x={x} y={y} width={bw - 4} height={h} fill="#6b8af5" rx={1} />
                        </g>
                      );
                    })}
                  </svg>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
                    <div className="card"><div style={{ fontSize: 12, color: 'var(--muted)' }}>Instructor</div><div>{summary.teacher?.name}</div></div>
                    <div className="card"><div style={{ fontSize: 12, color: 'var(--muted)' }}>Course</div><div>{summary.course?.title} ({summary.course?.code})</div></div>
                    <div className="card"><div style={{ fontSize: 12, color: 'var(--muted)' }}>Feedbacks</div><div>{summary.total_feedbacks}</div></div>
                  </div>
                </div>
              )}
            </div>
            )}

            {activeTab === 'reports' && (
            <div className="card">
              <h3>Reports</h3>
              <p style={{ color: 'var(--muted)' }}>Export evaluation and department analytics.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={exportSummaryCSV} disabled={!summary}>Export CSV</button>
                <button className="btn btn-ghost" onClick={() => alert('PDF export coming soon')} disabled={!summary}>Export PDF</button>
                <button className="btn btn-ghost" onClick={() => alert('Excel export coming soon')} disabled={!summary}>Export Excel</button>
              </div>
            </div>
            )}
            {activeTab === 'courses' && (
            <div className="card">
              <h3>Post Course & Assign Instructor</h3>
              <p style={{ color: 'var(--muted)' }}>Create a course in this department and attach instructors.</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <input className="btn btn-ghost" placeholder="Course title" value={courseForm.title} onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} />
                <input className="btn btn-ghost" placeholder="Course code" value={courseForm.code} onChange={(e) => setCourseForm((f) => ({ ...f, code: e.target.value }))} />
                <textarea className="btn btn-ghost" placeholder="Description (optional)" value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} />
                <label>
                  Instructors
                  <select className="btn btn-ghost" multiple size={Math.min(6, Math.max(3, teacherOptions.length))} value={courseForm.teacher_ids} onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setCourseForm((f) => ({ ...f, teacher_ids: opts }));
                  }}>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={String(t.id)}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                </label>
                <button className="btn btn-primary" onClick={submitCourse} disabled={courseSubmitting}>
                  {courseSubmitting ? 'Creating…' : 'Create Course'}
                </button>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <h4>Assign Instructor to Course (Year & Semester)</h4>
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  <label>
                    Course
                    <select className="btn btn-ghost" value={assignForm.course_id} onChange={(e) => setAssignForm((f) => ({ ...f, course_id: e.target.value }))}>
                      <option value="">Select course</option>
                      {courseOptions.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.title} ({c.code})</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Instructor
                    <select className="btn btn-ghost" value={assignForm.teacher_id} onChange={(e) => setAssignForm((f) => ({ ...f, teacher_id: e.target.value }))}>
                      <option value="">Select instructor</option>
                      {teacherOptions.map((t) => (
                        <option key={t.id} value={String(t.id)}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ flex: 1 }}>
                      Year
                      <select className="btn btn-ghost" value={assignForm.year_level} onChange={(e) => setAssignForm((f) => ({ ...f, year_level: e.target.value }))}>
                        {[1,2,3,4,5].map((y) => (
                          <option key={y} value={String(y)}>Year {y}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ flex: 1 }}>
                      Semester
                      <select className="btn btn-ghost" value={assignForm.semester} onChange={(e) => setAssignForm((f) => ({ ...f, semester: e.target.value }))}>
                        <option value="Semester I">Semester I</option>
                        <option value="Semester II">Semester II</option>
                      </select>
                    </label>
                  </div>
                  <button className="btn btn-primary" disabled={assignSubmitting} onClick={async () => {
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
                  }}>
                    {assignSubmitting ? 'Assigning…' : 'Assign Instructor'}
                  </button>
                </div>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
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
            )}

            {activeTab === 'evaluations' && (
            <div className="card">
              <h3>Open Course Evaluation</h3>
              <p style={{ color: 'var(--muted)' }}>Select course and instructor, set dates, and open evaluation for the chosen session.</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <label>
                  Course
                  <select className="btn btn-ghost" value={evalForm.course_id} onChange={(e) => setEvalForm((f) => ({ ...f, course_id: e.target.value }))}>
                    <option value="">Select course</option>
                    {courseOptions.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.title} ({c.code})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Instructor
                  <select className="btn btn-ghost" value={evalForm.teacher_id} onChange={(e) => setEvalForm((f) => ({ ...f, teacher_id: e.target.value }))}>
                    <option value="">Select instructor</option>
                    {teacherOptions.map((t) => (
                      <option key={t.id} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Open date
                  <input type="date" className="btn btn-ghost" value={evalForm.opened_at} onChange={(e) => setEvalForm((f) => ({ ...f, opened_at: e.target.value }))} />
                </label>
                <label>
                  Close date (optional)
                  <input type="date" className="btn btn-ghost" value={evalForm.closed_at} onChange={(e) => setEvalForm((f) => ({ ...f, closed_at: e.target.value }))} />
                </label>
                <button className="btn btn-primary" onClick={submitEvaluation} disabled={evalSubmitting}>
                  {evalSubmitting ? 'Opening…' : 'Open Evaluation'}
                </button>
              </div>

              <div className="card" style={{ marginTop: 12 }}>
                <h4>Session Evaluations ({academicYear}, {semester})</h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                  <input className="btn btn-ghost" placeholder="Filter by course/instructor" value={evalFilter} onChange={(e) => { setEvalPage(1); setEvalFilter(e.target.value); }} />
                  <label>
                    Sort by
                    <select className="btn btn-ghost" value={evalSortKey} onChange={(e) => setEvalSortKey(e.target.value)}>
                      <option value="opened_at">Opened</option>
                      <option value="closed_at">Closed</option>
                      <option value="course">Course</option>
                      <option value="teacher">Instructor</option>
                    </select>
                  </label>
                  <button className="btn btn-ghost" onClick={() => setEvalSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>{evalSortDir === 'asc' ? 'Asc' : 'Desc'}</button>
                  <label>
                    Page size
                    <select className="btn btn-ghost" value={evalPageSize} onChange={(e) => { setEvalPage(1); setEvalPageSize(Number(e.target.value)); }}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </label>
                </div>
                {evalLoading && <p>Loading evaluations…</p>}
                {!evalLoading && evaluations.length === 0 && <p style={{ color: 'var(--muted)' }}>No evaluations for this session.</p>}
                {!evalLoading && evaluations.length > 0 && (
                  (() => {
                    const filtered = evaluations.filter((ev) => {
                      const s = `${ev.course?.title} ${ev.course?.code} ${ev.teacher?.name}`.toLowerCase();
                      return s.includes(evalFilter.toLowerCase());
                    });
                    const sorted = filtered.sort((a, b) => {
                      const dir = evalSortDir === 'asc' ? 1 : -1;
                      if (evalSortKey === 'course') return dir * String(a.course?.title || '').localeCompare(String(b.course?.title || ''));
                      if (evalSortKey === 'teacher') return dir * String(a.teacher?.name || '').localeCompare(String(b.teacher?.name || ''));
                      if (evalSortKey === 'closed_at') return dir * String(a.closed_at || '').localeCompare(String(b.closed_at || ''));
                      return dir * String(a.opened_at || '').localeCompare(String(b.opened_at || ''));
                    });
                    const total = sorted.length;
                    const start = (evalPage - 1) * evalPageSize;
                    const pageItems = sorted.slice(start, start + evalPageSize);
                    const pageCount = Math.max(1, Math.ceil(total / evalPageSize));
                    return (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th align="left">Course</th>
                        <th align="left">Instructor</th>
                        <th align="left">Opened</th>
                        <th align="left">Closed</th>
                        <th align="left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((ev) => (
                        <tr key={ev.id}>
                          <td>{ev.course?.title} ({ev.course?.code})</td>
                          <td>{ev.teacher?.name}</td>
                          <td>{ev.opened_at}</td>
                          <td>{ev.closed_at || '—'}</td>
                          <td style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary" onClick={() => setSelectedEvalId(ev.id)}>View Results</button>
                            {!ev.closed_at && (
                              <button className="btn btn-ghost" onClick={() => closeEvaluation(ev)}>Close</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    );
                  })()
                )}
                {!evalLoading && evaluations.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <button className="btn btn-ghost" disabled={evalPage <= 1} onClick={() => setEvalPage((p) => Math.max(1, p - 1))}>Prev</button>
                    <span style={{ color: 'var(--muted)' }}>Page {evalPage}</span>
                    <button className="btn btn-ghost" onClick={() => setEvalPage((p) => p + 1)}>Next</button>
                  </div>
                )}
              </div>
            </div>
            )}

            {activeTab === 'evaluations' && (
            <div className="card">
              <h3>Teacher Evaluation Results</h3>
              <p style={{ color: 'var(--muted)' }}>Aggregated ratings and sample comments for the selected evaluation.</p>
              {!selectedEvalId && <p style={{ color: 'var(--muted)' }}>Select "View Results" on an evaluation.</p>}
              {summaryLoading && <p>Loading summary…</p>}
              {summary && (
                <div style={{ marginTop: 8 }}>
                  <p><strong>Course:</strong> {summary.course?.title} ({summary.course?.code})</p>
                  <p><strong>Instructor:</strong> {summary.teacher?.name}</p>
                  <p><strong>Session:</strong> {summary.academic_year}, {summary.semester}</p>
                  <p><strong>Feedbacks:</strong> {summary.total_feedbacks}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="btn btn-ghost" onClick={exportSummaryCSV}>Download CSV</button>
                    <span style={{ color: 'var(--muted)' }}>Lock status: {summary.closed_at ? 'Locked' : 'Open'}</span>
                  </div>
                  <div className="card" style={{ marginTop: 12 }}>
                    <h4>Participation</h4>
                    {detailLoading && <p>Loading details…</p>}
                    {evalDetail && (
                      <div>
                        <div style={{ color: 'var(--muted)' }}>Students in department: {department.students?.length ?? 0}</div>
                        <div style={{ color: 'var(--muted)' }}>Feedbacks received: {evalDetail.feedbacks?.length ?? 0}</div>
                        <div style={{ marginTop: 6 }}>
                          <progress value={evalDetail.feedbacks?.length ?? 0} max={Math.max(1, department.students?.length ?? 1)} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card" style={{ marginTop: 12 }}>
                    <h4>Question Summaries</h4>
                    {summary.questions?.length === 0 && <p style={{ color: 'var(--muted)' }}>No responses yet.</p>}
                    {summary.questions?.map((q) => (
                      <div key={q.question_id} style={{ marginBottom: 10 }}>
                        <div>Question #{q.question_id}</div>
                        <div>Average rating: {q.average_rating ?? '—'} ({q.responses_count} ratings)</div>
                        {q.sample_comments?.length > 0 && (
                          <ul>
                            {q.sample_comments.map((c, i) => (
                              <li key={i} style={{ color: 'var(--muted)' }}>&ldquo;{c}&rdquo;</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </section>
          <section className="grid" style={{ marginTop: 20 }}>
            {activeTab === 'instructors' && (
            <div className="card">
              <h3>Manage Instructors</h3>
              <p style={{ color: 'var(--muted)' }}>View and manage department instructors. Add/update requires backend endpoints.</p>
              <div className="card" style={{ marginTop: 8 }}>
                <h4>Instructors</h4>
                {(department.teachers || []).length === 0 && <p style={{ color: 'var(--muted)' }}>No instructors found.</p>}
                {(department.teachers || []).length > 0 && (
                  <ul>
                    {department.teachers.map((t) => (
                      <li key={t.id}>{t.name} ({t.email || '—'})</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-primary" onClick={() => setShowInstructorModal(true)}>Add Instructor</button>
              </div>
            </div>
            )}

            {activeTab === 'students' && (
            <div className="card">
              <h3>Manage Students</h3>
              <p style={{ color: 'var(--muted)' }}>View and manage department students. Upload/add/update requires backend endpoints.</p>
              <div className="card" style={{ marginTop: 8 }}>
                <h4>Students</h4>
                {(department.students || []).length === 0 && <p style={{ color: 'var(--muted)' }}>No students found.</p>}
                {(department.students || []).length > 0 && (
                  <ul>
                    {department.students.map((s) => (
                      <li key={s.id}>{s.name} ({s.student_id})</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowStudentModal(true)}>Add Student</button>
                <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                  Upload Excel
                  <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={() => alert('Upload handling coming soon')} />
                </label>
              </div>
            </div>
            )}

            {activeTab === 'announcements' && (
            <div className="card">
              <h3>Announcements</h3>
              <p style={{ color: 'var(--muted)' }}>Post announcements for department students and notify instructors.</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                <textarea className="btn btn-ghost" placeholder="Write announcement…" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} />
                <button className="btn btn-primary" onClick={addAnnouncement}>Post</button>
                <div className="card">
                  <h4>Recent Announcements</h4>
                  {announcements.length === 0 && <p style={{ color: 'var(--muted)' }}>No announcements yet.</p>}
                  {announcements.length > 0 && (
                    <ul>
                      {announcements.map((a) => (
                        <li key={a.id}>{a.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            )}

            {activeTab === 'settings' && (
            <div className="card">
              <h3>Evaluation Settings</h3>
              <p style={{ color: 'var(--muted)' }}>Configure evaluation parameters. Some settings require backend support.</p>
              <ul>
                <li>Set evaluation start & end date (use Open/Close form)</li>
                <li>Choose question categories (coming soon)</li>
                <li>Enable/disable anonymous feedback (coming soon)</li>
                <li>Minimum attendance requirement (optional, coming soon)</li>
                <li>Disable course or instructor from evaluation (coming soon)</li>
              </ul>
            </div>
            )}

            {activeTab === 'settings' && (
            <div className="card">
              <h3>Profile & Department Settings</h3>
              <ul>
                <li>Update department info (implemented above)</li>
                <li>Change department admin password (coming soon)</li>
                <li>Set academic year & semester defaults (controls above)</li>
                <li>Manage department logo/header (coming soon)</li>
              </ul>
            </div>
            )}
          </section>
          {showInstructorModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
              <div className="card" style={{ width: 420 }}>
                <h3>Add Instructor</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input className="btn btn-ghost" placeholder="Name" value={newInstructor.name} onChange={(e) => setNewInstructor((f) => ({ ...f, name: e.target.value }))} />
                  <input className="btn btn-ghost" placeholder="Email" value={newInstructor.email} onChange={(e) => setNewInstructor((f) => ({ ...f, email: e.target.value }))} />
                  <input className="btn btn-ghost" placeholder="Title" value={newInstructor.title} onChange={(e) => setNewInstructor((f) => ({ ...f, title: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setShowInstructorModal(false)}>Cancel</button>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!newInstructor.name || !newInstructor.email) {
                          alert('Name and email are required');
                          return;
                        }
                        try {
                          const res = await api.post('/teachers', {
                            name: newInstructor.name,
                            email: newInstructor.email,
                            title: newInstructor.title || undefined,
                            department_id: deptId,
                          });
                          setDepartment((prev) => ({
                            ...prev,
                            teachers: [res.data, ...(prev?.teachers || [])],
                          }));
                          setNewInstructor({ name: '', email: '', title: '' });
                          const pwd = res.data?.default_password;
                          setInstructorMessage(pwd ? `Instructor added. Default password: ${pwd}` : 'Instructor added successfully');
                          setShowInstructorModal(false);
                        } catch (e) {
                          alert('Failed to add instructor');
                        }
                      }}
                    >
                      Save
                    </button>
                  </div>
                  {instructorMessage && <p style={{ color: 'var(--muted)' }}>{instructorMessage}</p>}
                </div>
              </div>
            </div>
          )}

          {showStudentModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
              <div className="card" style={{ width: 420 }}>
                <h3>Add Student</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input className="btn btn-ghost" placeholder="Name" value={newStudent.name} onChange={(e) => setNewStudent((f) => ({ ...f, name: e.target.value }))} />
                  <input className="btn btn-ghost" placeholder="Email" value={newStudent.email} onChange={(e) => setNewStudent((f) => ({ ...f, email: e.target.value }))} />
                  <input className="btn btn-ghost" placeholder="Student ID" value={newStudent.student_id} onChange={(e) => setNewStudent((f) => ({ ...f, student_id: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setShowStudentModal(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => { setStudentMessage('Backend endpoint not implemented yet'); setShowStudentModal(false); }}>Save</button>
                  </div>
                  {studentMessage && <p style={{ color: 'var(--muted)' }}>{studentMessage}</p>}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentDashboard;