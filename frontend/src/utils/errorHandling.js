/**
 * Enhanced Error Handling Utilities
 * Provides comprehensive error handling for evaluation submission control system
 * Updated: 2025-01-19 - Added rate limiting support
 */

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation', 
  DUPLICATE_SUBMISSION: 'duplicate_submission',
  ACCESS_DENIED: 'access_denied',
  TIMEOUT: 'timeout',
  SERVER_ERROR: 'server_error',
  RATE_LIMITED: 'rate_limited',
  INSUFFICIENT_DATA: 'insufficient_data',
  EXPORT_FAILED: 'export_failed'
};

// Detect canceled/aborted requests (Axios or Fetch)
function isCanceledError(error) {
  if (!error) return false;
  const msg = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  return (
    error.code === 'ERR_CANCELED' ||
    error.name === 'CanceledError' ||
    error.name === 'AbortError' ||
    msg.includes('canceled') ||
    msg.includes('cancelled') ||
    msg.includes('aborted')
  );
}

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: {
    title: '🌐 Network Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'Retry'
  },
  [ERROR_TYPES.VALIDATION]: {
    title: '📝 Validation Error',
    message: 'Please check your input and ensure all required fields are completed correctly.',
    action: 'Review Input'
  },
  [ERROR_TYPES.DUPLICATE_SUBMISSION]: {
    title: '⚠️ Duplicate Submission Prevented',
    message: 'You have already submitted this evaluation. Each student can only submit one evaluation per course-teacher combination.',
    action: 'View Submitted Evaluations'
  },
  [ERROR_TYPES.ACCESS_DENIED]: {
    title: '🔒 Access Denied',
    message: 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.',
    action: 'Contact Support'
  },
  [ERROR_TYPES.TIMEOUT]: {
    title: '⏱️ Request Timeout',
    message: 'The operation is taking longer than expected. This may be due to high server load or a large dataset.',
    action: 'Try Again'
  },
  [ERROR_TYPES.SERVER_ERROR]: {
    title: '🔧 Server Error',
    message: 'An unexpected error occurred on the server. Our team has been notified and is working to resolve the issue.',
    action: 'Try Again Later'
  },
  [ERROR_TYPES.INSUFFICIENT_DATA]: {
    title: '📊 Insufficient Data',
    message: 'There is not enough data available to generate the requested report or analysis.',
    action: 'Try Different Filters'
  },
  [ERROR_TYPES.EXPORT_FAILED]: {
    title: '📄 Export Failed',
    message: 'Unable to generate the requested export. This may be due to large dataset size or server limitations.',
    action: 'Try Smaller Dataset'
  },
  [ERROR_TYPES.RATE_LIMITED]: {
    title: '⏱️ Too Many Requests',
    message: 'You are making requests too quickly. Please wait a moment before trying again.',
    action: 'Wait and Retry'
  }
};

/**
 * Categorizes an error based on response status and content
 */
export function categorizeError(error) {
  // Handle null or undefined errors
  if (!error) {
    return ERROR_TYPES.SERVER_ERROR;
  }

  // Network errors (no response received)
  if (!error.response) {
    // Check for specific network error types
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return ERROR_TYPES.NETWORK;
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT;
    }
    // Default to network error for no response
    return ERROR_TYPES.NETWORK;
  }

  const { status, data } = error.response;
  
  // Debug logging for rate limiting
  if (status === 429) {
    console.log('🚫 Rate limiting detected - 429 status code');
  }

  // Check for specific error codes in response data
  if (data?.error === 'duplicate_submission') {
    return ERROR_TYPES.DUPLICATE_SUBMISSION;
  }

  if (data?.error === 'insufficient_data') {
    return ERROR_TYPES.INSUFFICIENT_DATA;
  }

  if (data?.error === 'export_failed' || data?.error === 'export_generation_failed' || data?.error === 'export_too_large') {
    return ERROR_TYPES.EXPORT_FAILED;
  }

  // Categorize by HTTP status code
  switch (status) {
    case 401:
    case 403:
      return ERROR_TYPES.ACCESS_DENIED;
    case 422:
      return ERROR_TYPES.VALIDATION;
    case 408:
    case 504:
      return ERROR_TYPES.TIMEOUT;
    case 429:
      console.log('🚫 Categorizing as RATE_LIMITED');
      return ERROR_TYPES.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
      return ERROR_TYPES.SERVER_ERROR;
    default:
      return ERROR_TYPES.SERVER_ERROR;
  }
}

/**
 * Gets user-friendly error information
 */
export function getErrorInfo(error) {
  // Handle null or undefined errors
  if (!error) {
    return {
      type: ERROR_TYPES.SERVER_ERROR,
      title: ERROR_MESSAGES[ERROR_TYPES.SERVER_ERROR].title,
      message: 'An unknown error occurred',
      action: ERROR_MESSAGES[ERROR_TYPES.SERVER_ERROR].action,
      details: null,
      canRetry: false
    };
  }

  const errorType = categorizeError(error);
  const errorInfo = ERROR_MESSAGES[errorType];
  
  // Extract specific message from server if available
  let specificMessage = errorInfo.message;
  if (error.response?.data?.message) {
    specificMessage = error.response.data.message;
  }

  return {
    type: errorType,
    title: errorInfo.title,
    message: specificMessage,
    action: errorInfo.action,
    details: error.response?.data?.errors || null,
    canRetry: [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT, ERROR_TYPES.SERVER_ERROR].includes(errorType)
  };
}

/**
 * Retry mechanism with exponential backoff and enhanced error handling
 */
export class RetryManager {
  constructor(maxRetries = 3, baseDelay = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  // Enhanced retry mechanism with comprehensive error handling
  async executeWithRetry(operation, context = '', options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitterFactor = 0.1,
      retryCondition = null,
      onRetry = null,
      timeout = null
    } = options;

    let lastError;
    let retryCount = 0;
    const startTime = Date.now();
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Apply timeout if specified
        let operationPromise = operation();
        
        if (timeout) {
          operationPromise = Promise.race([
            operationPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
            )
          ]);
        }

        const result = await operationPromise;
        
        // Success - log recovery if this wasn't the first attempt
        if (attempt > 0) {
          console.log(`RetryManager: Operation succeeded after ${attempt} retries in ${context}`);
          
          // Notify about successful recovery
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('operationRecovered', {
              detail: { 
                context, 
                attempts: attempt, 
                totalTime: Date.now() - startTime,
                finalSuccess: true
              }
            }));
          }
        }
        
        return result;
      } catch (error) {
        // Gracefully handle canceled/aborted requests without retrying
        if (isCanceledError(error)) {
          console.debug(`RetryManager: Request canceled for ${context}; skipping retries.`);
          throw this.enhanceError(error, {
            context,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            retryable: false,
            reason: 'Request canceled'
          });
        }
        lastError = error;
        retryCount = attempt + 1;
        const errorType = categorizeError(error);

        console.error(`RetryManager: Attempt ${attempt + 1}/${maxRetries + 1} failed for ${context}:`, error);
        
        // Check if error is retryable
        const isRetryable = retryCondition ? 
          retryCondition(error, attempt) : 
          this.isRetryable(error);
        
        if (!isRetryable) {
          console.log(`RetryManager: Non-retryable error for ${context}: ${errorType}`);
          throw this.enhanceError(error, {
            context,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            retryable: false,
            reason: 'Error type not retryable'
          });
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          console.log(`RetryManager: Max retries (${maxRetries}) reached for ${context}`);
          throw this.enhanceError(error, {
            context,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            retryable: false,
            reason: 'Maximum retry attempts exceeded'
          });
        }
        
        // Calculate delay with exponential backoff and jitter
        const baseDelayForAttempt = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
        const jitter = (Math.random() - 0.5) * 2 * jitterFactor * baseDelayForAttempt;
        const delay = Math.max(0, baseDelayForAttempt + jitter);
        
        console.log(`RetryManager: Retry attempt ${retryCount}/${maxRetries} for ${context} in ${Math.round(delay)}ms (error: ${errorType})`);
        
        // Call retry callback if provided
        if (onRetry) {
          try {
            await onRetry(error, attempt, delay);
          } catch (callbackError) {
            console.warn('RetryManager: Retry callback failed:', callbackError);
          }
        }
        
        // Notify about retry attempt
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('retryAttempt', {
            detail: { 
              context, 
              attempt: retryCount, 
              maxRetries: maxRetries, 
              delay, 
              errorType,
              error: error.message,
              nextAttemptIn: delay
            }
          }));
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but just in case
    throw this.enhanceError(lastError, {
      context,
      attempts: retryCount,
      totalTime: Date.now() - startTime,
      retryable: false,
      reason: 'Unexpected end of retry loop'
    });
  }

  // Enhance error with retry information
  enhanceError(originalError, retryInfo) {
    const enhancedError = new Error(originalError.message);
    enhancedError.name = originalError.name;
    enhancedError.stack = originalError.stack;
    enhancedError.originalError = originalError;
    enhancedError.retryInfo = retryInfo;
    
    // Add user-friendly information
    const errorInfo = getErrorInfo(originalError);
    enhancedError.userFriendly = {
      title: errorInfo.title,
      message: this.getRetryFailureMessage(retryInfo),
      suggestions: this.getRetryFailureSuggestions(originalError, retryInfo)
    };
    
    return enhancedError;
  }

  // Get user-friendly message for retry failures
  getRetryFailureMessage(retryInfo) {
    const { context, attempts, reason } = retryInfo;
    
    if (reason === 'Error type not retryable') {
      if (context.includes('submission')) {
        return 'Unable to submit evaluation due to a validation error. Please check your responses and try again.';
      } else if (context.includes('connection')) {
        return 'Connection failed due to authentication issues. Please refresh the page and log in again.';
      } else {
        return 'This operation cannot be retried automatically. Please try again manually.';
      }
    } else if (reason === 'Maximum retry attempts exceeded') {
      if (context.includes('submission')) {
        return `Failed to submit evaluation after ${attempts} attempts. Your responses are saved locally.`;
      } else if (context.includes('connection')) {
        return `Unable to establish connection after ${attempts} attempts. Please check your internet connection.`;
      } else {
        return `Operation failed after ${attempts} attempts. Please try again later.`;
      }
    }
    
    return 'Operation failed. Please try again.';
  }

  // Get suggestions for retry failures
  getRetryFailureSuggestions(error, retryInfo) {
    const suggestions = [];
    const errorType = categorizeError(error);
    const { context, attempts } = retryInfo;
    
    if (errorType === ERROR_TYPES.NETWORK) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try switching to a different network');
      if (context.includes('submission')) {
        suggestions.push('Your responses are saved and can be submitted later');
      }
    } else if (errorType === ERROR_TYPES.VALIDATION) {
      suggestions.push('Review your input for any errors');
      suggestions.push('Ensure all required fields are completed');
    } else if (errorType === ERROR_TYPES.ACCESS_DENIED) {
      suggestions.push('You may need to log in again');
      suggestions.push('Contact support if you believe you should have access');
    } else if (errorType === ERROR_TYPES.SERVER_ERROR) {
      suggestions.push('This appears to be a temporary server issue');
      suggestions.push('Try again in a few minutes');
      if (attempts > 2) {
        suggestions.push('Contact support if the problem persists');
      }
    }
    
    // Always add refresh suggestion for persistent failures
    if (attempts > 2) {
      suggestions.push('Try refreshing the page');
    }
    
    return suggestions;
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error) {
    // Handle null or undefined errors
    if (!error) {
      return false;
    }

    const errorType = categorizeError(error);
    console.log(`🔍 Checking if error is retryable: ${errorType}`);
    
    // Don't retry rate limited errors - they need special handling
    if (errorType === ERROR_TYPES.RATE_LIMITED) {
      console.log('🚫 Rate limited error - NOT retryable');
      return false;
    }
    
    const retryableTypes = [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT, ERROR_TYPES.SERVER_ERROR];
    const isRetryable = retryableTypes.includes(errorType);
    console.log(`🔍 Error type ${errorType} is ${isRetryable ? 'retryable' : 'not retryable'}`);
    
    return isRetryable;
  }

  /**
   * Get retry delay for a specific attempt
   */
  getRetryDelay(attempt) {
    const jitter = Math.random() * 0.1 * this.baseDelay;
    return (this.baseDelay * Math.pow(2, attempt)) + jitter;
  }
}

/**
 * Loading state manager for operations
 */
export class LoadingStateManager {
  constructor() {
    this.loadingStates = new Map();
    this.listeners = new Set();
  }

  setLoading(key, isLoading, message = '') {
    this.loadingStates.set(key, { isLoading, message, timestamp: Date.now() });
    this.notifyListeners();
  }

  isLoading(key) {
    const state = this.loadingStates.get(key);
    return state ? state.isLoading : false;
  }

  getLoadingMessage(key) {
    const state = this.loadingStates.get(key);
    return state ? state.message : '';
  }

  getAllLoadingStates() {
    return Object.fromEntries(this.loadingStates);
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getAllLoadingStates()));
  }

  clear() {
    this.loadingStates.clear();
    this.notifyListeners();
  }
}

/**
 * Progress tracker for long-running operations
 */
export class ProgressTracker {
  constructor() {
    this.progress = new Map();
    this.listeners = new Set();
  }

  updateProgress(key, current, total, message = '') {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    this.progress.set(key, {
      current,
      total,
      percentage,
      message,
      timestamp: Date.now()
    });
    this.notifyListeners();
  }

  getProgress(key) {
    return this.progress.get(key) || { current: 0, total: 0, percentage: 0, message: '' };
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(Object.fromEntries(this.progress)));
  }

  clear(key) {
    if (key) {
      this.progress.delete(key);
    } else {
      this.progress.clear();
    }
    this.notifyListeners();
  }
}

// Global instances
export const retryManager = new RetryManager();
export const loadingStateManager = new LoadingStateManager();
export const progressTracker = new ProgressTracker();

/**
 * Enhanced API wrapper with error handling, retry logic, offline support, and submission-specific handling
 */
export function createEnhancedApiCall(apiFunction, context = '') {
  return async (...args) => {
    const operationKey = `${context}_${Date.now()}`;
    
    try {
      loadingStateManager.setLoading(operationKey, true, `Loading ${context}...`);
      
      // Check network status before making request
      if (!networkManager.isOnline) {
        // Add to offline queue for non-critical operations
        if (context.includes('load') || context.includes('get')) {
          const queueId = offlineQueueManager.addToQueue(() => apiFunction(...args));
          throw new Error(`Request queued for when connection is restored (Queue ID: ${queueId})`);
        } else {
          throw new Error('No internet connection. Please check your network and try again.');
        }
      }
      
      // Check connection quality and adjust timeout
      const networkInfo = networkManager.getNetworkInfo();
      const timeoutMultiplier = networkInfo.connectionQuality === 'poor' ? 2 : 1;
      
      // Set context-specific timeouts
      let timeoutDuration = 30000; // Default 30 seconds
      if (context.includes('submission')) {
        timeoutDuration = 60000; // 60 seconds for submissions
      } else if (context.includes('report') || context.includes('export')) {
        timeoutDuration = 120000; // 2 minutes for reports
      } else if (context.includes('large_dataset')) {
        timeoutDuration = 180000; // 3 minutes for large datasets
      }
      
      const result = await retryManager.executeWithRetry(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutDuration * timeoutMultiplier);
          
          try {
            // Add abort signal to request if supported
            const response = await apiFunction(...args, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle abort errors
            if (error.name === 'AbortError') {
              const timeoutError = new Error(`Request timed out after ${Math.round(timeoutDuration * timeoutMultiplier / 1000)} seconds`);
              timeoutError.code = 'TIMEOUT';
              throw timeoutError;
            }
            
            throw error;
          }
        },
        context
      );
      
      return result;
    } catch (error) {
      // Skip logging for canceled/aborted requests
      if (isCanceledError(error)) {
        throw error;
      }
      const errorInfo = getErrorInfo(error);
      console.error(`Enhanced API call failed for ${context}:`, errorInfo);
      
      // Add context-specific error details
      if (context.includes('submission')) {
        if (errorInfo.type === ERROR_TYPES.DUPLICATE_SUBMISSION) {
          error.message = 'This evaluation has already been submitted. You can only submit once per evaluation.';
        } else if (errorInfo.type === ERROR_TYPES.VALIDATION) {
          error.message = 'Please review your responses and ensure all required fields are completed.';
        }
      } else if (context.includes('report') || context.includes('export')) {
        if (errorInfo.type === ERROR_TYPES.TIMEOUT) {
          error.message = 'Report generation timed out. Try applying filters to reduce the dataset size.';
        } else if (errorInfo.type === ERROR_TYPES.EXPORT_FAILED) {
          error.message = 'Export failed. This may be due to large dataset size. Try a different format or apply filters.';
        }
      }
      
      // Add network-specific error details
      if (errorInfo.type === ERROR_TYPES.NETWORK) {
        const networkInfo = networkManager.getNetworkInfo();
        error.networkInfo = networkInfo;
        
        if (!networkInfo.isOnline) {
          error.message = 'No internet connection available. Please check your network settings.';
        } else if (networkInfo.connectionQuality === 'poor') {
          error.message = 'Poor network connection detected. The request may have failed due to connectivity issues.';
        }
      }
      
      throw error;
    } finally {
      loadingStateManager.setLoading(operationKey, false);
    }
  };
}

/**
 * Enhanced graceful degradation handler for large datasets with submission-specific handling
 */
export class GracefulDegradationManager {
  constructor() {
    this.thresholds = {
      evaluations: 50,        // Reduced from 100 for better performance
      responses: 500,         // Reduced from 1000
      teachers: 25,           // Reduced from 50
      exportSize: 5000,       // Reduced from 10000
      submissions: 200,       // New threshold for submissions
      reportData: 1000        // New threshold for report data
    };
    
    this.strategies = {
      evaluations: {
        pagination: { pageSize: 15 },
        lazy_loading: { batchSize: 10 },
        filtering: { defaultFilters: ['active', 'current_semester'] }
      },
      responses: {
        sampling: { sampleSize: 300, method: 'stratified' },
        aggregation: { groupBy: 'question_category' }
      },
      teachers: {
        lazy_loading: { batchSize: 8 },
        search_based: { minSearchLength: 2 }
      },
      exportSize: {
        chunked_export: { chunkSize: 500 },
        format_optimization: { preferredFormats: ['csv', 'json'] }
      },
      submissions: {
        batch_processing: { batchSize: 50 },
        progress_tracking: { updateInterval: 100 }
      },
      reportData: {
        progressive_loading: { sections: ['overview', 'details', 'analytics'] },
        caching: { ttl: 300 } // 5 minutes
      }
    };
  }

  shouldDegrade(dataType, count) {
    return count > (this.thresholds[dataType] || 100);
  }

  getDegradationStrategy(dataType, count, context = '') {
    if (!this.shouldDegrade(dataType, count)) {
      return { strategy: 'full', message: null };
    }

    const baseStrategy = this.strategies[dataType];
    if (!baseStrategy) {
      return {
        strategy: 'limit',
        message: `Large dataset detected (${count} items). Showing first 100 items for performance.`,
        limit: 100
      };
    }

    // Context-specific strategy selection
    if (context.includes('submission')) {
      return {
        strategy: 'batch_processing',
        message: `Processing ${count} submissions in batches for optimal performance.`,
        batchSize: baseStrategy.batch_processing?.batchSize || 50,
        showProgress: true
      };
    }

    if (context.includes('export') || context.includes('report')) {
      return {
        strategy: 'chunked_export',
        message: `Large export detected (${count} records). Export will be processed in chunks to prevent timeouts.`,
        chunkSize: baseStrategy.chunked_export?.chunkSize || 500,
        showProgress: true,
        estimatedTime: Math.ceil(count / 500) * 10 // Estimate 10 seconds per chunk
      };
    }

    if (context.includes('load') || context.includes('display')) {
      if (dataType === 'evaluations') {
        return {
          strategy: 'pagination',
          message: `Large dataset detected (${count} evaluations). Results will be paginated for better performance.`,
          pageSize: baseStrategy.pagination?.pageSize || 15,
          showPagination: true
        };
      }

      if (dataType === 'responses') {
        return {
          strategy: 'sampling',
          message: `Large dataset detected (${count} responses). Showing representative sample for performance.`,
          sampleSize: baseStrategy.sampling?.sampleSize || 300,
          method: baseStrategy.sampling?.method || 'random',
          showSampleInfo: true
        };
      }

      if (dataType === 'teachers') {
        return {
          strategy: 'lazy_loading',
          message: `Large dataset detected (${count} teachers). Data will be loaded as needed.`,
          batchSize: baseStrategy.lazy_loading?.batchSize || 8,
          enableSearch: true
        };
      }
    }

    // Default strategy
    return {
      strategy: 'limit',
      message: `Large dataset detected (${count} items). Performance optimizations applied.`,
      limit: Math.min(count, 100),
      showOptimizationInfo: true
    };
  }

  /**
   * Apply degradation strategy to data
   */
  applyStrategy(data, strategy, options = {}) {
    switch (strategy.strategy) {
      case 'pagination':
        const page = options.page || 1;
        const pageSize = strategy.pageSize || 15;
        const start = (page - 1) * pageSize;
        return {
          data: data.slice(start, start + pageSize),
          pagination: {
            current: page,
            total: Math.ceil(data.length / pageSize),
            pageSize,
            totalItems: data.length
          }
        };

      case 'sampling':
        const sampleSize = Math.min(strategy.sampleSize || 300, data.length);
        let sampledData;
        
        if (strategy.method === 'stratified' && options.stratifyBy) {
          // Stratified sampling
          const groups = data.reduce((acc, item) => {
            const key = item[options.stratifyBy];
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {});
          
          const groupKeys = Object.keys(groups);
          const itemsPerGroup = Math.floor(sampleSize / groupKeys.length);
          
          sampledData = groupKeys.flatMap(key => 
            groups[key].slice(0, itemsPerGroup)
          );
        } else {
          // Random sampling
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          sampledData = shuffled.slice(0, sampleSize);
        }
        
        return {
          data: sampledData,
          sampling: {
            originalSize: data.length,
            sampleSize: sampledData.length,
            method: strategy.method || 'random'
          }
        };

      case 'chunked_export':
        const chunkSize = strategy.chunkSize || 500;
        const chunks = [];
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize));
        }
        return {
          chunks,
          chunkInfo: {
            totalChunks: chunks.length,
            chunkSize,
            totalItems: data.length
          }
        };

      case 'limit':
        const limit = strategy.limit || 100;
        return {
          data: data.slice(0, limit),
          limitation: {
            shown: Math.min(limit, data.length),
            total: data.length,
            hasMore: data.length > limit
          }
        };

      default:
        return { data };
    }
  }

  /**
   * Get performance recommendations based on dataset size
   */
  getPerformanceRecommendations(dataType, count) {
    const recommendations = [];

    if (this.shouldDegrade(dataType, count)) {
      recommendations.push({
        type: 'warning',
        message: `Large ${dataType} dataset detected (${count} items)`,
        suggestions: []
      });

      if (dataType === 'evaluations') {
        recommendations[0].suggestions.push(
          'Apply date range filters to reduce dataset size',
          'Filter by specific departments or courses',
          'Use search functionality to find specific evaluations'
        );
      }

      if (dataType === 'responses') {
        recommendations[0].suggestions.push(
          'Filter by evaluation period',
          'Focus on specific question categories',
          'Use summary statistics instead of individual responses'
        );
      }

      if (dataType === 'exportSize') {
        recommendations[0].suggestions.push(
          'Export data in smaller date ranges',
          'Choose CSV format for better performance',
          'Consider exporting by department or course'
        );
      }
    }

    return recommendations;
  }
}

export const gracefulDegradationManager = new GracefulDegradationManager();

/**
 * Network connectivity manager for handling offline scenarios
 */
export class NetworkManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.connectionQuality = 'unknown';
    this.lastConnectivityCheck = null;
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    
    // Periodic connectivity check
    this.startConnectivityMonitoring();
  }

  handleOnlineStatusChange(isOnline) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    
    if (wasOnline !== isOnline) {
      console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
      this.notifyListeners({ isOnline, wasOnline });
      
      if (isOnline) {
        this.checkConnectionQuality();
      }
    }
  }

  async checkConnectionQuality() {
    try {
      const startTime = Date.now();
      const token = localStorage.getItem('auth_token') || '';

      // Prefer backend health endpoint for accurate connectivity checks
      let responseTime = 0;
      let ok = false;

      try {
        const res = await api.get('health-check', {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            Accept: 'application/json'
          },
          timeout: 5000
        });
        if (res) {
          ok = true;
          responseTime = Date.now() - startTime;
        }
      } catch (apiError) {
        // Fallback to a lightweight HEAD request that won't be blocked by auth
        try {
          const res = await fetch('/favicon.ico', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000)
          });
          ok = res.ok;
          responseTime = Date.now() - startTime;
        } catch (faviconError) {
          // Handle aborts gracefully (e.g., navigation, HMR refresh)
          this.connectionQuality = 'unknown';
          this.lastConnectivityCheck = Date.now();
          this.notifyListeners({ connectionQuality: this.connectionQuality });
          console.debug('Connectivity check aborted (non-fatal):', faviconError);
          return;
        }
      }

      if (ok) {
        if (responseTime < 500) {
          this.connectionQuality = 'good';
        } else if (responseTime < 2000) {
          this.connectionQuality = 'fair';
        } else {
          this.connectionQuality = 'poor';
        }
      } else {
        this.connectionQuality = 'poor';
      }

      this.lastConnectivityCheck = Date.now();
      this.notifyListeners({ connectionQuality: this.connectionQuality, responseTime });

    } catch (error) {
      // Do not over-report as poor for transient client-side issues
      this.connectionQuality = 'unknown';
      console.debug('Connection quality check encountered a transient issue:', error);
    }
  }

  startConnectivityMonitoring() {
    // Check connection quality every 30 seconds when online
    setInterval(() => {
      if (this.isOnline) {
        this.checkConnectionQuality();
      }
    }, 30000);
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data));
  }

  getNetworkInfo() {
    return {
      isOnline: this.isOnline,
      connectionQuality: this.connectionQuality,
      lastCheck: this.lastConnectivityCheck,
      effectiveType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || null,
      rtt: navigator.connection?.rtt || null
    };
  }

  shouldRetryRequest(error, attempt) {
    if (!this.isOnline) {
      return false; // Don't retry when offline
    }
    
    if (this.connectionQuality === 'poor' && attempt > 1) {
      return false; // Limit retries on poor connections
    }
    
    const errorType = categorizeError(error);
    return [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT].includes(errorType);
  }
}

export const networkManager = new NetworkManager();

/**
 * Offline queue manager for handling requests when offline
 */
export class OfflineQueueManager {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    
    // Listen for online events to process queue
    networkManager.addListener(({ isOnline }) => {
      if (isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  addToQueue(request) {
    const queueItem = {
      id: Date.now() + Math.random(),
      request,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3
    };
    
    this.queue.push(queueItem);
    console.log(`Added request to offline queue: ${queueItem.id}`);
    
    return queueItem.id;
  }

  async processQueue() {
    if (this.isProcessing || !networkManager.isOnline) {
      return;
    }
    
    this.isProcessing = true;
    console.log(`Processing offline queue: ${this.queue.length} items`);
    
    const itemsToProcess = [...this.queue];
    this.queue = [];
    
    for (const item of itemsToProcess) {
      try {
        await item.request();
        console.log(`Successfully processed queued request: ${item.id}`);
      } catch (error) {
        item.attempts++;
        
        if (item.attempts < item.maxAttempts) {
          this.queue.push(item);
          console.log(`Re-queued failed request: ${item.id} (attempt ${item.attempts})`);
        } else {
          console.error(`Dropped queued request after ${item.maxAttempts} attempts: ${item.id}`, error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      oldestItem: this.queue.length > 0 ? this.queue[0].timestamp : null
    };
  }

  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];
    console.log(`Cleared offline queue: ${clearedCount} items removed`);
    return clearedCount;
  }
}

export const offlineQueueManager = new OfflineQueueManager();
import api from '../services/api';