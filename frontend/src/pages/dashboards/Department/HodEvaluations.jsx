import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function HodEvaluations() {
  const { id: departmentId } = useParams();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/departments/${departmentId}/hod-evaluations?open_only=true`);
        // Laravel paginator returns { data: [...] }
        const items = Array.isArray(res.data?.data) ? res.data.data : (res.data || []);
        if (mounted) setEvaluations(items);
      } catch (e) {
        if (mounted) setError('Failed to load HOD evaluations.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (departmentId) load();
    return () => { mounted = false; };
  }, [departmentId]);

  const handleSave = async (item, score, remarks) => {
    setSavingId(item.id);
    try {
      await api.post(`/hod-evaluations/${item.id}/score`, { score: Number(score), remarks });
      // Optimistically update local state
      setEvaluations(prev => prev.map(ev => ev.id === item.id ? { ...ev, score: Number(score), remarks } : ev));
    } catch (e) {
      setError('Failed to save HOD score.');
    } finally {
      setSavingId(null);
    }
  };

  const renderItem = (item) => {
    const [scoreState, setScoreState] = useState(item.score ?? '');
    const [remarksState, setRemarksState] = useState(item.remarks ?? '');

    return (
      <div key={item.id} className="hod-eval-card">
        <div className="hod-eval-header">
          <div className="hod-eval-title">
            <span className="teacher-name">{item.teacher?.name || 'Unknown Teacher'}</span>
            <span className="eval-meta">AY {item.academic_year} • {item.semester}</span>
          </div>
          <div className="eval-status">{item.status || 'open'}</div>
        </div>
        <div className="hod-eval-body">
          <div className="score-row">
            <label htmlFor={`score-${item.id}`}>Score (0–100)</label>
            <input
              id={`score-${item.id}`}
              type="number"
              min="0"
              max="100"
              value={scoreState}
              onChange={(e) => setScoreState(e.target.value)}
              className="dept-input"
            />
          </div>
          <div className="remarks-row">
            <label htmlFor={`remarks-${item.id}`}>Remarks (optional)</label>
            <textarea
              id={`remarks-${item.id}`}
              value={remarksState}
              onChange={(e) => setRemarksState(e.target.value)}
              className="dept-textarea"
              rows={3}
            />
          </div>
        </div>
        <div className="hod-eval-actions">
          <button
            className="dept-btn dept-btn-primary"
            disabled={savingId === item.id}
            onClick={() => handleSave(item, scoreState, remarksState)}
          >
            {savingId === item.id ? 'Saving…' : 'Save HOD Score'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="department-page">
      <div className="page-header">
        <h2>HOD Evaluations</h2>
        <p>Record HOD scores for assigned evaluations.</p>
      </div>

      {loading && (
        <div className="loading-state"><div className="loading-spinner"></div><p>Loading HOD evaluations…</p></div>
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
      <div className="hod-evals-list">
        {evaluations.map(ev => (
          <HodEvalItem key={ev.id} item={ev} onSave={handleSave} savingId={savingId} />
        ))}
      </div>
    </div>
  );
}

function HodEvalItem({ item, onSave, savingId }) {
  const [scoreState, setScoreState] = useState(item.score ?? '');
  const [remarksState, setRemarksState] = useState(item.remarks ?? '');

  return (
    <div className="hod-eval-card">
      <div className="hod-eval-header">
        <div className="hod-eval-title">
          <span className="teacher-name">{item.teacher?.name || 'Unknown Teacher'}</span>
          <span className="eval-meta">AY {item.academic_year} • {item.semester}</span>
        </div>
        <div className="eval-status">{item.status || 'open'}</div>
      </div>
      <div className="hod-eval-body">
        <div className="score-row">
          <label htmlFor={`score-${item.id}`}>Score (0–100)</label>
          <input
            id={`score-${item.id}`}
            type="number"
            min="0"
            max="100"
            value={scoreState}
            onChange={(e) => setScoreState(e.target.value)}
            className="dept-input"
          />
        </div>
        <div className="remarks-row">
          <label htmlFor={`remarks-${item.id}`}>Remarks (optional)</label>
          <textarea
            id={`remarks-${item.id}`}
            value={remarksState}
            onChange={(e) => setRemarksState(e.target.value)}
            className="dept-textarea"
            rows={3}
          />
        </div>
      </div>
      <div className="hod-eval-actions">
        <button
          className="dept-btn dept-btn-primary"
          disabled={savingId === item.id}
          onClick={() => onSave(item, scoreState, remarksState)}
        >
          {savingId === item.id ? 'Saving…' : 'Save HOD Score'}
        </button>
      </div>
    </div>
  );
}

export default HodEvaluations;