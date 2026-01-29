import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

function PeerEvaluationsList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluations, setEvaluations] = useState([]);

  useEffect(() => {
    const teacherId = typeof window !== 'undefined' ? localStorage.getItem('teacher_id') : null;
    if (!teacherId) {
      setError('No teacher account found. Please login as a teacher.');
      setLoading(false);
      return;
    }

    const fetchEvaluations = async () => {
      try {
        const res = await api.get(`/teachers/${teacherId}/peer-evaluations`, {
          params: { released_only: true }
        });
        const items = res?.data?.data?.data || res?.data?.data || res?.data || [];
        setEvaluations(items);
      } catch (e) {
        setError('Failed to load peer evaluations.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading peer evaluations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>Unable to Load Peer Evaluations</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Peer Evaluations</h1>
          <p>Review and submit evaluations assigned to you.</p>
        </div>
      </div>

      <div className="dashboard-section">
        {evaluations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3>No Released Peer Evaluations</h3>
            <p>You currently have no peer evaluations to complete.
              If you expect assignments, contact your department administrator.
            </p>
          </div>
        ) : (
          <div className="modern-peer-cards-grid">
            {evaluations.map((ev, index) => (
              <div className={`modern-peer-card card-${(index % 4) + 1}`} key={ev.id}>
                <div className="card-gradient-top">
                  <div className="card-number">{index + 1}</div>
                </div>
                
                <div className="card-content">
                  <div className="teacher-avatar-circle">
                    {ev?.teacher?.name ? 
                      ev.teacher.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                      'UN'
                    }
                  </div>
                  
                  <h3 className="teacher-title">{ev?.teacher?.name || 'Assigned Teacher'}</h3>
                  <p className="department-subtitle">{ev?.department?.name || 'Software Engineering'}</p>
                  
                  <div className="card-meta">
                    <div className="meta-item">
                      <span>Opened: {ev?.opened_at ? new Date(ev.opened_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="meta-item">
                      <span>Status: {ev.submitted ? 'Submitted' : 'Open'}</span>
                    </div>
                  </div>
                  
                  <div className="card-action">
                    {ev.submitted ? (
                      <div className="status-pill submitted">
                        ✓ Already Submitted
                      </div>
                    ) : (
                      <Link className="evaluate-btn" to={`/teacher/peer-evaluations/${ev.id}`}>
                        Evaluate
                      </Link>
                    )}
                  </div>
                  
                  <div className="academic-badge">
                    {ev.academic_year} • {ev.semester}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PeerEvaluationsList;