import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import ErrorAlert from '../../../components/ErrorHandling/ErrorAlert';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';
import DepartmentResultsErrorBoundary from '../../../components/ErrorHandling/DepartmentResultsErrorBoundary';
import DepartmentResultsErrorManager from '../../../components/ErrorHandling/DepartmentResultsErrorManager';
import ResultsPageFallback from '../../../components/ErrorHandling/ResultsPageFallback';
import StatusBadge from '../../../components/StatusBadge';
import ExportControls from '../../../components/ExportControls';
import ExportNotification from '../../../components/ExportNotification';
import ModernCircularProgress from '../../../components/ModernCircularProgress';
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
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Course ratings modal state
  const [showCourseRatings, setShowCourseRatings] = useState(false);
  const [courseRatings, setCourseRatings] = useState(null);
  const [courseRatingsLoading, setCourseRatingsLoading] = useState(false);
  const [courseRatingsError, setCourseRatingsError] = useState(null);
  
  // Individual course detail modal state
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
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
      setLastRefresh(new Date().toISOString());
    }
  };

  // Load course ratings for teacher
  const loadCourseRatings = async () => {
    if (!evaluationResults?.instructor_information?.teacher_id) {
      setCourseRatingsError('Teacher information not available');
      return;
    }

    try {
      setCourseRatingsLoading(true);
      setCourseRatingsError(null);
      
      const response = await handleApiCall(
        () => api.get(`/departments/${departmentId}/teachers/${evaluationResults.instructor_information.teacher_id}/course-ratings`, {
          params: {
            academic_year: evaluationResults.academic_year,
            semester: evaluationResults.semester
          }
        }),
        'course_ratings_load'
      );
      
      setCourseRatings(response.data);
    } catch (err) {
      console.error('Failed to load course ratings:', err);
      setCourseRatingsError('Failed to load course ratings. Please try again.');
      addError(err, 'course_ratings_load');
    } finally {
      setCourseRatingsLoading(false);
    }
  };

  // Handle view course ratings
  const handleViewCourseRatings = () => {
    setShowCourseRatings(true);
    loadCourseRatings();
  };

  // Handle close course ratings modal
  const handleCloseCourseRatings = () => {
    setShowCourseRatings(false);
    setCourseRatings(null);
    setCourseRatingsError(null);
  };

  // Handle view individual course detail
  const handleViewCourseDetail = (course) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
  };

  // Handle close course detail modal
  const handleCloseCourseDetail = () => {
    setShowCourseDetail(false);
    setSelectedCourse(null);
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

  // Format a weight that may be provided as ratio (0-1) or percentage (>1)
  const formatWeightPct = (w) => {
    const num = Number(w) || 0;
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
  };

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
      
          {/* Enhanced Professional Header */}
          <div className="evaluation-results-header">
            <div className="header-background">
              <div className="header-gradient"></div>
              <div className="header-pattern"></div>
            </div>
            
            <div className="header-content">
              <div className="header-main">
                <div className="header-title-section">
                  <div className="title-with-icon">
                    <div className="title-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2M9 11V9a2 2 0 1 1 4 0v2M9 11h6"/>
                      </svg>
                    </div>
                    <div className="title-content">
                      <h1 className="page-title">Evaluation Results</h1>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="header-actions">
                <div className="action-group">
                  <div className="action-buttons">
                    <button 
                      className="action-btn refresh-btn"
                      onClick={loadEvaluationResults}
                      disabled={loading}
                      title="Refresh evaluation data"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    
                    <button 
                      className="action-btn primary-btn"
                      onClick={handleBack}
                      title="Return to results overview"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Back to Results
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* Results content */}
      <div className="evaluation-results-content" id="main-content">
        {evaluationResults ? (
          <>
            {/* Instructor Information Section */}
            <div className="results-section">
              <div className="section-header">
                <h3>👨‍🏫 Instructor Information</h3>
                {evaluationResults.instructor_information?.teacher_id && (
                  <button 
                    className="dept-btn dept-btn-secondary"
                    onClick={handleViewCourseRatings}
                    disabled={courseRatingsLoading}
                  >
                    {courseRatingsLoading ? <LoadingSpinner size="small" /> : 'View Course Ratings'}
                  </button>
                )}
              </div>
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

            {/* Modern Final Evaluation Score Section */}
            {evaluationResults.weighted_scores && (
              <div className="results-section">
                <h3>🎯 Final Evaluation Score</h3>
                <div className="weighted-score-container">
                  <div className="modern-final-score-display">
                    <ModernCircularProgress
                      percentage={parseFloat(evaluationResults.final_score || evaluationResults.weighted_scores.weighted_score)}
                      size={220}
                      strokeWidth={14}
                      title="Total"
                      subtitle="Final Score"
                      performanceLevel={evaluationResults.performance_level || evaluationResults.weighted_scores.performance_level}
                      animated={true}
                      showGlow={true}
                    />
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

            {/* Instructor Courses Section */}
            <div className="results-section">
              <h3>📚 Instructor Courses</h3>
              {evaluationResults.instructor_information?.teacher_id ? (
                <div className="instructor-courses-container">
                  <p className="section-description">
                    View detailed rating distributions for each course taught by this instructor.
                  </p>
                  <button 
                    className="dept-btn dept-btn-primary"
                    onClick={handleViewCourseRatings}
                    disabled={courseRatingsLoading}
                  >
                    {courseRatingsLoading ? <LoadingSpinner size="small" /> : 'View All Course Ratings'}
                  </button>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 12 }}>
                  <p style={{ color: 'var(--muted)' }}>Instructor information not available.</p>
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

      {/* Course Ratings Modal */}
      {showCourseRatings && (
        <div className="modal-overlay" onClick={handleCloseCourseRatings}>
          <div className="course-ratings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📚 Instructor Courses</h3>
              <button 
                className="modal-close-btn"
                onClick={handleCloseCourseRatings}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {courseRatingsLoading ? (
                <div className="loading-container">
                  <LoadingSpinner size="medium" message="Loading course ratings..." />
                </div>
              ) : courseRatingsError ? (
                <div className="error-container">
                  <ErrorAlert
                    error={{ response: { data: { message: courseRatingsError } } }}
                    onRetry={loadCourseRatings}
                    onDismiss={() => setCourseRatingsError(null)}
                  />
                </div>
              ) : courseRatings?.data?.courses?.length > 0 ? (
                <>
                  <div className="teacher-info">
                    <h4>👨‍🏫 {courseRatings.data.teacher.name}</h4>
                    <p className="filters-info">
                      Academic Year: {courseRatings.data.filters.academic_year} | 
                      Semester: {courseRatings.data.filters.semester}
                    </p>
                  </div>
                  
                  <div className="courses-list">
                    {courseRatings.data.courses.map((course, index) => (
                      <div key={course.course_id} className="course-list-item">
                        <div className="course-info">
                          <div className="course-header">
                            <h5 className="course-title">{course.course_title}</h5>
                            <span className="course-code">{course.course_code}</span>
                          </div>
                          <div className="course-summary">
                            <span className="summary-item">
                              <strong>Final Score:</strong> {course.final_score}%
                            </span>
                            <span className="summary-item">
                              <strong>Avg Rating:</strong> {course.average_rating}/5
                            </span>
                            <span className="summary-item">
                              <strong>Responses:</strong> {course.total_responses}
                            </span>
                          </div>
                        </div>
                        <button 
                          className="dept-btn dept-btn-primary course-detail-btn"
                          onClick={() => handleViewCourseDetail(course)}
                        >
                          See Details
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h4>No Course Data Available</h4>
                  <p>No course ratings found for this teacher in the selected period.</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="dept-btn dept-btn-secondary"
                onClick={handleCloseCourseRatings}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Course Detail Modal */}
      {showCourseDetail && selectedCourse && (
        <div className="modal-overlay" onClick={handleCloseCourseDetail}>
          <div className="course-ratings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 {selectedCourse.course_title} - Rating Distribution</h3>
              <button 
                className="modal-close-btn"
                onClick={handleCloseCourseDetail}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="course-detail-container">
                <div className="course-header-detail">
                  <div className="course-title-section">
                    <h4>{selectedCourse.course_title}</h4>
                    <span className="course-code">{selectedCourse.course_code}</span>
                  </div>
                  <div className="course-period">
                    <span>Academic Year: {selectedCourse.academic_year}</span>
                    <span>Semester: {selectedCourse.semester}</span>
                    <span>Year Level: {selectedCourse.year_level || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="course-stats-detail">
                  <div className="stat-item">
                    <span className="stat-label">Final Score</span>
                    <span className="stat-value final-score">{selectedCourse.final_score}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Average Rating</span>
                    <span className="stat-value">{selectedCourse.average_rating}/5</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Responses</span>
                    <span className="stat-value">{selectedCourse.total_responses}</span>
                  </div>
                </div>
                
                <div className="rating-distribution-detail">
                  <h5>Rating Distribution</h5>
                  <div className="rating-bars">
                    {Object.entries(selectedCourse.rating_distribution).map(([rating, data]) => (
                      <div key={rating} className="rating-bar-item">
                        <span className="rating-label">⭐ {rating}</span>
                        <div className="rating-bar">
                          <div 
                            className="rating-fill" 
                            style={{ width: `${data.percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="rating-count">{data.count} ({data.percentage || 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="dept-btn dept-btn-secondary"
                onClick={handleCloseCourseDetail}
              >
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DepartmentResultsErrorManager>
  </DepartmentResultsErrorBoundary>
  );
}

export default EvaluationResults;