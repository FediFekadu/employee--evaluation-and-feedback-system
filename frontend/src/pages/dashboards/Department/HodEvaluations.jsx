import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import StyledCard from '../../../components/Common/StyledCard';

function HodEvaluations() {
  const { id: departmentId } = useParams();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEval, setSelectedEval] = useState(null);
  const [templateQuestions, setTemplateQuestions] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  const loadEvaluations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/departments/${departmentId}/hod-evaluations`);
      const items = Array.isArray(res.data?.data) ? res.data.data : (res.data || []);
      setEvaluations(items);
    } catch (e) {
      console.error('Failed to load HOD evaluations', e);
      setError(`Failed to load HOD evaluations: ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departmentId) {
      loadEvaluations();
      loadTemplate();
    }
  }, [departmentId]);

  const loadTemplate = async () => {
    setTemplateLoading(true);
    try {
      const res = await api.get(`/departments/${departmentId}/hod-template`);
      setTemplateQuestions(res.data.questions || []);
    } catch (e) {
      console.error('Failed to load evaluation template', e);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleOpenEvaluation = (evaluation) => {
    setSelectedEval(evaluation);
  };

  const handleCloseModal = () => {
    setSelectedEval(null);
    loadEvaluations(); // Refresh list to update status/score
  };

  return (
    <div className="department-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2>HOD Evaluations</h2>
            <p>Evaluate teachers based on department criteria.</p>
        </div>
      </div>

      {loading && (
        <div className="loading-state"><div className="loading-spinner"></div></div>
      )}
      {error && (
        <div className="error-state">{error}</div>
      )}
      {!loading && !error && evaluations.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👨‍💼</div>
          <h3>No HOD evaluations found</h3>
          <p>Open or assign HOD evaluations to begin scoring.</p>
        </div>
      )}

      <div className="hod-evals-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {evaluations.map(ev => {
          const isSubmitted = ev.status === 'submitted';
          const statusColor = isSubmitted ? '#10b981' : '#f59e0b'; // Green or Amber
          const statusBg = isSubmitted ? '#d1fae5' : '#fef3c7';
          
          return (
            <StyledCard
              key={ev.id}
              icon={
                ev.teacher?.photo_url || ev.teacher?.profile_photo_url ? (
                  <img 
                    src={ev.teacher.photo_url || ev.teacher.profile_photo_url} 
                    alt={ev.teacher?.name} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  (ev.teacher?.name || 'T').charAt(0).toUpperCase()
                )
              }
              iconBgColor={isSubmitted ? '#ecfdf5' : '#fffbeb'}
              iconColor={statusColor}
              title={ev.teacher?.name || 'Unknown Teacher'}
              subtitle={`AY ${ev.academic_year} • ${ev.semester}`}
              timestamp={ev.updated_at ? new Date(ev.updated_at).toLocaleDateString() : 'New'}
              description={isSubmitted ? `Evaluation completed. Score: ${Number(ev.score).toFixed(1)}` : 'Pending evaluation. Click to start.'}
              onClick={() => !isSubmitted && handleOpenEvaluation(ev)}
              status={
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: 600,
                  backgroundColor: statusBg,
                  color: statusColor
                }}>
                  {isSubmitted ? 'Submitted' : 'Pending'}
                </span>
              }
              footer={
                 <button 
                   className={`dept-btn ${isSubmitted ? 'dept-btn-secondary' : 'dept-btn-primary'}`}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (!isSubmitted) handleOpenEvaluation(ev);
                   }}
                   disabled={isSubmitted}
                   style={{ padding: '6px 16px', fontSize: '13px', opacity: isSubmitted ? 0.7 : 1 }}
                 >
                   {isSubmitted ? 'Completed' : 'Evaluate'}
                 </button>
              }
            />
          );
        })}
      </div>

      {selectedEval && (
        <HodEvaluationModal
          evaluation={selectedEval}
          questions={templateQuestions}
          onClose={handleCloseModal}
          templateLoading={templateLoading}
        />
      )}
    </div>
  );
}

function HodEvaluationModal({ evaluation, questions, onClose, templateLoading }) {
  const [responses, setResponses] = useState({});
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing responses if any
    const loadDetails = async () => {
      try {
        const res = await api.get(`/hod-evaluations/${evaluation.id}`);
        const existingEval = res.data;
        
        // Populate responses
        const initialResponses = {};
        if (existingEval.responses && Array.isArray(existingEval.responses)) {
            existingEval.responses.forEach(r => {
                initialResponses[r.hod_template_question_id] = {
                    rating: r.rating,
                    text: r.text
                };
            });

            // RECOVERY LOGIC: If we have responses but they don't match current question IDs
            // (likely due to template update wiping IDs), try to map by index.
            const hasMatchingIds = questions.some(q => initialResponses[q.id]);
            if (!hasMatchingIds && existingEval.responses.length > 0) {
                 console.warn('HOD Evaluation: ID mismatch detected. Attempting recovery by index.');
                 // Sort responses by ID (assuming creation order)
                 const sortedResponses = [...existingEval.responses].sort((a, b) => a.id - b.id);
                 // Sort questions by order
                 const sortedQuestions = [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));
                 
                 // Only attempt if counts match or are close enough to be useful (e.g., within reason)
                 // For now, strict count match to avoid misalignment
                 if (sortedResponses.length <= sortedQuestions.length) {
                     sortedResponses.forEach((r, index) => {
                         if (sortedQuestions[index]) {
                            initialResponses[sortedQuestions[index].id] = {
                                rating: r.rating,
                                text: r.text
                            };
                         }
                     });
                 }
            }
        }
        setResponses(initialResponses);
        setRemarks(existingEval.remarks || '');
      } catch (e) {
        console.error('Failed to load evaluation details', e);
        setError('Failed to load existing responses.');
      } finally {
        setLoading(false);
      }
    };
    
    if (evaluation.id) {
        loadDetails();
    }
  }, [evaluation.id]);

  const handleRatingChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating: value === 'nc' ? null : Number(value) }
    }));
  };

  const handleTextChange = (questionId, value) => {
    setResponses(prev => ({
        ...prev,
        [questionId]: { ...prev[questionId], text: value }
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    
    // Validate: ensure all rating questions have a rating
    const ratingQuestions = questions.filter(q => q.type === 'rating');
    const missing = ratingQuestions.filter(q => {
        const r = responses[q.id];
        return !r || r.rating === undefined;
    });
    
    if (missing.length > 0) {
        setError(`Please answer all ${ratingQuestions.length} rating questions.`);
        setSubmitting(false);
        return;
    }

    try {
      const payload = {
        responses: Object.entries(responses).map(([qId, val]) => ({
            question_id: Number(qId),
            rating: val.rating,
            text: val.text
        })),
        remarks,
        status: 'submitted'
      };

      await api.post(`/hod-evaluations/${evaluation.id}/submit`, payload);
      onClose(); // Close modal on success (which triggers refresh)
    } catch (e) {
      console.error('Submission failed', e);
      setError('Failed to submit evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || templateLoading) {
      return (
          <div className="modal-overlay">
              <div className="modal-content" style={{ padding: 40, textAlign: 'center' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading evaluation form...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: 'var(--bg-primary)', width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', borderRadius: 12, padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <h3 style={{ margin: 0 }}>Evaluate {evaluation.teacher?.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted)' }}>&times;</button>
        </div>
        
        <div className="modal-body" style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            {error && (
                <div className="error-alert" style={{ background: '#fee2e2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    {error}
                </div>
            )}
            
            {questions.length === 0 ? (
                <div className="empty-state">
                    <p>No evaluation criteria found for this department.</p>
                </div>
            ) : (
                <div className="evaluation-form">
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-soft)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', width: '40%' }}>Evaluation Criteria</th>
                                {[1, 2, 3, 4, 5].map(score => (
                                    <th key={score} style={{ padding: '12px 8px', textAlign: 'center', minWidth: 60 }}>
                                        <div style={{ fontSize: 16, fontWeight: 600 }}>{score}</div>
                                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
                                            {score === 1 ? 'Poor' : score === 2 ? 'Fair' : score === 3 ? 'Good' : score === 4 ? 'Very Good' : 'Excellent'}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ padding: '12px 8px', textAlign: 'center', minWidth: 60 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>NC</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>Does not Apply</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((q, index) => (
                                <React.Fragment key={q.id}>
                                    {q.type === 'rating' ? (
                                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                                                <div style={{ fontWeight: 500, marginBottom: 4 }}>{index + 1}. {q.text}</div>
                                            </td>
                                            {[1, 2, 3, 4, 5].map(score => (
                                                <td key={score} style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                    <label style={{ cursor: 'pointer', display: 'block', height: '100%' }}>
                                                        <input
                                                            type="radio"
                                                            name={`q-${q.id}`}
                                                            value={score}
                                                            checked={responses[q.id]?.rating === score}
                                                            onChange={() => handleRatingChange(q.id, score)}
                                                            style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                                                        />
                                                    </label>
                                                </td>
                                            ))}
                                            <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <label style={{ cursor: 'pointer', display: 'block', height: '100%' }}>
                                                    <input
                                                        type="radio"
                                                        name={`q-${q.id}`}
                                                        value="nc"
                                                        checked={responses[q.id]?.rating === null}
                                                        onChange={() => handleRatingChange(q.id, 'nc')}
                                                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                                                    />
                                                </label>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={q.id}>
                                            <td colSpan={7} style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
                                                <div style={{ fontWeight: 500, marginBottom: 8 }}>{index + 1}. {q.text}</div>
                                                <textarea
                                                    className="dept-textarea"
                                                    value={responses[q.id]?.text || ''}
                                                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                                                    placeholder="Enter your comments here..."
                                                    rows={3}
                                                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border-input)' }}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    <div className="general-remarks" style={{ marginTop: 24 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>General Remarks</label>
                        <textarea
                            className="dept-textarea"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Overall comments regarding this evaluation..."
                            rows={4}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border-input)' }}
                        />
                    </div>
                </div>
            )}
        </div>

        <div className="modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
          <button className="dept-btn dept-btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="dept-btn dept-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HodEvaluations;
