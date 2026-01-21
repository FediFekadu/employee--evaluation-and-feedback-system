import React, { memo } from 'react';
import StatusBadge from './StatusBadge';
import ParticipationIndicator from './ParticipationIndicator';

const EvaluationCard = memo(({
  evaluation,
  onViewResults,
  getParticipationClass
}) => {
  const handleViewResults = () => {
    onViewResults(evaluation.id);
  };

  return (
    <div className="evaluation-card">
      {/* Card Header with Color Indicator */}
      <div className={`card-header ${getParticipationClass(evaluation.participation?.participation_rate || 0)}`}>
        <div className="card-header-content">
          <div className="course-info">
            <h3 className="course-title">{evaluation.course?.title || 'Unknown Course'}</h3>
            <span className="course-code">{evaluation.course?.code || 'N/A'}</span>
          </div>
          <StatusBadge 
            status={evaluation.status} 
            type="evaluation"
          />
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Instructor Info */}
        <div className="instructor-section">
          <div className="instructor-avatar">
            <span className="avatar-initials">
              {evaluation.teacher?.name ? 
                evaluation.teacher.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                'UN'
              }
            </span>
          </div>
          <div className="instructor-details">
            <div className="instructor-name">{evaluation.teacher?.name || 'Unknown Instructor'}</div>
            <div className="instructor-meta">
              <span className="year-level">{evaluation.course?.year_level || 'N/A'}</span>
              <span className="separator">•</span>
              <span className="opened-date">
                {evaluation.opened_at ? 
                  new Date(evaluation.opened_at).toLocaleDateString() : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Participation Metrics */}
        <div className="participation-section">
          <div className="participation-header">
            <span className="section-label">Participation</span>
            <ParticipationIndicator 
              rate={evaluation.participation?.participation_rate || 0}
              variant="badge"
              size="small"
              showPercentage={true}
              showLabel={true}
            />
          </div>
          
          <div className="participation-details">
            <div className="response-count">
              <span className="count-number">{evaluation.participation?.total_responses || 0}</span>
              <span className="count-label">responses</span>
            </div>
            <div className="participation-bar">
              <ParticipationIndicator 
                rate={evaluation.participation?.participation_rate || 0}
                variant="bar"
                size="small"
                showPercentage={false}
                showLabel={false}
              />
            </div>
            <div className="data-quality">
              <span className={`quality-indicator ${getParticipationClass(evaluation.participation?.participation_rate || 0)}`}>
                {evaluation.participation?.data_quality || 'Limited'}
              </span>
            </div>
          </div>
        </div>

        {/* Weighted Score Display */}
        {evaluation.weighted_scores && (
          <div className="weighted-score-section">
            <div className="score-header">
              <span className="section-label">Final Score</span>
              <div className="final-score-badge">
                <span className="score-value">{evaluation.weighted_scores.weighted_score}%</span>
                <span className="performance-level">{evaluation.weighted_scores.performance_level}</span>
              </div>
            </div>
            
            <div className="score-mini-breakdown">
              <div className="mini-score-item">
                <span className="mini-label">Student</span>
                <span className="mini-value">{evaluation.weighted_scores.student_score}%</span>
                <span className="mini-weight">(50%)</span>
              </div>
              <div className="mini-score-item">
                <span className="mini-label">Teachers</span>
                <span className="mini-value">{evaluation.weighted_scores.peer_score}%</span>
                <span className="mini-weight">(30%)</span>
              </div>
              <div className="mini-score-item">
                <span className="mini-label">Head of Department (HOD)</span>
                <span className="mini-value">{evaluation.weighted_scores.admin_score}%</span>
                <span className="mini-weight">(20%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Card Actions */}
        <div className="card-actions">
          <button 
            className="dept-btn dept-btn-primary card-action-btn"
            onClick={handleViewResults}
          >
            View Results
          </button>
          <div className="card-meta">
            <span className="evaluation-id">ID: {evaluation.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

EvaluationCard.displayName = 'EvaluationCard';

export default EvaluationCard;