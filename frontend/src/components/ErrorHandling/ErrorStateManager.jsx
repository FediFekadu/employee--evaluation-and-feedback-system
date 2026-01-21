import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { getErrorInfo, ERROR_TYPES } from '../../utils/errorHandling';

/**
 * Enhanced Error State Management System
 * Provides centralized error handling with context-aware recovery mechanisms
 */

// Error state context
const ErrorStateContext = createContext();

// Error actions
const ERROR_ACTIONS = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  UPDATE_ERROR: 'UPDATE_ERROR',
  SET_GLOBAL_ERROR: 'SET_GLOBAL_ERROR',
  CLEAR_GLOBAL_ERROR: 'CLEAR_GLOBAL_ERROR',
  INCREMENT_RETRY: 'INCREMENT_RETRY',
  RESET_RETRY: 'RESET_RETRY'
};

// Initial state
const initialState = {
  errors: [],
  globalError: null,
  errorCounts: {},
  retryAttempts: {},
  errorHistory: [],
  suppressedErrors: new Set()
};

// Error reducer
function errorReducer(state, action) {
  switch (action.type) {
    case ERROR_ACTIONS.ADD_ERROR: {
      const { error, context, id } = action.payload;
      const errorInfo = getErrorInfo(error);
      
      const newError = {
        id: id || `${Date.now()}_${Math.random()}`,
        ...errorInfo,
        originalError: error,
        context,
        timestamp: new Date(),
        retryCount: 0,
        dismissed: false
      };

      // Check if this error should be suppressed (duplicate within short time)
      const recentSimilar = state.errors.find(e => 
        e.type === errorInfo.type && 
        e.context === context &&
        Date.now() - e.timestamp.getTime() < 5000 // 5 seconds
      );

      if (recentSimilar) {
        return {
          ...state,
          errorCounts: {
            ...state.errorCounts,
            [recentSimilar.id]: (state.errorCounts[recentSimilar.id] || 1) + 1
          }
        };
      }

      return {
        ...state,
        errors: [...state.errors, newError],
        errorHistory: [...state.errorHistory.slice(-49), newError] // Keep last 50 errors
      };
    }

    case ERROR_ACTIONS.REMOVE_ERROR: {
      const { id } = action.payload;
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== id),
        errorCounts: {
          ...state.errorCounts,
          [id]: undefined
        }
      };
    }

    case ERROR_ACTIONS.CLEAR_ERRORS: {
      const { context } = action.payload || {};
      if (context) {
        return {
          ...state,
          errors: state.errors.filter(error => error.context !== context)
        };
      }
      return {
        ...state,
        errors: [],
        errorCounts: {}
      };
    }

    case ERROR_ACTIONS.UPDATE_ERROR: {
      const { id, updates } = action.payload;
      return {
        ...state,
        errors: state.errors.map(error => 
          error.id === id ? { ...error, ...updates } : error
        )
      };
    }

    case ERROR_ACTIONS.SET_GLOBAL_ERROR: {
      const { error, context } = action.payload;
      const errorInfo = getErrorInfo(error);
      
      return {
        ...state,
        globalError: {
          ...errorInfo,
          originalError: error,
          context,
          timestamp: new Date()
        }
      };
    }

    case ERROR_ACTIONS.CLEAR_GLOBAL_ERROR: {
      return {
        ...state,
        globalError: null
      };
    }

    case ERROR_ACTIONS.INCREMENT_RETRY: {
      const { id } = action.payload;
      return {
        ...state,
        retryAttempts: {
          ...state.retryAttempts,
          [id]: (state.retryAttempts[id] || 0) + 1
        },
        errors: state.errors.map(error => 
          error.id === id ? { ...error, retryCount: error.retryCount + 1 } : error
        )
      };
    }

    case ERROR_ACTIONS.RESET_RETRY: {
      const { id } = action.payload;
      return {
        ...state,
        retryAttempts: {
          ...state.retryAttempts,
          [id]: 0
        },
        errors: state.errors.map(error => 
          error.id === id ? { ...error, retryCount: 0 } : error
        )
      };
    }

    default:
      return state;
  }
}

/**
 * Error State Provider Component
 */
export function ErrorStateProvider({ children, maxErrors = 10, autoCleanup = true }) {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Auto-cleanup old errors
  useEffect(() => {
    if (!autoCleanup) return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      const oldErrors = state.errors.filter(error => 
        now - error.timestamp.getTime() > 300000 // 5 minutes
      );

      oldErrors.forEach(error => {
        dispatch({
          type: ERROR_ACTIONS.REMOVE_ERROR,
          payload: { id: error.id }
        });
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, [state.errors, autoCleanup]);

  // Limit number of errors
  useEffect(() => {
    if (state.errors.length > maxErrors) {
      const oldestErrors = state.errors
        .slice(0, state.errors.length - maxErrors)
        .map(error => error.id);

      oldestErrors.forEach(id => {
        dispatch({
          type: ERROR_ACTIONS.REMOVE_ERROR,
          payload: { id }
        });
      });
    }
  }, [state.errors.length, maxErrors]);

  const addError = useCallback((error, context = '', options = {}) => {
    const { id, suppressDuplicates = true } = options;

    // Check for suppression
    if (suppressDuplicates) {
      const errorInfo = getErrorInfo(error);
      const recentSimilar = state.errors.find(e => 
        e.type === errorInfo.type && 
        e.context === context &&
        Date.now() - e.timestamp.getTime() < 5000
      );

      if (recentSimilar) {
        console.log('Suppressing duplicate error:', errorInfo.type, context);
        return recentSimilar.id;
      }
    }

    const errorId = id || `${Date.now()}_${Math.random()}`;
    
    dispatch({
      type: ERROR_ACTIONS.ADD_ERROR,
      payload: { error, context, id: errorId }
    });

    return errorId;
  }, [state.errors]);

  const removeError = useCallback((id) => {
    dispatch({
      type: ERROR_ACTIONS.REMOVE_ERROR,
      payload: { id }
    });
  }, []);

  const clearErrors = useCallback((context) => {
    dispatch({
      type: ERROR_ACTIONS.CLEAR_ERRORS,
      payload: { context }
    });
  }, []);

  const updateError = useCallback((id, updates) => {
    dispatch({
      type: ERROR_ACTIONS.UPDATE_ERROR,
      payload: { id, updates }
    });
  }, []);

  const setGlobalError = useCallback((error, context = '') => {
    dispatch({
      type: ERROR_ACTIONS.SET_GLOBAL_ERROR,
      payload: { error, context }
    });
  }, []);

  const clearGlobalError = useCallback(() => {
    dispatch({
      type: ERROR_ACTIONS.CLEAR_GLOBAL_ERROR
    });
  }, []);

  const incrementRetry = useCallback((id) => {
    dispatch({
      type: ERROR_ACTIONS.INCREMENT_RETRY,
      payload: { id }
    });
  }, []);

  const resetRetry = useCallback((id) => {
    dispatch({
      type: ERROR_ACTIONS.RESET_RETRY,
      payload: { id }
    });
  }, []);

  // Helper functions
  const getErrorsByContext = useCallback((context) => {
    return state.errors.filter(error => error.context === context);
  }, [state.errors]);

  const getErrorsByType = useCallback((type) => {
    return state.errors.filter(error => error.type === type);
  }, [state.errors]);

  const hasErrors = useCallback((context) => {
    if (context) {
      return state.errors.some(error => error.context === context);
    }
    return state.errors.length > 0;
  }, [state.errors]);

  const getErrorCount = useCallback((id) => {
    return state.errorCounts[id] || 1;
  }, [state.errorCounts]);

  const getRetryCount = useCallback((id) => {
    return state.retryAttempts[id] || 0;
  }, [state.retryAttempts]);

  const canRetry = useCallback((id, maxRetries = 3) => {
    const retryCount = getRetryCount(id);
    const error = state.errors.find(e => e.id === id);
    
    if (!error) return false;
    if (retryCount >= maxRetries) return false;
    
    // Check if error type is retryable
    const nonRetryableTypes = [
      ERROR_TYPES.VALIDATION,
      ERROR_TYPES.ACCESS_DENIED,
      ERROR_TYPES.DUPLICATE_SUBMISSION
    ];
    
    return !nonRetryableTypes.includes(error.type);
  }, [state.errors, getRetryCount]);

  const getErrorSummary = useCallback(() => {
    const summary = {
      total: state.errors.length,
      byType: {},
      byContext: {},
      critical: 0,
      retryable: 0
    };

    state.errors.forEach(error => {
      // Count by type
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
      
      // Count by context
      summary.byContext[error.context] = (summary.byContext[error.context] || 0) + 1;
      
      // Count critical errors
      if ([ERROR_TYPES.SERVER_ERROR, ERROR_TYPES.ACCESS_DENIED].includes(error.type)) {
        summary.critical++;
      }
      
      // Count retryable errors
      if (canRetry(error.id)) {
        summary.retryable++;
      }
    });

    return summary;
  }, [state.errors, canRetry]);

  const contextValue = {
    // State
    errors: state.errors,
    globalError: state.globalError,
    errorHistory: state.errorHistory,
    
    // Actions
    addError,
    removeError,
    clearErrors,
    updateError,
    setGlobalError,
    clearGlobalError,
    incrementRetry,
    resetRetry,
    
    // Helpers
    getErrorsByContext,
    getErrorsByType,
    hasErrors,
    getErrorCount,
    getRetryCount,
    canRetry,
    getErrorSummary
  };

  return (
    <ErrorStateContext.Provider value={contextValue}>
      {children}
    </ErrorStateContext.Provider>
  );
}

/**
 * Hook to use error state
 */
export function useErrorState() {
  const context = useContext(ErrorStateContext);
  
  if (!context) {
    throw new Error('useErrorState must be used within an ErrorStateProvider');
  }
  
  return context;
}

/**
 * Hook for context-specific error handling
 */
export function useContextErrorHandling(context) {
  const errorState = useErrorState();
  
  const addContextError = useCallback((error, options = {}) => {
    return errorState.addError(error, context, options);
  }, [errorState, context]);

  const clearContextErrors = useCallback(() => {
    errorState.clearErrors(context);
  }, [errorState, context]);

  const contextErrors = errorState.getErrorsByContext(context);
  const hasContextErrors = errorState.hasErrors(context);

  return {
    errors: contextErrors,
    hasErrors: hasContextErrors,
    addError: addContextError,
    clearErrors: clearContextErrors,
    removeError: errorState.removeError,
    updateError: errorState.updateError,
    canRetry: errorState.canRetry,
    incrementRetry: errorState.incrementRetry,
    resetRetry: errorState.resetRetry
  };
}

export default ErrorStateProvider;