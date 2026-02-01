import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function PeerEvaluation() {
  const { peerEvaluationId } = useParams();
  const [teacherId, setTeacherId] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [formInfo, setFormInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Responses keyed by question_id
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const tid = typeof window !== 'undefined' ? window.localStorage.getItem('teacher_id') : null;
    setTeacherId(tid ? Number(tid) : null);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!peerEvaluationId) return;
      setLoading(true);
      setError('');
      try {
        const [showRes, qRes] = await Promise.all([
          api.get(`/peer-evaluations/${peerEvaluationId}`),
          api.get(`/peer-evaluations/${peerEvaluationId}/questions`),
        ]);
        if (!mounted) return;
        setEvaluation(showRes.data?.evaluation || showRes.data);
        setAssignees(showRes.data?.assignees || []);
        const qs = Array.isArray(qRes.data?.questions) ? qRes.data.questions : [];
        setQuestions(qs);
        setFormInfo(qRes.data?.form_info || null);
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load peer evaluation', e);
        setError('Failed to load peer evaluation or questions.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [peerEvaluationId]);

  const assignedToMe = useMemo(() => {
    if (!teacherId) return false;
    return assignees.some(a => Number(a.evaluator_teacher_id) === Number(teacherId));
  }, [assignees, teacherId]);

  const handleRatingChange = (qid, value) => {
    const v = value === 'nc' ? null : Number(value);
    setResponses(prev => ({ ...prev, [qid]: { ...prev[qid], rating: v } }));
  };
  const handleTextChange = (qid, value) => {
    setResponses(prev => ({ ...prev, [qid]: { ...prev[qid], text: value } }));
  };

  const handleSubmit = async () => {
    if (!teacherId) {
      setError('No teacher account found. Please login as a teacher.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSubmitResult(null);
    try {
      const payloadResponses = questions.map(q => {
        const resp = responses[q.id] || {};
        return {
          question_id: q.id,
          rating: q.type === 'rating' ? resp.rating ?? null : null,
          text: q.type === 'text' ? (resp.text ?? '') : null,
        };
      });
      const res = await api.post(`/peer-evaluations/${peerEvaluationId}/responses`, {
        evaluator_teacher_id: Number(teacherId),
        responses: payloadResponses,
      });
      setSubmitResult(res.data);
    } catch (e) {
      console.error('Failed to submit peer responses', e);
      setError(e.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-page">
      <div className="page-header">
        <h2>Peer Evaluation</h2>
        {evaluation && (
          <p>
            Evaluating: <strong>{evaluation.teacher?.name || 'Unknown Teacher'}</strong> • AY {evaluation.academic_year} • {evaluation.semester}
          </p>
        )}
      </div>

      {loading && <div className="loading-state"><div className="loading-spinner"></div></div>}
      {error && <div className="error-state">{error}</div>}

      {!loading && !error && !assignedToMe && (
        <div className="warning-state">You are not assigned to this peer evaluation.</div>
      )}

      {!loading && !error && assignedToMe && (
        <div className="peer-form">
          {formInfo && (
            <div className="form-info">
              <h3>{formInfo.title || 'Instructions'}</h3>
              <p>{formInfo.description || 'Please provide ratings and comments where applicable.'}</p>
            </div>
          )}

          {/* Rating questions rendered as table grid, reusing student styles */}
          <div className="evaluation-table-container">
            <table className="evaluation-table">
              <colgroup>
                <col style={{ width: '50%' }} />
                <col style={{ width: '8.33%' }} />
                <col style={{ width: '8.33%' }} />
                <col style={{ width: '8.33%' }} />
                <col style={{ width: '8.33%' }} />
                <col style={{ width: '8.33%' }} />
                <col style={{ width: '8.33%' }} />
              </colgroup>
              <thead>
                <tr className="table-header">
                  <th rowSpan="2" className="criteria-header">EVALUATION CRITERIA የምዘና መስፈርት</th>
                  <th colSpan="6" className="rating-header">Rating Scale</th>
                </tr>
                <tr className="scale-header">
                  {[1,2,3,4,5].map(r => (
                    <th key={r} className="scale-column">
                      <div className="scale-label">
                        <div className="scale-number">{r}</div>
                        <div className="scale-text">{r === 1 ? 'Very Low' : r === 2 ? 'Low' : r === 3 ? 'Medium' : r === 4 ? 'High' : 'Very High'}</div>
                      </div>
                    </th>
                  ))}
                  <th className="scale-column">
                    <div className="scale-label">
                      <div className="scale-number">NC</div>
                      <div className="scale-text">Does not Apply</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {questions.filter(q => q.type === 'rating').map((q, idx) => (
                  <tr key={q.id} className="criteria-row">
                    <td className="criteria-cell">
                      <div className="criteria-number">{idx + 1}</div>
                      <div className="criteria-text">{q.text || q.question || 'Untitled question'}</div>
                    </td>
                    {[1, 2, 3, 4, 5, 'nc'].map((rating) => (
                      <td key={rating} className="rating-cell">
                        <label className="rating-option">
                          <input
                            type="radio"
                            name={`q-${q.id}-rating`}
                            value={rating}
                            checked={(responses[q.id]?.rating === (rating === 'nc' ? null : Number(rating)))}
                            onChange={(e) => handleRatingChange(q.id, e.target.value)}
                          />
                          <span className="radio-mark">○</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Text questions */}
          {questions.some(q => q.type === 'text') && (
            <div className="text-questions">
              {questions.filter(q => q.type === 'text').map((q, idx) => (
                <div key={q.id} className="text-question-row">
                  <div className="q-index small">{idx + 1}</div>
                  <div className="q-text">{q.text || q.question || 'Untitled question'}</div>
                  <textarea
                    rows={3}
                    value={responses[q.id]?.text || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="teacher-textarea"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="form-note">
            <strong>Note:</strong> Your feedback is valuable and will be kept confidential. This evaluation helps improve teaching quality and student learning experience.
          </div>

          <div className="form-actions">
            <button
              className="teacher-btn teacher-btn-primary"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting…' : 'Submit Responses'}
            </button>
          </div>

          {submitResult && (
            <div className="submit-success">
              <h3>Submission Successful</h3>
              <p>Computed score: <strong>{submitResult.score}%</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PeerEvaluation;