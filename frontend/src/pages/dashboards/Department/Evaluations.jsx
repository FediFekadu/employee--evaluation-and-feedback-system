import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function FormBuilder({ evaluations, onSaved }) {
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadExisting = async () => {
      if (!selectedId) { setQuestions([]); return; }
      setLoading(true);
      setMessage('');
      try {
        const res = await api.get(`/evaluations/${selectedId}`);
        const existing = res.data?.questions || [];
        const mapped = existing.map((q) => ({ text: q.text || '', type: q.type || 'rating' }));
        if (mounted) setQuestions(mapped);
      } catch (e) {
        if (mounted) setMessage('Failed to load existing questions');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadExisting();
    return () => { mounted = false; };
  }, [selectedId]);

  const addQuestion = (type) => {
    setQuestions((qs) => [...qs, { text: '', type }]);
  };
  const updateQuestion = (idx, patch) => {
    setQuestions((qs) => qs.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };
  const removeQuestion = (idx) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  };
  const saveQuestions = async () => {
    if (!selectedId) { setMessage('Select an evaluation first'); return; }
    const cleaned = questions.filter((q) => q.text && q.type);
    if (cleaned.length === 0) { setMessage('Add at least one question'); return; }
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/evaluations/${selectedId}/questions`, { questions: cleaned });
      setMessage('Form saved');
      onSaved?.();
    } catch (e) {
      setMessage('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ flex: 1 }}>
          Evaluation
          <select className="dept-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select evaluation</option>
            {evaluations.map((ev) => (
              <option key={ev.id} value={String(ev.id)}>
                {ev.course?.title} – {ev.teacher?.name} ({ev.opened_at})
              </option>
            ))}
          </select>
        </label>
        <button className="dept-btn dept-btn-ghost" onClick={() => addQuestion('rating')}>Add rating</button>
        <button className="dept-btn dept-btn-ghost" onClick={() => addQuestion('text')}>Add text</button>
        <button className="dept-btn dept-btn-primary" onClick={saveQuestions} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Form'}
        </button>
      </div>
      {message && <p style={{ color: 'var(--muted)' }}>{message}</p>}
      {loading && <p>Loading questions…</p>}
      {!loading && (
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {questions.length === 0 && <p style={{ color: 'var(--muted)' }}>No questions yet. Add rating or text questions.</p>}
          {questions.map((q, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="dept-input" style={{ flex: 3 }} placeholder="Question text" value={q.text} onChange={(e) => updateQuestion(idx, { text: e.target.value })} />
              <select className="dept-select" style={{ flex: 1 }} value={q.type} onChange={(e) => updateQuestion(idx, { type: e.target.value })}>
                <option value="rating">Rating (1–5)</option>
                <option value="text">Text (comment)</option>
              </select>
              <button className="dept-btn dept-btn-ghost" onClick={() => removeQuestion(idx)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvaluationTableBuilder({ evaluations, onSaved }) {
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [headerTitle, setHeaderTitle] = useState('EVALUATION CRITERIA');
  const [headerSubTitle, setHeaderSubTitle] = useState('የምዘና መስፈርት');
  const [scaleLabels, setScaleLabels] = useState({
    vlow: '1. Very low\nበጣም ዝቅተኛ',
    med: '2. Medium\nመካከለኛ',
    high: '3. High\nከፍተኛ',
    vhigh: '4. Very high\nበጣም ከፍተኛ',
    na: 'Does not Apply to NA\nአይመለከተም',
  });

  const defaultSections = useMemo(() => ([
    {
      key: 'A',
      title: 'A. INSTRUCTIONAL SKILLS: (የማስተማር ችሎታዎች)',
      items: [
        'Applies & respects day one class one.',
        'Prepares & gives clear course outline.',
        'Offers the course based on the sequence & content indicated in course outline.',
        'Outline & explains clearly the objectives of the chapters & topics.',
        'Presents the course clearly using instructional language.',
        'Has adequate knowledge about the course offered.',
        'Gets prepared & comes to the class always for daily lesson.',
        'Explains the course briefly using pertinent examples, illustrations & real life situations frequently as necessary.',
        'Identifies & offers the course to the learners based on their understanding level.',
        "Gives class works, homework, assignments, work sheets, review questions - etc and provides solutions and feedbacks on time.",
        'Teaches using appropriate Instructional materials (teaching aids).',
        'Provides handout as well as necessary lists of reference books.',
        'Has interest & motivation to teach.',
        'Uses the class only for appropriate teaching & learning issues.',
      ],
    },
    {
      key: 'B',
      title: 'B. PROFESSIONAL ETHICS & ATTITUDE TOWARDS THE STUDENTS: (የባለሙያ ስነምግባር እና ከተማሪዎች ጋር ያለው አመለካከት)',
      items: [
        'Always comes to the class on time & compensates wasted class time regularly.',
        "Encourages the students to participate in the class and receives answers from & gives answers to students' questions satisfactorily.",
        'Always avails himself or herself & solves the academic problem of the students during consultation hours.',
        'Treats students equally and fairly without any discrimination.',
        'Usually motivates and encourages students to learn.',
        'Tries to foster climate of trust and respect in teaching and learning process.',
        'Encourages student to express their feelings.',
        'Good role model, honest & a person of integrity.',
      ],
    },
    {
      key: 'C',
      title: 'C. ASSESSMENT METHODS & FEEDBACK: (የአሰሳሰ ዘዴዎች እና ግብረመልስ)',
      items: [
        'Announces the methods & types of assessment used in the course in advance.',
        'Checks if students have understood the lesson by different mechanisms.',
        'Using continuous assessment, assesses students with various methods.',
        "Corrects the students' assessments & gives feedbacks on time.",
        'Prepares exam questions from topics & portions covered.',
        'Allocates sufficient time for each tests & exams.',
        'Identifies students who scored below satisfactory & helps them to improve their result.',
      ],
    },
  ]), []);

  const [sections, setSections] = useState(defaultSections);

  const addItem = (sidx) => {
    setSections((secs) => secs.map((s, i) => i === sidx ? { ...s, items: [...s.items, ''] } : s));
  };
  const removeItem = (sidx, idx) => {
    setSections((secs) => secs.map((s, i) => i === sidx ? { ...s, items: s.items.filter((_, j) => j !== idx) } : s));
  };
  const updateItem = (sidx, idx, text) => {
    setSections((secs) => secs.map((s, i) => i === sidx ? { ...s, items: s.items.map((t, j) => j === idx ? text : t) } : s));
  };
  const updateSectionTitle = (sidx, text) => {
    setSections((secs) => secs.map((s, i) => i === sidx ? { ...s, title: text } : s));
  };

  const saveAsQuestions = async () => {
    if (!selectedId) { setMessage('Select an evaluation first'); return; }
    const texts = sections.flatMap((s) => s.items).map((t) => t.trim()).filter(Boolean);
    if (texts.length === 0) { setMessage('Add at least one criterion text'); return; }
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/evaluations/${selectedId}/questions`, { questions: texts.map((text) => ({ text, type: 'rating' })) });
      setMessage('Form saved');
      onSaved?.();
    } catch (e) {
      setMessage('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const renderScaleHeader = (txt) => (
    <textarea className="btn btn-ghost scale-label" defaultValue={txt} onChange={(e) => {
      const val = e.target.value;
      const [vlow, med, high, vhigh, na] = [scaleLabels.vlow, scaleLabels.med, scaleLabels.high, scaleLabels.vhigh, scaleLabels.na];
      if (txt === vlow) setScaleLabels((s) => ({ ...s, vlow: val }));
      else if (txt === med) setScaleLabels((s) => ({ ...s, med: val }));
      else if (txt === high) setScaleLabels((s) => ({ ...s, high: val }));
      else if (txt === vhigh) setScaleLabels((s) => ({ ...s, vhigh: val }));
      else if (txt === na) setScaleLabels((s) => ({ ...s, na: val }));
    }} rows={2} />
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ flex: 1 }}>
          Evaluation
          <select className="dept-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select evaluation</option>
            {evaluations.map((ev) => (
              <option key={ev.id} value={String(ev.id)}>
                {ev.course?.title} – {ev.teacher?.name} ({ev.opened_at})
              </option>
            ))}
          </select>
        </label>
        <button className="dept-btn dept-btn-primary" onClick={saveAsQuestions} disabled={saving}>
          {saving ? 'Saving…' : 'Save Form'}
        </button>
      </div>
      {message && <p style={{ color: 'var(--muted)' }}>{message}</p>}

      <div className="dept-card" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="dept-input" style={{ flex: 1 }} value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} />
          <input className="dept-input" style={{ flex: 1 }} value={headerSubTitle} onChange={(e) => setHeaderSubTitle(e.target.value)} />
        </div>
        <div className="dept-table-responsive" style={{ marginTop: 8 }}>
          <table className="dept-table-fixed">
          <thead>
            <tr>
              <th align="left" style={{ width: 40 }}>#</th>
              <th align="left">Evaluation Criteria</th>
              <th align="center" style={{ width: 90 }}>{renderScaleHeader(scaleLabels.vlow)}</th>
              <th align="center" style={{ width: 90 }}>{renderScaleHeader(scaleLabels.med)}</th>
              <th align="center" style={{ width: 90 }}>{renderScaleHeader(scaleLabels.high)}</th>
              <th align="center" style={{ width: 90 }}>{renderScaleHeader(scaleLabels.vhigh)}</th>
              <th align="center" style={{ width: 120 }}>{renderScaleHeader(scaleLabels.na)}</th>
              <th align="center" style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec, sidx) => (
              <React.Fragment key={sec.key}>
                <tr>
                  <td colSpan={8} style={{ background: '#f9f9f9', padding: 8 }}>
                    <input className="dept-input" style={{ width: '100%' }} value={sec.title} onChange={(e) => updateSectionTitle(sidx, e.target.value)} />
                  </td>
                </tr>
                {sec.items.map((txt, idx) => {
                  const number = sections.slice(0, sidx).reduce((acc, s) => acc + s.items.length, 0) + idx + 1;
                  return (
                    <tr key={`${sec.key}-${idx}`}>
                      <td>{number}</td>
                      <td>
                        <input className="dept-input" style={{ width: '100%' }} value={txt} onChange={(e) => updateItem(sidx, idx, e.target.value)} />
                      </td>
                      {[1,2,3,4].map((n) => (
                        <td key={n} align="center">○</td>
                      ))}
                      <td align="center">○</td>
                      <td style={{ width: 120 }}>
                        <button className="dept-btn dept-btn-ghost" onClick={() => removeItem(sidx, idx)}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={8} style={{ padding: 8 }}>
                    <button className="dept-btn dept-btn-ghost" onClick={() => addItem(sidx)}>Add row</button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DepartmentEvaluations() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const currentYear = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  }, []);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('Semester I');

  const [evalForm, setEvalForm] = useState({ course_id: '', teacher_id: '', year_level: '1', opened_at: '', closed_at: '' });
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [evalDetail, setEvalDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [evalFilter, setEvalFilter] = useState('');
  const [evalSortKey, setEvalSortKey] = useState('opened_at');
  const [evalSortDir, setEvalSortDir] = useState('desc');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(5);

  useEffect(() => { setAcademicYear(currentYear); }, [currentYear]);

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

  const loadEvaluations = async () => {
    setEvalLoading(true);
    try {
      const res = await api.get('/evaluations', { params: { department_id: deptId, academic_year: academicYear, semester } });
      setEvaluations(res.data?.data || []);
    } catch (e) {
      // ignore errors to keep UX simple
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => { if (deptId && academicYear && semester) loadEvaluations(); }, [deptId, academicYear, semester]);

  const teacherOptions = department?.teachers || [];
  const courseOptions = department?.courses || [];

  const submitEvaluation = async () => {
    if (!evalForm.course_id || !evalForm.teacher_id || !academicYear || !semester || !evalForm.opened_at || !evalForm.year_level) {
      alert('Course, teacher, academic year, year level, semester, and opened date are required');
      return;
    }
    setEvalSubmitting(true);
    try {
      const payload = {
        course_id: Number(evalForm.course_id),
        teacher_id: Number(evalForm.teacher_id),
        academic_year: academicYear,
        semester,
        year_level: Number(evalForm.year_level),
        opened_at: evalForm.opened_at,
        closed_at: evalForm.closed_at || null,
      };
      const res = await api.post('/evaluations', payload);
      setEvaluations((prev) => [res.data, ...prev]);
      setEvalForm({ course_id: '', teacher_id: '', year_level: '1', opened_at: '', closed_at: '' });
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

  const exportSummaryCSV = () => {
    if (!summary) { alert('No summary to export'); return; }
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

  return (
    <div>
      <div className="dept-card">
        <h3>Open Course Evaluation</h3>
        <p style={{ color: 'var(--muted)' }}>Select course and instructor, set dates, and open evaluation for the chosen session.</p>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <label>
            Course
            <select className="dept-select" value={evalForm.course_id} onChange={(e) => setEvalForm((f) => ({ ...f, course_id: e.target.value }))}>
              <option value="">Select course</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.title} ({c.code})</option>
              ))}
            </select>
          </label>
          <label>
            Instructor
            <select className="dept-select" value={evalForm.teacher_id} onChange={(e) => setEvalForm((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">Select instructor</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              Target Year
              <select className="dept-select" value={evalForm.year_level} onChange={(e) => setEvalForm((f) => ({ ...f, year_level: e.target.value }))}>
                {[1,2,3,4,5].map((y) => (
                  <option key={y} value={String(y)}>Year {y}</option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Semester
              <input className="dept-input" value={semester} onChange={(e) => setSemester(e.target.value)} />
            </label>
          </div>
          <label>
            Open date
            <input type="date" className="dept-input" value={evalForm.opened_at} onChange={(e) => setEvalForm((f) => ({ ...f, opened_at: e.target.value }))} />
          </label>
          <label>
            Close date (optional)
            <input type="date" className="dept-input" value={evalForm.closed_at} onChange={(e) => setEvalForm((f) => ({ ...f, closed_at: e.target.value }))} />
          </label>
          <button className="dept-btn dept-btn-primary" onClick={submitEvaluation} disabled={evalSubmitting}>
            {evalSubmitting ? 'Opening…' : 'Open Evaluation'}
          </button>
        </div>
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Editable Table Form</h4>
        <p style={{ color: 'var(--muted)' }}>Create an editable table like the provided photo; all texts are editable. Save will convert rows to rating questions.</p>
        <EvaluationTableBuilder evaluations={evaluations} onSaved={loadEvaluations} />
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Session Evaluations ({academicYear}, {semester})</h4>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
          <input className="dept-input" placeholder="Filter by course/instructor" value={evalFilter} onChange={(e) => { setEvalPage(1); setEvalFilter(e.target.value); }} />
          <label>
            Sort by
            <select className="dept-select" value={evalSortKey} onChange={(e) => setEvalSortKey(e.target.value)}>
              <option value="opened_at">Opened</option>
              <option value="closed_at">Closed</option>
              <option value="course">Course</option>
              <option value="teacher">Instructor</option>
            </select>
          </label>
          <button className="dept-btn dept-btn-ghost" onClick={() => setEvalSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>{evalSortDir === 'asc' ? 'Asc' : 'Desc'}</button>
          <label>
            Page size
            <select className="dept-select" value={evalPageSize} onChange={(e) => { setEvalPage(1); setEvalPageSize(Number(e.target.value)); }}>
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
          <div className="dept-table-responsive">
          <table className="dept-table-fixed">
            <thead>
              <tr>
                <th align="left">Course</th>
                <th align="left">Instructor</th>
                <th align="left">Year</th>
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
                  <td>{ev.year_level ? `Year ${ev.year_level}` : '—'}</td>
                  <td>{ev.opened_at}</td>
                  <td>{ev.closed_at || '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="dept-btn dept-btn-primary" onClick={() => setSelectedEvalId(ev.id)}>View Results</button>
                    {!ev.closed_at && (
                      <button className="dept-btn dept-btn-ghost" onClick={() => closeEvaluation(ev)}>Close</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
            );
          })()
        )}
        {!evalLoading && evaluations.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <button className="dept-btn dept-btn-ghost" disabled={evalPage <= 1} onClick={() => setEvalPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span style={{ color: 'var(--muted)' }}>Page {evalPage}</span>
            <button className="dept-btn dept-btn-ghost" onClick={() => setEvalPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
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
              <button className="dept-btn dept-btn-ghost" onClick={exportSummaryCSV}>Download CSV</button>
              <span style={{ color: 'var(--muted)' }}>Lock status: {summary.closed_at ? 'Locked' : 'Open'}</span>
            </div>
            <div className="dept-card" style={{ marginTop: 12 }}>
              <h4>Participation</h4>
              {detailLoading && <p>Loading details…</p>}
              {evalDetail && (
                <div>
                  <div style={{ color: 'var(--muted)' }}>Students in department: {department?.students?.length ?? 0}</div>
                  <div style={{ color: 'var(--muted)' }}>Feedbacks received: {evalDetail.feedbacks?.length ?? 0}</div>
                  <div style={{ marginTop: 6 }}>
                    <progress value={evalDetail.feedbacks?.length ?? 0} max={Math.max(1, department?.students?.length ?? 1)} />
                  </div>
                </div>
              )}
            </div>
            <div className="dept-card" style={{ marginTop: 12 }}>
              <h4>Question Summaries</h4>
              {summary.questions?.length === 0 && <p style={{ color: 'var(--muted)' }}>No responses yet.</p>}
              {summary.questions?.map((q) => (
                <div key={q.question_id} style={{ marginBottom: 10 }}>
                  <div>Question #{q.question_id}</div>
                  <div style={{ color: 'var(--muted)' }}>Average rating: {q.average_rating ?? '—'}</div>
                  <div style={{ color: 'var(--muted)' }}>Responses: {q.responses_count ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentEvaluations;