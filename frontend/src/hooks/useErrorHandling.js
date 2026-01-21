import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getErrorInfo, 
  retryManager, 
  loadingStateManager, 
  progressTracker,
  createEnhancedApiCall 
} from '../utils/errorHandling';

/**
 * Enhanced error handling hook
 */
export function useErrorHandling() {
  const [errors, setErrors] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [progressStates, setProgressStates] = useState({});
  // Track recently-added errors to prevent duplicate banners
  const recentErrorsRef = useRef({});

  // Subscribe to loading state changes
  useEffect(() => {
    const unsubscribe = loadingStateManager.addListener(setLoadingStates);
    return unsubscribe;
  }, []);

  // Subscribe to progress changes
  useEffect(() => {
    const unsubscribe = progressTracker.addListener(setProgressStates);
    return unsubscribe;
  }, []);

  const addError = useCallback((error, context = '') => {
    const errorInfo = getErrorInfo(error);
    const now = Date.now();
    const key = `${errorInfo.type || 'unknown'}:${context || ''}:${errorInfo.message || ''}`;

    // De-duplicate identical errors within a short window (e.g., 20s)
    const last = recentErrorsRef.current[key];
    if (last && now - last.time < 20000) {
      // If a duplicate exists, do not add another banner
      return last.id;
    }

    const errorId = `${now}_${Math.random()}`;
    recentErrorsRef.current[key] = { id: errorId, time: now };

    setErrors(prev => [...prev, {
      id: errorId,
      ...errorInfo,
      context,
      timestamp: new Date(),
      error: error
    }]);

    return errorId;
  }, []);

  const removeError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleApiCall = useCallback(async (apiFunction, context = '', options = {}) => {
    const { 
      showProgress = false, 
      progressSteps = null,
      onProgress = null 
    } = options;

    try {
      if (showProgress && progressSteps) {
        progressTracker.updateProgress(context, 0, progressSteps.length, progressSteps[0]);
      }

      const enhancedApiCall = createEnhancedApiCall(apiFunction, context);
      const result = await enhancedApiCall();

      if (showProgress) {
        progressTracker.clear(context);
      }

      return result;
    } catch (error) {
      // Suppress canceled/aborted requests in global error list
      const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
      const isCanceled = error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError' || msg.includes('aborted') || msg.includes('canceled') || msg.includes('cancelled');
      const errorId = isCanceled ? null : addError(error, context);
      
      if (showProgress) {
        progressTracker.clear(context);
      }
      
      throw { ...error, errorId };
    }
  }, [addError]);

  const retryOperation = useCallback(async (operation, context = '') => {
    try {
      return await retryManager.executeWithRetry(operation, context);
    } catch (error) {
      addError(error, context);
      throw error;
    }
  }, [addError]);

  const isLoading = useCallback((key) => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const getLoadingMessage = useCallback((key) => {
    const state = loadingStates[key];
    return state ? state.message : '';
  }, [loadingStates]);

  const getProgress = useCallback((key) => {
    return progressStates[key] || null;
  }, [progressStates]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    handleApiCall,
    retryOperation,
    isLoading,
    getLoadingMessage,
    getProgress,
    loadingStates,
    progressStates
  };
}

/**
 * Enhanced hook for handling submission-specific errors with comprehensive validation
 */
export function useSubmissionErrorHandling() {
  const { addError, removeError, handleApiCall } = useErrorHandling();
  const [submissionState, setSubmissionState] = useState({
    isSubmitting: false,
    hasSubmitted: false,
    submissionError: null,
    validationErrors: {},
    retryCount: 0,
    lastAttempt: null
  });

  const validateSubmission = useCallback((submissionData) => {
    const errors = {};
    
    // Check for required responses
    if (!submissionData.responses || Object.keys(submissionData.responses).length === 0) {
      errors.responses = 'Please provide responses to all evaluation questions';
    }
    
    // Check for incomplete responses
    const incompleteQuestions = [];
    Object.entries(submissionData.responses || {}).forEach(([questionId, response]) => {
      if (!response || response === '' || response === null) {
        incompleteQuestions.push(questionId);
      }
    });
    
    if (incompleteQuestions.length > 0) {
      errors.incomplete = `Please complete responses for ${incompleteQuestions.length} question(s)`;
    }
    
    // Check evaluation ID
    if (!submissionData.evaluation_id) {
      errors.evaluation = 'Evaluation ID is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const handleSubmission = useCallback(async (submissionFunction, submissionData, context = 'submission') => {
    // Pre-submission validation
    const validation = validateSubmission(submissionData);
    if (!validation.isValid) {
      setSubmissionState(prev => ({
        ...prev,
        submissionError: {
          type: 'validation',
          title: '📝 Validation Error',
          message: 'Please complete all required fields before submitting',
          details: validation.errors
        },
        validationErrors: validation.errors
      }));
      return Promise.reject(new Error('Validation failed'));
    }

    setSubmissionState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      submissionError: null,
      validationErrors: {},
      lastAttempt: new Date()
    }));

    try {
      const result = await handleApiCall(submissionFunction, context, {
        showProgress: true,
        progressSteps: [
          'Validating submission data',
          'Checking for duplicate submissions', 
          'Processing evaluation responses',
          'Saving submission record',
          'Updating submission status'
        ]
      });

      setSubmissionState({
        isSubmitting: false,
        hasSubmitted: true,
        submissionError: null,
        validationErrors: {},
        retryCount: 0,
        lastAttempt: new Date()
      });

      return result;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      
      setSubmissionState(prev => ({
        isSubmitting: false,
        hasSubmitted: false,
        submissionError: errorInfo,
        validationErrors: error.response?.data?.errors || {},
        retryCount: prev.retryCount + 1,
        lastAttempt: new Date()
      }));

      throw error;
    }
  }, [handleApiCall, validateSubmission]);

  const retrySubmission = useCallback(async (submissionFunction, submissionData) => {
    if (submissionState.retryCount >= 3) {
      const error = new Error('Maximum retry attempts exceeded. Please refresh the page and try again.');
      addError(error, 'submission_retry');
      return Promise.reject(error);
    }

    return handleSubmission(submissionFunction, submissionData, 'submission_retry');
  }, [submissionState.retryCount, handleSubmission, addError]);

  const resetSubmissionState = useCallback(() => {
    setSubmissionState({
      isSubmitting: false,
      hasSubmitted: false,
      submissionError: null,
      validationErrors: {},
      retryCount: 0,
      lastAttempt: null
    });
  }, []);

  const canRetrySubmission = useCallback(() => {
    return submissionState.retryCount < 3 && 
           submissionState.submissionError?.type !== 'duplicate_submission' &&
           submissionState.submissionError?.type !== 'access_denied';
  }, [submissionState]);

  return {
    submissionState,
    handleSubmission,
    retrySubmission,
    resetSubmissionState,
    canRetrySubmission,
    validateSubmission
  };
}

/**
 * Enhanced hook for handling report generation errors with comprehensive progress tracking
 */
export function useReportErrorHandling() {
  const { addError, handleApiCall, getProgress } = useErrorHandling();
  const [reportState, setReportState] = useState({
    isGenerating: false,
    generationError: null,
    lastGenerated: null,
    currentFormat: null,
    progress: null,
    estimatedTime: null,
    canCancel: false,
    cancelFunction: null
  });

  const estimateGenerationTime = useCallback((format, dataSize) => {
    // Estimate based on format and data size
    const baseTime = {
      csv: 5,    // 5 seconds base
      pdf: 15,   // 15 seconds base  
      excel: 10  // 10 seconds base
    };
    
    const sizeMultiplier = Math.max(1, Math.floor(dataSize / 1000));
    return (baseTime[format] || 10) * sizeMultiplier;
  }, []);

  const handleReportGeneration = useCallback(async (reportFunction, format, dataSize = 1000, context = 'report_generation') => {
    const estimatedTime = estimateGenerationTime(format, dataSize);
    
    setReportState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      generationError: null,
      currentFormat: format,
      estimatedTime,
      canCancel: estimatedTime > 30 // Allow cancel for operations > 30 seconds
    }));

    // Create cancellation mechanism for long operations
    let cancelFunction = null;
    if (estimatedTime > 30) {
      const controller = new AbortController();
      cancelFunction = () => {
        controller.abort();
        setReportState(prev => ({ 
          ...prev, 
          isGenerating: false,
          generationError: {
            type: 'cancelled',
            title: '⏹️ Operation Cancelled',
            message: 'Report generation was cancelled by user',
            canRetry: true
          }
        }));
      };
      
      setReportState(prev => ({ ...prev, cancelFunction }));
    }

    try {
      const progressSteps = [
        'Collecting evaluation data',
        'Processing analytics and statistics',
        `Generating ${format.toUpperCase()} report`,
        'Applying formatting and styling',
        'Finalizing export file'
      ];

      const result = await handleApiCall(
        () => reportFunction({ signal: cancelFunction ? cancelFunction.signal : undefined }), 
        context, 
        {
          showProgress: true,
          progressSteps,
          estimatedTime
        }
      );

      setReportState({
        isGenerating: false,
        generationError: null,
        lastGenerated: new Date(),
        currentFormat: null,
        progress: null,
        estimatedTime: null,
        canCancel: false,
        cancelFunction: null
      });

      return result;
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      
      // Enhanced error handling for report generation
      if (error.name === 'AbortError') {
        errorInfo.type = 'cancelled';
        errorInfo.title = '⏹️ Operation Cancelled';
        errorInfo.message = 'Report generation was cancelled';
      } else if (errorInfo.type === 'timeout') {
        errorInfo.message = `${format.toUpperCase()} report generation timed out. Try reducing the dataset size or use a simpler format like CSV.`;
      } else if (errorInfo.type === 'export_failed') {
        errorInfo.message = `Failed to generate ${format.toUpperCase()} report. This may be due to large dataset size. Try applying filters or using CSV format.`;
      }
      
      setReportState({
        isGenerating: false,
        generationError: errorInfo,
        lastGenerated: null,
        currentFormat: null,
        progress: null,
        estimatedTime: null,
        canCancel: false,
        cancelFunction: null
      });

      throw error;
    }
  }, [handleApiCall, estimateGenerationTime]);

  const cancelReportGeneration = useCallback(() => {
    if (reportState.cancelFunction) {
      reportState.cancelFunction();
    }
  }, [reportState.cancelFunction]);

  const retryReportGeneration = useCallback(async (reportFunction, format, dataSize, options = {}) => {
    // Suggest format downgrade for retries
    let retryFormat = format;
    if (options.suggestFormatDowngrade && format !== 'csv') {
      retryFormat = 'csv'; // CSV is usually faster and more reliable
      console.log(`Retrying with ${retryFormat} format for better reliability`);
    }
    
    return handleReportGeneration(reportFunction, retryFormat, dataSize, 'report_retry');
  }, [handleReportGeneration]);

  const resetReportState = useCallback(() => {
    // Cancel any ongoing operation first
    if (reportState.cancelFunction) {
      reportState.cancelFunction();
    }
    
    setReportState({
      isGenerating: false,
      generationError: null,
      lastGenerated: null,
      currentFormat: null,
      progress: null,
      estimatedTime: null,
      canCancel: false,
      cancelFunction: null
    });
  }, [reportState.cancelFunction]);

  const getReportProgress = useCallback(() => {
    return getProgress('report_generation') || reportState.progress;
  }, [getProgress, reportState.progress]);

  return {
    reportState,
    handleReportGeneration,
    retryReportGeneration,
    cancelReportGeneration,
    resetReportState,
    getReportProgress
  };
}