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
    <div className="evaluation-card professional">
      <div className="card-header">
        <div className="course-info">
          <h4 className="course-title">{evaluation.course?.title || 'Unknown Course'}</h4>
          <div className="course-meta">
            <span className="course-code">{evaluation.course?.code || 'N/A'}</span>
            <span className="separator">•</span>
            <span className="semester">{evaluation.academic_year || '2026'} • {evaluation.semester || 'Semester I'}</span>
          </div>
        </div>
        <StatusBadge status={evaluation.status} type="evaluation" />
      </div>

      <div className="card-body">
        <div className="instructor-section">
          <div className="instructor-avatar" style={{ overflow: 'hidden' }}>
            {evaluation.teacher?.photo_url ? (
              <img src={evaluation.teacher.photo_url} alt={evaluation.teacher?.name || 'Instructor'} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              (evaluation.teacher?.name ?
                evaluation.teacher.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                'UN'
              )
            )}
          </div>
          <div className="instructor-details">
            <span className="instructor-name">{evaluation.teacher?.name || 'Unknown Instructor'}</span>
            <span className="department">Department: {evaluation.department || 'Software Engineering'}</span>
          </div>
        </div>

        <div className="evaluation-meta">
          <div className="meta-item">
            <span className="meta-label">Opened:</span>
            <span className="meta-value">
              {evaluation.opened_at ? new Date(evaluation.opened_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {evaluation.participation && (
            <div className="meta-item">
              <span className="meta-label">Responses:</span>
              <span className="meta-value">{evaluation.participation.total_responses || 0}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        <button
          className="btn-primary compact"
          onClick={handleViewResults}
        >
          View Results
        </button>
      </div>
    </div>
  );
});

EvaluationCard.displayName = 'EvaluationCard';

export default EvaluationCard;