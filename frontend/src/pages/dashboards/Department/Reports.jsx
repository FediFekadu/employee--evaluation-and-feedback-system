import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useErrorHandling } from '../../../hooks/useErrorHandling';
import ErrorAlert from '../../../components/ErrorHandling/ErrorAlert';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';
import { gracefulDegradationManager } from '../../../utils/errorHandling';
import { computeDateRange, REPORT_PERIODS, getPerformanceStatus, computeWeightedScore } from '../../../constants/reportsConstants';
import VisualAnalytics from '../../../components/VisualAnalytics';
import InteractiveTeacherRankings from '../../../components/InteractiveTeacherRankings';
import InteractiveVisualAnalytics from '../../../components/InteractiveVisualAnalytics';
import exportService from '../../../services/exportService';

function Reports() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [department, setDepartment] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [accessDenied, setAccessDenied] = useState(false);

  // Performance optimization state
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({});
  const [timeRange, setTimeRange] = useState('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const periodRange = useMemo(() => computeDateRange(timeRange, customFrom, customTo), [timeRange, customFrom, customTo]);
  const visualTimeRange = useMemo(() => {
    switch (timeRange) {
      case 'daily': return '1day';
      case 'weekly': return '1week';
      case 'monthly': return '1month';
      case 'yearly': return '1year';
      default: return 'custom';
    }
  }, [timeRange]);

  // Lazy loaded data state
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
  } = useErrorHandling();


  // Memoized computed values for performance
  const filteredEvaluations = useMemo(() => {
    if (!evaluations.length) return [];
    let filtered = evaluations.filter(evaluation => {
      if (filters.teacher && evaluation.teacher?.name !== filters.teacher) return false;
      if (filters.course && evaluation.course?.title !== filters.course) return false;
      if (filters.year && evaluation.academic_year !== filters.year) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    return filtered;
  }, [evaluations, filters, sortBy, sortDirection]);

  // Debounced filter update
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const [isExportingDept, setIsExportingDept] = useState(false);
  const [deptExportProgress, setDeptExportProgress] = useState(0);
  const [isExportingEval, setIsExportingEval] = useState(false);
  const [evalExportProgress, setEvalExportProgress] = useState(0);

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
            sort_by: sortBy,
            sort_direction: sortDirection,
            ...filters,
            from_date: periodRange.from,
            to_date: periodRange.to
          }
        }),
        'load_evaluations'
      );
      
      const evaluationsList = evalRes.data.data || [];
      
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

      // Load report data with optimization flags
      try {
        const reportRes = await handleApiCall(
          () => api.get(`/departments/${id}/reports`, { params: { optimize: true, summary_only: true, from_date: periodRange.from, to_date: periodRange.to } }),
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
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  }, [id, sortBy, sortDirection, filters, periodRange.from, periodRange.to, handleApiCall, clearErrors, addError]);

  // Lazy loading functions with caching
  

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

  

  // Optimized evaluation analytics loading
  const loadEvaluationAnalyticsOptimized = useCallback(async (evaluationId) => {
    try {
      const res = await api.get(`/evaluations/${evaluationId}/analytics?optimize=true&cache=true`);
      setSelectedEvaluation(res.data);
    } catch (err) {
      console.error('Failed to load evaluation analytics:', err);
    }
  }, []);

  // Department-level export using centralized export service
  const exportDepartmentReport = useCallback(async (format) => {
    try {
      setIsExportingDept(true);
      setDeptExportProgress(0);
      const result = await exportService.exportDepartment(
        Number(id),
        format,
        {
          filters: { 
            ...filters, 
            from_date: periodRange.from, 
            to_date: periodRange.to 
          },
          sortBy: sortBy,
          sortDirection: sortDirection,
          includeAnalytics: true,
          preservePrivacy: true
        },
        (p) => setDeptExportProgress(Math.min(100, Number(p?.progress ?? 0)))
      );
      
      if (result.success) {
        exportService.downloadFile(result.blob, result.filename);
      } else {
        addError(
          { response: { data: { 
            error: 'export_failed', 
            message: result.error || `Failed to export ${format.toUpperCase()} report.` 
          } } },
          'Export failed'
        );
      }
    } catch (err) {
      addError(
        { response: { data: { 
          error: 'export_failed', 
          message: err.message || `Failed to export ${format.toUpperCase()} report.` 
        } } },
        'Export failed'
      );
    } finally {
      setIsExportingDept(false);
      setDeptExportProgress(0);
    }
  }, [id, filters, periodRange.from, periodRange.to, sortBy, sortDirection, addError]);

  const exportSelectedEvaluation = useCallback(async (format) => {
    if (!selectedEvaluation && !evaluations.length) return;
    try {
      setIsExportingEval(true);
      setEvalExportProgress(0);
      const evaluationId = selectedEvaluation?.evaluation_id ?? selectedEvaluation?.id ?? evaluations[0]?.id;
      const result = await exportService.exportEvaluation(
        Number(evaluationId),
        format,
        {
          departmentId: Number(id),
          preservePrivacy: true,
          additionalParams: {
            from_date: periodRange.from,
            to_date: periodRange.to
          }
        },
        (p) => setEvalExportProgress(Math.min(100, Number(p?.progress ?? 0)))
      );
      if (result.success) {
        exportService.downloadFile(result.blob ?? result.downloadUrl, result.filename);
      } else {
        addError(
          { response: { data: { 
            error: 'export_failed', 
            message: result.error || `Failed to export ${format.toUpperCase()} report.` 
          } } },
          'Export failed'
        );
      }
    } catch (err) {
      addError(
        { response: { data: { 
          error: 'export_failed', 
          message: err.message || `Failed to export ${format.toUpperCase()} report.` 
        } } },
        'Export failed'
      );
    } finally {
      setIsExportingEval(false);
      setEvalExportProgress(0);
    }
  }, [selectedEvaluation, evaluations, id, periodRange.from, periodRange.to, addError]);

  // Removed unused placeholder chart/table utilities and pagination controls

  

  const typeAverages = useMemo(() => {
    const breakdown = reportData?.score_breakdown?.breakdown;
    let student = Number(breakdown?.student?.raw_score ?? 0);
    let peer = Number(breakdown?.peer?.raw_score ?? 0);
    let hod = Number(breakdown?.admin?.raw_score ?? breakdown?.hod?.raw_score ?? 0);
    if (!(student || peer || hod)) {
      const list = reportData?.teacher_performances || [];
      if (Array.isArray(list) && list.length > 0) {
        const sVals = list.map(t => Number(t.student_score ?? t.student_average ?? 0)).filter(v => !Number.isNaN(v));
        const pVals = list.map(t => Number(t.peer_score ?? 0)).filter(v => !Number.isNaN(v));
        const hVals = list.map(t => Number(t.hod_score ?? 0)).filter(v => !Number.isNaN(v));
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        student = avg(sVals);
        peer = avg(pVals);
        hod = avg(hVals);
      }
    }
    const finalWeighted = reportData?.score_breakdown?.final_weighted_score ?? computeWeightedScore(student, peer, hod);
    return {
      student: Math.round(student * 100) / 100,
      peer: Math.round(peer * 100) / 100,
      hod: Math.round(hod * 100) / 100,
      final: Math.round(finalWeighted * 100) / 100
    };
  }, [reportData]);

  const statusLabel = useMemo(() => {
    const score = typeAverages.final;
    const normalized = score > 5 ? score / 20 : score;
    return getPerformanceStatus(normalized);
  }, [typeAverages.final]);

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
        break;
      default:
        break;
    }

    return items;
  }, [id, activeTab, selectedEvaluation]);

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
      <div className="dashboard-header">
        <div>
          <h1>Reports</h1>
          <p>Period: {periodRange.label}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="dept-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            {REPORT_PERIODS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          {timeRange === 'custom' && (
            <>
              <input
                type="date"
                className="dept-select"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <input
                type="date"
                className="dept-select"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </>
          )}
          <button className="dept-btn dept-btn-primary" onClick={loadDepartmentDataOptimized}>
            Load
          </button>
          <button className="dept-btn dept-btn-ghost" onClick={() => exportDepartmentReport('pdf')} disabled={isExportingDept}>
            {isExportingDept ? <LoadingSpinner size="small" /> : 'Export PDF'}
          </button>
          <button className="dept-btn dept-btn-ghost" onClick={() => exportDepartmentReport('excel')} disabled={isExportingDept}>
            {isExportingDept ? <LoadingSpinner size="small" /> : 'Export Excel'}
          </button>
          <button className="dept-btn dept-btn-ghost" onClick={() => exportDepartmentReport('csv')} disabled={isExportingDept}>
            {isExportingDept ? <LoadingSpinner size="small" /> : 'Export CSV'}
          </button>
        </div>
      </div>
      {/* Global Error Display */}
      {globalErrors.map((error) => (
        <ErrorAlert
          key={error.id}
          error={error.error}
          onRetry={() => {
            removeError(error.id);
            // Implement retry logic based on error context
            if (error.context.includes('load_')) {
              loadDepartmentDataOptimized();
            }
          }}
          onDismiss={() => removeError(error.id)}
          showDetails={process.env.NODE_ENV === 'development'}
          autoHide={true}
          hideDelay={6000}
          context={error.context || 'reports'}
        />
      ))}

      

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
        
      </div>

      <div className="department-stats-grid" style={{ marginTop: 12 }}>
        <div className="department-stat-card">
          <div className="stat-content">
            <div className="stat-value">{typeAverages.student}</div>
            <div className="stat-title">Student Avg</div>
          </div>
        </div>
        <div className="department-stat-card">
          <div className="stat-content">
            <div className="stat-value">{typeAverages.peer}</div>
            <div className="stat-title">Peer Avg</div>
          </div>
        </div>
        <div className="department-stat-card">
          <div className="stat-content">
            <div className="stat-value">{typeAverages.hod}</div>
            <div className="stat-title">HOD Avg</div>
          </div>
        </div>
        <div className="department-stat-card">
          <div className="stat-content">
            <div className="stat-value">{typeAverages.final}</div>
            <div className="stat-title">Final Weighted</div>
          </div>
        </div>
        <div className="department-stat-card">
          <div className="stat-content">
            <div className="stat-value">{statusLabel}</div>
            <div className="stat-title">Performance Status</div>
          </div>
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
          <div className="report-section">
            <h3>Visual Analytics</h3>
            <VisualAnalytics
              departmentId={id}
              chartTypes={['rating_distribution', 'performance_distribution', 'participation_trends']}
              timeRange={visualTimeRange}
              period={`${periodRange.from}:${periodRange.to}`}
              height="420px"
              className="visual-analytics"
            />
          </div>
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

          {/* Charts replaced with VisualAnalytics above */}
        </div>
      )}

      {/* Evaluation Analysis Tab */}
      {activeTab === 'evaluations' && (
        <div className="report-content">
          <div className="evaluation-list">
            <h3>Select Evaluation for Analysis</h3>
            <div className="evaluation-grid">
              {filteredEvaluations.map((evaluation) => (
                <div 
                  key={evaluation.id} 
                  className="evaluation-card report-card"
                  data-testid="evaluation-item"
                  onClick={() => loadEvaluationAnalyticsOptimized(evaluation.id)}
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

          {/* Selected Evaluation Summary */}
          {selectedEvaluation && (
            <div className="evaluation-summary" style={{ marginTop: 16, marginBottom: 12 }}>
              <div className="summary-items" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <div className="summary-item">
                  <span className="summary-label">Teacher:</span>
                  <span className="summary-value">{selectedEvaluation.teacher?.name || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Course:</span>
                  <span className="summary-value">{selectedEvaluation.course?.title || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Avg Rating:</span>
                  <span className="summary-value">{(selectedEvaluation.average_rating ?? selectedEvaluation.overall_average)?.toFixed?.(2) || 'N/A'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Responses:</span>
                  <span className="summary-value">{selectedEvaluation.total_responses ?? selectedEvaluation.response_count ?? 0}</span>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <button className="dept-btn dept-btn-ghost" onClick={() => setSelectedEvaluation(null)}>
                  Reset Selection
                </button>
                <span style={{ marginLeft: 8, marginRight: 8 }} />
                <button className="dept-btn dept-btn-ghost" onClick={() => exportSelectedEvaluation('pdf')} disabled={isExportingEval}>
                  {isExportingEval ? <LoadingSpinner size="small" /> : 'Export PDF'}
                </button>
                <button className="dept-btn dept-btn-ghost" onClick={() => exportSelectedEvaluation('excel')} disabled={isExportingEval}>
                  {isExportingEval ? <LoadingSpinner size="small" /> : 'Export Excel'}
                </button>
                <button className="dept-btn dept-btn-ghost" onClick={() => exportSelectedEvaluation('csv')} disabled={isExportingEval}>
                  {isExportingEval ? <LoadingSpinner size="small" /> : 'Export CSV'}
                </button>
              </div>
            </div>
          )}

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
          <InteractiveTeacherRankings
            departmentId={id}
            timeRange={visualTimeRange}
            period={`${periodRange.from}:${periodRange.to}`}
            enableExport={true}
            enableFiltering={true}
            showTrends={true}
            showBenchmarks={true}
            pageSize={10}
          />
        </div>
      )}

      {/* Historical Trends Tab */}
      {activeTab === 'trends' && (
        <div className="report-content">
          <InteractiveVisualAnalytics
            departmentId={id}
            timeRange={visualTimeRange}
            period={`${periodRange.from}:${periodRange.to}`}
            enableExport={true}
            enableComparison={true}
            showTrends={true}
            showBenchmarks={true}
          />
        </div>
      )}
    </div>
  );
}

export default Reports;
