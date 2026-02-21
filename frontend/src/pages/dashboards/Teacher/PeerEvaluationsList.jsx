import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import StyledCard from '../../../components/Common/StyledCard';

function PeerEvaluationsList() {
  const location = useLocation();
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
          <p>Review and complete your peer evaluations.</p>
        </div>
      </div>

      <div className="dashboard-section">
        {location.state?.justSubmitted && (
          <div className="success-state">
            <span className="success-icon">✓</span>
            <span>Submitted successfully — thank you for your feedback.</span>
          </div>
        )}
        {location.state?.alreadySubmitted && (
          <div className="info-state">
            <span className="info-icon">ℹ️</span>
            <span>Already submitted — you can review your evaluations below.</span>
          </div>
        )}
        {evaluations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3>No Released Peer Evaluations</h3>
            <p>You currently have no peer evaluations to complete.
              If you expect assignments, contact your department administrator.
            </p>
          </div>
        ) : (
          <div className="modern-peer-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {evaluations.map((ev, index) => {
              const isSubmitted = ev.submitted;
              const statusColor = isSubmitted ? '#10b981' : '#3b82f6';
              const statusBg = isSubmitted ? '#d1fae5' : '#dbeafe';

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
                  iconBgColor={statusBg}
                  iconColor={statusColor}
                  title={ev.teacher?.name || 'Assigned Teacher'}
                  subtitle={ev.department?.name || 'Department'}
                  timestamp={`AY ${ev.academic_year}`}
                  description={
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <span style={{ fontWeight: 600 }}>{ev.semester}</span>
                       <span style={{ fontSize: '12px', color: '#6b7280' }}>
                         Opened: {ev.opened_at ? new Date(ev.opened_at).toLocaleDateString() : '—'}
                       </span>
                     </div>
                  }
                  status={
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      backgroundColor: statusBg,
                      color: statusColor
                    }}>
                      {isSubmitted ? 'Submitted' : 'Open'}
                    </span>
                  }
                  footer={
                    isSubmitted ? (
                      <button 
                        disabled 
                        style={{ 
                          width: '100%', 
                          marginTop: '16px',
                          padding: '8px', 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb', 
                          background: '#f9fafb', 
                          color: '#9ca3af', 
                          fontWeight: 500,
                          cursor: 'default' 
                        }}
                      >
                        Completed
                      </button>
                    ) : (
                      <Link to={`/teacher/peer-evaluations/${ev.id}`} style={{ display: 'block', textDecoration: 'none', width: '100%', marginTop: '16px' }}>
                        <button 
                          style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: '#3b82f6', 
                            color: 'white', 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#2563eb'}
                          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                        >
                          Start Evaluation
                        </button>
                      </Link>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PeerEvaluationsList;