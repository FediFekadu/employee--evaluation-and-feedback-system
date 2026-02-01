import React, { useState, useEffect, useMemo } from 'react';
import { useErrorHandling } from '../hooks/useErrorHandling';
import api from '../services/api';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';
import ErrorAlert from './ErrorHandling/ErrorAlert';
import ParticipationIndicator from './ParticipationIndicator';

/**
 * TeacherRankings Component
 * 
 * Displays teacher performance rankings with sorting and filtering capabilities.
 * Shows comprehensive performance metrics and insights for each teacher.
 */
function TeacherRankings({ 
  departmentId, 
  period = null,
  sortBy = 'performance',
  sortDirection = 'desc',
  limit = 50,
  showInsights = true,
  showComparison = true,
  className = '',
  onTeacherClick = null,
  refreshInterval = null
}) {
  const [rankingsData, setRankingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [currentSortDirection, setCurrentSortDirection] = useState(sortDirection);
  const [refreshing, setRefreshing] = useState(false);

  const { handleApiCall, addError } = useErrorHandling();

  // Load teacher rankings data
  const loadTeacherRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        sort_by: currentSortBy,
        sort_direction: currentSortDirection,
        limit: limit,
      };

      if (period) {
        params.period = period;
      }

      const response = await handleApiCall(
        () => api.get(`/departments/${departmentId}/teacher-rankings`, { params }),
        'teacher_rankings_load'
      );

      setRankingsData(response.data.data);
    } catch (err) {
      console.error('Failed to load teacher rankings:', err);
      const errorId = addError(err, 'teacher_rankings_load');
      setError('Failed to load teacher rankings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTeacherRankings();
    } catch (err) {
      console.error('Failed to refresh teacher rankings:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle sorting changes
  const handleSort = (field) => {
    if (currentSortBy === field) {
      setCurrentSortDirection(currentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCurrentSortBy(field);
      setCurrentSortDirection('desc');
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (departmentId) {
      loadTeacherRankings();
    }
  }, [departmentId, currentSortBy, currentSortDirection, period, limit]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(handleRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Memoized performance level calculation
  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'satisfactory';
    return 'needs-improvement';
  };

  // Memoized ranking statistics
  const rankingStats = useMemo(() => {
    if (!rankingsData?.rankings) return null;

    const rankings = rankingsData.rankings;
    const totalTeachers = rankings.length;
    const avgPerformance = rankings.reduce((sum, teacher) => sum + teacher.average_performance_score, 0) / totalTeachers;
    const avgParticipation = rankings.reduce((sum, teacher) => sum + teacher.average_participation_rate, 0) / totalTeachers;
    
    const performanceLevels = {
      excellent: rankings.filter(t => t.average_performance_score >= 90).length,
      good: rankings.filter(t => t.average_performance_score >= 80 && t.average_performance_score < 90).length,
      satisfactory: rankings.filter(t => t.average_performance_score >= 70 && t.average_performance_score < 80).length,
      needs_improvement: rankings.filter(t => t.average_performance_score < 70).length,
    };

    return {
      totalTeachers,
      avgPerformance: avgPerformance.toFixed(1),
      avgParticipation: avgParticipation.toFixed(1),
      performanceLevels,
    };
  }, [rankingsData]);

  // Loading state
  if (loading) {
    return (
      <div className={`teacher-rankings loading ${className}`}>
        <LoadingSpinner size="large" showMessage={false} showElapsed={false} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`teacher-rankings error ${className}`}>
        <ErrorAlert
          error={{ response: { data: { message: error } } }}
          onRetry={loadTeacherRankings}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  // No data state
  if (!rankingsData?.rankings || rankingsData.rankings.length === 0) {
    return (
      <div className={`teacher-rankings no-data ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Teacher Rankings</h3>
          <p>No teacher performance data available for the selected period.</p>
          <button className="dept-btn dept-btn-primary" onClick={loadTeacherRankings}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`teacher-rankings ${className}`}>
      {/* Header with controls */}
      <div className="rankings-header">
        <h3 className="rankings-title">
          Teacher Performance Rankings
          {rankingStats && (
            <span className="rankings-subtitle">
              ({rankingStats.totalTeachers} teachers)
            </span>
          )}
        </h3>
        <div className="rankings-controls">
          <select
            value={`${currentSortBy}-${currentSortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setCurrentSortBy(field);
              setCurrentSortDirection(direction);
            }}
            className="sort-select"
          >
            <option value="performance-desc">Performance (High to Low)</option>
            <option value="performance-asc">Performance (Low to High)</option>
            <option value="participation-desc">Participation (High to Low)</option>
            <option value="participation-asc">Participation (Low to High)</option>
            <option value="responses-desc">Responses (Most to Least)</option>
            <option value="responses-asc">Responses (Least to Most)</option>
          </select>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh rankings"
          >
            {refreshing ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      {/* Summary statistics */}
      {showComparison && rankingStats && (
        <div className="rankings-summary">
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">Average Performance</span>
              <span className="stat-value">{rankingStats.avgPerformance}%</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Average Participation</span>
              <span className="stat-value">{rankingStats.avgParticipation}%</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Excellent Performers</span>
              <span className="stat-value">{rankingStats.performanceLevels.excellent}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Need Improvement</span>
              <span className="stat-value">{rankingStats.performanceLevels.needs_improvement}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rankings table */}
      <div className="rankings-table-container">
        <table className="rankings-table">
          <thead>
            <tr>
              <th 
                className="sortable-header"
                onClick={() => handleSort('rank')}
              >
                Rank
                {currentSortBy === 'rank' && (
                  <span className="sort-indicator">
                    {currentSortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleSort('teacher_name')}
              >
                Teacher
                {currentSortBy === 'teacher_name' && (
                  <span className="sort-indicator">
                    {currentSortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleSort('performance')}
              >
                Performance Score
                {currentSortBy === 'performance' && (
                  <span className="sort-indicator">
                    {currentSortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="sortable-header"
                onClick={() => handleSort('participation')}
              >
                Participation Rate
                {currentSortBy === 'participation' && (
                  <span className="sort-indicator">
                    {currentSortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>Courses</th>
              <th>Total Responses</th>
              {showInsights && <th>Insights</th>}
            </tr>
          </thead>
          <tbody>
            {rankingsData.rankings.map((teacher) => (
              <tr 
                key={teacher.teacher_id}
                className={onTeacherClick ? 'clickable-row' : ''}
                onClick={() => onTeacherClick?.(teacher)}
              >
                <td className={`rank-cell ${teacher.rank <= 3 ? 'top-3' : ''}`}>
                  #{teacher.rank}
                </td>
                <td>
                  <div className="teacher-info">
                    <div
                      className="teacher-avatar"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        marginRight: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--neutral-200)',
                        overflow: 'hidden',
                        fontWeight: 600
                      }}
                    >
                      {teacher.photo_url || teacher.profile_photo_url ? (
                        <img
                          src={teacher.photo_url || teacher.profile_photo_url}
                          alt={teacher.teacher_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (teacher.teacher_name || 'U')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                      )}
                    </div>
                    <div className="teacher-name">{teacher.teacher_name}</div>
                    <div className="teacher-meta">
                      {teacher.total_evaluations} evaluation{teacher.total_evaluations !== 1 ? 's' : ''}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={`performance-score ${getPerformanceLevel(teacher.average_performance_score)}`}>
                    {teacher.average_performance_score.toFixed(1)}%
                  </div>
                </td>
                <td>
                  <ParticipationIndicator 
                    rate={teacher.average_participation_rate}
                    variant="badge"
                    size="small"
                    showPercentage={true}
                  />
                </td>
                <td>
                  <div className="course-info">
                    <div className="course-count">
                      {teacher.course_count} course{teacher.course_count !== 1 ? 's' : ''}
                    </div>
                    {teacher.courses_taught && teacher.courses_taught.length > 0 && (
                      <div className="course-list" title={teacher.courses_taught.join(', ')}>
                        {teacher.courses_taught.slice(0, 2).join(', ')}
                        {teacher.courses_taught.length > 2 && ` +${teacher.courses_taught.length - 2} more`}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className="response-count">{teacher.total_responses}</span>
                </td>
                {showInsights && (
                  <td>
                    {teacher.performance_insights && teacher.performance_insights.length > 0 && (
                      <ul className="insights-list">
                        {teacher.performance_insights.slice(0, 2).map((insight, index) => (
                          <li 
                            key={index} 
                            className={`insight-item ${
                              insight.includes('Excellent') || insight.includes('Top performer') ? 'positive' :
                              insight.includes('improvement') || insight.includes('Low') ? 'warning' :
                              insight.includes('concerns') || insight.includes('decline') ? 'alert' : ''
                            }`}
                            title={insight}
                          >
                            {insight.length > 50 ? `${insight.substring(0, 50)}...` : insight}
                          </li>
                        ))}
                        {teacher.performance_insights.length > 2 && (
                          <li className="insight-item">
                            +{teacher.performance_insights.length - 2} more insights
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparative analysis */}
      {showComparison && rankingsData.comparative_analysis && (
        <div className="comparative-analysis">
          <h4>Department Analysis</h4>
          
          {/* Top performers */}
          {rankingsData.comparative_analysis.top_performers.length > 0 && (
            <div className="analysis-section">
              <h5>🌟 Top Performers ({rankingsData.comparative_analysis.top_performers.length})</h5>
              <div className="performer-list">
                {rankingsData.comparative_analysis.top_performers.slice(0, 3).map((teacher) => (
                  <span key={teacher.teacher_id} className="performer-tag excellent">
                    {teacher.teacher_name} ({teacher.average_performance_score.toFixed(1)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvement needed */}
          {rankingsData.comparative_analysis.improvement_needed.length > 0 && (
            <div className="analysis-section">
              <h5>📈 Needs Improvement ({rankingsData.comparative_analysis.improvement_needed.length})</h5>
              <div className="performer-list">
                {rankingsData.comparative_analysis.improvement_needed.slice(0, 3).map((teacher) => (
                  <span key={teacher.teacher_id} className="performer-tag needs-improvement">
                    {teacher.teacher_name} ({teacher.average_performance_score.toFixed(1)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Performance gaps */}
          {rankingsData.comparative_analysis.performance_gaps && (
            <div className="analysis-section">
              <h5>📊 Performance Distribution</h5>
              <div className="gap-info">
                <span className="gap-stat">
                  Highest: {rankingsData.comparative_analysis.performance_gaps.max_score.toFixed(1)}%
                </span>
                <span className="gap-stat">
                  Lowest: {rankingsData.comparative_analysis.performance_gaps.min_score.toFixed(1)}%
                </span>
                <span className="gap-stat">
                  Gap: {rankingsData.comparative_analysis.performance_gaps.gap.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {rankingsData.comparative_analysis.recommendations.length > 0 && (
            <div className="analysis-section">
              <h5>💡 Recommendations</h5>
              <ul className="recommendations-list">
                {rankingsData.comparative_analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="recommendation-item">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="rankings-metadata">
        <small className="metadata-text">
          Period: {rankingsData.period} | 
          Sort: {currentSortBy} ({currentSortDirection}) | 
          Generated: {new Date(rankingsData.generated_at).toLocaleString()}
        </small>
      </div>
    </div>
  );
}

export default TeacherRankings;