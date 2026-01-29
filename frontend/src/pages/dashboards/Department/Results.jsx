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
import ExportControls from '../../../components/ExportControls';
import ExportNotification from '../../../components/ExportNotification';
import Pagination from '../../../components/Pagination';
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
  
  // View state - only evaluations view now
  const [activeView, setActiveView] = useState('evaluations');
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Performance optimization state
  const [performanceMode, setPerformanceMode] = useState('normal');
  const [dataReductionApplied, setDataReductionApplied] = useState(false);

  // Simple state management for evaluation results
  const [evaluations, setEvaluations] = useState([]);

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
    } catch (error) {
      console.error('Failed to refresh evaluation results:', error);
    }
  }, [id]);
  
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
      
      // Use enhanced API call for refresh
      await handleApiCall(
        () => refreshData(),
        'data_refresh'
      );

    } catch (err) {
      console.error('Failed to refresh data:', err);
      const errorId = addError(err, 'data_refresh');
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
          // Sort by final score instead of participation rate
          aVal = a.final_score || 
                 a.weighted_scores?.weighted_score || 
                 a.participation?.participation_rate || 0;
          bVal = b.final_score || 
                 b.weighted_scores?.weighted_score || 
                 b.participation?.participation_rate || 0;
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
            <div className="header-content">
              <div className="header-main">
                <h1 className="page-title">Evaluation Results</h1>
                <p className="page-description">Comprehensive evaluation analytics and reporting for {department?.name}</p>
              </div>
              <div className="header-actions">
                <ExportControls
                  onExport={handleExportAll}
                  loading={exportLoading}
                  disabled={filteredEvaluations.length === 0}
                  formats={['csv', 'excel']}
                  size="small"
                  variant="dropdown"
                />
                <button 
                  className="dept-btn dept-btn-primary refresh-btn"
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

      {/* Results content */}
      <div className="results-content" id="main-content">
        {/* Evaluations View */}
        {activeView === 'evaluations' && (
          <>
            {evaluations.length > 0 ? (
              <>


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
                      <option value="participation-desc">Highest Score</option>
                      <option value="participation-asc">Lowest Score</option>
                      <option value="status-asc">Status</option>
                    </select>
                    <span id="sort-help" className="sr-only">
                      Choose how to sort the evaluation results
                    </span>
                  </div>

                  {/* Evaluations List */}
                  <div className="evaluations-list">
                    {paginatedEvaluations.map((evaluation, index) => {
                      const participationRate = evaluation.participation?.participation_rate || 0;
                      const finalScore = evaluation.final_score || 
                                       evaluation.weighted_scores?.weighted_score || 
                                       participationRate;
                      
                      const getPerformanceLevel = () => {
                        if (finalScore >= 85) return { text: 'Excellent', class: 'perf-excellent' };
                        if (finalScore >= 70) return { text: 'Good', class: 'perf-good' };
                        if (finalScore >= 55) return { text: 'Average', class: 'perf-average' };
                        return { text: 'Poor', class: 'perf-poor' };
                      };
                      
                      const performance = getPerformanceLevel();
                      
                      return (
                        <div key={evaluation.id} className="evaluation-list-item">
                          <div className="teacher-avatar-section">
                            <div className="teacher-avatar">
                              {evaluation.teacher?.name ?
                                evaluation.teacher.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                                'UN'
                              }
                            </div>
                          </div>
                          
                          <div className="teacher-name-section">
                            <span className="teacher-name">
                              {evaluation.teacher?.name || 'Unknown Teacher'}
                            </span>
                          </div>
                          
                          <div className="percentage-section">
                            <span className="percentage-value">
                              {evaluation.final_score ? 
                                `${Math.round(evaluation.final_score)}%` : 
                                evaluation.weighted_scores?.weighted_score ? 
                                  `${Math.round(evaluation.weighted_scores.weighted_score)}%` :
                                  participationRate > 0 ? `${Math.round(participationRate)}%` : '0%'
                              }
                            </span>
                          </div>
                          
                          <div className="performance-section">
                            <span className={`performance-badge ${performance.class}`}>
                              {performance.text}
                            </span>
                          </div>
                          
                          <div className="responses-section">
                            <span className="responses-count">
                              {evaluation.participation?.total_responses || 0} responses
                            </span>
                          </div>
                          
                          <div className="date-section">
                            <span className="date-value">
                              {evaluation.opened_at ? new Date(evaluation.opened_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="action-section">
                            <button
                              className="see-detail-btn"
                              onClick={() => handleViewResults(evaluation.id)}
                            >
                              See Detail
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
      </div>
        </div>
      </DepartmentResultsErrorManager>
    </DepartmentResultsErrorBoundary>
  );
}

export default Results;
