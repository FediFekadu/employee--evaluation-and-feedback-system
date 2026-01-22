import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import { useErrorHandling, useSubmissionErrorHandling } from '../../../hooks/useErrorHandling';
import ErrorAlert from '../../../components/ErrorHandling/ErrorAlert';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';
import ProgressIndicator from '../../../components/ErrorHandling/ProgressIndicator';
import { gracefulDegradationManager, getErrorInfo } from '../../../utils/errorHandling';
import { isEvaluationAvailable, getCurrentDateString, formatDateForDisplay } from '../../../utils/dateUtils';

// NotificationToast Component
const NotificationToast = ({ notifications, onDismiss, onMarkAsRead }) => {
  if (!notifications || notifications.length === 0) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline_extended': return '⏰';
      case 'closed': return '🔒';
      case 'updated': return '📝';
      case 'maintenance': return '🔧';
      default: return '📢';
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'deadline_extended': return 'notification-info';
      case 'closed': return 'notification-warning';
      case 'updated': return 'notification-info';
      case 'maintenance': return 'notification-error';
      default: return 'notification-info';
    }
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`notification-toast ${getNotificationClass(notification.type)} ${notification.read ? 'read' : 'unread'}`}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {getNotificationIcon(notification.type)}
            </span>
            <div className="notification-body">
              <div className="notification-message">
                {notification.message}
              </div>
              <div className="notification-meta">
                <span className="notification-time">
                  {notification.timestamp.toLocaleTimeString()}
                </span>
                {notification.evaluationId && (
                  <span className="notification-eval">
                    Evaluation #{notification.evaluationId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="notification-actions">
            {!notification.read && (
              <button 
                className="notification-action mark-read"
                onClick={() => onMarkAsRead(notification.id)}
                title="Mark as read"
              >
                👁️
              </button>
            )}
            <button 
              className="notification-action dismiss"
              onClick={() => onDismiss(notification.id)}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

function StudentEvaluations() {
  const [evalDetail, setEvalDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [errors, setErrors] = useState({});
  const [responses, setResponses] = useState({});
  const [submissionStatuses, setSubmissionStatuses] = useState({});

  // Get department ID and student year level for connection and display
  const departmentId = typeof window !== 'undefined' ? Number(localStorage.getItem('department_id')) : null;
  const studentYearLevel = typeof window !== 'undefined' ? localStorage.getItem('year_level') : null;
  
  // Helper function to format year level for display
  const formatYearLevel = (yearLevel) => {
    if (!yearLevel) return '';
    
    const year = parseInt(yearLevel);
    if (isNaN(year)) return yearLevel;
    
    const suffixes = ['st', 'nd', 'rd', 'th'];
    const suffix = year <= 3 ? suffixes[year - 1] : suffixes[3];
    
    return `${year}${suffix} Year`;
  };
  
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
    submissionState, 
    handleSubmission, 
    resetSubmissionState 
  } = useSubmissionErrorHandling();

  // Simple state management for evaluations and notifications
  const [evaluations, setEvaluations] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Simple refresh and reconnect functions
  const refresh = useCallback(async () => {
    try {
      // Use the correct evaluations endpoint with department filtering
      const params = new URLSearchParams();
      if (departmentId) {
        params.append('department_id', departmentId);
      }
      // Filter evaluations by student's year level if available, so students see relevant forms
      if (studentYearLevel) {
        params.append('year_level', String(studentYearLevel));
      }
      params.append('open_only', 'true'); // Only show open evaluations to students
      
      const response = await api.get(`/evaluations?${params.toString()}`);
      const evaluationsData = response.data?.data || response.data || [];
      
      // Load detailed data for each evaluation to get feedbacks
      const evaluationsWithDetails = await Promise.all(
        evaluationsData.map(async (evaluation) => {
          try {
            const detailResponse = await api.get(`/evaluations/${evaluation.id}`);
            return detailResponse.data;
          } catch (error) {
            console.warn(`Failed to load details for evaluation ${evaluation.id}:`, error);
            return evaluation; // Return original data if detail loading fails
          }
        })
      );
      
      setEvaluations(evaluationsWithDetails);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh evaluations:', error);
      addError(error, 'Failed to load evaluations');
    }
  }, [departmentId, addError]);

  const reconnect = useCallback(() => {
    refresh();
  }, [refresh]);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Enhanced scale labels matching the official form
  const scaleLabels = {
    1: 'Very Low\nበጣም ዝቅተኛ\nየሚል\nነጥብ',
    2: 'Low\nዝቅተኛ',
    3: 'Medium\nመካከለኛ',
    4: 'High\nከፍተኛ',
    5: 'Very High\nበጣም ከፍተኛ',
    nc: 'Does not Apply\nአይመለከተም'
  };



  useEffect(() => {
    let mounted = true;
    
    // Load submission statuses when evaluations change
    if (evaluations.length > 0) {
      const loadSubmissionStatuses = async () => {
        const studentDbId = typeof window !== 'undefined' ? Number(localStorage.getItem('student_db_id')) : null;
        if (studentDbId) {
          const statusPromises = evaluations.map(async (evaluation) => {
            try {
              const statusRes = await api.get(`/evaluations/${evaluation.id}/submission-status?student_id=${studentDbId}`);
              return { evaluationId: evaluation.id, status: statusRes.data.submission_status };
            } catch (error) {
              // Graceful fallback to existing logic if endpoint fails
              const isSubmitted = (evaluation?.feedbacks || []).some((fb) => Number(fb.student_id) === studentDbId);
              return { 
                evaluationId: evaluation.id, 
                status: { 
                  has_submitted: isSubmitted,
                  submitted_at: null,
                  is_anonymous: null 
                } 
              };
            }
          });
          
          const statuses = await Promise.all(statusPromises);
          if (mounted) {
            const statusMap = {};
            statuses.forEach(({ evaluationId, status }) => {
              statusMap[evaluationId] = status;
            });
            setSubmissionStatuses(statusMap);
          }
        }
      };

      loadSubmissionStatuses();
    }
    
    return () => { mounted = false; };
  }, [evaluations]);

  // Load evaluations when component mounts or department changes
  useEffect(() => {
    if (departmentId) {
      refresh();
    }
  }, [departmentId, refresh]);

  // Debug logging to help identify the issue
  useEffect(() => {
    const studentDbId = typeof window !== 'undefined' ? Number(localStorage.getItem('student_db_id')) : null;
    const storedDepartmentId = typeof window !== 'undefined' ? Number(localStorage.getItem('department_id')) : null;
    
    console.log('🔍 Student Debug Info:', {
      studentDbId,
      departmentId,
      storedDepartmentId,
      evaluationsCount: evaluations.length,
      submissionStatuses: Object.keys(submissionStatuses).length
    });
    
    // Warn if there's a mismatch
    if (storedDepartmentId && departmentId && storedDepartmentId !== departmentId) {
      console.warn('⚠️ Department ID mismatch:', { stored: storedDepartmentId, current: departmentId });
    }
    
    // Log evaluation details for debugging
    evaluations.forEach((evaluationItem) => {
      const feedbacks = evaluationItem.feedbacks || [];
      const hasSubmitted = feedbacks.some((fb) => Number(fb.student_id) === studentDbId);
      console.log(`📝 Evaluation ${evaluationItem.id}:`, {
        course: evaluationItem.course?.title,
        feedbackCount: feedbacks.length,
        studentSubmitted: hasSubmitted,
        feedbackStudentIds: feedbacks.map((fb) => fb.student_id),
        questions: evaluationItem.questions?.length || 0,
      });
    });
    
    // Check if student should see any evaluations
    if (evaluations.length === 0 && departmentId) {
      console.warn('⚠️ No evaluations found for department:', departmentId);
      console.log('💡 Available departments with evaluations: 1790, 1802, 2215');
    }
  }, [evaluations, submissionStatuses, departmentId]);

  const openEval = async (evaluationId) => {
    // Hint Department builder to auto-select this evaluation ID
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('deptSelectedEvalId', String(evaluationId)); } catch {}
    }
    // Check submission status before opening
    const studentDbId = typeof window !== 'undefined' ? Number(localStorage.getItem('student_db_id')) : null;
    if (!studentDbId) {
      addError(new Error('Missing student identity. Please log in again.'), 'Authentication required');
      return;
    }

    // Check if already submitted using cached status first
    const cachedStatus = submissionStatuses[evaluationId];
    if (cachedStatus?.has_submitted) {
      addError(
        { response: { data: { 
          error: 'duplicate_submission',
          message: 'You have already submitted this evaluation. Each student can only submit one evaluation per course.'
        }}}, 
        'Evaluation Already Submitted'
      );
      return;
    }

    // Also check using evaluation feedbacks as fallback
    const evaluation = evaluations.find(e => e.id === evaluationId);
    const feedbackSubmission = (evaluation?.feedbacks || []).find(fb => Number(fb.student_id) === studentDbId);
    if (feedbackSubmission) {
      // Update cached status
      setSubmissionStatuses(prev => ({
        ...prev,
        [evaluationId]: {
          has_submitted: true,
          submitted_at: feedbackSubmission.created_at || null,
          is_anonymous: feedbackSubmission.anonymous
        }
      }));
      
      addError(
        { response: { data: { 
          error: 'duplicate_submission',
          message: 'You have already submitted this evaluation. Each student can only submit one evaluation per course.'
        }}}, 
        'Evaluation Already Submitted'
      );
      return;
    }

    setDetailLoading(true);
    setEvalDetail(null);
    setErrors({});
    setResponses({});
    clearErrors();
    
    try {
      // Double-check submission status with fresh API call and retry mechanism
      const statusRes = await handleApiCall(
        () => api.get(`/evaluations/${evaluationId}/submission-status?student_id=${studentDbId}`),
        'check_submission_status',
        { 
          showProgress: true,
          progressSteps: ['Checking submission status', 'Verifying eligibility']
        }
      );
      
      if (statusRes.data.submission_status.has_submitted) {
        addError(
          { response: { data: { error: 'duplicate_submission' } } }, 
          'Evaluation already submitted'
        );
        return;
      }

      // Load evaluation questions from department template
      const questionsRes = await handleApiCall(
        () => api.get(`/evaluations/${evaluationId}/template-questions`),
        'load_template_questions',
        {
          showProgress: true,
          progressSteps: ['Loading evaluation template', 'Preparing questions', 'Ready to evaluate']
        }
      );
      
      // Load basic evaluation details
      const evalRes = await handleApiCall(
        () => api.get(`/evaluations/${evaluationId}`),
        'load_evaluation_details',
        {
          showProgress: true,
          progressSteps: ['Loading evaluation details', 'Finalizing form']
        }
      );
      
      // Combine evaluation details with template questions
      const evaluationData = {
        ...evalRes.data,
        questions: questionsRes.data.questions || [],
        form_info: questionsRes.data.form_info || null,
        template_name: questionsRes.data.template_name || 'Evaluation Template'
      };
      
      setEvalDetail(evaluationData);
      
      // Default anonymous preference from localStorage if present
      const stored = typeof window !== 'undefined' ? localStorage.getItem('anonymous_preference') : null;
      setAnonymous(stored === null ? true : stored === 'true');
      
    } catch (error) {
      // Enhanced error handling with specific messages
      const errorInfo = getErrorInfo ? getErrorInfo(error) : { type: 'unknown', message: 'An error occurred' };
      
      if (errorInfo.type === 'network') {
        addError(error, 'Network connection failed while loading evaluation');
      } else if (errorInfo.type === 'timeout') {
        addError(error, 'Request timed out while loading evaluation');
      } else if (errorInfo.type === 'server_error') {
        addError(error, 'Server error while loading evaluation');
      } else {
        addError(error, 'Failed to load evaluation details');
      }
      
      console.error('Failed to load evaluation:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRatingChange = (questionId, rating) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { rating: rating === 'nc' ? null : Number(rating), text: null }
    }));
    // Clear error for this question
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleTextChange = (questionId, text) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { rating: null, text: text || null }
    }));
  };

  const getCompletionStats = () => {
    if (!evalDetail?.questions) return { completed: 0, total: 0 };
    const ratingQuestions = evalDetail.questions.filter(q => q.type === 'rating');
    const completed = ratingQuestions.filter(q => responses[q.id]?.rating !== undefined).length;
    return { completed, total: ratingQuestions.length };
  };

  const submitEvaluation = async () => {
    const studentDbId = typeof window !== 'undefined' ? Number(localStorage.getItem('student_db_id')) : null;
    if (!studentDbId) {
      addError(new Error('Missing student identity. Please log in again.'), 'Authentication required');
      return;
    }
    
    // Enhanced duplicate submission check
    const cachedStatus = submissionStatuses[evalDetail.id];
    if (cachedStatus?.has_submitted) {
      addError(
        { response: { data: { error: 'duplicate_submission' } } }, 
        'Duplicate submission prevented'
      );
      return;
    }
    
    // Enhanced evaluation availability check using date utilities
    const currentDate = getCurrentDateString();
    const evaluationAvailable = isEvaluationAvailable(evalDetail.opened_at, evalDetail.closed_at, currentDate);
    
    if (!evaluationAvailable) {
      // Determine specific reason for unavailability
      const hasOpened = isEvaluationAvailable(evalDetail.opened_at, null, currentDate);
      const errorType = hasOpened ? 'evaluation_closed' : 'evaluation_not_open';
      const message = hasOpened ? 
        'This evaluation has been closed and no longer accepts submissions.' :
        'This evaluation is not yet open for submissions.';
      
      addError(
        { response: { data: { error: errorType, message } } }, 
        'Evaluation not available'
      );
      return;
    }
    
    // Build responses from state with enhanced validation and sanitization
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return null;
      // Remove characters disallowed by backend regex: < > ' " ;
      return text.replace(/[<>\'";]/g, '').trim() || null;
    };
    const responseArray = [];
    const requiredQuestions = [];
    const nextErrors = {};
    
    (evalDetail?.questions || []).forEach((q) => {
      const response = responses[q.id];
      if (q.type === 'rating') {
        let ratingVal = null;
        if (response?.rating !== undefined) {
          const parsed = Number(response.rating);
          if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 5) {
            ratingVal = parsed;
          } else {
            // Flag out-of-range rating for pre-submit validation
            nextErrors[q.id] = 'Rating must be between 1 and 5.';
          }
        }
        responseArray.push({ 
          question_id: q.id, 
          rating: ratingVal, 
          text: null 
        });
        requiredQuestions.push(q.id);
      } else {
        const sanitized = sanitizeText(response?.text);
        responseArray.push({ 
          question_id: q.id, 
          rating: null, 
          text: sanitized 
        });
      }
    });
    
    // Enhanced validation with detailed error messages
    let missingCount = 0;
    
    requiredQuestions.forEach((qId) => {
      const response = responses[qId];
      if (!response || response.rating === undefined) {
        nextErrors[qId] = 'Please select a rating for this question.';
        missingCount++;
      }
    });
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const errorMessage = `Please complete ${missingCount} remaining question${missingCount > 1 ? 's' : ''} before submitting.`;
      addError(
        { response: { data: { error: 'validation_failed', message: errorMessage } } }, 
        'Form validation failed'
      );
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error-message');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Enhanced submission with comprehensive progress tracking and error handling
    try {
      // Prepare validation data for submission hook (include all answered responses)
      const validationResponses = Object.entries(responses).reduce((acc, [qId, r]) => {
        if (r && typeof r === 'object') {
          if ('rating' in r && r.rating != null) {
            acc[qId] = r;
          } else if ('text' in r && r.text && r.text.trim() !== '') {
            acc[qId] = r;
          } else if ('selected' in r && r.selected != null) {
            acc[qId] = r;
          }
        } else if (r != null && r !== '') {
          acc[qId] = r;
        }
        return acc;
      }, {});

      const submissionValidationData = {
        evaluation_id: evalDetail?.id,
        responses: validationResponses
      };

      const result = await handleSubmission(
        () => api.post('/feedbacks', { 
          evaluation_id: evalDetail.id, 
          student_id: studentDbId, 
          anonymous, 
          responses: responseArray 
        }),
        submissionValidationData,
        'evaluation_submission'
      );
      
      // Success handling with user feedback
      console.log('Evaluation submitted successfully:', result);
      
      // Show success message
      const successMessage = anonymous ? 
        'Your anonymous evaluation has been submitted successfully! Thank you for your feedback.' :
        'Your evaluation has been submitted successfully! Thank you for your feedback.';
      
      // You could add a success notification here if you have a notification system
      
      // Immediately update submission status in local state
      setSubmissionStatuses(prev => ({
        ...prev,
        [evalDetail.id]: {
          has_submitted: true,
          submitted_at: new Date().toISOString(),
          is_anonymous: anonymous
        }
      }));
      
      setEvalDetail(null);
      setResponses({});
      resetSubmissionState();
      
      // Refresh evaluations list using hook
      try {
        await refresh();
      } catch (refreshError) {
        console.warn('Failed to refresh evaluations list:', refreshError);
        // Don't show error to user as submission was successful
      }
      
    } catch (error) {
      // Enhanced error handling with specific user guidance
      console.error('Submission failed:', error);
      
      // Present detailed server-side validation messages when available
      const serverStatus = error?.response?.status;
      const serverData = error?.response?.data;
      if (serverStatus === 422 && serverData) {
        // Show a user-facing message from server
        const title = 'Submission validation failed';
        const message = serverData.message || 'Please correct the highlighted fields and try again.';
        addError(error, title);

        // Handle malicious content errors and map to specific question
        if (serverData.error === 'malicious_content') {
          try {
            const details = serverData.details || '';
            const idxMatch = details.match(/Response #(\d+)/);
            const respIdx = idxMatch ? Number(idxMatch[1]) : null;
            if (respIdx != null && responseArray[respIdx]) {
              const qid = responseArray[respIdx].question_id;
              setErrors(prev => ({ ...prev, [qid]: message }));
            }
          } catch (mapErr) {
            console.warn('Failed to map malicious content error to question:', mapErr);
          }
        }
        
        // Enhanced 422 error debugging
        console.log('🔍 422 Error Debug Info:', {
          evaluation_id: evalDetail.id,
          student_id: studentDbId,
          responses_count: responseArray.length,
          server_error: serverData.error,
          server_message: serverData.message,
          validation_errors: serverData.errors
        });
        
        // If it's a duplicate submission, update local state immediately
        if (serverData.error === 'duplicate_submission') {
          setSubmissionStatuses(prev => ({
            ...prev,
            [evalDetail.id]: {
              has_submitted: true,
              submitted_at: serverData.submission_details?.submitted_at || new Date().toISOString(),
              is_anonymous: serverData.submission_details?.is_anonymous || null
            }
          }));
          setEvalDetail(null);
        }
      }

      // Handle specific error cases for UI updates
      if (error.response?.data?.error === 'duplicate_submission') {
        // Update submission status immediately to prevent further attempts
        setSubmissionStatuses(prev => ({
          ...prev,
          [evalDetail.id]: {
            has_submitted: true,
            submitted_at: error.response.data.submission_details?.submitted_at || null,
            is_anonymous: error.response.data.submission_details?.is_anonymous || null
          }
        }));
        setEvalDetail(null);
        
        // Show user-friendly message
        addError(
          { response: { data: { 
            error: 'duplicate_submission',
            message: 'You have already submitted this evaluation. Each student can only submit one evaluation per course.'
          }}}, 
          'Evaluation Already Submitted'
        );
      } else if (error.response?.data?.error === 'evaluation_closed') {
        // Evaluation was closed while user was filling it
        setEvalDetail(null);
      } else if (error.response?.data?.error === 'validation_failed') {
        // Server-side validation failed, show specific errors
        const serverErrors = error.response?.data?.errors || {};
        const newErrors = {};
        
        Object.keys(serverErrors).forEach(field => {
          if (field.includes('responses.')) {
            const questionIndex = field.match(/responses\.(\d+)\./)?.[1];
            if (questionIndex !== undefined) {
              const questionId = responseArray[parseInt(questionIndex)]?.question_id;
              if (questionId) {
                newErrors[questionId] = serverErrors[field][0] || 'Invalid response';
              }
            }
          }
        });
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        }
      } else if (error.response?.data?.error === 'evaluation_not_open') {
        // Not open yet – reflect message to user
        addError(error, 'Evaluation not open');
      }
      
      // Error details are already handled by handleSubmission hook
    }
  };

  return (
    <div className="student-evaluations">
      {/* Global Error Display */}
      {globalErrors.map((error) => (
        <ErrorAlert
          key={error.id}
          error={error.error}
          onRetry={() => {
            removeError(error.id);
            // Implement retry logic based on error context
            if (error.context === 'load_evaluations') {
              window.location.reload();
            }
          }}
          onDismiss={() => removeError(error.id)}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      ))}

      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onMarkAsRead={markAsRead}
      />

      {/* Submission Error Display */}
      {submissionState.submissionError && (
        <ErrorAlert
          error={{ response: { data: submissionState.submissionError } }}
          onRetry={() => {
            resetSubmissionState();
            submitEvaluation();
          }}
          onDismiss={() => resetSubmissionState()}
        />
      )}

      {/* Header */}
      <div className="evaluations-header">
        <div className="header-title">
          <h1>Teacher Evaluations</h1>
          {getUnreadCount() > 0 && (
            <span className="notification-badge">
              {getUnreadCount()} new notification{getUnreadCount() > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p>Evaluate your instructors to help improve teaching quality</p>
        
        {/* Connection Status Display */}
        <div className="connection-status">
          <div className="status-indicator">
            <span className={`status-icon ${connectionStatus}`}>
              {connectionStatus === 'connected' && '🟢'}
              {connectionStatus === 'connecting' && '🟡'}
              {connectionStatus === 'error' && '🔴'}
              {connectionStatus === 'polling' && '🔄'}
            </span>
            <span className={`status-text ${connectionStatus}`}>
              {connectionStatus === 'connected' && 'Live Updates'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'error' && 'Connection Lost'}
              {connectionStatus === 'polling' && 'Polling Mode'}
            </span>
            {lastUpdate && (
              <span className="last-update">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            {connectionStatus === 'error' && (
              <button className="retry-btn" onClick={reconnect}>
                Retry Connection
              </button>
            )}
          </div>
        </div>
        
        {/* Loading indicator for page-level operations */}
        {isLoading('load_evaluations') && (
          <LoadingSpinner 
            size="small" 
            message="Loading evaluations..." 
          />
        )}
      </div>

      {/* Evaluations List */}
      <div className="evaluations-grid">
        {evaluations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Evaluations Available</h3>
            <p>There are no open evaluations for your courses at this time.</p>
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '8px', fontSize: '0.9em' }}>
                <strong>Debug Info:</strong>
                <br />Department ID: {departmentId || 'Not set'}
                <br />Student ID: {typeof window !== 'undefined' ? localStorage.getItem('student_db_id') : 'Not set'}
                <br />Available departments with evaluations: 1790, 1802, 2215
              </div>
            )}
          </div>
        ) : (
          evaluations.map((evaluation) => {
            const studentDbId = typeof window !== 'undefined' ? Number(localStorage.getItem('student_db_id')) : null;
            // Use enhanced submission status with fallback to existing logic
            const submissionStatus = submissionStatuses[evaluation.id];
            const feedbackSubmission = (evaluation?.feedbacks || []).find(fb => Number(fb.student_id) === studentDbId);
            const isSubmitted = submissionStatus?.has_submitted || !!feedbackSubmission;
            
            // Debug logging for this specific evaluation
            if (process.env.NODE_ENV === 'development') {
              console.log(`Evaluation ${evaluation.id} submission check:`, {
                studentDbId,
                submissionStatus,
                feedbackSubmission,
                isSubmitted,
                feedbacks: evaluation.feedbacks?.map(fb => ({ id: fb.id, student_id: fb.student_id }))
              });
            }
            
            // Use date utility functions for availability determination
            const currentDate = getCurrentDateString();
            const evaluationAvailable = isEvaluationAvailable(evaluation.opened_at, evaluation.closed_at, currentDate);
            const isClosed = evaluation.closed_at && !isEvaluationAvailable(evaluation.opened_at, evaluation.closed_at, currentDate) && 
                            isEvaluationAvailable(evaluation.opened_at, null, currentDate); // Has opened but is now closed
            const isNotYetOpen = !isEvaluationAvailable(evaluation.opened_at, null, currentDate); // Has not opened yet
            
            return (
              <div key={evaluation.id} className="ui-card evaluation-card">
                {/* Status Indicator Bar */}
                <div className={`status-bar ${isSubmitted ? 'completed' : !evaluationAvailable ? 'closed' : 'open'}`}></div>
                
                {/* Card Icon */}
                <div className="card-icon">
                  {isSubmitted ? '✅' : !evaluationAvailable ? (isClosed ? '🔒' : '⏳') : '📝'}
                </div>
                
                {/* Card Number/Code */}
                <div className="card-number">
                  {evaluation.course?.code || 'N/A'}
                </div>
                
                {/* Card Title */}
                <h3 className="card-title">
                  {evaluation.course?.title || 'Course Evaluation'}
                </h3>
                
                {/* Card Description */}
                <div className="card-description">
                  <p><strong>Instructor:</strong> {evaluation.teacher?.name || 'N/A'}</p>
                  <p><strong>Year Level:</strong> {formatYearLevel(studentYearLevel)}</p>
                  <p><strong>Academic Year:</strong> {evaluation.academic_year}</p>
                  <p><strong>Semester:</strong> {evaluation.semester}</p>
                  <p><strong>Opens:</strong> {formatDateForDisplay(evaluation.opened_at)}</p>
                  {evaluation.closed_at && (
                    <p><strong>Closes:</strong> {formatDateForDisplay(evaluation.closed_at)}</p>
                  )}
                </div>
                
                {/* Card Action Button */}
                <div className="card-action">
                  {isSubmitted ? (
                    <button className="ui-btn completed eval-btn" disabled>
                      ✅ Already Submitted
                    </button>
                  ) : !evaluationAvailable ? (
                    <button className="ui-btn disabled eval-btn" disabled>
                      {isClosed ? 'Evaluation Closed' : 'Not Available Yet'}
                    </button>
                  ) : (
                    <button 
                      className="ui-btn primary eval-btn"
                      onClick={() => openEval(evaluation.id)}
                    >
                      Fill Evaluation
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Evaluation Modal */}
      {evalDetail && (
        <div className="evaluation-modal-overlay">
          <div className="evaluation-modal">
            {detailLoading ? (
              <LoadingSpinner 
                size="large" 
                message="Loading evaluation details..." 
                overlay={true}
              />
            ) : (
              <>
                {/* Progress indicator for submission */}
                {submissionState.isSubmitting && (
                  <ProgressIndicator
                    progress={getProgress('evaluation_submission')}
                    title="Submitting Evaluation"
                    variant="steps"
                  />
                )}
                {/* Modal Header */}
                <div className="modal-header">
                  <div className="modal-hero">
                    <div className="university-header">
                      <h2>BULE-HORA UNIVERSITY</h2>
                      <h3 className="brand-subtitle">Teachers' Performance Evaluation Criteria (Student)</h3>
                      <div className="header-meta">
                        <span>Evaluation ID: {evalDetail?.id}</span>
                        <span>Questions: {(evalDetail?.questions || []).length}</span>
                      </div>
                    </div>
                    <button className="modal-close" onClick={() => setEvalDetail(null)}>
                      ✕
                    </button>
                  </div>
                  
                  <div className="evaluation-info">
                    <div className="info-grid info-chips">
                      <div className="info-item">
                        <label>Name of the Instructor</label>
                        <span className="value-chip">{evalDetail.teacher?.name || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Course Title</label>
                        <span className="value-chip">{evalDetail.course?.title || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Department</label>
                        <span className="value-chip">{evalDetail.department?.name || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Year Level</label>
                        <span className="value-chip">{formatYearLevel(studentYearLevel)}</span>
                      </div>
                      <div className="info-item">
                        <label>Academic Year</label>
                        <span className="value-chip">{evalDetail.academic_year || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <label>Semester</label>
                        <span className="value-chip">{evalDetail.semester || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="modal-close" onClick={() => setEvalDetail(null)}>
                    ✕
                  </button>
                </div>

                {/* Instructions */}
                <div className="evaluation-instructions">
                  <h4>GENERAL DIRECTION</h4>
                  <ol>
                    <li>Read each evaluation point carefully</li>
                    <li>Rate the instructor's performance on each criterion</li>
                    <li>Use the scale: 1 (Very Low) to 5 (Very High), or NC (Not Applicable)</li>
                    <li>Your honest feedback helps improve teaching quality</li>
                  </ol>
                </div>

                {/* Progress Bar */}
                <div className="evaluation-progress">
                  <div className="progress-info">
                    <span>Progress: {getCompletionStats().completed} of {getCompletionStats().total} completed</span>
                    <span>{Math.round((getCompletionStats().completed / getCompletionStats().total) * 100) || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(getCompletionStats().completed / getCompletionStats().total) * 100 || 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Evaluation Form */}
                <div className="evaluation-form">
                  {/* Anonymous Option */}
                  <div className="anonymous-option">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => {
                          setAnonymous(e.target.checked);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('anonymous_preference', String(e.target.checked));
                          }
                        }}
                      />
                      <span className="checkmark"></span>
                      Submit anonymously
                    </label>
                  </div>

                  {/* Evaluation Table */}
                  <div className="evaluation-table-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                      <div style={{ fontWeight: 600 }}>Evaluation Criteria</div>
                      <div style={{ fontSize: '0.9em', color: 'var(--muted)' }}>
                        Total Questions: {(evalDetail?.questions || []).filter(q => q.type === 'rating').length}
                      </div>
                    </div>
                    <table className="evaluation-table">
                      <colgroup>
                        <col style={{ width: '50%' }} />
                        <col style={{ width: '8.33%' }} />
                        <col style={{ width: '8.33%' }} />
                        <col style={{ width: '8.33%' }} />
                        <col style={{ width: '8.33%' }} />
                        <col style={{ width: '8.33%' }} />
                        <col style={{ width: '8.33%' }} />
                      </colgroup>
                      <thead>
                        <tr className="table-header">
                          <th rowSpan="2" className="criteria-header">
                            EVALUATION CRITERIA የምዘና መስፈርት
                          </th>
                          <th colSpan="6" className="rating-header">Rating Scale</th>
                        </tr>
                         <tr className="scale-header">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <th key={rating} className="scale-column">
                              <div className="scale-label">
                                <div className="scale-number">{rating}</div>
                                <div className="scale-text">{scaleLabels[rating]}</div>
                              </div>
                            </th>
                          ))}
                          <th className="scale-column">
                            <div className="scale-label">
                              <div className="scale-number">NC</div>
                              <div className="scale-text">{scaleLabels.nc}</div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(evalDetail?.questions || []).filter(q => q.type === 'rating').map((question, questionIndex) => (
                          <tr key={question.id} className="criteria-row">
                            <td className="criteria-cell">
                              <div className="criteria-number">{questionIndex + 1}</div>
                              <div className="criteria-text">{question.text}</div>
                              {errors[question.id] && (
                                <div className="error-message">{errors[question.id]}</div>
                              )}
                            </td>
                            {[1, 2, 3, 4, 5, 'nc'].map((rating) => (
                              <td key={rating} className="rating-cell">
                                <label className="rating-option">
                                  <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={rating}
                                    checked={responses[question.id]?.rating === (rating === 'nc' ? null : Number(rating))}
                                    onChange={() => handleRatingChange(question.id, rating)}
                                  />
                                  <span className="radio-mark">○</span>
                                </label>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Text Questions */}
                  {(() => {
                    const textQuestions = (evalDetail?.questions || []).filter(q => q.type === 'text');
                    if (textQuestions.length === 0) return null;
                    
                    return (
                      <div className="text-questions">
                        <h4>Additional Comments</h4>
                        {textQuestions.map((question) => (
                          <div key={question.id} className="text-question">
                            <label className="question-label">{question.text}</label>
                            <textarea
                              className="question-textarea"
                              rows="3"
                              placeholder="Your comment (optional)"
                              value={responses[question.id]?.text || ''}
                              onChange={(e) => handleTextChange(question.id, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                  <div className="footer-note">
                    <p><strong>Note:</strong> Your feedback is valuable and will be kept confidential. This evaluation helps improve teaching quality and student learning experience.</p>
                  </div>
                  
                  <div className="modal-actions">
                    <button 
                      className="modal-btn secondary" 
                      onClick={() => setEvalDetail(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="modal-btn primary" 
                      onClick={submitEvaluation}
                      disabled={submissionState.isSubmitting}
                    >
                      {submissionState.isSubmitting ? (
                        <>
                          <LoadingSpinner size="small" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Evaluation'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentEvaluations;