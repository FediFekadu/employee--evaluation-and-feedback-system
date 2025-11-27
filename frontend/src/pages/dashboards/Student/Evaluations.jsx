import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function StudentEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [evalDetail, setEvalDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const deptId = typeof window !== 'undefined' ? Number(localStorage.getItem('department_id')) : null;
    const yearLevel = typeof window !== 'undefined' ? Number(localStorage.getItem('year_level')) : null;
    const semesterNum = typeof window !== 'undefined' ? Number(localStorage.getItem('semester')) : null;
    const semesterStr = semesterNum === 2 ? 'Semester II' : 'Semester I';
    if (deptId && yearLevel) {
      api.get(`/evaluations?department_id=${deptId}&open_only=true&year_level=${yearLevel}&semester=${encodeURIComponent(semesterStr)}`)
        .then((res) => {
          if (!mounted) return;
          setEvaluations(res.data?.data || []);
        })
        .catch(() => {})
        .finally(() => {});
    }
    return () => { mounted = false; };
  }, []);

  const openEval = async (evaluationId) => {
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

  return (
    <div>
      <h2>Open Evaluations</h2>
      {evaluations.length === 0 && <p>No evaluations open for you right now.</p>}
      {evaluations.length > 0 && (
        <ul style={{ display: 'grid', gap: 8 }}>
          {evaluations.map((ev) => (
            <li key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                {ev.course?.title || 'Course'} — {ev.teacher?.name || 'Instructor'}
              </span>
              <button className="btn btn-primary" onClick={() => openEval(ev.id)}>Fill Evaluation</button>
            </li>
          ))}
        </ul>
      )}

      {evalDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
          <div className="card" style={{ width: 560 }}>
            <h3>Evaluation: {evalDetail.course?.title} — {evalDetail.teacher?.name}</h3>
            <p style={{ color: 'var(--muted)' }}>Academic Year: {evalDetail.academic_year}, {evalDetail.semester}</p>
            <div style={{ display: 'grid', gap: 12 }}>
              {detailLoading && <p>Loading…</p>}
              {!detailLoading && (
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: 10 }}>
                  {(evalDetail?.questions || []).map((q) => (
                    <div key={q.id}>
                      <div style={{ fontWeight: 500 }}>{q.text}</div>
                      {q.type === 'rating' ? (
                        <select className="btn btn-ghost" defaultValue="" data-qid={q.id}>
                          <option value="">Select rating</option>
                          {[1,2,3,4,5].map((r) => (
                            <option key={r} value={String(r)}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <textarea className="btn btn-ghost" rows={2} placeholder="Your comment" data-qid={q.id}></textarea>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setEvalDetail(null)}>Cancel</button>
                    <button className="btn btn-primary" disabled={submitLoading} onClick={async () => {
                      const studentDbId = typeof window !== 'undefined' ? Number(localStorage.getItem('student_db_id')) : null;
                      if (!studentDbId) {
                        alert('Missing student identity');
                        return;
                      }
                      const already = (evalDetail?.feedbacks || []).some((fb) => Number(fb.student_id) === studentDbId);
                      if (already) {
                        alert('You already submitted this evaluation');
                        return;
                      }
                      const inputs = Array.from(document.querySelectorAll('[data-qid]'));
                      const responses = inputs.map((el) => {
                        const qid = Number(el.getAttribute('data-qid'));
                        let rating = null;
                        let text = null;
                        if (el.tagName.toLowerCase() === 'select') {
                          const v = el.value ? Number(el.value) : null;
                          rating = v;
                        } else {
                          text = el.value || null;
                        }
                        return { question_id: qid, rating, text };
                      });
                      setSubmitLoading(true);
                      try {
                        await api.post('/feedbacks', { evaluation_id: evalDetail.id, student_id: studentDbId, anonymous: false, responses });
                        alert('Submitted successfully');
                        setEvalDetail(null);
                        setEvaluations((prev) => prev.map((ev) => ev.id === evalDetail.id ? { ...ev } : ev));
                      } catch (e) {
                        alert('Failed to submit. If you already submitted, you cannot submit again.');
                      } finally {
                        setSubmitLoading(false);
                      }
                    }}>Submit</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentEvaluations;