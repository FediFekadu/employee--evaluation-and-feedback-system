import React, { useState, useEffect, useMemo } from 'react';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import api from '../../services/api';
import DashboardCard from './DashboardCard';
import StatCard from './StatCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ParticipationIndicator from '../ParticipationIndicator';

/**
 * Enhanced Teacher Rankings Component
 * 
 * Modern, interactive teacher rankings with enhanced UI design,
 * smooth animations, and improved filtering/sorting capabilities.
 */
function EnhancedTeacherRankings({ 
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerformanceLevel, setSelectedPerformanceLevel] = useState('all');

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

  // Filtered and searched rankings
  const filteredRankings = useMemo(() => {
    if (!rankingsData?.rankings) return [];

    let filtered = rankingsData.rankings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.courses_taught?.some(course => 
          course.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply performance level filter
    if (selectedPerformanceLevel !== 'all') {
      filtered = filtered.filter(teacher => 
        getPerformanceLevel(teacher.average_performance_score) === selectedPerformanceLevel
      );
    }

    return filtered;
  }, [rankingsData, searchTerm, selectedPerformanceLevel]);

  // Loading state
  if (loading) {
    return (
      <div className={`enhanced-teacher-rankings ${className}`}>
        <LoadingState 
          type="skeleton"
          message="Loading teacher rankings..."
          size="large"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-teacher-rankings ${className}`}>
        <EmptyState
          variant="error"
          action={loadTeacherRankings}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  // No data state
  if (!rankingsData?.rankings || rankingsData.rankings.length === 0) {
    return (
      <div className={`enhanced-teacher-rankings ${className}`}>
        <EmptyState
          variant="no-teachers"
          action={loadTeacherRankings}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className={`enhanced-teacher-rankings ${className} fade-in`}>
      {/* Summary Statistics */}
      {showComparison && rankingStats && (
        <div className="rankings-summary enhanced-grid enhanced-grid-cols-4 enhanced-gap-4" style={{ marginBottom: 'var(--space-6)' }}>
          <StatCard
            title="Total Teachers"
            value={rankingStats.totalTeachers}
            format="integer"
            icon="👥"
            variant="primary"
            size="small"
          />
          
          <StatCard
            title="Average Performance"
            value={rankingStats.avgPerformance}
            format="percentage"
            icon="🎯"
            variant="success"
            size="small"
          />
          
          <StatCard
            title="Average Participation"
            value={rankingStats.avgParticipation}
            format="percentage"
            icon="📊"
            variant="info"
            size="small"
          />
          
          <StatCard
            title="Excellent Performers"
            value={rankingStats.performanceLevels.excellent}
            format="integer"
            icon="🌟"
            variant="warning"
            size="small"
          />
        </div>
      )}

      {/* Main Rankings Card */}
      <DashboardCard
        title="Teacher Performance Rankings"
        subtitle={`${filteredRankings.length} of ${rankingStats?.totalTeachers || 0} teachers`}
        icon="🏆"
        variant="primary"
        headerActions={
          <div className="rankings-controls enhanced-flex enhanced-gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search teachers or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="enhanced-input"
              style={{ width: '200px' }}
            />
            
            {/* Performance Level Filter */}
            <select
              value={selectedPerformanceLevel}
              onChange={(e) => setSelectedPerformanceLevel(e.target.value)}
              className="enhanced-input"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="all">All Levels</option>
              <option value="excellent">Excellent (90%+)</option>
              <option value="good">Good (80-89%)</option>
              <option value="satisfactory">Satisfactory (70-79%)</option>
              <option value="needs-improvement">Needs Improvement (&lt;70%)</option>
            </select>
            
            {/* Sort */}
            <select
              value={`${currentSortBy}-${currentSortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setCurrentSortBy(field);
                setCurrentSortDirection(direction);
              }}
              className="enhanced-input"
              style={{ width: 'auto', minWidth: '180px' }}
            >
              <option value="performance-desc">Performance (High to Low)</option>
              <option value="performance-asc">Performance (Low to High)</option>
              <option value="participation-desc">Participation (High to Low)</option>
              <option value="participation-asc">Participation (Low to High)</option>
              <option value="responses-desc">Responses (Most to Least)</option>
              <option value="responses-asc">Responses (Least to Most)</option>
            </select>
            
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh rankings"
            >
              {refreshing ? (
                <div className="enhanced-spinner" style={{ width: '14px', height: '14px' }} />
              ) : (
                '↻'
              )}
            </button>
          </div>
        }
      >
        {filteredRankings.length === 0 ? (
          <EmptyState
            variant="no-results"
            action={() => {
              setSearchTerm('');
              setSelectedPerformanceLevel('all');
            }}
            actionText="Clear Filters"
            size="small"
          />
        ) : (
          <>
            {/* Rankings Grid */}
            <div className="rankings-grid enhanced-grid enhanced-grid-auto-fit enhanced-gap-4">
              {filteredRankings.map((teacher) => (
                <div 
                  key={teacher.teacher_id}
                  className={`enhanced-card teacher-ranking-card ${onTeacherClick ? 'interactive' : ''}`}
                  onClick={() => onTeacherClick?.(teacher)}
                >
                  <div className="enhanced-card-body">
                    {/* Rank Badge */}
                    <div className="rank-badge-container enhanced-flex enhanced-flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                      <div className={`enhanced-badge rank-badge ${teacher.rank <= 3 ? 'enhanced-badge-warning' : 'enhanced-badge-neutral'}`}>
                        #{teacher.rank}
                      </div>
                      {teacher.rank <= 3 && (
                        <div className="top-performer-icon">
                          {teacher.rank === 1 ? '🥇' : teacher.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>

                    {/* Teacher Info */}
                    <div className="teacher-info" style={{ marginBottom: 'var(--space-4)' }}>
                      <h4 className="text-heading-5" style={{ marginBottom: 'var(--space-1)' }}>
                        {teacher.teacher_name}
                      </h4>
                      <div className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                        {teacher.total_evaluations} evaluation{teacher.total_evaluations !== 1 ? 's' : ''} • {teacher.course_count} course{teacher.course_count !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="performance-metrics enhanced-flex enhanced-flex-col enhanced-gap-3">
                      <div className="metric-row enhanced-flex enhanced-flex-between">
                        <span className="text-body-small">Performance Score</span>
                        <div className={`enhanced-badge performance-badge ${
                          getPerformanceLevel(teacher.average_performance_score) === 'excellent' ? 'enhanced-badge-success' :
                          getPerformanceLevel(teacher.average_performance_score) === 'good' ? 'enhanced-badge-info' :
                          getPerformanceLevel(teacher.average_performance_score) === 'satisfactory' ? 'enhanced-badge-warning' :
                          'enhanced-badge-error'
                        }`}>
                          {teacher.average_performance_score.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="metric-row enhanced-flex enhanced-flex-between">
                        <span className="text-body-small">Participation Rate</span>
                        <ParticipationIndicator 
                          rate={teacher.average_participation_rate}
                          variant="badge"
                          size="small"
                          showPercentage={true}
                        />
                      </div>
                      
                      <div className="metric-row enhanced-flex enhanced-flex-between">
                        <span className="text-body-small">Total Responses</span>
                        <span className="text-body-small font-medium">{teacher.total_responses}</span>
                      </div>
                    </div>

                    {/* Courses */}
                    {teacher.courses_taught && teacher.courses_taught.length > 0 && (
                      <div className="courses-section" style={{ marginTop: 'var(--space-4)' }}>
                        <div className="text-caption" style={{ marginBottom: 'var(--space-2)', color: 'var(--text-tertiary)' }}>
                          COURSES
                        </div>
                        <div className="courses-list enhanced-flex enhanced-flex-col enhanced-gap-1">
                          {teacher.courses_taught.slice(0, 3).map((course, index) => (
                            <div key={index} className="course-list-item">
                              {course}
                            </div>
                          ))}
                          {teacher.courses_taught.length > 3 && (
                            <div className="course-list-item" style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                              +{teacher.courses_taught.length - 3} more courses
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {showInsights && teacher.performance_insights && teacher.performance_insights.length > 0 && (
                      <div className="insights-section" style={{ marginTop: 'var(--space-4)' }}>
                        <div className="text-caption" style={{ marginBottom: 'var(--space-2)', color: 'var(--text-tertiary)' }}>
                          KEY INSIGHTS
                        </div>
                        <div className="insights-list enhanced-flex enhanced-flex-col enhanced-gap-2">
                          {teacher.performance_insights.slice(0, 2).map((insight, index) => (
                            <div 
                              key={index} 
                              className={`insight-item text-body-small ${
                                insight.includes('Excellent') || insight.includes('Top performer') ? 'insight-positive' :
                                insight.includes('improvement') || insight.includes('Low') ? 'insight-warning' :
                                insight.includes('concerns') || insight.includes('decline') ? 'insight-alert' : ''
                              }`}
                              title={insight}
                            >
                              {insight.length > 80 ? `${insight.substring(0, 80)}...` : insight}
                            </div>
                          ))}
                          {teacher.performance_insights.length > 2 && (
                            <div className="text-body-small" style={{ color: 'var(--text-tertiary)' }}>
                              +{teacher.performance_insights.length - 2} more insights
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Comparative Analysis */}
            {showComparison && rankingsData.comparative_analysis && (
              <div className="comparative-analysis" style={{ marginTop: 'var(--space-8)' }}>
                <h4 className="text-heading-4" style={{ marginBottom: 'var(--space-6)' }}>
                  Department Analysis
                </h4>
                
                <div className="analysis-grid enhanced-grid enhanced-grid-cols-2 enhanced-gap-6">
                  {/* Top performers */}
                  {rankingsData.comparative_analysis.top_performers.length > 0 && (
                    <div className="enhanced-card analysis-section">
                      <div className="enhanced-card-header">
                        <h5 className="text-heading-5">🌟 Top Performers</h5>
                      </div>
                      <div className="enhanced-card-body">
                        <div className="performer-list enhanced-flex enhanced-flex-col enhanced-gap-2">
                          {rankingsData.comparative_analysis.top_performers.slice(0, 5).map((teacher) => (
                            <div key={teacher.teacher_id} className="performer-item enhanced-flex enhanced-flex-between">
                              <span className="text-body-small">{teacher.teacher_name}</span>
                              <span className="enhanced-badge enhanced-badge-success">
                                {teacher.average_performance_score.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Improvement needed */}
                  {rankingsData.comparative_analysis.improvement_needed.length > 0 && (
                    <div className="enhanced-card analysis-section">
                      <div className="enhanced-card-header">
                        <h5 className="text-heading-5">📈 Needs Improvement</h5>
                      </div>
                      <div className="enhanced-card-body">
                        <div className="performer-list enhanced-flex enhanced-flex-col enhanced-gap-2">
                          {rankingsData.comparative_analysis.improvement_needed.slice(0, 5).map((teacher) => (
                            <div key={teacher.teacher_id} className="performer-item enhanced-flex enhanced-flex-between">
                              <span className="text-body-small">{teacher.teacher_name}</span>
                              <span className="enhanced-badge enhanced-badge-warning">
                                {teacher.average_performance_score.toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance gaps */}
                {rankingsData.comparative_analysis.performance_gaps && (
                  <div className="enhanced-card" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="enhanced-card-header">
                      <h5 className="text-heading-5">📊 Performance Distribution</h5>
                    </div>
                    <div className="enhanced-card-body">
                      <div className="gap-stats enhanced-grid enhanced-grid-cols-3 enhanced-gap-4">
                        <div className="gap-stat">
                          <div className="text-heading-4" style={{ color: 'var(--success-green-600)' }}>
                            {rankingsData.comparative_analysis.performance_gaps.max_score.toFixed(1)}%
                          </div>
                          <div className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                            Highest Score
                          </div>
                        </div>
                        <div className="gap-stat">
                          <div className="text-heading-4" style={{ color: 'var(--error-red-600)' }}>
                            {rankingsData.comparative_analysis.performance_gaps.min_score.toFixed(1)}%
                          </div>
                          <div className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                            Lowest Score
                          </div>
                        </div>
                        <div className="gap-stat">
                          <div className="text-heading-4" style={{ color: 'var(--warning-orange-600)' }}>
                            {rankingsData.comparative_analysis.performance_gaps.gap.toFixed(1)}%
                          </div>
                          <div className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                            Performance Gap
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {rankingsData.comparative_analysis.recommendations.length > 0 && (
                  <div className="enhanced-card" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="enhanced-card-header">
                      <h5 className="text-heading-5">💡 Recommendations</h5>
                    </div>
                    <div className="enhanced-card-body">
                      <div className="recommendations-list enhanced-flex enhanced-flex-col enhanced-gap-3">
                        {rankingsData.comparative_analysis.recommendations.map((recommendation, index) => (
                          <div key={index} className="recommendation-item enhanced-flex enhanced-gap-3">
                            <div className="recommendation-icon" style={{ color: 'var(--primary-blue-500)' }}>
                              💡
                            </div>
                            <div className="text-body-small">
                              {recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DashboardCard>

      {/* Metadata */}
      <div className="rankings-metadata" style={{ marginTop: 'var(--space-6)' }}>
        <div className="enhanced-card">
          <div className="enhanced-card-body" style={{ padding: 'var(--space-4)' }}>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Period: {rankingsData.period} | 
              Sort: {currentSortBy} ({currentSortDirection}) | 
              Generated: {new Date(rankingsData.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedTeacherRankings;