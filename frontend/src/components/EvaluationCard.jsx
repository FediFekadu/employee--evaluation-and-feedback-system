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

  // Performance status color classes
  const getPerformanceClass = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('excellent')) return 'perf-excellent';
    if (l.includes('very')) return 'perf-verygood';
    if (l.includes('good')) return 'perf-good';
    if (l.includes('average')) return 'perf-average';
    if (l.includes('unsatisfactory') || l.includes('poor')) return 'perf-unsatisfactory';
    return 'perf-unknown';
  };

  return (
    <div className="evaluation-card compact">
      <div className="compact-top">
        <div className="course-block">
          <div className="title-row">
            <span className="course-title">{evaluation.course?.title || 'Unknown Course'}</span>
          </div>
          <div className="instructor-row">
            <div className="avatar-small">
              <span className="avatar-initials">
                {evaluation.teacher?.name ?
                  evaluation.teacher.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                  'UN'
                }
              </span>
            </div>
            <span className="instructor-name">{evaluation.teacher?.name || 'Unknown Instructor'}</span>
            <span className="course-code">{evaluation.course?.code || 'N/A'}</span>
            <span className="opened-date">{evaluation.opened_at ? new Date(evaluation.opened_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
        <div className="status-block">
          <StatusBadge status={evaluation.status} type="evaluation" />
        </div>
      </div>

      <div className="compact-middle">
        <div className="participation-inline">
          <ParticipationIndicator
            rate={evaluation.participation?.participation_rate || 0}
            variant="bar"
            size="small"
            showPercentage={true}
            showLabel={false}
          />
          <span className="responses-chip">
            {evaluation.participation?.total_responses || 0} responses
          </span>
        </div>
        {evaluation.weighted_scores && (
          <div className="final-score-inline">
            <span className={`final-score-badge compact ${getPerformanceClass(evaluation.weighted_scores.performance_level)}`}>
              <span className="score-icon">⭐</span>
              <span className="score-value">{evaluation.weighted_scores.weighted_score}%</span>
              <span className="performance-level">{evaluation.weighted_scores.performance_level}</span>
            </span>
            <span className="breakdown-inline">
              Stu {evaluation.weighted_scores.student_score}% • Peer {evaluation.weighted_scores.peer_score}% • HOD {evaluation.weighted_scores.admin_score}%
            </span>
          </div>
        )}
      </div>

      <div className="compact-actions">
        <button
          className="dept-btn dept-btn-primary card-action-btn"
          onClick={handleViewResults}
        >
          View Results
        </button>
        <span className="evaluation-id">ID: {evaluation.id}</span>
      </div>
    </div>
  );
});

EvaluationCard.displayName = 'EvaluationCard';

export default EvaluationCard;