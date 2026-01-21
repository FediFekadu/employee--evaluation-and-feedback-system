import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApiRequest } from '../hooks/useApiRequest';
import { PRIORITY } from '../utils/requestManager';
import exportService from '../services/exportService';
import DashboardCard from './EnhancedDashboard/DashboardCard';
import LoadingState from './EnhancedDashboard/LoadingState';
import EmptyState from './EnhancedDashboard/EmptyState';

/**
 * Interactive Teacher Rankings Component
 * 
 * Displays sortable teacher rankings with performance metrics, trend indicators,
 * filtering capabilities, and export functionality.
 */
function InteractiveTeacherRankings({
  departmentId,
  period = null,
  timeRange = '1year',
  className = '',
  enableExport = true,
  enableFiltering = true,
  showTrends = true,
  showBenchmarks = true,
  pageSize = 10
}) {
  const [rankingsData, setRankingsData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Table state
  const [sortBy, setSortBy] = useState('overall_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  
  // Filter state
  const [filters, setFilters] = useState({
    department: 'all',
    performance_level: 'all',
    evaluation_count_min: '',
    score_range: { min: '', max: '' }
  });
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  const { loading, get } = useApiRequest();

  // Load teacher rankings data
  const loadTeacherRankings = useCallback(async () => {
    try {
      setError(null);

      const params = {
        time_range: timeRange,
        sort_by: sortBy,
        sort_direction: sortDirection,
        filters: filters,
        include_trends: showTrends,
        include_benchmarks: showBenchmarks,
        page_size: pageSize,
        page: currentPage
      };

      if (period) {
        params.period = period;
      }

      const response = await get(
        `/departments/${departmentId}/teacher-rankings`,
        params,
        {
          priority: PRIORITY.MEDIUM,
          skipCache: false
        }
      );

      if (response) {
        setRankingsData(response.data);
      }
    } catch (err) {
      console.error('Failed to load teacher rankings:', err);
      
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        setError(`Too many requests. The system will automatically retry in ${Math.round(waitTime/1000)} seconds.`);
        
        setTimeout(() => {
          setError(null);
          loadTeacherRankings();
        }, waitTime);
        return;
      }
      
      setError('Failed to load teacher rankings data. Please try again.');
    }
  }, [departmentId, timeRange, sortBy, sortDirection, filters, showTrends, showBenchmarks, pageSize, currentPage, period, get]);

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

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (departmentId) {
      loadTeacherRankings();
    }
  }, [loadTeacherRankings]);

  // Process and filter rankings data
  const processedRankings = useMemo(() => {
    if (!rankingsData?.rankings) return [];

    let processed = [...rankingsData.rankings];

    // Apply additional client-side filtering if needed
    if (filters.evaluation_count_min) {
      const minCount = parseInt(filters.evaluation_count_min);
      processed = processed.filter(teacher => teacher.evaluation_count >= minCount);
    }

    if (filters.score_range.min || filters.score_range.max) {
      const minScore = parseFloat(filters.score_range.min) || 0;
      const maxScore = parseFloat(filters.score_range.max) || 100;
      processed = processed.filter(teacher => 
        teacher.overall_score >= minScore && teacher.overall_score <= maxScore
      );
    }

    return processed;
  }, [rankingsData, filters]);

  // Handle sort changes
  const handleSort = useCallback((column) => {
    if (column === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortBy]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
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

  // Handle select all
  const handleSelectAll = useCallback((selected) => {
    if (selected) {
      setSelectedTeachers(new Set(processedRankings.map(teacher => teacher.id)));
    } else {
      setSelectedTeachers(new Set());
    }
  }, [processedRankings]);

  // Handle tooltip
  const handleTooltip = useCallback((event, content) => {
    if (!content) {
      setTooltip({ visible: false, x: 0, y: 0, content: null });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content
    });
  }, []);

  // Export rankings data
  const handleExport = useCallback(async (format) => {
    if (!rankingsData || exporting) return;
    
    try {
      setExporting(true);
      setExportProgress(0);
      
      const exportData = {
        rankings: processedRankings,
        metadata: rankingsData.metadata,
        filters: filters,
        sortBy: sortBy,
        sortDirection: sortDirection,
        selectedTeachers: Array.from(selectedTeachers)
      };
      
      const result = await exportService.exportDepartment(
        departmentId,
        format,
        {
          additionalParams: {
            export_type: 'teacher_rankings',
            rankings_data: exportData
          }
        },
        (progress) => {
          setExportProgress(progress.progress || 0);
        }
      );
      
      if (result.success) {
        exportService.downloadFile(result.blob, result.filename);
      } else {
        setError(`Export failed: ${result.error}`);
      }
      
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [rankingsData, processedRankings, filters, sortBy, sortDirection, selectedTeachers, departmentId, exporting]);

  // Get performance level badge
  const getPerformanceBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'var(--success-green-500)' };
    if (score >= 80) return { label: 'Good', color: 'var(--primary-blue-500)' };
    if (score >= 70) return { label: 'Satisfactory', color: 'var(--warning-orange-500)' };
    if (score >= 60) return { label: 'Needs Improvement', color: 'var(--error-red-500)' };
    return { label: 'Poor', color: 'var(--error-red-600)' };
  };

  // Get trend indicator
  const getTrendIndicator = (trend) => {
    if (!trend) return null;
    
    const { direction, percentage } = trend;
    const color = direction === 'up' ? 'var(--success-green-500)' : 
                  direction === 'down' ? 'var(--error-red-500)' : 'var(--neutral-500)';
    const icon = direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→';
    
    return (
      <span 
        className="trend-indicator"
        style={{ color }}
        title={`${direction === 'up' ? 'Increased' : direction === 'down' ? 'Decreased' : 'No change'} by ${percentage}%`}
      >
        {icon} {percentage}%
      </span>
    );
  };

  // Render filter controls
  const renderFilterControls = () => {
    if (!enableFiltering) return null;

    return (
      <div className="rankings-filter-controls">
        <div className="filter-row">
          <div className="filter-group">
            <label className="text-caption font-medium">Performance Level</label>
            <select
              value={filters.performance_level}
              onChange={(e) => handleFilterChange('performance_level', e.target.value)}
              className="enhanced-input enhanced-input-sm"
            >
              <option value="all">All Levels</option>
              <option value="excellent">Excellent (90+)</option>
              <option value="good">Good (80-89)</option>
              <option value="satisfactory">Satisfactory (70-79)</option>
              <option value="needs_improvement">Needs Improvement (60-69)</option>
              <option value="poor">Poor (&lt;60)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="text-caption font-medium">Min Evaluations</label>
            <input
              type="number"
              value={filters.evaluation_count_min}
              onChange={(e) => handleFilterChange('evaluation_count_min', e.target.value)}
              placeholder="0"
              min="0"
              className="enhanced-input enhanced-input-sm"
              style={{ width: '100px' }}
            />
          </div>

          <div className="filter-group">
            <label className="text-caption font-medium">Score Range</label>
            <div className="score-range-inputs">
              <input
                type="number"
                value={filters.score_range.min}
                onChange={(e) => handleFilterChange('score_range', { ...filters.score_range, min: e.target.value })}
                placeholder="Min"
                min="0"
                max="100"
                className="enhanced-input enhanced-input-sm"
                style={{ width: '70px' }}
              />
              <span className="text-caption">-</span>
              <input
                type="number"
                value={filters.score_range.max}
                onChange={(e) => handleFilterChange('score_range', { ...filters.score_range, max: e.target.value })}
                placeholder="Max"
                min="0"
                max="100"
                className="enhanced-input enhanced-input-sm"
                style={{ width: '70px' }}
              />
            </div>
          </div>

          <button
            className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
            onClick={() => setFilters({
              department: 'all',
              performance_level: 'all',
              evaluation_count_min: '',
              score_range: { min: '', max: '' }
            })}
            title="Clear all filters"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  };

  // Render table header
  const renderTableHeader = () => {
    const columns = [
      { key: 'rank', label: 'Rank', sortable: false },
      { key: 'name', label: 'Teacher Name', sortable: true },
      { key: 'department', label: 'Department', sortable: true },
      { key: 'overall_score', label: 'Overall Score', sortable: true },
      { key: 'evaluation_count', label: 'Evaluations', sortable: true },
      { key: 'response_rate', label: 'Response Rate', sortable: true },
      { key: 'trend', label: 'Trend', sortable: false },
      { key: 'performance_level', label: 'Performance', sortable: true }
    ];

    return (
      <thead className="rankings-table-header">
        <tr>
          <th className="select-column">
            <input
              type="checkbox"
              checked={selectedTeachers.size === processedRankings.length && processedRankings.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="enhanced-checkbox"
            />
          </th>
          {columns.map(column => (
            <th
              key={column.key}
              className={`sortable-header ${column.sortable ? 'clickable' : ''} ${sortBy === column.key ? 'active' : ''}`}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <div className="header-content">
                <span>{column.label}</span>
                {column.sortable && (
                  <span className="sort-indicator">
                    {sortBy === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  // Render table row
  const renderTableRow = (teacher, index) => {
    const performanceBadge = getPerformanceBadge(teacher.overall_score);
    const isSelected = selectedTeachers.has(teacher.id);

    return (
      <tr
        key={teacher.id}
        className={`rankings-table-row ${isSelected ? 'selected' : ''}`}
      >
        <td className="select-column">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleTeacherSelection(teacher.id, e.target.checked)}
            className="enhanced-checkbox"
          />
        </td>
        
        <td className="rank-column">
          <div className="rank-badge">
            #{teacher.rank || (index + 1)}
          </div>
        </td>
        
        <td className="teacher-name-column">
          <div className="teacher-info">
            <div className="teacher-name font-medium">{teacher.name}</div>
            {teacher.title && (
              <div className="teacher-title text-caption">{teacher.title}</div>
            )}
          </div>
        </td>
        
        <td className="department-column">
          <span className="department-name">{teacher.department_name}</span>
        </td>
        
        <td className="score-column">
          <div className="score-display">
            <div className="score-value font-medium">{teacher.overall_score.toFixed(1)}</div>
            {showBenchmarks && teacher.benchmark_comparison && (
              <div 
                className="benchmark-indicator text-caption"
                onMouseEnter={(e) => handleTooltip(e, `Department Average: ${teacher.benchmark_comparison.department_avg.toFixed(1)}`)}
                onMouseLeave={() => handleTooltip(null)}
              >
                {teacher.overall_score > teacher.benchmark_comparison.department_avg ? '+' : ''}
                {(teacher.overall_score - teacher.benchmark_comparison.department_avg).toFixed(1)}
              </div>
            )}
          </div>
        </td>
        
        <td className="evaluations-column">
          <div className="evaluation-info">
            <div className="evaluation-count">{teacher.evaluation_count}</div>
            <div className="evaluation-period text-caption">{timeRange}</div>
          </div>
        </td>
        
        <td className="response-rate-column">
          <div className="response-rate-display">
            <div className="response-percentage">{teacher.response_rate?.toFixed(1) || 0}%</div>
            <div className="response-bar">
              <div 
                className="response-fill"
                style={{ 
                  width: `${teacher.response_rate || 0}%`,
                  backgroundColor: teacher.response_rate >= 70 ? 'var(--success-green-500)' : 
                                   teacher.response_rate >= 50 ? 'var(--warning-orange-500)' : 'var(--error-red-500)'
                }}
              />
            </div>
          </div>
        </td>
        
        <td className="trend-column">
          {showTrends && getTrendIndicator(teacher.trend)}
        </td>
        
        <td className="performance-column">
          <span 
            className="performance-badge"
            style={{ 
              backgroundColor: performanceBadge.color,
              color: 'white',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: '500'
            }}
          >
            {performanceBadge.label}
          </span>
        </td>
      </tr>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (!rankingsData?.pagination) return null;

    const { current_page, total_pages, total_count } = rankingsData.pagination;
    
    return (
      <div className="rankings-pagination">
        <div className="pagination-info text-caption">
          Showing {((current_page - 1) * pageSize) + 1} to {Math.min(current_page * pageSize, total_count)} of {total_count} teachers
        </div>
        
        <div className="pagination-controls">
          <button
            className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={current_page <= 1}
          >
            Previous
          </button>
          
          <span className="page-indicator text-body-small">
            Page {current_page} of {total_pages}
          </span>
          
          <button
            className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
            onClick={() => setCurrentPage(prev => Math.min(total_pages, prev + 1))}
            disabled={current_page >= total_pages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`interactive-teacher-rankings ${className}`}>
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
      <div className={`interactive-teacher-rankings ${className}`}>
        <EmptyState
          variant="error"
          description={error}
          action={loadTeacherRankings}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  // No data state
  if (!rankingsData?.rankings || rankingsData.rankings.length === 0) {
    return (
      <div className={`interactive-teacher-rankings ${className}`}>
        <EmptyState
          variant="no-data"
          title="No Teacher Rankings"
          description="No teacher ranking data available for the selected criteria."
          action={loadTeacherRankings}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className={`interactive-teacher-rankings ${className} fade-in`}>
      <DashboardCard
        title="Teacher Rankings"
        subtitle={`${processedRankings.length} teachers ranked by performance`}
        icon="🏆"
        variant="primary"
        headerActions={
          <div className="rankings-controls enhanced-flex enhanced-gap-3">
            {/* Export controls */}
            {enableExport && (
              <div className="export-controls enhanced-flex enhanced-gap-1">
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  title="Export as CSV"
                >
                  CSV
                </button>
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('excel')}
                  disabled={exporting}
                  title="Export as Excel"
                >
                  Excel
                </button>
              </div>
            )}
            
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh rankings data"
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
        {/* Export progress */}
        {exporting && (
          <div className="export-progress" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="enhanced-flex enhanced-items-center enhanced-gap-2">
              <div className="enhanced-spinner" style={{ width: '16px', height: '16px' }} />
              <span className="text-body-small">Exporting... {exportProgress}%</span>
            </div>
            <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${exportProgress}%`,
                  height: '4px',
                  backgroundColor: 'var(--primary-blue-500)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Filter controls */}
        {renderFilterControls()}

        {/* Selected teachers actions */}
        {selectedTeachers.size > 0 && (
          <div className="selected-actions" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="enhanced-flex enhanced-items-center enhanced-gap-3">
              <span className="text-body-small">
                {selectedTeachers.size} teacher{selectedTeachers.size !== 1 ? 's' : ''} selected
              </span>
              <button
                className="enhanced-btn enhanced-btn-sm enhanced-btn-primary"
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                Export Selected
              </button>
              <button
                className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                onClick={() => setSelectedTeachers(new Set())}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Rankings table */}
        <div className="rankings-table-container">
          <table className="rankings-table">
            {renderTableHeader()}
            <tbody>
              {processedRankings.map((teacher, index) => renderTableRow(teacher, index))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}

        {/* Summary statistics */}
        {rankingsData.summary && (
          <div className="rankings-summary" style={{ marginTop: 'var(--space-4)' }}>
            <div className="summary-stats enhanced-flex enhanced-gap-6">
              <div className="stat-item">
                <div className="stat-value text-heading-3">{rankingsData.summary.average_score?.toFixed(1) || 'N/A'}</div>
                <div className="stat-label text-caption">Department Average</div>
              </div>
              <div className="stat-item">
                <div className="stat-value text-heading-3">{rankingsData.summary.total_evaluations || 0}</div>
                <div className="stat-label text-caption">Total Evaluations</div>
              </div>
              <div className="stat-item">
                <div className="stat-value text-heading-3">{rankingsData.summary.average_response_rate?.toFixed(1) || 'N/A'}%</div>
                <div className="stat-label text-caption">Avg Response Rate</div>
              </div>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="rankings-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'var(--background-elevated)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            pointerEvents: 'none',
            fontSize: 'var(--text-sm)',
            whiteSpace: 'nowrap'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default InteractiveTeacherRankings;