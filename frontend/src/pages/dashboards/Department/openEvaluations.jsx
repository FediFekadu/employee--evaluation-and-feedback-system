import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentManageEvaluations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [evalFilter, setEvalFilter] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ status: 'all' });
  const [evalSortKey, setEvalSortKey] = useState('opened_at');
  const [evalSortDir, setEvalSortDir] = useState('desc');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(5);

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

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const deleteEvaluation = async (evaluationId) => {
    if (!window.confirm('Are you sure you want to delete this evaluation? This will permanently remove all related feedbacks and cannot be undone.')) return;
    setActionLoading(`delete-${evaluationId}`);
    try {
      await api.delete(`/evaluations/${evaluationId}`);
      setMessage('✅ Evaluation deleted successfully');
      await loadEvaluations();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete evaluation');
    } finally {
      setActionLoading(null);
    }
  };

  const closeEvaluation = async (evaluationId) => {
    if (!window.confirm('Are you sure you want to close this evaluation? Students will no longer be able to submit responses.')) return;
    setActionLoading(`close-${evaluationId}`);
    try {
      await api.post(`/evaluations/${evaluationId}/close`);
      setMessage('✅ Evaluation closed successfully');
      await loadEvaluations();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to close evaluation');
    } finally {
      setActionLoading(null);
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
      </div>

      {/* Session Evaluations card moved here */}
      <div className="dept-card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4>Session Evaluations</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="dept-btn dept-btn-primary" onClick={loadEvaluations} title="Refresh data">🔄 Refresh</button>
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

        {loading && (
          <div className="loading-state"><div className="loading-spinner"></div></div>
        )}
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
                        <th align="left">Instructor</th>
                        <th align="left">Status</th>
                        <th align="left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((ev) => (
                        <tr key={ev.id}>
                          <td>{ev.teacher?.name}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ev.closed_at ? '#95a5a6' : '#27ae60', display: 'inline-block' }} />
                              {ev.closed_at ? 'Closed' : 'Active'}
                            </div>
                          </td>
                          <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button className="dept-btn dept-btn-primary" onClick={() => editFormQuestions(ev.id)}>Edit Form</button>
                            <button className="dept-btn dept-btn-ghost" onClick={() => navigate(`/department/${id}/results/${ev.id}`)}>View Results</button>
                            {!ev.closed_at && (
                              <button 
                                className="dept-btn dept-btn-ghost" 
                                onClick={() => closeEvaluation(ev.id)}
                                disabled={actionLoading === `close-${ev.id}`}
                              >
                                {actionLoading === `close-${ev.id}` ? 'Closing...' : 'Close'}
                              </button>
                            )}
                            <button 
                              className="dept-btn dept-btn-danger" 
                              onClick={() => deleteEvaluation(ev.id)}
                              disabled={actionLoading === `delete-${ev.id}`}
                            >
                              {actionLoading === `delete-${ev.id}` ? 'Deleting...' : 'Delete'}
                            </button>
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
      {message && (
        <div className="refresh-notification success" role="status" style={{ marginTop: 16 }}>
          <span className="notification-icon">✅</span>
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="refresh-notification error" role="alert" style={{ marginTop: 16 }}>
          <span className="notification-icon">❌</span>
          <span>{error}</span>
        </div>
      )}
      {loading && <div className="loading-state"><div className="loading-spinner"></div></div>}
    </div>
  );
}

export default DepartmentManageEvaluations;