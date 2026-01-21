import { useState, useCallback, useRef, useEffect } from 'react';
import { queueRequest, PRIORITY } from '../utils/requestManager';
import { 
  createEnhancedApiCall, 
  retryManager, 
  loadingStateManager, 
  progressTracker,
  networkManager,
  getErrorInfo,
  ERROR_TYPES
} from '../utils/errorHandling';
import api from '../services/api';

/**
 * Enhanced API request hook with comprehensive error handling, retry logic, and recovery mechanisms
 */
export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [networkStatus, setNetworkStatus] = useState(networkManager.getNetworkInfo());
  const abortController = useRef(null);
  const requestId = useRef(null);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribe = networkManager.addListener(setNetworkStatus);
    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const makeRequest = useCallback(async (config) => {
    const {
      url,
      method = 'GET',
      params = {},
      data = null,
      priority = PRIORITY.NORMAL,
      skipCache = false,
      timeout = 30000,
      enableRetry = true,
      maxRetries = 3,
      retryDelay = 1000,
      context = 'api_request',
      showProgress = false,
      progressSteps = null,
      onProgress = null
    } = config;

    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Generate unique request ID
    requestId.current = `${context}_${Date.now()}_${Math.random()}`;
    const reqId = requestId.current;

    setLoading(true);
    setError(null);

    try {
      // Create new abort controller
      abortController.current = new AbortController();

      // Set up progress tracking if enabled
      if (showProgress && progressSteps) {
        progressTracker.updateProgress(reqId, 0, progressSteps.length, progressSteps[0]);
      }

      // Create enhanced API call with retry logic
      const enhancedApiCall = createEnhancedApiCall(async () => {
        const requestConfig = {
          method,
          url,
          signal: abortController.current.signal,
          timeout
        };

        if (method.toLowerCase() === 'get') {
          requestConfig.params = params;
        } else {
          requestConfig.data = data;
        }

        // Use queued request for better performance
        return queueRequest(
          () => api.request(requestConfig),
          {
            url,
            params: method.toLowerCase() === 'get' ? params : data,
            priority,
            skipCache
          }
        );
      }, context);

      // Execute with retry logic if enabled
      let response;
      if (enableRetry) {
        response = await retryManager.executeWithRetry(
          enhancedApiCall,
          context,
          {
            maxRetries,
            baseDelay: retryDelay,
            onRetry: (error, attempt, delay) => {
              setRetryCount(attempt + 1);
              if (onProgress) {
                onProgress({
                  type: 'retry',
                  attempt: attempt + 1,
                  maxRetries,
                  delay,
                  error: getErrorInfo(error)
                });
              }
            }
          }
        );
      } else {
        response = await enhancedApiCall();
      }

      // Update progress on success
      if (showProgress) {
        progressTracker.updateProgress(reqId, progressSteps?.length || 1, progressSteps?.length || 1, 'Complete');
        setTimeout(() => progressTracker.clear(reqId), 1000);
      }

      // Reset retry count on success
      setRetryCount(0);

      return response.data;

    } catch (err) {
      // Don't show error for aborted requests
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return null;
      }

      // Clear progress on error
      if (showProgress) {
        progressTracker.clear(reqId);
      }

      // Enhance error with context
      const errorInfo = getErrorInfo(err);
      const enhancedError = {
        ...err,
        ...errorInfo,
        context,
        requestId: reqId,
        retryCount,
        networkStatus,
        timestamp: new Date().toISOString()
      };

      console.error(`API request failed for ${context}:`, enhancedError);
      setError(enhancedError);
      throw enhancedError;

    } finally {
      setLoading(false);
      abortController.current = null;
      requestId.current = null;
    }
  }, [retryCount, networkStatus]);

  const get = useCallback((url, params = {}, options = {}) => {
    return makeRequest({
      url,
      method: 'GET',
      params,
      context: options.context || `get_${url.replace(/[^a-zA-Z0-9]/g, '_')}`,
      ...options
    });
  }, [makeRequest]);

  const post = useCallback((url, data = {}, options = {}) => {
    return makeRequest({
      url,
      method: 'POST',
      data,
      skipCache: true, // Don't cache POST requests
      context: options.context || `post_${url.replace(/[^a-zA-Z0-9]/g, '_')}`,
      ...options
    });
  }, [makeRequest]);

  const put = useCallback((url, data = {}, options = {}) => {
    return makeRequest({
      url,
      method: 'PUT',
      data,
      skipCache: true, // Don't cache PUT requests
      context: options.context || `put_${url.replace(/[^a-zA-Z0-9]/g, '_')}`,
      ...options
    });
  }, [makeRequest]);

  const del = useCallback((url, options = {}) => {
    return makeRequest({
      url,
      method: 'DELETE',
      skipCache: true, // Don't cache DELETE requests
      context: options.context || `delete_${url.replace(/[^a-zA-Z0-9]/g, '_')}`,
      ...options
    });
  }, [makeRequest]);

  // Enhanced retry function with exponential backoff
  const retryLastRequest = useCallback(async (customOptions = {}) => {
    if (!error || !error.context) {
      throw new Error('No failed request to retry');
    }

    const retryOptions = {
      maxRetries: Math.max(1, 3 - retryCount),
      retryDelay: Math.min(1000 * Math.pow(2, retryCount), 10000),
      ...customOptions
    };

    // Reconstruct the original request
    const originalConfig = {
      url: error.config?.url,
      method: error.config?.method || 'GET',
      params: error.config?.params || {},
      data: error.config?.data,
      context: `${error.context}_retry`,
      enableRetry: true,
      ...retryOptions
    };

    return makeRequest(originalConfig);
  }, [error, retryCount, makeRequest]);

  // Check if current error is retryable
  const canRetry = useCallback(() => {
    if (!error) return false;
    
    // Check network status
    if (!networkStatus.isOnline) return false;
    
    // Check retry count
    if (retryCount >= 3) return false;
    
    // Check error type
    return retryManager.isRetryable(error);
  }, [error, networkStatus.isOnline, retryCount]);

  // Get retry delay for next attempt
  const getRetryDelay = useCallback(() => {
    return retryManager.getRetryDelay(retryCount);
  }, [retryCount]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // Get loading state for specific operation
  const isLoading = useCallback((operationKey) => {
    if (operationKey) {
      return loadingStateManager.isLoading(operationKey);
    }
    return loading;
  }, [loading]);

  // Get progress for specific operation
  const getProgress = useCallback((operationKey) => {
    if (operationKey && requestId.current) {
      return progressTracker.getProgress(requestId.current);
    }
    return null;
  }, []);

  return {
    // Request methods
    get,
    post,
    put,
    delete: del,
    makeRequest,
    
    // State
    loading,
    error,
    retryCount,
    networkStatus,
    
    // Retry functionality
    retryLastRequest,
    canRetry,
    getRetryDelay,
    clearError,
    
    // Progress and loading
    isLoading,
    getProgress,
    
    // Utility
    requestId: requestId.current
  };
}

/**
 * Enhanced hook for dashboard-specific API requests with optimized error handling
 */
export function useDashboardApiRequest() {
  const baseApi = useApiRequest();
  
  const loadDashboardData = useCallback(async (options = {}) => {
    const {
      departmentId,
      dateRange,
      includeAnalytics = true,
      includeRankings = true,
      enableLiveUpdates = false
    } = options;

    try {
      const requests = [];
      
      // Load evaluations
      requests.push(
        baseApi.get('/evaluations', {
          department_id: departmentId,
          date_range: dateRange
        }, {
          context: 'dashboard_evaluations',
          showProgress: true,
          progressSteps: ['Loading evaluations', 'Processing data', 'Applying filters']
        })
      );

      // Load analytics if requested
      if (includeAnalytics) {
        requests.push(
          baseApi.get('/analytics', {
            department_id: departmentId,
            date_range: dateRange
          }, {
            context: 'dashboard_analytics',
            showProgress: true,
            progressSteps: ['Calculating analytics', 'Generating insights', 'Formatting results']
          })
        );
      }

      // Load teacher rankings if requested
      if (includeRankings) {
        requests.push(
          baseApi.get('/teacher-rankings', {
            department_id: departmentId,
            date_range: dateRange
          }, {
            context: 'dashboard_rankings',
            showProgress: true,
            progressSteps: ['Calculating rankings', 'Sorting results', 'Applying filters']
          })
        );
      }

      const results = await Promise.allSettled(requests);
      
      // Process results and handle partial failures
      const dashboardData = {
        evaluations: results[0]?.status === 'fulfilled' ? results[0].value : [],
        analytics: includeAnalytics && results[1]?.status === 'fulfilled' ? results[1].value : null,
        rankings: includeRankings && results[2]?.status === 'fulfilled' ? results[2].value : []
      };

      // Check for partial failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Dashboard data loaded with partial failures:', failures);
        
        // Return partial data with error information
        return {
          ...dashboardData,
          partialFailures: failures.map(failure => ({
            error: failure.reason,
            context: failure.reason?.context || 'unknown'
          }))
        };
      }

      return dashboardData;

    } catch (error) {
      console.error('Dashboard data loading failed:', error);
      throw error;
    }
  }, [baseApi]);

  const refreshDashboard = useCallback(async (options = {}) => {
    const { force = false } = options;
    
    return loadDashboardData({
      ...options,
      skipCache: force
    });
  }, [loadDashboardData]);

  return {
    ...baseApi,
    loadDashboardData,
    refreshDashboard
  };
}

export default useApiRequest;