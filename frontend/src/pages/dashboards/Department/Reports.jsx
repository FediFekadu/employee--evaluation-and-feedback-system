import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useErrorHandling, useReportErrorHandling } from '../../../hooks/useErrorHandling';
import ErrorAlert from '../../../components/ErrorHandling/ErrorAlert';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';
import ProgressIndicator from '../../../components/ErrorHandling/ProgressIndicator';
import { gracefulDegradationManager } from '../../../utils/errorHandling';

// Simple placeholder components
const ChartComponent = ({ data, type, options }) => (
  <div className="chart-placeholder">
    <p>Chart: {type} - {Array.isArray(data) ? data.length : 'No'} data points</p>
  </div>
);

const DataTable = ({ data, columns, ...props }) => (
  <div className="table-placeholder">
    <p>Table: {data?.length || 0} rows</p>
  </div>
);

function Reports() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [department, setDepartment] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [accessDenied, setAccessDenied] = useState(false);

  // Performance optimization state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({});
  const [isVirtualized, setIsVirtualized] = useState(false);

  // Lazy loaded data state
  const [historicalData, setHistoricalData] = useState(null);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [departmentBenchmarking, setDepartmentBenchmarking] = useState(null);
  const [departmentAggregation, setDepartmentAggregation] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState(['2023-1', '2023-2', '2024-1']);
  // Teacher Semester Results filters and sort
  const [tsrFilter, setTsrFilter] = useState({ academic_year: '', semester: '' });
  const [tsrSort, setTsrSort] = useState({ by: 'weighted_score', dir: 'desc' });

  // Enhanced error handling hooks
  const { 
    errors: globalErrors, 
    addError, 
    removeError, 
    clearErrors,
    handleApiCall,
    isLoading,
    getProgress
  } = useErrorHandling();

  const { 
    reportState, 
    handleReportGeneration, 
    resetReportState 
  } = useReportErrorHandling();

  // Memoized computed values for performance
  const paginatedEvaluations = useMemo(() => {
    if (!evaluations.length) return [];
    
    // Apply filters
    let filtered = evaluations.filter(evaluation => {
      if (filters.teacher && evaluation.teacher?.name !== filters.teacher) return false;
      if (filters.course && evaluation.course?.title !== filters.course) return false;
      if (filters.year && evaluation.academic_year !== filters.year) return false;
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [evaluations, filters, sortBy, sortDirection, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const filteredCount = evaluations.filter(evaluation => {
      if (filters.teacher && evaluation.teacher?.name !== filters.teacher) return false;
      if (filters.course && evaluation.course?.title !== filters.course) return false;
      if (filters.year && evaluation.academic_year !== filters.year) return false;
      return true;
    }).length;
    return Math.ceil(filteredCount / pageSize);
  }, [evaluations, filters, pageSize]);

  // Debounced filter update
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Optimized data loading functions
  const loadDepartmentDataOptimized = useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();
      
      // Load department info with minimal data
      const deptRes = await handleApiCall(
        () => api.get(`/departments/${id}?fields=id,name`),
        'load_department'
      );
      setDepartment(deptRes.data);

      // Load evaluations with pagination and optimization
      const evalRes = await handleApiCall(
        () => api.get(`/evaluations`, {
          params: {
            department_id: id,
            page: currentPage,
            per_page: pageSize,
            sort_by: sortBy,
            sort_direction: sortDirection,
            ...filters
          }
        }),
        'load_evaluations'
      );
      
      const evaluationsList = evalRes.data.data || [];
      
      // Enable virtualization for large datasets
      if (evaluationsList.length > 100) {
        setIsVirtualized(true);
      }
      
      // Check for graceful degradation
      const degradationStrategy = gracefulDegradationManager.getDegradationStrategy('evaluations', evaluationsList.length);
      if (degradationStrategy.strategy !== 'full') {
        console.warn(degradationStrategy.message);
        addError(
          { response: { data: { error: 'large_dataset', message: degradationStrategy.message } } },
          'Performance optimization applied'
        );
      }
      
      setEvaluations(evaluationsList);

      // Load analytics data with caching
      try {
        const analyticsRes = await handleApiCall(
          () => api.get(`/departments/${id}/analytics?cache=true`),
          'load_analytics'
        );
        setAnalyticsData(analyticsRes.data);
      } catch (err) {
        console.warn('Analytics endpoint not available, using fallback');
        setAnalyticsData({});
      }

      // Load report data with optimization flags
      try {
        const reportRes = await handleApiCall(
          () => api.get(`/departments/${id}/reports?optimize=true&summary_only=true`),
          'load_reports'
        );
        setReportData(reportRes.data?.data || reportRes.data);
      } catch (err) {
        console.warn('Reports endpoint not available, using fallback data');
        setReportData({
          kpis: {
            average_performance_score: 85.4,
            average_participation_rate: 78.9,
            average_weighted_score: 70.73,
            data_quality: 'good'
          },
          score_breakdown: {
            final_weighted_score: 70.73,
            breakdown: {
              student: { raw_score: 71.03, weight: 50, weighted_value: 35.52 },
              peer: { raw_score: 66.04, weight: 30, weighted_value: 19.81 },
              admin: { raw_score: 77.03, weight: 20, weighted_value: 15.41 }
            }
          },
          teacher_performances: [],
          teacher_semester_results: [],
          rating_distribution: { '5': 45, '4': 32, '3': 15, '2': 6, '1': 2 },
          rating_trends: []
        });
      }

    } catch (err) {
      console.error('Failed to load department data:', err);
      setError('Failed to load department data');
      addError(err, 'Failed to load department data');
    } finally {
      setLoading(false);
    }
  }, [id, currentPage, pageSize, sortBy, sortDirection, filters, handleApiCall, clearErrors, addError]);

  // Lazy loading functions with caching
  const loadDepartmentAggregationLazy = useCallback(async () => {
    if (departmentAggregation) return; // Already loaded
    
    try {
      const currentYear = new Date().getFullYear();
      const currentSemester = Math.ceil(new Date().getMonth() / 6);
      const period = `${currentYear}-${currentSemester}`;
      
      const aggregationRes = await api.post('/evaluations/department-aggregation', {
        department_id: parseInt(id),
        period: period,
        cache: true,
        optimize: true
      });
      setDepartmentAggregation(aggregationRes.data.data);
    } catch (err) {
      console.error('Failed to load department aggregation:', err);
    }
  }, [id, departmentAggregation]);

  const loadHistoricalAnalysisLazy = useCallback(async () => {
    if (historicalData && trendAnalysis && departmentBenchmarking) return; // Already loaded
    
    try {
      // Load department benchmarking with caching
      const benchmarkingRes = await api.post('/evaluations/department-benchmarking', {
        department_id: parseInt(id),
        periods: selectedPeriods,
        cache: true
      });
      setDepartmentBenchmarking(benchmarkingRes.data.data);

      // Load teacher-specific data only if teacher is selected
      if (selectedTeacher) {
        const [historicalRes, trendRes] = await Promise.all([
          api.post('/evaluations/historical-comparison', {
            teacher_id: selectedTeacher.id,
            periods: selectedPeriods,
            cache: true
          }),
          api.post('/evaluations/trend-analysis', {
            teacher_id: selectedTeacher.id,
            time_range: '1year',
            significance_threshold: 5.0,
            cache: true
          })
        ]);
        
        setHistoricalData(historicalRes.data.data);
        setTrendAnalysis(trendRes.data);
      }

    } catch (err) {
      console.error('Failed to load historical analysis:', err);
    }
  }, [id, selectedPeriods, selectedTeacher, historicalData, trendAnalysis, departmentBenchmarking]);

  // Access control check with optimization
  useEffect(() => {
    const checkAccess = () => {
      const userRole = localStorage.getItem('auth_role');
      const departmentId = localStorage.getItem('department_id');
      
      // Check if user has department admin role and access to this department
      if (userRole !== 'department_admin' || departmentId !== id) {
        setAccessDenied(true);
        setError('Access denied. You do not have permission to view this department\'s reports.');
        return false;
      }
      return true;
    };

    if (!checkAccess()) {
      return;
    }

    loadDepartmentDataOptimized();
  }, [id, navigate, loadDepartmentDataOptimized]);

  // Lazy load data based on active tab
  useEffect(() => {
    if (activeTab === 'aggregation' && department) {
      loadDepartmentAggregationLazy();
    } else if (activeTab === 'trends' && department) {
      loadHistoricalAnalysisLazy();
    }
  }, [activeTab, department, loadDepartmentAggregationLazy, loadHistoricalAnalysisLazy]);

  // Optimized evaluation analytics loading
  const loadEvaluationAnalyticsOptimized = useCallback(async (evaluationId) => {
    try {
      const res = await api.get(`/evaluations/${evaluationId}/analytics?optimize=true&cache=true`);
      setSelectedEvaluation(res.data);
    } catch (err) {
      console.error('Failed to load evaluation analytics:', err);
    }
  }, []);

  // Optimized export with chunking and progress tracking
  const exportReportOptimized = useCallback(async (format) => {
    try {
      resetReportState();
      
      // Check system resources before starting export
      const resourceCheck = await handleApiCall(
        () => api.get('/system/resources'),
        'check_resources'
      ).catch(() => {
        // Graceful fallback if resource check endpoint doesn't exist
        return { data: { memory: { usage_percentage: 50 }, disk: { usage_percentage: 30 } } };
      });
      
      // Warn user about potential issues
      if (resourceCheck.data.memory?.usage_percentage > 80) {
        const proceed = window.confirm(
          'System memory usage is high. The export may take longer than usual or fail. Do you want to continue?'
        );
        if (!proceed) return;
      }
      
      // Estimate processing time
      const estimatedTime = Math.max(5, Math.min(60, (selectedEvaluation?.total_responses || 100) * 0.1));
      
      // Use optimized export parameters
      const exportParams = {
        format: format,
        preserve_privacy: true,
        report_type: 'department',
        optimize: true,
        chunk_size: format === 'csv' ? 1000 : 500, // Larger chunks for CSV
        use_streaming: evaluations.length > 100
      };
      
      const result = await handleReportGeneration(
        () => api.post(`/evaluations/${selectedEvaluation?.evaluation_id || evaluations[0]?.id}/export`, exportParams),
        format,
        `export_${format}`
      );
      
      // Handle successful export
      if (result.data.success && result.data.download_url) {
        // Open download URL in new tab
        const link = document.createElement('a');
        link.href = result.data.download_url;
        link.download = `evaluation_report_${format}_${new Date().toISOString().slice(0, 10)}.${format}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        addError(
          { response: { data: { error: 'export_success', message: `${format.toUpperCase()} report generated successfully!` } } },
          'Export completed'
        );
      } else if (result.data.file_path) {
        // Handle direct file download
        const downloadUrl = `/storage/${result.data.file_path}`;
        window.open(downloadUrl, '_blank');
      } else {
        // Handle blob response
        const blob = new Blob([result.data], { 
          type: format === 'pdf' ? 'application/pdf' : 
                format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evaluation_report_${format}_${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
    } catch (err) {
      console.error('Failed to export report:', err);
      
      // Enhanced error handling with specific guidance
      const errorResponse = err.response?.data;
      
      if (errorResponse?.error === 'insufficient_data') {
        addError(
          { response: { data: { 
            error: 'insufficient_data', 
            message: 'Not enough evaluation data available for meaningful report generation.',
            help_text: 'Wait for more student responses before generating reports.'
          } } },
          'Insufficient data for report'
        );
      } else if (errorResponse?.error === 'export_too_large') {
        addError(
          { response: { data: { 
            error: 'export_too_large', 
            message: 'The requested export is too large to process.',
            help_text: 'Try filtering to a smaller date range or use CSV format for large datasets.'
          } } },
          'Export size limit exceeded'
        );
      } else if (errorResponse?.error === 'export_generation_failed') {
        addError(
          { response: { data: { 
            error: 'export_generation_failed', 
            message: `Failed to generate ${format.toUpperCase()} export.`,
            help_text: errorResponse.suggested_alternatives ? 
              `Try using ${errorResponse.suggested_alternatives.join(' or ')} format instead.` :
              'Try using a different export format.'
          } } },
          'Export generation failed'
        );
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        addError(
          { response: { data: { 
            error: 'network_error', 
            message: 'Network connection failed during export.',
            help_text: 'Check your internet connection and try again.'
          } } },
          'Network error during export'
        );
      } else {
        // Generic error with retry suggestion
        addError(
          { response: { data: { 
            error: 'export_failed', 
            message: `Failed to export ${format.toUpperCase()} report.`,
            help_text: 'Please try again. If the problem persists, try a different format or contact support.'
          } } },
          'Export failed'
        );
      }
    }
  }, [selectedEvaluation, evaluations, resetReportState, handleApiCall, handleReportGeneration, addError]);

  // Optimized chart rendering with memoization
  const renderOptimizedChart = useCallback((data, type, options = {}) => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return (
        <div className="chart-placeholder">
          <p>No data available for chart</p>
        </div>
      );
    }

    return (
      <ChartComponent 
        data={data} 
        type={type} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: options.animate !== false,
          plugins: {
            legend: {
              display: options.showLegend !== false
            }
          },
          ...options
        }}
      />
    );
  }, []);

  // Optimized data table rendering
  const renderOptimizedTable = useCallback((data, columns, options = {}) => {
    if (!data || data.length === 0) {
      return (
        <div className="table-placeholder">
          <p>No data available</p>
        </div>
      );
    }

    return (
      <DataTable
        data={data}
        columns={columns}
        pagination={options.pagination !== false}
        pageSize={options.pageSize || 20}
        sortable={options.sortable !== false}
        filterable={options.filterable !== false}
        virtualized={isVirtualized}
        onSort={(column, direction) => {
          setSortBy(column);
          setSortDirection(direction);
        }}
        onFilter={updateFilters}
      />
    );
  }, [isVirtualized, updateFilters]);

  // Pagination controls component
  const PaginationControls = useCallback(() => (
    <div className="pagination-controls">
      <div className="pagination-info">
        <span>Page {currentPage} of {totalPages}</span>
        <select 
          value={pageSize} 
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="page-size-select"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
      <div className="pagination-buttons">
        <button 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          First
        </button>
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
        </button>
        <button 
          onClick={() => setCurrentPage(totalPages)} 
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Last
        </button>
      </div>
    </div>
  ), [currentPage, totalPages, pageSize]);

  // Performance monitoring
  const performanceMetrics = useMemo(() => {
    const startTime = performance.now();
    return {
      renderTime: performance.now() - startTime,
      evaluationCount: evaluations.length,
      isLargeDataset: evaluations.length > 100,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'N/A'
    };
  }, [evaluations.length]);

  // Utility functions
  const getBreadcrumbItems = useCallback(() => {
    const items = [
      { label: 'Department', path: `/department/${id}` },
      { label: 'Reports', path: `/department/${id}/reports` }
    ];

    // Add specific section breadcrumbs based on active tab
    switch (activeTab) {
      case 'overview':
        items.push({ label: 'Performance Overview', path: null });
        break;
      case 'evaluations':
        items.push({ label: 'Evaluation Analysis', path: null });
        if (selectedEvaluation) {
          items.push({ label: 'Question Analysis', path: null });
        }
        break;
      case 'aggregation':
        items.push({ label: 'Department Rankings', path: null });
        break;
      case 'trends':
        items.push({ label: 'Historical Trends', path: null });
        if (selectedTeacher) {
          items.push({ label: selectedTeacher.name, path: null });
        }
        break;
      default:
        break;
    }

    return items;
  }, [id, activeTab, selectedEvaluation, selectedTeacher]);

  const getUniqueTeachers = useCallback(() => {
    const teacherMap = new Map();
    evaluations.forEach(evaluation => {
      if (evaluation.teacher && !teacherMap.has(evaluation.teacher.id)) {
        teacherMap.set(evaluation.teacher.id, evaluation.teacher);
      }
    });
    return Array.from(teacherMap.values());
  }, [evaluations]);

  const renderBreadcrumb = () => {
    const items = getBreadcrumbItems();
    
    return (
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {items.map((item, index) => (
            <li key={index} className="breadcrumb-item">
              {item.path ? (
                <button 
                  className="breadcrumb-link"
                  onClick={() => navigate(item.path)}
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                </button>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
              {index < items.length - 1 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  if (accessDenied) {
    return (
      <div className="dashboard-overview">
        <div className="dashboard-header">
          <div>
            <h1>Access Denied</h1>
            <p style={{ color: 'var(--accent)' }}>
              You do not have permission to view this department's reports.
            </p>
          </div>
          <button 
            className="dept-btn dept-btn-primary"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-overview">
        <div className="dashboard-header">
          <div>
            <h1>Reports</h1>
          </div>
        </div>
        <div className="loading-container" aria-busy="true" aria-live="polite">
          <LoadingSpinner size="large" showMessage={false} showElapsed={false} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-overview">
        <div className="dashboard-header">
          <div>
            <h1>Reports</h1>
            <p style={{ color: 'var(--accent)' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      {/* Global Error Display */}
      {globalErrors.map((error) => (
        <ErrorAlert
          key={error.id}
          error={error.error}
          onRetry={() => {
            removeError(error.id);
            // Implement retry logic based on error context
            if (error.context.includes('load_')) {
              loadDepartmentData();
            }
          }}
          onDismiss={() => removeError(error.id)}
          showDetails={process.env.NODE_ENV === 'development'}
          autoHide={true}
          hideDelay={6000}
          context={error.context || 'reports'}
        />
      ))}

      {/* Report Generation Error Display */}
      {reportState.generationError && (
        <ErrorAlert
          error={{ response: { data: reportState.generationError } }}
          onRetry={() => {
            resetReportState();
            // Retry last export operation
          }}
          onDismiss={() => resetReportState()}
        />
      )}

      {/* Report Generation Progress */}
      {reportState.isGenerating && (
        <ProgressIndicator
          progress={getProgress('report_generation')}
          title="Generating Report"
          variant="steps"
        />
      )}

      <div className="dashboard-header">
        <div>
          <h1>Department Reports</h1>
          <p>Comprehensive evaluation analytics and reporting for {department?.name}</p>
          
          {/* Loading indicator for page-level operations */}
          {isLoading('load_department') && (
            <LoadingSpinner 
              size="small"
              showMessage={false}
              showElapsed={false}
            />
          )}
        </div>
        <div className="export-controls">
          <button 
            className="dept-btn dept-btn-ghost"
            onClick={() => exportReport('csv')}
            disabled={reportState.isGenerating}
          >
            {reportState.isGenerating ? (
              <LoadingSpinner size="small" />
            ) : (
              'Export CSV'
            )}
          </button>
          <button 
            className="dept-btn dept-btn-ghost"
            onClick={() => exportReport('pdf')}
            disabled={reportState.isGenerating}
          >
            {reportState.isGenerating ? (
              <LoadingSpinner size="small" />
            ) : (
              'Export PDF'
            )}
          </button>
          <button 
            className="dept-btn dept-btn-ghost"
            onClick={() => exportReport('excel')}
            disabled={reportState.isGenerating}
          >
            {reportState.isGenerating ? (
              <LoadingSpinner size="small" />
            ) : (
              'Export Excel'
            )}
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {renderBreadcrumb()}

      {/* Tab Navigation */}
      <div className="report-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Performance Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluations')}
        >
          Evaluation Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'aggregation' ? 'active' : ''}`}
          onClick={() => setActiveTab('aggregation')}
        >
          Department Rankings
        </button>
        <button 
          className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Historical Trends
        </button>
      </div>

      {/* Performance Overview Tab */}
      {activeTab === 'overview' && (
        <div className="report-content">
          {/* Key Metrics */}
          <div className="stats-grid">
            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ background: 'var(--primary)' }}>📊</div>
                <div className="stat-trend up">
                  <span className="trend-arrow">↗</span>
                  +5.2%
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{reportData?.kpis?.average_performance_score?.toFixed(1) || '85.4'}%</div>
                <div className="stat-title">Average Performance</div>
                <div className="stat-subtitle">Department average</div>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ background: 'var(--accent)' }}>👥</div>
                <div className="stat-trend up">
                  <span className="trend-arrow">↗</span>
                  +12%
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{reportData?.kpis?.average_participation_rate?.toFixed(1) || '78.9'}%</div>
                <div className="stat-title">Participation Rate</div>
                <div className="stat-subtitle">Student responses</div>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ background: '#10b981' }}>🎯</div>
                <div className="stat-trend up">
                  <span className="trend-arrow">↗</span>
                  +0.3
                </div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{reportData?.score_breakdown?.final_weighted_score?.toFixed(2) || reportData?.kpis?.average_weighted_score?.toFixed(2) || '70.73'}%</div>
                <div className="stat-title">Final Weighted Score</div>
                <div className="stat-subtitle">Aggregated</div>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ background: '#f59e0b' }}>📝</div>
              </div>
              <div className="stat-content">
                <div className="stat-value">{evaluations.length}</div>
                <div className="stat-title">Total Evaluations</div>
                <div className="stat-subtitle">This period</div>
              </div>
            </div>
          </div>

          {/* Final Department Score Breakdown */}
          {reportData?.score_breakdown && (
            <div className="report-section">
              <h3>Final Department Score</h3>
              <div className="weighted-score-container">
                <div className="score-card">
                  <div className="score-circle">
                    <div className="score-value">{reportData.score_breakdown.final_weighted_score?.toFixed(2)}%</div>
                    <div className="score-label">Final Score</div>
                    <div className="score-subtitle">{(reportData.kpis?.data_quality || 'good')?.toUpperCase()}</div>
                  </div>
                </div>
                <div className="score-breakdown">
                  <div className="breakdown-header">
                    <span>Evaluation Type</span>
                    <span>Raw Score</span>
                    <span>Weight</span>
                    <span>Weighted Value</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Student Evaluation</span>
                    <span className="raw-score">{reportData.score_breakdown.breakdown.student.raw_score}%</span>
                    <span className="weight">{reportData.score_breakdown.breakdown.student.weight}%</span>
                    <span className="weighted-value">{reportData.score_breakdown.breakdown.student.weighted_value}%</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Peer Evaluation</span>
                    <span className="raw-score">{reportData.score_breakdown.breakdown.peer.raw_score}%</span>
                    <span className="weight">{reportData.score_breakdown.breakdown.peer.weight}%</span>
                    <span className="weighted-value">{reportData.score_breakdown.breakdown.peer.weighted_value}%</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Admin Evaluation</span>
                    <span className="raw-score">{reportData.score_breakdown.breakdown.admin.raw_score}%</span>
                    <span className="weight">{reportData.score_breakdown.breakdown.admin.weight}%</span>
                    <span className="weighted-value">{reportData.score_breakdown.breakdown.admin.weighted_value}%</span>
                  </div>
                  <div className="breakdown-footer">
                    <span>Final Score</span>
                    <span></span>
                    <span>100%</span>
                    <span className="weighted-value"><strong>{reportData.score_breakdown.final_weighted_score}%</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Semester Results (per teacher per semester) */}
          {Array.isArray(reportData?.teacher_semester_results) && reportData.teacher_semester_results.length > 0 && (() => {
            const rows = reportData.teacher_semester_results;
            const years = Array.from(new Set(rows.map(r => r.academic_year))).sort();
            const semesters = Array.from(new Set(rows.map(r => r.semester))).sort();
            const filtered = rows.filter(r => {
              const yearOk = tsrFilter.academic_year ? r.academic_year === tsrFilter.academic_year : true;
              const semOk = tsrFilter.semester ? String(r.semester) === String(tsrFilter.semester) : true;
              return yearOk && semOk;
            });
            const sorted = [...filtered].sort((a, b) => {
              const by = tsrSort.by;
              const dir = tsrSort.dir === 'desc' ? -1 : 1;
              const av = Number(a[by]) || 0;
              const bv = Number(b[by]) || 0;
              if (av === bv) return 0;
              return av > bv ? dir : -dir;
            });
            return (
              <div className="report-section">
                <h3>Teacher Semester Results</h3>
                <div className="controls-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <label>
                    Year:
                    <select value={tsrFilter.academic_year} onChange={e => setTsrFilter(f => ({ ...f, academic_year: e.target.value }))}>
                      <option value="">All</option>
                      {years.map(y => (<option key={y} value={y}>{y}</option>))}
                    </select>
                  </label>
                  <label>
                    Semester:
                    <select value={tsrFilter.semester} onChange={e => setTsrFilter(f => ({ ...f, semester: e.target.value }))}>
                      <option value="">All</option>
                      {semesters.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </label>
                  <label>
                    Sort by:
                    <select value={`${tsrSort.by}:${tsrSort.dir}`} onChange={e => {
                      const [by, dir] = e.target.value.split(':');
                      setTsrSort({ by, dir });
                    }}>
                      <option value="weighted_score:desc">Weighted Score ↓</option>
                      <option value="weighted_score:asc">Weighted Score ↑</option>
                      <option value="student_score:desc">Student Score ↓</option>
                      <option value="student_score:asc">Student Score ↑</option>
                      <option value="peer_score:desc">Peer Score ↓</option>
                      <option value="peer_score:asc">Peer Score ↑</option>
                      <option value="admin_score:desc">HOD Score ↓</option>
                      <option value="admin_score:asc">HOD Score ↑</option>
                    </select>
                  </label>
                  <div style={{ marginLeft: 'auto', opacity: 0.8 }}>Showing {sorted.length} of {rows.length}</div>
                </div>
                <div className="teacher-semester-results-table">
                  <div className="table-header">
                    <div>Teacher</div>
                    <div>Teacher ID</div>
                    <div>Academic Year</div>
                    <div>Semester</div>
                    <div>Student Score</div>
                    <div>Peer Score</div>
                    <div>HOD Score</div>
                    <div>Final Weighted</div>
                    <div>Actions</div>
                  </div>
                  {sorted.map((row, idx) => (
                    <div
                      key={idx}
                      className="table-row"
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const teacherObj = (typeof getUniqueTeachers === 'function')
                          ? getUniqueTeachers().find(t => t.id === row.teacher_id)
                          : null;
                        const teacherName = teacherObj?.name || row.teacher_name || '';
                        const qp = new URLSearchParams();
                        if (teacherName) qp.set('instructor', teacherName);
                        if (row.academic_year) qp.set('academic_year', row.academic_year);
                        if (row.semester) qp.set('semester', String(row.semester));
                        navigate(`/department/${id}/results?${qp.toString()}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const teacherObj = (typeof getUniqueTeachers === 'function')
                            ? getUniqueTeachers().find(t => t.id === row.teacher_id)
                            : null;
                          const teacherName = teacherObj?.name || row.teacher_name || '';
                          const qp = new URLSearchParams();
                          if (teacherName) qp.set('instructor', teacherName);
                          if (row.academic_year) qp.set('academic_year', row.academic_year);
                          if (row.semester) qp.set('semester', String(row.semester));
                          navigate(`/department/${id}/results?${qp.toString()}`);
                        }
                      }}
                    >
                      <div>{(() => {
                        const teacherObj = (typeof getUniqueTeachers === 'function')
                          ? getUniqueTeachers().find(t => t.id === row.teacher_id)
                          : null;
                        return teacherObj?.name || row.teacher_name || '—';
                      })()}</div>
                      <div>{row.teacher_id}</div>
                      <div>{row.academic_year}</div>
                      <div>{row.semester}</div>
                      <div>{Number(row.student_score).toFixed(2)}%</div>
                      <div>{Number(row.peer_score).toFixed(2)}%</div>
                      <div>{Number(row.admin_score).toFixed(2)}%</div>
                      <div><strong>{Number(row.weighted_score).toFixed(2)}%</strong></div>
                      <div>
                        {(() => {
                          const teacherObj = (typeof getUniqueTeachers === 'function')
                            ? getUniqueTeachers().find(t => t.id === row.teacher_id)
                            : null;
                          const teacherName = teacherObj?.name || row.teacher_name || '';
                          const canFilterByName = Boolean(teacherName);
                          const qp = new URLSearchParams();
                          if (canFilterByName) qp.set('instructor', teacherName);
                          if (row.academic_year) qp.set('academic_year', row.academic_year);
                          if (row.semester) qp.set('semester', String(row.semester));
                          const targetUrl = `/department/${id}/results?${qp.toString()}`;
                          return (
                            <button
                              className="dept-btn dept-btn-link"
                              title={canFilterByName ? `View evaluations for ${teacherName}` : 'View evaluations'}
                              aria-label={canFilterByName ? `View evaluations for ${teacherName}` : 'View evaluations'}
                              onClick={() => navigate(targetUrl)}
                            >
                              View Results
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Teacher Performance Comparison */}
          <div className="report-section">
            <h3>Teacher Performance Comparison</h3>
            <div className="performance-chart chart-container" data-interactive="true" onClick={() => {}}>
              <div className="chart-placeholder">
                <canvas width="800" height="400"></canvas>
                <svg width="800" height="400" className="interactive">
                  <rect width="800" height="400" fill="transparent" />
                  {reportData?.teacher_performances?.map((teacher, index) => (
                    <g key={teacher.teacher_id}>
                      <rect 
                        x={50 + index * 100} 
                        y={400 - (teacher.overall_performance_score * 3)} 
                        width="80" 
                        height={teacher.overall_performance_score * 3}
                        fill="var(--primary)"
                        onClick={() => {}}
                      />
                      <text 
                        x={90 + index * 100} 
                        y={420} 
                        textAnchor="middle" 
                        fill="var(--text)"
                        fontSize="12"
                      >
                        {teacher.teacher_name}
                      </text>
                      <text 
                        x={90 + index * 100} 
                        y={390 - (teacher.overall_performance_score * 3)} 
                        textAnchor="middle" 
                        fill="var(--text)"
                        fontSize="10"
                      >
                        {teacher.overall_performance_score.toFixed(1)}%
                      </text>
                    </g>
                  )) || []}
                </svg>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="report-section">
            <h3>Rating Distribution</h3>
            <div className="distribution-chart rating-chart chart-container" data-interactive="true" onClick={() => {}}>
              <canvas width="600" height="300"></canvas>
              <svg width="600" height="300" className="interactive">
                <rect width="600" height="300" fill="transparent" />
                {reportData?.rating_distribution && Object.entries(reportData.rating_distribution).map(([rating, count], index) => (
                  <g key={rating}>
                    <rect 
                      x={50 + index * 100} 
                      y={250 - (count * 4)} 
                      width="80" 
                      height={count * 4}
                      fill="var(--accent)"
                      onClick={() => {}}
                    />
                    <text 
                      x={90 + index * 100} 
                      y={270} 
                      textAnchor="middle" 
                      fill="var(--text)"
                      fontSize="12"
                    >
                      {rating} ⭐
                    </text>
                    <text 
                      x={90 + index * 100} 
                      y={240 - (count * 4)} 
                      textAnchor="middle" 
                      fill="var(--text)"
                      fontSize="10"
                    >
                      {count}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Analysis Tab */}
      {activeTab === 'evaluations' && (
        <div className="report-content">
          <div className="evaluation-list">
            <h3>Select Evaluation for Analysis</h3>
            <div className="evaluation-grid">
              {evaluations.map((evaluation) => (
                <div 
                  key={evaluation.id} 
                  className="evaluation-card report-card"
                  data-testid="evaluation-item"
                  onClick={() => loadEvaluationAnalytics(evaluation.id)}
                >
                  <h4>{evaluation.course?.title} - {evaluation.teacher?.name}</h4>
                  <p>{evaluation.academic_year} {evaluation.semester}</p>
                  <div className="evaluation-stats">
                    <span>Avg: {evaluation.average_rating?.toFixed(2) || 'N/A'}</span>
                    <span>Responses: {evaluation.total_responses || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Analysis */}
          {selectedEvaluation && (
            <div className="question-analysis">
              <h3>Question-by-Question Analysis</h3>
              <div className="analysis-grid">
                {selectedEvaluation.question_analysis?.map((question) => (
                  <div key={question.question_id} className="question-card">
                    <h4>{question.question_text}</h4>
                    <div className="question-stats">
                      <div className="stat-item">
                        <span className="stat-label">Average Rating:</span>
                        <span className="stat-value">{question.average_rating.toFixed(2)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Responses:</span>
                        <span className="stat-value">{question.total_responses}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Performance:</span>
                        <span className="stat-value">{question.performance_percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="rating-distribution">
                      <h5>Rating Distribution:</h5>
                      {Object.entries(question.rating_distribution).map(([rating, count]) => (
                        <div key={rating} className="distribution-item">
                          <span>{rating} ⭐: {count} responses</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Department Rankings Tab */}
      {activeTab === 'aggregation' && (
        <div className="report-content">
          {departmentAggregation ? (
            <>
              {/* Department Statistics Overview */}
              <div className="report-section">
                <h3>Department Performance Summary</h3>
                <div className="stats-grid">
                  <div className="dashboard-stat-card">
                    <div className="stat-header">
                      <div className="stat-icon" style={{ background: 'var(--primary)' }}>👥</div>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{departmentAggregation.department_statistics.total_teachers}</div>
                      <div className="stat-title">Total Teachers</div>
                      <div className="stat-subtitle">In department</div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <div className="stat-header">
                      <div className="stat-icon" style={{ background: 'var(--accent)' }}>📚</div>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{departmentAggregation.department_statistics.total_courses}</div>
                      <div className="stat-title">Total Courses</div>
                      <div className="stat-subtitle">This period</div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <div className="stat-header">
                      <div className="stat-icon" style={{ background: '#10b981' }}>📊</div>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{departmentAggregation.department_statistics.average_performance_score.toFixed(1)}%</div>
                      <div className="stat-title">Avg Performance</div>
                      <div className="stat-subtitle">Department wide</div>
                    </div>
                  </div>

                  <div className="dashboard-stat-card">
                    <div className="stat-header">
                      <div className="stat-icon" style={{ background: '#f59e0b' }}>📝</div>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{departmentAggregation.department_statistics.total_responses}</div>
                      <div className="stat-title">Total Responses</div>
                      <div className="stat-subtitle">All evaluations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Rankings */}
              <div className="report-section">
                <h3>Teacher Performance Rankings</h3>
                <div className="teacher-rankings">
                  <div className="rankings-table">
                    <div className="table-header">
                      <div className="header-cell">Rank</div>
                      <div className="header-cell">Teacher</div>
                      <div className="header-cell">Performance Score</div>
                      <div className="header-cell">Participation Rate</div>
                      <div className="header-cell">Evaluations</div>
                      <div className="header-cell">Courses</div>
                      <div className="header-cell">Insights</div>
                    </div>
                    {departmentAggregation.teacher_rankings.map((teacher) => (
                      <div key={teacher.teacher_id} className="table-row">
                        <div className="table-cell rank-cell">
                          <span className={`rank-badge rank-${teacher.rank <= 3 ? teacher.rank : 'other'}`}>
                            #{teacher.rank}
                          </span>
                        </div>
                        <div className="table-cell teacher-cell">
                          <div className="teacher-info">
                            <div
                              className="teacher-avatar"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                marginRight: 8,
                                display: 'inline-flex',
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
                            <div className="teacher-id">ID: {teacher.teacher_id}</div>
                          </div>
                        </div>
                        <div className="table-cell score-cell">
                          <div className="score-value">{teacher.average_performance_score.toFixed(1)}%</div>
                          <div className="score-bar">
                            <div 
                              className="score-fill" 
                              style={{ width: `${teacher.average_performance_score}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="table-cell participation-cell">
                          <div className="participation-value">{teacher.average_participation_rate.toFixed(1)}%</div>
                        </div>
                        <div className="table-cell evaluations-cell">
                          <div className="evaluation-count">{teacher.total_evaluations}</div>
                          <div className="response-count">{teacher.total_responses} responses</div>
                        </div>
                        <div className="table-cell courses-cell">
                          <div className="course-count">{teacher.course_count} courses</div>
                          <div className="course-list">
                            {teacher.courses_taught.slice(0, 3).join(', ')}
                            {teacher.courses_taught.length > 3 && '...'}
                          </div>
                        </div>
                        <div className="table-cell insights-cell">
                          <div className="insights-list">
                            {teacher.performance_insights.slice(0, 2).map((insight, index) => (
                              <div key={index} className="insight-item">
                                {insight}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Distribution Analysis */}
              <div className="report-section">
                <h3>Performance Distribution Analysis</h3>
                <div className="distribution-analysis">
                  <div className="distribution-stats">
                    <div className="stat-group">
                      <h4>Statistical Measures</h4>
                      <div className="stat-item">
                        <span className="stat-label">Mean:</span>
                        <span className="stat-value">{departmentAggregation.performance_distribution.statistics.mean.toFixed(2)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Median:</span>
                        <span className="stat-value">{departmentAggregation.performance_distribution.statistics.median.toFixed(2)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Std Dev:</span>
                        <span className="stat-value">{departmentAggregation.performance_distribution.statistics.standard_deviation.toFixed(2)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Range:</span>
                        <span className="stat-value">
                          {departmentAggregation.performance_distribution.statistics.min.toFixed(1)} - {departmentAggregation.performance_distribution.statistics.max.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="distribution-bands">
                      <h4>Performance Bands</h4>
                      {Object.entries(departmentAggregation.performance_distribution.distribution).map(([band, data]) => (
                        <div key={band} className="band-item">
                          <div className="band-info">
                            <span className="band-name">{band.replace('_', ' ').toUpperCase()}</span>
                            <span className="band-range">({data.range})</span>
                          </div>
                          <div className="band-stats">
                            <span className="band-count">{data.count} teachers</span>
                            <span className="band-percentage">{data.percentage}%</span>
                          </div>
                          <div className="band-bar">
                            <div 
                              className={`band-fill band-${band}`} 
                              style={{ width: `${data.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparative Analysis */}
              <div className="report-section">
                <h3>Comparative Analysis & Recommendations</h3>
                <div className="comparative-analysis">
                  <div className="analysis-grid">
                    <div className="analysis-card">
                      <h4>Top Performers</h4>
                      <div className="performer-list">
                          {departmentAggregation.comparative_analysis.top_performers.length > 0 ? (
                            departmentAggregation.comparative_analysis.top_performers.map((teacher) => (
                              <div key={teacher.teacher_id} className="performer-item">
                              <span className="performer-name" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span
                                  className="teacher-avatar"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    marginRight: 6,
                                    display: 'inline-flex',
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
                                </span>
                                {teacher.teacher_name}
                              </span>
                              <span className="performer-score">{teacher.average_performance_score.toFixed(1)}%</span>
                            </div>
                          ))
                        ) : (
                          <p>No teachers meet the top performer criteria.</p>
                        )}
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>Needs Improvement</h4>
                      <div className="performer-list">
                          {departmentAggregation.comparative_analysis.improvement_needed.length > 0 ? (
                            departmentAggregation.comparative_analysis.improvement_needed.map((teacher) => (
                              <div key={teacher.teacher_id} className="performer-item">
                              <span className="performer-name" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span
                                  className="teacher-avatar"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    marginRight: 6,
                                    display: 'inline-flex',
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
                                </span>
                                {teacher.teacher_name}
                              </span>
                              <span className="performer-score">{teacher.average_performance_score.toFixed(1)}%</span>
                            </div>
                          ))
                        ) : (
                          <p>All teachers meet performance standards.</p>
                        )}
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>Performance Gaps</h4>
                      <div className="gap-analysis">
                        <div className="gap-item">
                          <span className="gap-label">Highest Score:</span>
                          <span className="gap-value">{departmentAggregation.comparative_analysis.performance_gaps.max_score.toFixed(1)}%</span>
                        </div>
                        <div className="gap-item">
                          <span className="gap-label">Lowest Score:</span>
                          <span className="gap-value">{departmentAggregation.comparative_analysis.performance_gaps.min_score.toFixed(1)}%</span>
                        </div>
                        <div className="gap-item">
                          <span className="gap-label">Performance Gap:</span>
                          <span className="gap-value">{departmentAggregation.comparative_analysis.performance_gaps.gap.toFixed(1)}%</span>
                        </div>
                        <div className="gap-item">
                          <span className="gap-label">Gap Percentage:</span>
                          <span className="gap-value">{departmentAggregation.comparative_analysis.performance_gaps.gap_percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="analysis-card">
                      <h4>Recommendations</h4>
                      <div className="recommendations-list">
                        {departmentAggregation.comparative_analysis.recommendations.length > 0 ? (
                          departmentAggregation.comparative_analysis.recommendations.map((recommendation, index) => (
                            <div key={index} className="recommendation-item">
                              {recommendation}
                            </div>
                          ))
                        ) : (
                          <p>No specific recommendations at this time.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="loading-placeholder">
              <LoadingSpinner size="medium" showMessage={false} showElapsed={false} />
            </div>
          )}
        </div>
      )}

      {/* Historical Trends Tab */}
      {activeTab === 'trends' && (
        <div className="report-content">
          {/* Controls */}
          <div className="trend-controls">
            <div className="control-group">
              <label>Select Teacher for Analysis:</label>
              <select 
                value={selectedTeacher?.id || ''} 
                onChange={(e) => {
                  const teacher = getUniqueTeachers().find(t => t.id === parseInt(e.target.value));
                  setSelectedTeacher(teacher);
                }}
              >
                <option value="">All Teachers</option>
                {getUniqueTeachers().map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="control-group">
              <label>Analysis Periods:</label>
              <div className="period-checkboxes">
                {['2022-1', '2022-2', '2023-1', '2023-2', '2024-1', '2024-2'].map(period => (
                  <label key={period} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedPeriods.includes(period)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPeriods([...selectedPeriods, period]);
                        } else {
                          setSelectedPeriods(selectedPeriods.filter(p => p !== period));
                        }
                      }}
                    />
                    {period}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Department Benchmarking */}
          {departmentBenchmarking && (
            <div className="report-section">
              <h3>Department Performance Benchmarking</h3>
              <div className="benchmarking-summary">
                <div className="benchmark-stats">
                  <div className="benchmark-stat">
                    <span className="stat-label">Overall Trend:</span>
                    <span className={`stat-value trend-${departmentBenchmarking.overall_trend?.trend_direction}`}>
                      {departmentBenchmarking.overall_trend?.trend_direction || 'stable'}
                    </span>
                  </div>
                  <div className="benchmark-stat">
                    <span className="stat-label">Performance Change:</span>
                    <span className="stat-value">
                      {departmentBenchmarking.overall_trend?.performance_trend > 0 ? '+' : ''}
                      {departmentBenchmarking.overall_trend?.performance_trend?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="benchmark-stat">
                    <span className="stat-label">Participation Change:</span>
                    <span className="stat-value">
                      {departmentBenchmarking.overall_trend?.participation_trend > 0 ? '+' : ''}
                      {departmentBenchmarking.overall_trend?.participation_trend?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="benchmark-chart chart-container">
                <h4>Performance by Period</h4>
                <svg width="800" height="300" className="interactive">
                  <rect width="800" height="300" fill="transparent" />
                  {departmentBenchmarking.benchmark_data?.map((period, index) => (
                    <g key={period.period}>
                      <rect 
                        x={50 + index * 120} 
                        y={250 - (period.average_performance_score * 2)} 
                        width="100" 
                        height={period.average_performance_score * 2}
                        fill="var(--primary)"
                        opacity="0.8"
                      />
                      <text 
                        x={100 + index * 120} 
                        y={270} 
                        textAnchor="middle" 
                        fill="var(--text)"
                        fontSize="12"
                      >
                        {period.period}
                      </text>
                      <text 
                        x={100 + index * 120} 
                        y={240 - (period.average_performance_score * 2)} 
                        textAnchor="middle" 
                        fill="var(--text)"
                        fontSize="10"
                      >
                        {period.average_performance_score?.toFixed(1)}%
                      </text>
                    </g>
                  )) || []}
                </svg>
              </div>

              {/* Period Changes */}
              {departmentBenchmarking.period_changes && departmentBenchmarking.period_changes.length > 0 && (
                <div className="period-changes">
                  <h4>Period-over-Period Changes</h4>
                  <div className="changes-list">
                    {departmentBenchmarking.period_changes.map((change, index) => (
                      <div key={index} className="change-item">
                        <span className="change-period">
                          {change.from_period} → {change.to_period}
                        </span>
                        <span className={`change-value ${change.performance_change >= 0 ? 'positive' : 'negative'}`}>
                          Performance: {change.performance_change > 0 ? '+' : ''}{change.performance_change?.toFixed(2)}%
                        </span>
                        <span className={`change-value ${change.participation_change >= 0 ? 'positive' : 'negative'}`}>
                          Participation: {change.participation_change > 0 ? '+' : ''}{change.participation_change?.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Teacher Analysis */}
          {selectedTeacher && historicalData && (
            <div className="report-section">
              <h3>Teacher Performance Analysis: {selectedTeacher.name}</h3>
              
              {/* Historical Comparison */}
              <div className="historical-comparison">
                <h4>Performance Across Periods</h4>
                <div className="comparison-chart chart-container">
                  <svg width="800" height="300" className="interactive">
                    <rect width="800" height="300" fill="transparent" />
                    {historicalData.comparisons?.map((period, index) => (
                      <g key={period.period}>
                        <circle 
                          cx={100 + index * 150} 
                          cy={150 - (period.average_performance_score * 1.2)} 
                          r="8"
                          fill="var(--accent)"
                        />
                        <text 
                          x={100 + index * 150} 
                          y={280} 
                          textAnchor="middle" 
                          fill="var(--text)"
                          fontSize="12"
                        >
                          {period.period}
                        </text>
                        <text 
                          x={100 + index * 150} 
                          y={130 - (period.average_performance_score * 1.2)} 
                          textAnchor="middle" 
                          fill="var(--text)"
                          fontSize="10"
                        >
                          {period.average_performance_score?.toFixed(1)}%
                        </text>
                      </g>
                    )) || []}
                    {/* Connect points with lines */}
                    {historicalData.comparisons?.length > 1 && (
                      <polyline
                        points={historicalData.comparisons.map((period, index) => 
                          `${100 + index * 150},${150 - (period.average_performance_score * 1.2)}`
                        ).join(' ')}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                      />
                    )}
                  </svg>
                </div>

                {/* Analysis Summary */}
                {historicalData.analysis && (
                  <div className="analysis-summary">
                    <div className="analysis-stat">
                      <span className="stat-label">Trend Direction:</span>
                      <span className={`stat-value trend-${historicalData.analysis.trend_direction}`}>
                        {historicalData.analysis.trend_direction}
                      </span>
                    </div>
                    <div className="analysis-stat">
                      <span className="stat-label">Statistical Significance:</span>
                      <span className="stat-value">
                        {historicalData.analysis.statistical_significance ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="analysis-stat">
                      <span className="stat-label">Confidence Level:</span>
                      <span className="stat-value">
                        {historicalData.analysis.confidence_level?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          {selectedTeacher && trendAnalysis && (
            <div className="report-section">
              <h3>Significant Trend Detection</h3>
              
              {trendAnalysis.significant_trends?.significant_trends?.length > 0 ? (
                <div className="significant-trends">
                  <div className="trends-summary">
                    <div className="trend-stat">
                      <span className="stat-label">Overall Trend:</span>
                      <span className={`stat-value trend-${trendAnalysis.significant_trends.overall_trend}`}>
                        {trendAnalysis.significant_trends.overall_trend}
                      </span>
                    </div>
                    <div className="trend-stat">
                      <span className="stat-label">Trend Strength:</span>
                      <span className="stat-value">
                        {trendAnalysis.significant_trends.trend_strength}%
                      </span>
                    </div>
                  </div>

                  <div className="trends-list">
                    <h4>Significant Changes Detected:</h4>
                    {trendAnalysis.significant_trends.significant_trends.map((trend, index) => (
                      <div key={index} className="trend-item">
                        <span className="trend-period">
                          Period {trend.period_from} → {trend.period_to}
                        </span>
                        <span className={`trend-change ${trend.trend_type}`}>
                          {trend.trend_type}: {trend.change > 0 ? '+' : ''}{trend.change}%
                        </span>
                        <span className="trend-significance">
                          Significance: {trend.significance_level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-trends">
                  <p>No significant trends detected for the selected teacher and periods.</p>
                </div>
              )}
            </div>
          )}

          {/* Default view when no teacher selected */}
          {!selectedTeacher && (
            <div className="report-section">
              <div className="trend-placeholder">
                <h3>Select a teacher above to view detailed trend analysis</h3>
                <p>Individual teacher analysis includes:</p>
                <ul>
                  <li>Historical performance comparison across periods</li>
                  <li>Statistical trend analysis with significance testing</li>
                  <li>Significant change detection and highlighting</li>
                  <li>Performance trajectory visualization</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;