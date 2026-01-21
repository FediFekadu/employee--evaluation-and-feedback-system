import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useErrorHandling } from '../hooks/useErrorHandling';
import api from '../services/api';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';
import ErrorAlert from './ErrorHandling/ErrorAlert';
import ParticipationIndicator from './ParticipationIndicator';
import { exportService } from '../services/exportService';

/**
 * EnhancedTeacherRankings Component
 * 
 * Enhanced version with advanced sorting, filtering, comparison features,
 * and comprehensive performance analytics with department benchmarking.
 */
function EnhancedTeacherRankings({ 
  departmentId, 
  period = null,
  className = '',
  onTeacherSelect = null,
  refreshInterval = null,
  enableComparison = true,
  enableExport = true,
  enableBulkActions = false
}) {
  const [rankingsData, setRankingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced filtering and sorting state
  const [filters, setFilters] = useState({
    search: '',
    performanceRange: [0, 100],
    participationRange: [0, 100],
    courseCount: 'all',
    performanceLevel: 'all',
    department: 'all'
  });
  
  const [sorting, setSorting] = useState({
    field: 'overall_score',
    direction: 'desc'
  });
  
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards', 'comparison'
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showTrends, setShowTrends] = useState(true);

  const { handleApiCall, addError } = useErrorHandling();

  // Load enhanced teacher rankings data
  const loadTeacherRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        sort_by: sorting.field,
        sort_direction: sorting.direction,
        include_trends: showTrends,
        include_benchmarks: true,
        include_analytics: true,
        ...filters
      };

      if (period) {
        params.period = period;
      }

      const response = await handleApiCall(
        () => api.get(`/departments/${departmentId}/enhanced-teacher-rankings`, { params }),
        'enhanced_teacher_rankings_load'
      );

      setRankingsData(response.data.data);
    } catch (err) {
      console.error('Failed to load enhanced teacher rankings:', err);
      const errorId = addError(err, 'enhanced_teacher_rankings_load');
      setError('Failed to load teacher rankings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [departmentId, sorting, filters, period, showTrends, handleApiCall, addError]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadTeacherRankings();
    } catch (err) {
      console.error('Failed to refresh teacher rankings:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadTeacherRankings]);

  // Handle sorting changes
  const handleSort = useCallback((field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  // Handle teacher selection
  const handleTeacherSelection = useCallback((teacherId, selected) => {
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(teacherId);
      } else {
        newSet.delete(teacherId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk selection
  const handleBulkSelect = useCallback((selectAll) => {
    if (selectAll && rankingsData?.rankings) {
      setSelectedTeachers(new Set(rankingsData.rankings.map(t => t.teacher_id)));
    } else {
      setSelectedTeachers(new Set());
    }
  }, [rankingsData]);

  // Export functionality
  const handleExport = useCallback(async (format) => {
    if (!rankingsData?.rankings) return;

    try {
      const exportData = rankingsData.rankings.map(teacher => ({
        Rank: teacher.rank,
        'Teacher Name': teacher.teacher_name,
        'Overall Score': teacher.overall_score,
        'Performance Score': teacher.performance_score,
        'Participation Rate': teacher.participation_rate,
        'Course Count': teacher.course_count,
        'Total Responses': teacher.total_responses,
        'Department Rank': teacher.department_rank,
        'Trend': teacher.trend?.direction || 'N/A',
        'Performance Level': teacher.performance_level
      }));

      await exportService.exportData(exportData, `teacher-rankings-${departmentId}`, format);
    } catch (err) {
      console.error('Export failed:', err);
      addError(err, 'teacher_rankings_export');
    }
  }, [rankingsData, departmentId, addError]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (departmentId) {
      loadTeacherRankings();
    }
  }, [departmentId, loadTeacherRankings]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(handleRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, handleRefresh]);

  // Filtered and sorted rankings
  const processedRankings = useMemo(() => {
    if (!rankingsData?.rankings) return [];

    let filtered = rankingsData.rankings.filter(teacher => {
      // Search filter
      if (filters.search && !teacher.teacher_name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Performance range filter
      if (teacher.performance_score < filters.performanceRange[0] || 
          teacher.performance_score > filters.performanceRange[1]) {
        return false;
      }
      
      // Participation range filter
      if (teacher.participation_rate < filters.participationRange[0] || 
          teacher.participation_rate > filters.participationRange[1]) {
        return false;
      }
      
      // Course count filter
      if (filters.courseCount !== 'all') {
        const courseCount = teacher.course_count;
        switch (filters.courseCount) {
          case 'single': return courseCount === 1;
          case 'multiple': return courseCount > 1;
          case 'many': return courseCount >= 5;
          default: return true;
        }
      }
      
      // Performance level filter
      if (filters.performanceLevel !== 'all' && 
          teacher.performance_level !== filters.performanceLevel) {
        return false;
      }
      
      return true;
    });

    return filtered;
  }, [rankingsData, filters]);

  // Performance statistics
  const performanceStats = useMemo(() => {
    if (!processedRankings.length) return null;

    const totalTeachers = processedRankings.length;
    const avgPerformance = processedRankings.reduce((sum, t) => sum + t.performance_score, 0) / totalTeachers;
    const avgParticipation = processedRankings.reduce((sum, t) => sum + t.participation_rate, 0) / totalTeachers;
    const avgOverallScore = processedRankings.reduce((sum, t) => sum + t.overall_score, 0) / totalTeachers;

    const performanceLevels = {
      excellent: processedRankings.filter(t => t.performance_level === 'excellent').length,
      good: processedRankings.filter(t => t.performance_level === 'good').length,
      satisfactory: processedRankings.filter(t => t.performance_level === 'satisfactory').length,
      needs_improvement: processedRankings.filter(t => t.performance_level === 'needs_improvement').length,
    };

    return {
      totalTeachers,
      avgPerformance: avgPerformance.toFixed(1),
      avgParticipation: avgParticipation.toFixed(1),
      avgOverallScore: avgOverallScore.toFixed(1),
      performanceLevels,
    };
  }, [processedRankings]);

  // Get performance level styling
  const getPerformanceLevelClass = (level) => {
    switch (level) {
      case 'excellent': return 'performance-excellent';
      case 'good': return 'performance-good';
      case 'satisfactory': return 'performance-satisfactory';
      case 'needs_improvement': return 'performance-needs-improvement';
      default: return '';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`enhanced-teacher-rankings loading ${className}`}>
        <LoadingSpinner size="large" message="Loading enhanced teacher rankings..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-teacher-rankings error ${className}`}>
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
      <div className={`enhanced-teacher-rankings no-data ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Teacher Rankings Available</h3>
          <p>No teacher performance data found for the selected criteria.</p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={loadTeacherRankings}>
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-teacher-rankings ${className}`}>
      {/* Enhanced Header */}
      <div className="rankings-header">
        <div className="header-main">
          <h3 className="rankings-title">
            Enhanced Teacher Rankings
            {performanceStats && (
              <span className="rankings-subtitle">
                ({performanceStats.totalTeachers} teachers)
              </span>
            )}
          </h3>
          <div className="header-controls">
            <div className="view-mode-selector">
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                📊
              </button>
              <button
                className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                🃏
              </button>
              {enableComparison && (
                <button
                  className={`view-btn ${viewMode === 'comparison' ? 'active' : ''}`}
                  onClick={() => setViewMode('comparison')}
                  title="Comparison View"
                >
                  ⚖️
                </button>
              )}
            </div>
            
            {enableExport && (
              <div className="export-controls">
                <select
                  onChange={(e) => e.target.value && handleExport(e.target.value)}
                  value=""
                  className="export-select"
                >
                  <option value="">Export...</option>
                  <option value="csv">Export CSV</option>
                  <option value="excel">Export Excel</option>
                  <option value="pdf">Export PDF</option>
                </select>
              </div>
            )}
            
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

        {/* Enhanced Filters */}
        <div className="rankings-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Search Teachers:</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-group">
              <label>Performance Level:</label>
              <select
                value={filters.performanceLevel}
                onChange={(e) => handleFilterChange('performanceLevel', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Levels</option>
                <option value="excellent">Excellent (90%+)</option>
                <option value="good">Good (80-89%)</option>
                <option value="satisfactory">Satisfactory (70-79%)</option>
                <option value="needs_improvement">Needs Improvement (&lt;70%)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Course Load:</label>
              <select
                value={filters.courseCount}
                onChange={(e) => handleFilterChange('courseCount', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Teachers</option>
                <option value="single">Single Course</option>
                <option value="multiple">Multiple Courses</option>
                <option value="many">Heavy Load (5+)</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort By:</label>
              <select
                value={`${sorting.field}-${sorting.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSorting({ field, direction });
                }}
                className="sort-select"
              >
                <option value="overall_score-desc">Overall Score (High to Low)</option>
                <option value="overall_score-asc">Overall Score (Low to High)</option>
                <option value="performance_score-desc">Performance (High to Low)</option>
                <option value="performance_score-asc">Performance (Low to High)</option>
                <option value="participation_rate-desc">Participation (High to Low)</option>
                <option value="participation_rate-asc">Participation (Low to High)</option>
                <option value="teacher_name-asc">Name (A to Z)</option>
                <option value="teacher_name-desc">Name (Z to A)</option>
              </select>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="range-filter">
              <label>Performance Range: {filters.performanceRange[0]}% - {filters.performanceRange[1]}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.performanceRange[0]}
                onChange={(e) => handleFilterChange('performanceRange', [parseInt(e.target.value), filters.performanceRange[1]])}
                className="range-input"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.performanceRange[1]}
                onChange={(e) => handleFilterChange('performanceRange', [filters.performanceRange[0], parseInt(e.target.value)])}
                className="range-input"
              />
            </div>
            
            <div className="range-filter">
              <label>Participation Range: {filters.participationRange[0]}% - {filters.participationRange[1]}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.participationRange[0]}
                onChange={(e) => handleFilterChange('participationRange', [parseInt(e.target.value), filters.participationRange[1]])}
                className="range-input"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.participationRange[1]}
                onChange={(e) => handleFilterChange('participationRange', [filters.participationRange[0], parseInt(e.target.value)])}
                className="range-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      {performanceStats && (
        <div className="performance-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-value">{performanceStats.avgOverallScore}%</div>
              <div className="summary-label">Average Overall Score</div>
              {rankingsData.department_benchmarks && (
                <div className="benchmark-comparison">
                  vs Dept Avg: {rankingsData.department_benchmarks.overall_score.toFixed(1)}%
                </div>
              )}
            </div>
            
            <div className="summary-card">
              <div className="summary-value">{performanceStats.avgPerformance}%</div>
              <div className="summary-label">Average Performance</div>
              {rankingsData.department_benchmarks && (
                <div className="benchmark-comparison">
                  vs Dept Avg: {rankingsData.department_benchmarks.performance_score.toFixed(1)}%
                </div>
              )}
            </div>
            
            <div className="summary-card">
              <div className="summary-value">{performanceStats.avgParticipation}%</div>
              <div className="summary-label">Average Participation</div>
              {rankingsData.department_benchmarks && (
                <div className="benchmark-comparison">
                  vs Dept Avg: {rankingsData.department_benchmarks.participation_rate.toFixed(1)}%
                </div>
              )}
            </div>
            
            <div className="summary-card">
              <div className="summary-value">{performanceStats.performanceLevels.excellent}</div>
              <div className="summary-label">Excellent Performers</div>
              <div className="performance-breakdown">
                <span className="level-count excellent">{performanceStats.performanceLevels.excellent}</span>
                <span className="level-count good">{performanceStats.performanceLevels.good}</span>
                <span className="level-count satisfactory">{performanceStats.performanceLevels.satisfactory}</span>
                <span className="level-count needs-improvement">{performanceStats.performanceLevels.needs_improvement}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Rankings Display */}
      <div className="rankings-content">
        {viewMode === 'table' && (
          <div className="rankings-table-container">
            {enableBulkActions && (
              <div className="bulk-actions">
                <label className="bulk-select">
                  <input
                    type="checkbox"
                    checked={selectedTeachers.size === processedRankings.length && processedRankings.length > 0}
                    onChange={(e) => handleBulkSelect(e.target.checked)}
                  />
                  Select All ({selectedTeachers.size} selected)
                </label>
              </div>
            )}
            
            <table className="enhanced-rankings-table">
              <thead>
                <tr>
                  {enableBulkActions && <th className="select-column">Select</th>}
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('rank')}
                  >
                    Rank
                    {sorting.field === 'rank' && (
                      <span className="sort-indicator">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('teacher_name')}
                  >
                    Teacher
                    {sorting.field === 'teacher_name' && (
                      <span className="sort-indicator">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('overall_score')}
                  >
                    Overall Score
                    {sorting.field === 'overall_score' && (
                      <span className="sort-indicator">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('performance_score')}
                  >
                    Performance
                    {sorting.field === 'performance_score' && (
                      <span className="sort-indicator">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('participation_rate')}
                  >
                    Participation
                    {sorting.field === 'participation_rate' && (
                      <span className="sort-indicator">
                        {sorting.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th>Courses</th>
                  <th>Responses</th>
                  {showTrends && <th>Trend</th>}
                  <th>Benchmarks</th>
                </tr>
              </thead>
              <tbody>
                {processedRankings.map((teacher) => (
                  <tr 
                    key={teacher.teacher_id}
                    className={`teacher-row ${selectedTeachers.has(teacher.teacher_id) ? 'selected' : ''}`}
                    onClick={() => onTeacherSelect?.(teacher)}
                  >
                    {enableBulkActions && (
                      <td className="select-cell">
                        <input
                          type="checkbox"
                          checked={selectedTeachers.has(teacher.teacher_id)}
                          onChange={(e) => handleTeacherSelection(teacher.teacher_id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className={`rank-cell ${teacher.rank <= 3 ? 'top-performer' : ''}`}>
                      <div className="rank-display">
                        <span className="rank-number">#{teacher.rank}</span>
                        {teacher.rank <= 3 && <span className="rank-badge">🏆</span>}
                      </div>
                    </td>
                    <td>
                      <div className="teacher-info">
                        <div className="teacher-name">{teacher.teacher_name}</div>
                        <div className="teacher-meta">
                          <span className={`performance-level ${getPerformanceLevelClass(teacher.performance_level)}`}>
                            {teacher.performance_level.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`score-display ${getPerformanceLevelClass(teacher.performance_level)}`}>
                        <span className="score-value">{teacher.overall_score.toFixed(1)}%</span>
                        {teacher.department_comparison && (
                          <span className={`comparison-indicator ${teacher.department_comparison.overall_score > 0 ? 'above' : 'below'}`}>
                            {teacher.department_comparison.overall_score > 0 ? '+' : ''}{teacher.department_comparison.overall_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={`score-display ${getPerformanceLevelClass(teacher.performance_level)}`}>
                        <span className="score-value">{teacher.performance_score.toFixed(1)}%</span>
                        {teacher.department_comparison && (
                          <span className={`comparison-indicator ${teacher.department_comparison.performance_score > 0 ? 'above' : 'below'}`}>
                            {teacher.department_comparison.performance_score > 0 ? '+' : ''}{teacher.department_comparison.performance_score.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <ParticipationIndicator 
                        rate={teacher.participation_rate}
                        variant="enhanced"
                        size="medium"
                        showComparison={teacher.department_comparison?.participation_rate}
                      />
                    </td>
                    <td>
                      <div className="course-info">
                        <span className="course-count">{teacher.course_count}</span>
                        {teacher.courses && teacher.courses.length > 0 && (
                          <div className="course-details" title={teacher.courses.join(', ')}>
                            {teacher.courses.slice(0, 2).join(', ')}
                            {teacher.courses.length > 2 && ` +${teacher.courses.length - 2}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="response-count">{teacher.total_responses}</span>
                    </td>
                    {showTrends && (
                      <td>
                        {teacher.trend && (
                          <div className={`trend-indicator ${teacher.trend.direction}`}>
                            <span className="trend-icon">{getTrendIcon(teacher.trend)}</span>
                            <span className="trend-value">
                              {teacher.trend.change > 0 ? '+' : ''}{teacher.trend.change.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </td>
                    )}
                    <td>
                      <div className="benchmark-indicators">
                        {teacher.benchmarks && (
                          <>
                            <span className={`benchmark-indicator ${teacher.benchmarks.vs_department > 0 ? 'above' : 'below'}`}>
                              Dept: {teacher.benchmarks.vs_department > 0 ? '+' : ''}{teacher.benchmarks.vs_department.toFixed(1)}%
                            </span>
                            {teacher.benchmarks.vs_college && (
                              <span className={`benchmark-indicator ${teacher.benchmarks.vs_college > 0 ? 'above' : 'below'}`}>
                                College: {teacher.benchmarks.vs_college > 0 ? '+' : ''}{teacher.benchmarks.vs_college.toFixed(1)}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="rankings-cards-container">
            {processedRankings.map((teacher) => (
              <div 
                key={teacher.teacher_id}
                className={`teacher-card ${getPerformanceLevelClass(teacher.performance_level)}`}
                onClick={() => onTeacherSelect?.(teacher)}
              >
                <div className="card-header">
                  <div className="teacher-rank">#{teacher.rank}</div>
                  <div className="teacher-name">{teacher.teacher_name}</div>
                  {teacher.trend && (
                    <div className={`trend-badge ${teacher.trend.direction}`}>
                      {getTrendIcon(teacher.trend)}
                    </div>
                  )}
                </div>
                
                <div className="card-metrics">
                  <div className="metric">
                    <span className="metric-label">Overall Score</span>
                    <span className="metric-value">{teacher.overall_score.toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Performance</span>
                    <span className="metric-value">{teacher.performance_score.toFixed(1)}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Participation</span>
                    <span className="metric-value">{teacher.participation_rate.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="detail-item">
                    <span className="detail-label">Courses:</span>
                    <span className="detail-value">{teacher.course_count}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Responses:</span>
                    <span className="detail-value">{teacher.total_responses}</span>
                  </div>
                </div>
                
                {teacher.benchmarks && (
                  <div className="card-benchmarks">
                    <div className={`benchmark ${teacher.benchmarks.vs_department > 0 ? 'above' : 'below'}`}>
                      vs Dept: {teacher.benchmarks.vs_department > 0 ? '+' : ''}{teacher.benchmarks.vs_department.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'comparison' && selectedTeachers.size > 0 && (
          <div className="comparison-view">
            <h4>Teacher Comparison ({selectedTeachers.size} selected)</h4>
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {Array.from(selectedTeachers).map(teacherId => {
                      const teacher = processedRankings.find(t => t.teacher_id === teacherId);
                      return teacher ? (
                        <th key={teacherId}>{teacher.teacher_name}</th>
                      ) : null;
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rank</td>
                    {Array.from(selectedTeachers).map(teacherId => {
                      const teacher = processedRankings.find(t => t.teacher_id === teacherId);
                      return teacher ? (
                        <td key={teacherId}>#{teacher.rank}</td>
                      ) : null;
                    })}
                  </tr>
                  <tr>
                    <td>Overall Score</td>
                    {Array.from(selectedTeachers).map(teacherId => {
                      const teacher = processedRankings.find(t => t.teacher_id === teacherId);
                      return teacher ? (
                        <td key={teacherId}>{teacher.overall_score.toFixed(1)}%</td>
                      ) : null;
                    })}
                  </tr>
                  <tr>
                    <td>Performance Score</td>
                    {Array.from(selectedTeachers).map(teacherId => {
                      const teacher = processedRankings.find(t => t.teacher_id === teacherId);
                      return teacher ? (
                        <td key={teacherId}>{teacher.performance_score.toFixed(1)}%</td>
                      ) : null;
                    })}
                  </tr>
                  <tr>
                    <td>Participation Rate</td>
                    {Array.from(selectedTeachers).map(teacherId => {
                      const teacher = processedRankings.find(t => t.teacher_id === teacherId);
                      return teacher ? (
                        <td key={teacherId}>{teacher.participation_rate.toFixed(1)}%</td>
                      ) : null;
                    })}
                  </tr>
                  <tr>
                    <td>Course Count</td>
                    {Array.from(selectedTeachers).map(teacherId => {
                      const teacher = processedRankings.find(t => t.teacher_id === teacherId);
                      return teacher ? (
                        <td key={teacherId}>{teacher.course_count}</td>
                      ) : null;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="rankings-metadata">
        <small className="metadata-text">
          Showing {processedRankings.length} of {rankingsData.rankings.length} teachers | 
          Period: {rankingsData.period} | 
          Sort: {sorting.field} ({sorting.direction}) | 
          Generated: {new Date(rankingsData.generated_at).toLocaleString()}
        </small>
      </div>
    </div>
  );
}

export default EnhancedTeacherRankings;