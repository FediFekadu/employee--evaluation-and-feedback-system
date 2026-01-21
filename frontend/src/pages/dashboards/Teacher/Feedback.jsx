import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';

function TeacherFeedback() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);

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

  // Auto-select first course to streamline viewing
  useEffect(() => {
    if (!selectedCourseId && Array.isArray(courses) && courses.length > 0) {
      setSelectedCourseId(Number(courses[0].id));
    }
  }, [teacher]);

  const courses = teacher?.courses || [];
  const teacherId = teacher?.id || teacher?.teacher_id || null;
  const departmentId = teacher?.department_id || teacher?.department?.id || null;

  // When a course is selected, find the latest evaluation for this teacher + course,
  // then load detailed results and summary.
  useEffect(() => {
    let mounted = true;
    async function loadEvaluationResults() {
      if (!selectedCourseId || !teacherId) {
        setSelectedEvaluation(null);
        setResults(null);
        setSummary(null);
        setEvalError('');
        return;
      }
      setEvalLoading(true);
      setEvalError('');
      try {
        // Fetch evaluations in the teacher's department and pick the one matching course + teacher.
        const params = departmentId ? { params: { department_id: departmentId } } : {};
        const evalRes = await api.get('/evaluations', params);
        const evals = Array.isArray(evalRes.data?.data) ? evalRes.data.data : [];
        // Choose most recent open or latest by opened_at
        const matching = evals
          .filter(e => Number(e.course_id) === Number(selectedCourseId) && Number(e.teacher_id) === Number(teacherId))
          .sort((a, b) => new Date(b.opened_at || 0) - new Date(a.opened_at || 0));

        const selected = matching[0] || null;
        if (!selected) {
          setSelectedEvaluation(null);
          setResults(null);
          setSummary(null);
          setEvalError('No evaluation found for this course.');
          return;
        }
        setSelectedEvaluation(selected);

        // Load detailed results and summary
        const [resultsRes, summaryRes] = await Promise.all([
          api.get(`/evaluations/${selected.id}/results`),
          api.get(`/evaluations/${selected.id}/summary`)
        ]);

        if (!mounted) return;
        setResults(resultsRes.data);
        setSummary(summaryRes.data);
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load evaluation results', e);
        setEvalError('Failed to load evaluation results.');
      } finally {
        if (mounted) setEvalLoading(false);
      }
    }
    loadEvaluationResults();
    return () => { mounted = false; };
  }, [selectedCourseId, teacherId, departmentId]);

  const ratingDistribution = useMemo(() => {
    const dist = results?.participation_analysis?.rating_distribution || results?.response_statistics?.rating_distribution || {};
    const entries = Object.entries(dist);
    if (entries.length === 0) return [];
    return entries
      .map(([rating, value]) => {
        // Backend may return either {1: 3, 2: 5, ...} or {1: {count, percentage}, ...}
        const count = typeof value === 'object' && value !== null ? Number(value.count || 0) : Number(value || 0);
        return { rating: Number(rating), count };
      })
      .sort((a, b) => a.rating - b.rating);
  }, [results]);

  const scoreBreakdownEntries = useMemo(() => {
    const bd = results?.score_breakdown || {};
    return Object.keys(bd).map(key => ({ key, ...bd[key] }));
  }, [results]);

  const sampleComments = useMemo(() => {
    const qs = summary?.questions || [];
    const comments = [];
    qs.forEach(q => {
      (q.sample_comments || []).forEach(text => {
        comments.push({ question_id: q.question_id, text });
      });
    });
    return comments;
  }, [summary]);

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
              {evalLoading && <p>Loading results…</p>}
              {evalError && <p style={{ color: 'red' }}>{evalError}</p>}
              {!evalLoading && !evalError && results && (
                <>
                  {/* Top metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Participation Rate</div>
                      <div style={{ fontSize: 22, fontWeight: 600 }}>{Math.round(results.quick_stats?.participation_rate || 0)}%</div>
                    </div>
                    <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Final Score</div>
                      <div style={{ fontSize: 22, fontWeight: 600 }}>{Math.round(results.final_score || 0)}</div>
                    </div>
                    <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total Responses</div>
                      <div style={{ fontSize: 22, fontWeight: 600 }}>{results.quick_stats?.total_responses || 0}</div>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div style={{ marginTop: 18 }}>
                    <h4 style={{ marginBottom: 8 }}>Score Breakdown</h4>
                    {scoreBreakdownEntries.length === 0 && (
                      <p style={{ color: 'var(--muted)' }}>No breakdown available.</p>
                    )}
                    {scoreBreakdownEntries.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {scoreBreakdownEntries.map(item => (
                          <div key={item.key} style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.key}</div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{Math.round(item.weighted_value || item.average || 0)}</div>
                            {typeof item.weight !== 'undefined' && (
                              (() => {
                                const raw = Number(item.weight) || 0;
                                const pct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
                                return (
                                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Weight: {pct}%</div>
                                );
                              })()
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rating distribution */}
                  <div style={{ marginTop: 18 }}>
                    <h4 style={{ marginBottom: 8 }}>Rating Distribution</h4>
                    {ratingDistribution.length === 0 && (
                      <p style={{ color: 'var(--muted)' }}>No ratings yet.</p>
                    )}
                    {ratingDistribution.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                        {ratingDistribution.map(r => (
                          <div key={r.rating} style={{ padding: 12, border: '1px solid #eee', borderRadius: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>⭐ {r.rating}</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>{r.count}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sample comments */}
                  <div style={{ marginTop: 18 }}>
                    <h4 style={{ marginBottom: 8 }}>Sample Comments</h4>
                    {!summary && <p style={{ color: 'var(--muted)' }}>No comments available.</p>}
                    {summary && sampleComments.length === 0 && (
                      <p style={{ color: 'var(--muted)' }}>No comments available.</p>
                    )}
                    {sampleComments.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                        {sampleComments.map((c, idx) => (
                          <div key={`${c.question_id}-${idx}`} style={{ padding: 12, border: '1px solid #eee', borderRadius: 10 }}>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Question #{c.question_id}</div>
                            <div style={{ fontSize: 14 }}>{c.text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {!evalLoading && !evalError && !results && (
                <p style={{ color: 'var(--muted)' }}>No evaluation data to display.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherFeedback;