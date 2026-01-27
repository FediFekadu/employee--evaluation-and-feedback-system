import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import ErrorAlert from '../../../components/ErrorHandling/ErrorAlert';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';
import DepartmentResultsErrorBoundary from '../../../components/ErrorHandling/DepartmentResultsErrorBoundary';
import DepartmentResultsErrorManager from '../../../components/ErrorHandling/DepartmentResultsErrorManager';
import ResultsPageFallback from '../../../components/ErrorHandling/ResultsPageFallback';
import StatusBadge from '../../../components/StatusBadge';
import ParticipationIndicator from '../../../components/ParticipationIndicator';
import EvaluationCard from '../../../components/EvaluationCard';
import ExportControls from '../../../components/ExportControls';
import ExportNotification from '../../../components/ExportNotification';
import Pagination from '../../../components/Pagination';
import VisualAnalytics from '../../../components/VisualAnalytics';
import TeacherRankings from '../../../components/TeacherRankings';
import PerformanceInsights from '../../../components/PerformanceInsights';
import { useExport } from '../../../hooks/useExport';
import { useDebounce } from '../../../hooks/useDebounce';
import { useErrorHandling } from '../../../hooks/useErrorHandling';
import { useDepartmentAdminAccess } from '../../../hooks/useAccessControl';
import { gracefulDegradationManager } from '../../../utils/errorHandling';

function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Enhanced error handling
  const { handleApiCall, addError, removeError } = useErrorHandling();
  
  // Access control - this will be handled by RouteGuard, but we can still use the hook for user info
  const { user } = useDepartmentAdminAccess(id);
  
  // Core state
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criticalError, setCriticalError] = useState(null);
  
  // View state for analytics tabs
  const [activeView, setActiveView] = useState('evaluations'); // 'evaluations', 'analytics', 'rankings', 'insights'
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Performance optimization state
  const [performanceMode, setPerformanceMode] = useState('normal');
  const [dataReductionApplied, setDataReductionApplied] = useState(false);

  // Simple state management for evaluation results
  const [evaluations, setEvaluations] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorRecoveryStatus, setErrorRecoveryStatus] = useState('stable');
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  // Simple refresh and reconnect functions
  const refreshData = useCallback(async () => {
    try {
      const params = {};
      const f = filters || {};
      if (f.academic_year) params.academic_year = f.academic_year;
      if (f.semester) params.semester = f.semester;
      if (f.instructor) params.instructor = f.instructor;
      const response = await api.get(`/departments/${id}/evaluation-results`, { params });
      setEvaluations(response.data?.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh evaluation results:', error);
    }
  }, [id]);

  const reconnect = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const toggleLiveUpdates = useCallback(() => {
    setLiveUpdatesEnabled(prev => !prev);
  }, []);

  const getConnectionStats = useCallback(() => {
    return {
      status: connectionStatus,
      lastUpdate,
      isConnected,
      isPolling
    };
  }, [connectionStatus, lastUpdate, isConnected, isPolling]);
  
  // Export functionality using the useExport hook
  const {
    loading: exportLoading,
    notification: exportNotification,
    exportDepartment,
    clearNotification: clearExportNotification
  } = useExport();
  
  // Initialize state from URL parameters
  const getInitialState = () => ({
    currentPage: parseInt(searchParams.get('page')) || 1,
    pageSize: parseInt(searchParams.get('pageSize')) || 10,
    sortBy: searchParams.get('sortBy') || 'opened_at',
    sortDirection: searchParams.get('sortDirection') || 'desc',
    filters: {
      course: searchParams.get('course') || '',
      instructor: searchParams.get('instructor') || '',
      status: searchParams.get('status') || '',
      performance: searchParams.get('performance') || '',
      participation: searchParams.get('participation') || '',
      yearLevel: searchParams.get('yearLevel') || '',
      academic_year: searchParams.get('academic_year') || '',
      semester: searchParams.get('semester') || ''
    }
  });

  // Pagination and filtering state with URL synchronization
  const [currentPage, setCurrentPage] = useState(getInitialState().currentPage);
  const [pageSize, setPageSize] = useState(getInitialState().pageSize);
  const [sortBy, setSortBy] = useState(getInitialState().sortBy);
  const [sortDirection, setSortDirection] = useState(getInitialState().sortDirection);
  const [filters, setFilters] = useState(getInitialState().filters);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search for performance optimization
  const debouncedCourseFilter = useDebounce(filters.course, 300);
  const debouncedInstructorFilter = useDebounce(filters.instructor, 300);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (pageSize !== 10) params.set('pageSize', pageSize.toString());
    if (sortBy !== 'opened_at') params.set('sortBy', sortBy);
    if (sortDirection !== 'desc') params.set('sortDirection', sortDirection);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    setSearchParams(params, { replace: true });
  }, [currentPage, pageSize, sortBy, sortDirection, filters, setSearchParams]);

  // Load department data on component mount
  useEffect(() => {
    loadDepartmentData();
  }, [id]);

  // Re-fetch evaluations when key filters change to honor server-side filtering
  useEffect(() => {
    refreshData();
  }, [filters.academic_year, filters.semester, filters.instructor, refreshData]);

  // Load department and evaluation data with enhanced error handling
  const loadDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      setCriticalError(null);

      // Use enhanced API call with error handling
      const deptRes = await handleApiCall(
        () => api.get(`/departments/${id}`),
        'department_load'
      );

      setDepartment(deptRes.data);

      // Also load evaluation results immediately so the page does not show an empty state
      const evalRes = await handleApiCall(
        () => api.get(`/departments/${id}/evaluation-results`, { params: {
          academic_year: filters.academic_year || undefined,
          semester: filters.semester || undefined,
          instructor: filters.instructor || undefined
        } }),
        'evaluation_results_initial_load'
      );

      // Prefer `data.data` shape, fallback to `data`
      const evals = evalRes?.data?.data ?? evalRes?.data ?? [];
      setEvaluations(evals);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
      setIsConnected(true);
      setLastRefresh(new Date());

    } catch (err) {
      console.error('Failed to load department data:', err);

      // Check if this is a critical error that should show fallback UI
      if (err.response?.status === 404) {
        setCriticalError(new Error('Department not found. Please check the URL and try again.'));
      } else if (!navigator.onLine) {
        setCriticalError(new Error('No internet connection. Please check your network and try again.'));
      } else {
        // Add to error manager for recovery options
        addError(err, 'department_load');
        setError('Failed to load department data. Please try the recovery options below.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh functionality with enhanced error handling
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setRefreshError(null);
      setRefreshSuccess(false);
      
      // Use enhanced API call for refresh
      await handleApiCall(
        () => refreshData(),
        'data_refresh'
      );
      
      setLastRefresh(new Date());
      setRefreshSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setRefreshSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Failed to refresh data:', err);
      const errorId = addError(err, 'data_refresh');
      setRefreshError(err.response?.data?.message || 'Failed to refresh data. Please try the recovery options below.');
      
      // Auto-hide error message after 10 seconds
      setTimeout(() => {
        setRefreshError(null);
      }, 10000);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to get participation indicator class (memoized)
  const getParticipationClass = useCallback((rate) => {
    if (rate >= 80) return 'participation-high';
    if (rate >= 60) return 'participation-medium';
    return 'participation-low';
  }, []);

  // Memoized filter function for better performance
  const filterEvaluations = useCallback((evaluations, filters, debouncedCourseFilter) => {
    return evaluations.filter(evaluation => {
      // Course filter (using debounced value)
      if (debouncedCourseFilter && !evaluation.course?.title?.toLowerCase().includes(debouncedCourseFilter.toLowerCase())) {
        return false;
      }
      
      // Instructor filter
      if (filters.instructor && !evaluation.teacher?.name?.toLowerCase().includes(filters.instructor.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status && evaluation.status !== filters.status) {
        return false;
      }
      
      // Year level filter
      if (filters.yearLevel && evaluation.course?.year_level !== filters.yearLevel) {
        return false;
      }

      // Academic year filter
      if (filters.academic_year && String(evaluation.academic_year) !== String(filters.academic_year)) {
        return false;
      }

      // Semester filter
      if (filters.semester && String(evaluation.semester) !== String(filters.semester)) {
        return false;
      }
      
      // Performance filter (based on participation rate)
      if (filters.performance) {
        const participationRate = evaluation.participation?.participation_rate || 0;
        switch (filters.performance) {
          case 'high':
            if (participationRate < 80) return false;
            break;
          case 'medium':
            if (participationRate < 60 || participationRate >= 80) return false;
            break;
          case 'low':
            if (participationRate >= 60) return false;
            break;
        }
      }
      
      // Participation filter (based on data quality)
      if (filters.participation) {
        const dataQuality = evaluation.participation?.data_quality?.toLowerCase();
        if (dataQuality !== filters.participation.toLowerCase()) {
          return false;
        }
      }
      
      return true;
    });
  }, []);

  // Memoized sort function for better performance
  const sortEvaluations = useCallback((evaluations, sortBy, sortDirection) => {
    return [...evaluations].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'course':
          aVal = a.course?.title || '';
          bVal = b.course?.title || '';
          break;
        case 'instructor':
          aVal = a.teacher?.name || '';
          bVal = b.teacher?.name || '';
          break;
        case 'year':
          aVal = a.course?.year_level || '';
          bVal = b.course?.year_level || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'participation':
          aVal = a.participation?.participation_rate || 0;
          bVal = b.participation?.participation_rate || 0;
          break;
        case 'opened_at':
        default:
          aVal = new Date(a.opened_at || 0);
          bVal = new Date(b.opened_at || 0);
          break;
      }
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, []);

  // Memoized filtered evaluations
  const filteredEvaluations = useMemo(() => {
    if (!evaluations.length) return [];
    return filterEvaluations(evaluations, filters, debouncedCourseFilter);
  }, [evaluations, filters, debouncedCourseFilter, filterEvaluations]);

  // Memoized sorted and paginated evaluations
  const paginatedEvaluations = useMemo(() => {
    if (!filteredEvaluations.length) return [];
    
    // Apply sorting
    const sorted = sortEvaluations(filteredEvaluations, sortBy, sortDirection);

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredEvaluations, sortBy, sortDirection, currentPage, pageSize, sortEvaluations]);

  const totalPages = Math.ceil(filteredEvaluations.length / pageSize);

  // Handle sorting (optimized with useCallback)
  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortBy, sortDirection]);

  // Handle view results navigation (optimized with useCallback)
  const handleViewResults = useCallback((evaluationId) => {
    navigate(`/department/${id}/results/${evaluationId}`);
  }, [navigate, id]);

  // Handle filter changes (optimized with useCallback)
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Clear all filters (optimized with useCallback)
  const clearFilters = useCallback(() => {
    setFilters({
      course: '',
      instructor: '',
      status: '',
      performance: '',
      participation: '',
      yearLevel: '',
      academic_year: '',
      semester: ''
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active (memoized)
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(filter => filter !== '');
  }, [filters]);

  // Get unique values for filter dropdowns (memoized)
  const getUniqueValues = useCallback((field) => {
    const values = new Set();
    evaluations.forEach(evaluation => {
      let value;
      switch (field) {
        case 'course':
          value = evaluation.course?.title;
          break;
        case 'instructor':
          value = evaluation.teacher?.name;
          break;
        case 'status':
          value = evaluation.status;
          break;
        case 'yearLevel':
          value = evaluation.course?.year_level;
          break;
        case 'participation':
          value = evaluation.participation?.data_quality;
          break;
        case 'academic_year':
          value = evaluation.academic_year;
          break;
        case 'semester':
          value = evaluation.semester;
          break;
      }
      if (value) values.add(value);
    });
    return Array.from(values).sort();
  }, [evaluations]);

  // Handle retry for errors
  const handleRetry = () => {
    setError(null);
    loadDepartmentData();
  };

  // Handle refresh error retry
  const handleRefreshRetry = () => {
    setRefreshError(null);
    handleRefresh();
  };

  // Handle data reduction for performance optimization
  const handleDataReduction = useCallback(async (strategy) => {
    try {
      setPerformanceMode('optimized');
      setDataReductionApplied(true);
      
      // Apply the degradation strategy
      if (strategy.strategy === 'pagination') {
        setPageSize(Math.min(pageSize, strategy.pageSize || 10));
      } else if (strategy.strategy === 'limit') {
        setPageSize(Math.min(pageSize, strategy.limit || 20));
      }
      
      // Clear filters to reduce dataset
      clearFilters();
      
      // Show notification about optimization
      console.log('Data reduction applied:', strategy);
      
    } catch (error) {
      console.error('Data reduction failed:', error);
    }
  }, [pageSize, clearFilters]);

  // Handle format change for export errors
  const handleFormatChange = useCallback(async (newFormat) => {
    try {
      // Retry export with new format
      await handleExportAll(newFormat);
    } catch (error) {
      console.error('Format change failed:', error);
    }
  }, []);

  // Handle filter reset for recovery
  const handleFilterReset = useCallback(async () => {
    try {
      clearFilters();
      setCurrentPage(1);
      // Reload data
      await loadDepartmentData();
    } catch (error) {
      console.error('Filter reset failed:', error);
    }
  }, [clearFilters, loadDepartmentData]);

  // Handle contact support
  const handleContactSupport = useCallback(() => {
    const supportInfo = {
      page: 'Department Results',
      departmentId: id,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      evaluationCount: evaluations.length,
      filtersApplied: hasActiveFilters,
      performanceMode: performanceMode
    };
    
    const mailtoLink = `mailto:support@evaluation-system.com?subject=Department Results Issue&body=${encodeURIComponent(
      `I need help with the Department Results page.\n\nContext:\n${JSON.stringify(supportInfo, null, 2)}`
    )}`;
    
    window.open(mailtoLink);
  }, [id, evaluations.length, hasActiveFilters, performanceMode]);

  // Handle export functionality for all evaluations using the new export service
  const handleExportAll = async (format) => {
    try {
      const exportOptions = {
        evaluations: filteredEvaluations.map(e => e.id),
        filters: filters,
        sortBy: sortBy,
        sortDirection: sortDirection,
        preservePrivacy: true,
        includeAnalytics: true
      };

      await exportDepartment(id, format, exportOptions);
    } catch (error) {
      // Add error to error manager for recovery options
      addError(error, 'export_department');
      throw error;
    }
  };

  // Dismiss export notification (now handled by useExport hook)
  const dismissExportNotification = clearExportNotification;

  // Critical error fallback (shows fallback UI)
  if (criticalError) {
    return (
      <ResultsPageFallback
        error={criticalError}
        onRetry={loadDepartmentData}
        onContactSupport={handleContactSupport}
        showTechnicalDetails={process.env.NODE_ENV === 'development'}
      />
    );
  }

  // Loading view
  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="dashboard-header">
          <div>
            <h1>Results</h1>
            <p>Loading evaluation results...</p>
          </div>
        </div>
        <div className="loading-container">
          <LoadingSpinner size="large" message="Loading department evaluation results..." />
        </div>
      </div>
    );
  }

  // Error view
  if (error) {
    return (
      <div className="dashboard-overview">
        <ErrorAlert
          error={{ response: { data: { message: error } } }}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <DepartmentResultsErrorBoundary
      context="department_results_main"
      onRetry={loadDepartmentData}
      onReduceDataset={handleDataReduction}
      onContactSupport={handleContactSupport}
      autoRetry={true}
      maxAutoRetries={2}
    >
      <DepartmentResultsErrorManager
        context="department_results"
        onDataReduction={handleDataReduction}
        onFormatChange={handleFormatChange}
        onFilterReset={handleFilterReset}
        onContactSupport={handleContactSupport}
      >
        <div className="dashboard-overview">
          <a href="#main-content" className="skip-link">Skip to main content</a>
          
          {/* Export Notification */}
          <ExportNotification
            notification={exportNotification}
            onDismiss={dismissExportNotification}
            autoHide={true}
            autoHideDelay={5000}
          />
          
          <div className="dashboard-header">
            <div>
              <h1>Evaluation Results</h1>
              <p>Comprehensive evaluation analytics and reporting for {department?.name}</p>
              <div className="header-meta">
                {(lastRefresh || lastUpdate) && (
                  <div className="last-refresh">
                    Last updated: {(lastUpdate || lastRefresh)?.toLocaleString()}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  fontSize: '0.8em'
                }}>
                  <span>🔄</span>
                  <span>Manual Refresh Mode</span>
                </div>
                {dataReductionApplied && (
                  <div className="performance-notice">
                    <span className="performance-icon">⚡</span>
                    <span>Performance mode active</span>
                  </div>
                )}
              </div>
            </div>
        <div className="header-actions">
          <div className="live-updates-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={liveUpdatesEnabled}
                onChange={(e) => toggleLiveUpdates(e.target.checked)}
                className="toggle-checkbox"
                id="live-updates-toggle"
                aria-describedby="live-updates-description"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Live Updates</span>
              <span id="live-updates-description" className="sr-only">
                Enable or disable live updates for evaluation data
              </span>
            </label>
          </div>
          <ExportControls
            onExport={handleExportAll}
            loading={exportLoading}
            disabled={filteredEvaluations.length === 0}
            formats={['csv', 'excel']}
            size="small"
            variant="dropdown"
          />
          <button 
            className="dept-btn dept-btn-ghost refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Refresh evaluation data"
          >
            {refreshing ? (
              <>
                <LoadingSpinner size="small" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <span className="refresh-icon">🔄</span>
                <span>Refresh Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Navigation Tabs */}
      <div className="view-tabs">
        <button 
          className={`view-tab ${activeView === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveView('evaluations')}
        >
          📊 Evaluations
        </button>
        <button 
          className={`view-tab ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          📈 Visual Analytics
        </button>
        <button 
          className={`view-tab ${activeView === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveView('rankings')}
        >
          🏆 Teacher Rankings
        </button>
        <button 
          className={`view-tab ${activeView === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveView('insights')}
        >
          💡 Performance Insights
        </button>
      </div>

      {/* Refresh Status Messages */}
      {refreshSuccess && (
        <div className="refresh-notification success">
          <span className="notification-icon">✅</span>
          <span>Data refreshed successfully</span>
          <button 
            className="notification-close"
            onClick={() => setRefreshSuccess(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {refreshError && (
        <div className="refresh-notification error">
          <span className="notification-icon">❌</span>
          <span>{refreshError}</span>
          <div className="notification-actions">
            <button 
              className="notification-retry"
              onClick={handleRefreshRetry}
              disabled={refreshing}
            >
              Retry
            </button>
            <button 
              className="notification-close"
              onClick={() => setRefreshError(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Recovery Status */}
      {errorRecoveryStatus && (
        <div className={`refresh-notification ${errorRecoveryStatus.type === 'recovering' ? 'info' : 'warning'}`}>
          <span className="notification-icon">
            {errorRecoveryStatus.type === 'recovering' ? '🔄' : '⚠️'}
          </span>
          <span>{errorRecoveryStatus.message}</span>
          {errorRecoveryStatus.action && (
            <div className="notification-actions">
              <button 
                className="notification-retry"
                onClick={() => {
                  if (errorRecoveryStatus.action === 'refresh_page') {
                    window.location.reload();
                  } else {
                    reconnect();
                  }
                }}
              >
                {errorRecoveryStatus.action === 'refresh_page' ? 'Refresh Page' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      )}

      </div>

      {/* Results content */}
      <div className="results-content" id="main-content">
        {/* Evaluations View */}
        {activeView === 'evaluations' && (
          <>
            {evaluations.length > 0 ? (
              <>
                {/* Summary stats */}
                <div className="results-summary">
                  <div className="summary-stats">
                    <div className="summary-stat" aria-label="Total evaluations across department">
                      <div className="stat-icon">📊</div>
                      <span className="stat-value">{evaluations.length}</span>
                      <span className="stat-label">Total Evaluations</span>
                    </div>
                    <div className="summary-stat" aria-label="Active evaluations currently open">
                      <div className="stat-icon">✅</div>
                      <span className="stat-value">
                        {evaluations.filter(e => e.status === 'Active').length}
                      </span>
                      <span className="stat-label">Active</span>
                    </div>
                    <div className="summary-stat" aria-label="Closed evaluations that are completed">
                      <div className="stat-icon">🗂️</div>
                      <span className="stat-value">
                        {evaluations.filter(e => e.status === 'Closed').length}
                      </span>
                      <span className="stat-label">Closed</span>
                    </div>
                    <div className="summary-stat" aria-label="Average student participation across evaluations">
                      <div className="stat-icon">📈</div>
                      <span className="stat-value">
                        {evaluations.length > 0
                          ? Math.round(
                              evaluations.reduce((sum, e) => sum + (e.participation?.participation_rate || 0), 0) /
                              evaluations.length
                            )
                          : 0}%
                      </span>
                      <span className="stat-label">Avg Participation</span>
                    </div>
                  </div>
                </div>

                {/* Evaluations table */}
                <div className="evaluations-table-container">
                  <div className="table-header">
                    <h3>Evaluation Results</h3>
                    <div className="table-controls">
                      <button 
                        className={`dept-btn dept-btn-ghost ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        🔍 Filters {hasActiveFilters && <span className="filter-count">({Object.values(filters).filter(f => f !== '').length})</span>}
                      </button>
                      <select 
                        value={pageSize} 
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="page-size-select"
                        aria-label="Number of evaluations per page"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  {showFilters && (
                    <div className="filter-controls">
                      <div className="filter-grid">
                        <div className="filter-group">
                          <label htmlFor="course-filter">Course</label>
                          <input
                            id="course-filter"
                            type="text"
                            placeholder="Search courses..."
                            value={filters.course}
                            onChange={(e) => handleFilterChange('course', e.target.value)}
                            className="filter-input"
                            aria-describedby="course-filter-help"
                          />
                          <span id="course-filter-help" className="sr-only">
                            Filter evaluations by course name
                          </span>
                        </div>
                        
                        <div className="filter-group">
                          <label htmlFor="instructor-filter">Instructor</label>
                          <select
                            id="instructor-filter"
                            value={filters.instructor}
                            onChange={(e) => handleFilterChange('instructor', e.target.value)}
                            className="filter-select"
                            aria-describedby="instructor-filter-help"
                          >
                            <option value="">All Instructors</option>
                            {getUniqueValues('instructor').map(instructor => (
                              <option key={instructor} value={instructor}>{instructor}</option>
                            ))}
                          </select>
                          <span id="instructor-filter-help" className="sr-only">
                            Filter evaluations by instructor name
                          </span>
                        </div>

                        <div className="filter-group">
                          <label htmlFor="academic-year-filter">Academic Year</label>
                          <select
                            id="academic-year-filter"
                            value={filters.academic_year}
                            onChange={(e) => handleFilterChange('academic_year', e.target.value)}
                            className="filter-select"
                            aria-describedby="academic-year-filter-help"
                          >
                            <option value="">All Years</option>
                            {getUniqueValues('academic_year').map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <span id="academic-year-filter-help" className="sr-only">
                            Filter evaluations by academic year
                          </span>
                        </div>

                        <div className="filter-group">
                          <label htmlFor="semester-filter">Semester</label>
                          <select
                            id="semester-filter"
                            value={filters.semester}
                            onChange={(e) => handleFilterChange('semester', e.target.value)}
                            className="filter-select"
                            aria-describedby="semester-filter-help"
                          >
                            <option value="">All Semesters</option>
                            {getUniqueValues('semester').map(sem => (
                              <option key={sem} value={sem}>{sem}</option>
                            ))}
                          </select>
                          <span id="semester-filter-help" className="sr-only">
                            Filter evaluations by semester
                          </span>
                        </div>
                        
                        <div className="filter-group">
                          <label>Status</label>
                          <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="filter-select"
                          >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Closed">Closed</option>
                            <option value="Draft">Draft</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label>Year Level</label>
                          <select
                            value={filters.yearLevel}
                            onChange={(e) => handleFilterChange('yearLevel', e.target.value)}
                            className="filter-select"
                          >
                            <option value="">All Years</option>
                            {getUniqueValues('yearLevel').map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label>Performance</label>
                          <select
                            value={filters.performance}
                            onChange={(e) => handleFilterChange('performance', e.target.value)}
                            className="filter-select"
                          >
                            <option value="">All Performance</option>
                            <option value="high">High (80%+)</option>
                            <option value="medium">Medium (60-79%)</option>
                            <option value="low">Low (&lt;60%)</option>
                          </select>
                        </div>
                        
                        <div className="filter-group">
                          <label>Data Quality</label>
                          <select
                            value={filters.participation}
                            onChange={(e) => handleFilterChange('participation', e.target.value)}
                            className="filter-select"
                          >
                            <option value="">All Quality</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="limited">Limited</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="filter-actions">
                        {hasActiveFilters && (
                          <div className="active-filters" aria-label="Active filters">
                            {Object.entries(filters)
                              .filter(([_, value]) => value)
                              .map(([key, value]) => {
                                const labels = {
                                  course: 'Course',
                                  instructor: 'Instructor',
                                  status: 'Status',
                                  yearLevel: 'Year Level',
                                  performance: 'Performance',
                                  participation: 'Data Quality',
                                  academic_year: 'Academic Year',
                                  semester: 'Semester'
                                };
                                return (
                                  <button
                                    key={`${key}-${value}`}
                                    className="dept-btn dept-btn-ghost"
                                    title={`Remove ${labels[key]} filter`}
                                    onClick={() => handleFilterChange(key, '')}
                                  >
                                    {labels[key]}: {value} ✕
                                  </button>
                                );
                              })}
                          </div>
                        )}
                        <button 
                          className="dept-btn dept-btn-ghost"
                          onClick={clearFilters}
                          disabled={!hasActiveFilters}
                        >
                          Clear Filters
                        </button>
                        <div className="filter-results">
                          Showing {filteredEvaluations.length} of {evaluations.length} evaluations
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sort Controls */}
                  <div className="sort-controls">
                    <label htmlFor="sort-select">Sort by:</label>
                    <select 
                      id="sort-select"
                      value={`${sortBy}-${sortDirection}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-');
                        setSortBy(field);
                        setSortDirection(direction);
                        setCurrentPage(1);
                      }}
                      className="sort-select"
                      aria-describedby="sort-help"
                    >
                      <option value="opened_at-desc">Newest First</option>
                      <option value="opened_at-asc">Oldest First</option>
                      <option value="course-asc">Course A-Z</option>
                      <option value="course-desc">Course Z-A</option>
                      <option value="instructor-asc">Instructor A-Z</option>
                      <option value="instructor-desc">Instructor Z-A</option>
                      <option value="participation-desc">Highest Participation</option>
                      <option value="participation-asc">Lowest Participation</option>
                      <option value="status-asc">Status</option>
                    </select>
                    <span id="sort-help" className="sr-only">
                      Choose how to sort the evaluation results
                    </span>
                  </div>

                  {/* Evaluations Cards Grid */}
                  <div className="evaluations-cards-grid">
                    {paginatedEvaluations.map((evaluation) => (
                      <EvaluationCard
                        key={evaluation.id}
                        evaluation={evaluation}
                        onViewResults={handleViewResults}
                        getParticipationClass={getParticipationClass}
                      />
                    ))}
                  </div>

                  {/* Enhanced Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredEvaluations.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    showPageSizeSelector={true}
                    showJumpToPage={true}
                    showItemsInfo={true}
                    maxVisiblePages={5}
                    pageSizeOptions={[5, 10, 20, 50]}
                    className="evaluations-pagination"
                  />
                </div>
              </>
            ) : (
              <div className="no-evaluations">
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No Evaluation Results</h3>
                  <p>No evaluations found for this department.</p>
                  <button 
                    className="dept-btn dept-btn-primary"
                    onClick={() => navigate(`/department/${id}/evaluations`)}
                  >
                    Manage Evaluations
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Visual Analytics View */}
        {activeView === 'analytics' && (
          <div className="analytics-view">
            <VisualAnalytics
              departmentId={id}
              chartTypes={['performance_distribution', 'participation_trends', 'teacher_comparison', 'rating_breakdown']}
              height="400px"
              showLegend={true}
              showTooltips={true}
              className="department-analytics"
              onChartClick={(chartType, data) => {
                console.log('Chart clicked:', chartType, data);
                // Handle chart interactions
              }}
            />
          </div>
        )}

        {/* Teacher Rankings View */}
        {activeView === 'rankings' && (
          <div className="rankings-view">
            <TeacherRankings
              departmentId={id}
              sortBy="performance"
              sortDirection="desc"
              limit={50}
              showInsights={true}
              showComparison={true}
              className="department-rankings"
              onTeacherClick={(teacher) => {
                console.log('Teacher clicked:', teacher);
                // Handle teacher selection - could navigate to detailed view
              }}
            />
          </div>
        )}

        {/* Performance Insights View */}
        {activeView === 'insights' && (
          <div className="insights-view">
            <PerformanceInsights
              departmentId={id}
              includeTrends={true}
              includeBenchmarking={true}
              className="department-insights"
              onInsightClick={(insight) => {
                console.log('Insight clicked:', insight);
                // Handle insight interactions
              }}
            />
          </div>
        )}
      </div>
    </DepartmentResultsErrorManager>
  </DepartmentResultsErrorBoundary>
  );
}

export default Results;
