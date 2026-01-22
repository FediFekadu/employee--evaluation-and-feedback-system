import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useExport } from '../../../hooks/useExport';
import { useErrorHandling } from '../../../hooks/useErrorHandling';
import { useDepartmentAdminAccess } from '../../../hooks/useAccessControl';

function EvaluationResults() {
  const { id: departmentId, evaluationId } = useParams();
  const navigate = useNavigate();
  
  // Enhanced error handling
  const { handleApiCall, addError } = useErrorHandling();
  
  // Access control - this will be handled by RouteGuard, but we can still use the hook for user info
  useDepartmentAdminAccess(departmentId);
  
  // Core state
  const [department, setDepartment] = useState(null);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criticalError, setCriticalError] = useState(null);
  
  // Export functionality using the useExport hook
  const {
    loading: exportLoading,
    notification: exportNotification,
    exportEvaluation,
    clearNotification: clearExportNotification
  } = useExport();

  // Load evaluation results data on component mount
  useEffect(() => {
    loadEvaluationResults();
  }, [departmentId, evaluationId]);

  // Load evaluation results data with enhanced error handling
  const loadEvaluationResults = async () => {
    try {
      setLoading(true);
      setError(null);
      setCriticalError(null);
      
      // Use enhanced API call with error handling
      const deptRes = await handleApiCall(
        () => api.get(`/departments/${departmentId}`),
        'evaluation_department_load'
      );
      setDepartment(deptRes.data);

      // Load detailed evaluation results
      const resultsRes = await handleApiCall(
        () => api.get(`/evaluations/${evaluationId}/results`),
        'evaluation_results_load'
      );
      setEvaluationResults(resultsRes.data);

    } catch (err) {
      console.error('Failed to load evaluation results:', err);
      
      // Check if this is a critical error that should show fallback UI
      if (err.response?.status === 404) {
        setCriticalError(new Error('Evaluation not found or you do not have permission to view it.'));
      } else if (!navigator.onLine) {
        setCriticalError(new Error('No internet connection. Please check your network and try again.'));
      } else {
        // Add to error manager for recovery options
        addError(err, 'evaluation_results_load');
        setError('Failed to load evaluation results. Please try the recovery options below.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle retry for errors
  const handleRetry = () => {
    setError(null);
    loadEvaluationResults();
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/department/${departmentId}/results`);
  };

  // Handle export functionality using the new export service with enhanced error handling
  const handleExport = async (format) => {
    try {
      const exportOptions = {
        departmentId: departmentId,
        preservePrivacy: true,
        reportType: 'teacher',
        // Provide client-side fallback data when server rejects due to limited responses
        fallbackData: evaluationResults
      };

      await exportEvaluation(evaluationId, format, exportOptions);
    } catch (error) {
      // Add error to error manager for recovery options
      addError(error, 'evaluation_export');
      throw error;
    }
  };

  // Handle contact support
  const handleContactSupport = () => {
    const supportInfo = {
      page: 'Evaluation Results Detail',
      departmentId: departmentId,
      evaluationId: evaluationId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const mailtoLink = `mailto:support@evaluation-system.com?subject=Evaluation Results Issue&body=${encodeURIComponent(
      `I need help with the Evaluation Results detail page.\n\nContext:\n${JSON.stringify(supportInfo, null, 2)}`
    )}`;
    
    window.open(mailtoLink);
  };

  // Handle format change for export errors
  const handleFormatChange = async (newFormat) => {
    try {
      await handleExport(newFormat);
    } catch (error) {
      console.error('Format change failed:', error);
    }
  };

  // Dismiss export notification (now handled by useExport hook)
  const dismissExportNotification = clearExportNotification;

  // Helper function to get data quality class
  const getDataQualityClass = (quality) => {
    switch (quality?.toLowerCase()) {
      case 'excellent': return 'quality-excellent';
      case 'good': return 'quality-good';
      case 'limited': return 'quality-limited';
      default: return 'quality-unknown';
    }
  };

  // Format a weight that may be provided as ratio (0-1) or percentage (>1)
  const formatWeightPct = (w) => {
    const num = Number(w) || 0;
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
  };

  // Compute rating distribution compatible with multiple backend shapes
  const ratingDistribution = (() => {
    const dist = evaluationResults?.participation_analysis?.rating_distribution ||
                 evaluationResults?.response_statistics?.rating_distribution || {};
    const entries = Object.entries(dist);
    if (entries.length === 0) return [];
    const mapped = entries
      .map(([rating, value]) => {
        const count = typeof value === 'object' && value !== null ? Number(value.count || 0) : Number(value || 0);
        const percent = typeof value === 'object' && value !== null ? Number(value.percentage || 0) : 0;
        return { rating: Number(rating), count, percent };
      })
      .sort((a, b) => a.rating - b.rating);
    // If percentage not supplied, compute from totals
    const total = mapped.reduce((sum, r) => sum + (r.count || 0), 0);
    return mapped.map(r => ({
      ...r,
      percent: r.percent || (total > 0 ? Math.round((r.count / total) * 100) : 0)
    }));
  })();

  // Critical error fallback (shows fallback UI)
  if (criticalError) {
    return (
      <ResultsPageFallback
        error={criticalError}
        onRetry={loadEvaluationResults}
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
            <h1>Evaluation Results</h1>
            <p>Loading detailed evaluation results...</p>
          </div>
        </div>
        <div className="loading-container">
          <LoadingSpinner size="large" message="Loading evaluation results..." />
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
      context="evaluation_results_detail"
      onRetry={loadEvaluationResults}
      onContactSupport={handleContactSupport}
      autoRetry={true}
      maxAutoRetries={2}
    >
      <DepartmentResultsErrorManager
        context="evaluation_results"
        onFormatChange={handleFormatChange}
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
      
          {/* Header with breadcrumb */}
          <div className="dashboard-header">
        <div>
          <div className="breadcrumb-nav">
            <button 
              className="breadcrumb-link"
              onClick={handleBack}
              aria-label="Go back to results list"
            >
              ← Results
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Evaluation Details</span>
          </div>
          <h1>Evaluation Results</h1>
          <p>Detailed analytics for {evaluationResults?.course_information?.course}</p>
        </div>
        <div className="header-actions">
          <button 
            className="dept-btn dept-btn-ghost"
            onClick={loadEvaluationResults}
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" /> : 'Refresh Data'}
          </button>
          <button 
            className="dept-btn dept-btn-primary"
            onClick={handleBack}
          >
            Back to Results
          </button>
        </div>
      </div>

      {/* Results content */}
      <div className="evaluation-results-content" id="main-content">
        {evaluationResults ? (
          <>
            {/* Course Information Section */}
            <div className="results-section">
              <h3>📚 Course Information</h3>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">Course Name</div>
                  <div className="info-value">{evaluationResults.course_information?.course || 'N/A'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Course Code</div>
                  <div className="info-value">{evaluationResults.course_information?.code || 'N/A'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Year Level</div>
                  <div className="info-value">
                    <span className="year-badge">{evaluationResults.course_information?.year_level || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Academic Year</div>
                  <div className="info-value">{evaluationResults.academic_year || 'N/A'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Semester</div>
                  <div className="info-value">{evaluationResults.semester || 'N/A'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Department</div>
                  <div className="info-value">{department?.name || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Instructor Information Section */}
            <div className="results-section">
              <h3>👨‍🏫 Instructor Information</h3>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">Instructor Name</div>
                  <div className="info-value">{evaluationResults.instructor_information?.name || 'N/A'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Session Details</div>
                  <div className="info-value">{evaluationResults.instructor_information?.session || 'N/A'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Instructor Status</div>
                  <div className="info-value">
                    <StatusBadge 
                      status={evaluationResults.instructor_information?.status} 
                      type="instructor"
                    />
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Evaluation Period</div>
                  <div className="info-value">
                    {evaluationResults.opened_at && evaluationResults.closed_at ? (
                      <>
                        {new Date(evaluationResults.opened_at).toLocaleDateString()} - {' '}
                        {new Date(evaluationResults.closed_at).toLocaleDateString()}
                      </>
                    ) : evaluationResults.opened_at ? (
                      <>Started: {new Date(evaluationResults.opened_at).toLocaleDateString()}</>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-label">Evaluation Status</div>
                  <div className="info-value">
                    <StatusBadge 
                      status={evaluationResults.status} 
                      type="evaluation"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Statistics Section */}
            <div className="results-section">
              <h3>📊 Quick Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-value">{evaluationResults.quick_stats?.total_responses || 0}</div>
                    <div className="stat-label">Total Responses</div>
                    <div className="stat-subtitle">
                      {evaluationResults.quick_stats?.expected_responses ? 
                        `of ${evaluationResults.quick_stats.expected_responses} expected` : 
                        'responses received'
                      }
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      <ParticipationIndicator 
                        rate={evaluationResults.quick_stats?.participation_rate || 0}
                        variant="badge"
                        size="large"
                        showPercentage={true}
                        showLabel={false}
                      />
                    </div>
                    <div className="stat-label">Participation Rate</div>
                    <div className="stat-subtitle">
                      <ParticipationIndicator 
                        rate={evaluationResults.quick_stats?.participation_rate || 0}
                        variant="bar"
                        size="small"
                        showPercentage={false}
                        showLabel={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className={`stat-value ${getDataQualityClass(evaluationResults.quick_stats?.data_quality)}`}>
                      {evaluationResults.quick_stats?.data_quality || 'Unknown'}
                    </div>
                    <div className="stat-label">Data Quality</div>
                    <div className="stat-subtitle">
                      {evaluationResults.quick_stats?.data_quality === 'Excellent' ? 'Highly reliable data' :
                       evaluationResults.quick_stats?.data_quality === 'Good' ? 'Reliable data' :
                       evaluationResults.quick_stats?.data_quality === 'Limited' ? 'Limited reliability' :
                       'Quality assessment unavailable'}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {evaluationResults.average_completion_time ? 
                        `${Math.round(evaluationResults.average_completion_time)} min` : 
                        'N/A'
                      }
                    </div>
                    <div className="stat-label">Avg. Completion Time</div>
                    <div className="stat-subtitle">
                      {evaluationResults.average_completion_time ? 
                        'per student response' : 
                        'completion time not tracked'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weighted Score Breakdown Section */}
            {evaluationResults.weighted_scores && (
              <div className="results-section">
                <h3>🎯 Final Evaluation Score</h3>
                <div className="weighted-score-container">
                  <div className="final-score-display">
                    <div className="final-score-circle">
                      <div className="score-value">{evaluationResults.final_score || evaluationResults.weighted_scores.weighted_score}%</div>
                      <div className="score-label">Final Score</div>
                      <div className="performance-level">
                        {evaluationResults.performance_level || evaluationResults.weighted_scores.performance_level}
                      </div>
                    </div>
                  </div>
                  
                  <div className="score-breakdown">
                    <h4>Score Breakdown</h4>
                    <div className="breakdown-table">
                      <div className="breakdown-header">
                        <span>Evaluation Type</span>
                        <span>Raw Score</span>
                        <span>Weight</span>
                        <span>Weighted Value</span>
                      </div>
                      
                      {evaluationResults.score_breakdown ? (
                        <>
                  <div className="breakdown-row">
                    <span className="eval-type">
                      <span className="type-icon">👥</span>
                      Student Evaluation
                    </span>
                    <span className="raw-score">{evaluationResults.score_breakdown.student.raw_score}%</span>
                    <span className="weight">{formatWeightPct(evaluationResults.score_breakdown.student.weight)}%</span>
                    <span className="weighted-value">{evaluationResults.score_breakdown.student.weighted_value}%</span>
                  </div>
                  <div className="breakdown-row">
                    <span className="eval-type">
                      <span className="type-icon">🤝</span>
                      Teachers Evaluation
                    </span>
                    <span className="raw-score">{evaluationResults.score_breakdown.peer.raw_score}%</span>
                    <span className="weight">{formatWeightPct(evaluationResults.score_breakdown.peer.weight)}%</span>
                    <span className="weighted-value">{evaluationResults.score_breakdown.peer.weighted_value}%</span>
                  </div>
                  <div className="breakdown-row">
                    <span className="eval-type">
                      <span className="type-icon">👔</span>
                      Head of Department (HOD) Evaluation
                    </span>
                    <span className="raw-score">{evaluationResults.score_breakdown.admin.raw_score}%</span>
                    <span className="weight">{formatWeightPct(evaluationResults.score_breakdown.admin.weight)}%</span>
                    <span className="weighted-value">{evaluationResults.score_breakdown.admin.weighted_value}%</span>
                  </div>
                          <div className="breakdown-row total-row">
                            <span className="eval-type"><strong>Final Score</strong></span>
                            <span className="raw-score">—</span>
                            <span className="weight">100%</span>
                            <span className="weighted-value">
                              <strong>{evaluationResults.final_score || evaluationResults.weighted_scores.weighted_score}%</strong>
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="breakdown-row">
                            <span className="eval-type">
                              <span className="type-icon">👥</span>
                              Student Evaluation
                            </span>
                            <span className="raw-score">{evaluationResults.weighted_scores.student_score}%</span>
                            <span className="weight">50%</span>
                            <span className="weighted-value">{(evaluationResults.weighted_scores.student_score * 0.5).toFixed(1)}%</span>
                          </div>
                          <div className="breakdown-row">
                            <span className="eval-type">
                              <span className="type-icon">🤝</span>
                              Teachers Evaluation
                            </span>
                            <span className="raw-score">{evaluationResults.weighted_scores.peer_score}%</span>
                            <span className="weight">30%</span>
                            <span className="weighted-value">{(evaluationResults.weighted_scores.peer_score * 0.3).toFixed(1)}%</span>
                          </div>
                          <div className="breakdown-row">
                            <span className="eval-type">
                              <span className="type-icon">👔</span>
                              Head of Department (HOD) Evaluation
                            </span>
                            <span className="raw-score">{evaluationResults.weighted_scores.admin_score}%</span>
                            <span className="weight">20%</span>
                            <span className="weighted-value">{(evaluationResults.weighted_scores.admin_score * 0.2).toFixed(1)}%</span>
                          </div>
                          <div className="breakdown-row total-row">
                            <span className="eval-type"><strong>Final Score</strong></span>
                            <span className="raw-score">—</span>
                            <span className="weight">100%</span>
                            <span className="weighted-value">
                              <strong>{evaluationResults.weighted_scores.weighted_score}%</strong>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Analysis removed per request */}

            {/* Participation Analysis intentionally removed per request */}

            {/* Rating Distribution Section */}
            <div className="results-section">
              <h3>⭐ Rating Distribution</h3>
              {ratingDistribution.length === 0 ? (
                <div className="empty-state" style={{ padding: 12 }}>
                  <p style={{ color: 'var(--muted)' }}>No ratings yet.</p>
                </div>
              ) : (
                <div className="ratings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  {ratingDistribution.map(r => (
                    <div key={r.rating} style={{ padding: 12, border: '1px solid #eee', borderRadius: 10 }} aria-label={`Rating ${r.rating} count ${r.count} (${r.percent}%)`}>
                      <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>⭐ {r.rating}</span>
                        <span>{r.percent}%</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>{r.count}</div>
                      <div style={{ marginTop: 6, height: 6, background: '#f1f3f5', borderRadius: 6 }}>
                        <div style={{ width: `${r.percent}%`, height: 6, background: '#0ea5e9', borderRadius: 6 }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Insights Banner */}
            {evaluationResults.quick_stats?.data_quality && (
              <div className="results-section">
                <div role="status" aria-live="polite" className="insights-banner" style={{ padding: 12, border: '1px solid #eee', borderRadius: 10, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💡</span>
                    <strong>Insights</strong>
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--muted)' }}>
                    {evaluationResults.quick_stats.data_quality === 'Excellent' && 'Data quality looks excellent — proceed with confidence.'}
                    {evaluationResults.quick_stats.data_quality === 'Good' && 'Good data quality — insights are reliable.'}
                    {evaluationResults.quick_stats.data_quality === 'Limited' && 'Limited reliability — low participation or incomplete responses. Consider keeping the evaluation open longer and sending reminders.'}
                  </div>
                </div>
              </div>
            )}

            {/* Export Controls Section */}
            <div className="results-section export-section">
              <h3>📁 Export & Actions</h3>
              <div className="export-section-description">
                Download comprehensive evaluation reports in your preferred format.
              </div>
              <ExportControls
                onExport={handleExport}
                loading={exportLoading}
                disabled={!evaluationResults}
                formats={['csv', 'pdf', 'excel']}
                size="medium"
                variant="buttons"
              />
            </div>

            {/* Last Updated */}
            <div className="results-footer">
              <p className="last-updated">
                Last updated: {evaluationResults.last_updated ? 
                  new Date(evaluationResults.last_updated).toLocaleString() : 
                  'Unknown'
                }
              </p>
            </div>
          </>
        ) : (
          <div className="no-results">
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Results Available</h3>
              <p>No detailed results found for this evaluation.</p>
              <button 
                className="dept-btn dept-btn-primary"
                onClick={handleBack}
              >
                Back to Results List
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </DepartmentResultsErrorManager>
  </DepartmentResultsErrorBoundary>
  );
}

export default EvaluationResults;