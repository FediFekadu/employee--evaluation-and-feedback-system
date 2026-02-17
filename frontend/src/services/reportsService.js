import api from './api';
import { API_CONFIG } from '../constants/reportsConstants';

/**
 * Reports Service for Department Reports Dashboard
 * Provides API functions for fetching reports, analytics, and evaluation results
 * 
 * API Endpoints:
 * - GET /api/departments/{id}/reports - Fetch department reports data
 * - GET /api/departments/{id}/analytics - Fetch department analytics data
 * - GET /api/departments/{id}/evaluation-results - Fetch evaluation results with filters
 */

/**
 * Request/Response Type Definitions (JSDoc)
 * 
 * @typedef {Object} ReportsQueryParams
 * @property {boolean} [optimize=false] - Optimize query for performance
 * @property {boolean} [summary_only=false] - Return only summary data
 * @property {'week'|'month'|'quarter'|'year'} [period='month'] - Time period for data
 * @property {boolean} [cache=true] - Use cached data if available
 * 
 * @typedef {Object} AnalyticsQueryParams
 * @property {boolean} [cache=true] - Use cached data if available
 * @property {'week'|'month'|'quarter'|'year'} [period='month'] - Time period for analytics
 * 
 * @typedef {Object} EvaluationResultsQueryParams
 * @property {number} [page=1] - Page number for pagination
 * @property {number} [per_page=50] - Number of records per page
 * @property {string} [sort_by='opened_at'] - Field to sort by
 * @property {'asc'|'desc'} [sort_direction='desc'] - Sort direction
 * @property {FilterCriteria} [filters] - Filter criteria object
 * 
 * @typedef {Object} FilterCriteria
 * @property {string} [academicYear] - Academic year filter
 * @property {string} [semester] - Semester filter
 * @property {string} [yearLevel] - Year level filter
 * @property {string} [course] - Course filter
 * @property {string} [instructor] - Instructor filter
 * @property {'Active'|'Closed'|'Pending'} [status] - Status filter
 * 
 * @typedef {Object} Course
 * @property {number} id - Course ID
 * @property {string} title - Course title
 * @property {string} code - Course code
 * @property {string} year_level - Year level
 * @property {number} [enrolled_students] - Number of enrolled students
 * 
 * @typedef {Object} Teacher
 * @property {number} id - Teacher ID
 * @property {string} name - Teacher name
 * @property {string} [title] - Teacher title
 * @property {string} [email] - Teacher email
 * 
 * @typedef {Object} ParticipationMetrics
 * @property {number} total_responses - Total number of responses
 * @property {number} expected_responses - Expected number of responses
 * @property {number} participation_rate - Participation rate percentage
 * @property {'Excellent'|'Good'|'Limited'} data_quality - Data quality indicator
 * 
 * @typedef {Object} ScoreBreakdown
 * @property {number} raw_score - Raw score value
 * @property {number} weight - Weight percentage
 * @property {number} weighted_value - Weighted score value
 * 
 * @typedef {Object} WeightedScores
 * @property {number} weighted_score - Final weighted score
 * @property {number} student_score - Student evaluation score
 * @property {number} peer_score - Peer evaluation score
 * @property {number} admin_score - Admin/HOD evaluation score
 * @property {Object} breakdown - Detailed score breakdown
 * @property {ScoreBreakdown} breakdown.student - Student score breakdown
 * @property {ScoreBreakdown} breakdown.peer - Peer score breakdown
 * @property {ScoreBreakdown} breakdown.admin - Admin score breakdown
 * @property {'Excellent'|'Very Good'|'Good'|'Satisfactory'|'Needs Improvement'|'Unsatisfactory'} performance_level - Performance level
 * @property {string} calculated_at - Calculation timestamp
 * 
 * @typedef {Object} EvaluationAnalytics
 * @property {number} participation_rate - Participation rate
 * @property {number} average_rating - Average rating
 * @property {number} weighted_score - Weighted score
 * @property {string} calculated_at - Calculation timestamp
 * 
 * @typedef {Object} Evaluation
 * @property {number} id - Evaluation ID
 * @property {Course} course - Course information
 * @property {Teacher} teacher - Teacher information
 * @property {string} academic_year - Academic year
 * @property {string} semester - Semester
 * @property {string} year_level - Year level
 * @property {'Active'|'Closed'|'Pending'} status - Evaluation status
 * @property {string} opened_at - Opening date
 * @property {string|null} closed_at - Closing date
 * @property {ParticipationMetrics} participation - Participation metrics
 * @property {WeightedScores} [weighted_scores] - Weighted scores (if available)
 * @property {EvaluationAnalytics} [analytics] - Analytics data (if available)
 * 
 * @typedef {Object} AnalyticsSummary
 * @property {number} total_evaluations - Total number of evaluations
 * @property {number} active_evaluations - Number of active evaluations
 * @property {number} closed_evaluations - Number of closed evaluations
 * @property {number} total_responses - Total number of responses
 * @property {number} average_participation - Average participation rate
 * @property {number} [average_weighted_score] - Average weighted score
 * 
 * @typedef {Object} TrendPoint
 * @property {number} responses - Number of responses
 * @property {number} expected - Expected responses
 * @property {number} rate - Participation rate
 * @property {number} [average_score] - Average score
 * 
 * @typedef {Object.<string, TrendPoint>} TrendData
 * 
 * @typedef {Object} TeacherPerformance
 * @property {number} teacher_id - Teacher ID
 * @property {string} teacher_name - Teacher name
 * @property {string} course_title - Course title
 * @property {string} course_code - Course code
 * @property {number} performance_score - Performance score
 * @property {number} average_rating - Average rating
 * @property {number} participation_rate - Participation rate
 * @property {number} total_responses - Total responses
 * @property {number} weighted_score - Weighted score
 * 
 * @typedef {Object} RankingData
 * @property {TeacherPerformance[]} top_performers - Top performing teachers
 * @property {TeacherPerformance[]} needs_improvement - Teachers needing improvement
 * 
 * @typedef {Object} AnalyticsData
 * @property {AnalyticsSummary} summary - Summary statistics
 * @property {TrendData} trends - Trend data over time
 * @property {RankingData} [rankings] - Teacher rankings (if available)
 * @property {'week'|'month'|'quarter'|'year'} period - Time period
 * @property {string} generated_at - Generation timestamp
 * 
 * @typedef {Object} PaginationMeta
 * @property {number} current_page - Current page number
 * @property {number} per_page - Records per page
 * @property {number} total - Total number of records
 * @property {number} last_page - Last page number
 * @property {number} from - Starting record number
 * @property {number} to - Ending record number
 * 
 * @typedef {Object} ReportsResponse
 * @property {boolean} success - Success indicator
 * @property {Evaluation[]} data - Array of evaluations
 * @property {string} [message] - Response message
 * @property {Object} [meta] - Additional metadata
 * 
 * @typedef {Object} AnalyticsResponse
 * @property {boolean} success - Success indicator
 * @property {AnalyticsData} data - Analytics data
 * @property {string} [message] - Response message
 * 
 * @typedef {Object} EvaluationResultsResponse
 * @property {boolean} success - Success indicator
 * @property {Evaluation[]} data - Array of evaluations
 * @property {PaginationMeta} meta - Pagination metadata
 * @property {string} [message] - Response message
 * 
 * @typedef {Object} ApiError
 * @property {boolean} success - Always false for errors
 * @property {string} error - Error type
 * @property {string} message - Error message
 * @property {number} [status] - HTTP status code
 * @property {Object} [details] - Additional error details
 */

/**
 * Fetch department reports data
 * 
 * @param {number} departmentId - The department ID
 * @param {ReportsQueryParams} [params={}] - Query parameters
 * @returns {Promise<ReportsResponse>} Reports data response
 * @throws {Error} If the request fails
 * 
 * @example
 * // Fetch basic reports
 * const reports = await fetchReportsData(1);
 * 
 * @example
 * // Fetch optimized summary for last quarter
 * const summary = await fetchReportsData(1, {
 *   optimize: true,
 *   summary_only: true,
 *   period: 'quarter',
 *   cache: true
 * });
 */
export async function fetchReportsData(departmentId, params = {}) {
  try {
    // Validate department ID
    if (!departmentId || typeof departmentId !== 'number') {
      throw new Error('Invalid department ID');
    }

    // Set default parameters
    const queryParams = {
      optimize: params.optimize ?? false,
      summary_only: params.summary_only ?? false,
      period: params.period ?? 'month',
      cache: params.cache ?? true,
    };

    // Make API request
    const response = await api.get(`/departments/${departmentId}/reports`, {
      params: queryParams,
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
    });

    // Validate response
    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
      meta: response.data.meta,
    };

  } catch (error) {
    return handleApiError(error, 'fetchReportsData');
  }
}

/**
 * Fetch department analytics data
 * 
 * @param {number} departmentId - The department ID
 * @param {AnalyticsQueryParams} [params={}] - Query parameters
 * @returns {Promise<AnalyticsResponse>} Analytics data response
 * @throws {Error} If the request fails
 * 
 * @example
 * // Fetch analytics for last month
 * const analytics = await fetchAnalyticsData(1);
 * 
 * @example
 * // Fetch fresh analytics for last year
 * const yearlyAnalytics = await fetchAnalyticsData(1, {
 *   period: 'year',
 *   cache: false
 * });
 */
export async function fetchAnalyticsData(departmentId, params = {}) {
  try {
    // Validate department ID
    if (!departmentId || typeof departmentId !== 'number') {
      throw new Error('Invalid department ID');
    }

    // Set default parameters
    const queryParams = {
      cache: params.cache ?? true,
      period: params.period ?? 'month',
    };

    // Make API request
    const response = await api.get(`/departments/${departmentId}/analytics`, {
      params: queryParams,
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
    });

    // Validate response
    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
    };

  } catch (error) {
    return handleApiError(error, 'fetchAnalyticsData');
  }
}

/**
 * Fetch evaluation results with filters, sorting, and pagination
 * 
 * @param {number} departmentId - The department ID
 * @param {EvaluationResultsQueryParams} [params={}] - Query parameters
 * @returns {Promise<EvaluationResultsResponse>} Evaluation results response
 * @throws {Error} If the request fails
 * 
 * @example
 * // Fetch first page of results
 * const results = await fetchEvaluationResults(1);
 * 
 * @example
 * // Fetch filtered and sorted results
 * const filteredResults = await fetchEvaluationResults(1, {
 *   page: 2,
 *   per_page: 25,
 *   sort_by: 'weighted_score',
 *   sort_direction: 'desc',
 *   filters: {
 *     academicYear: '2024-2025',
 *     semester: '1st Semester',
 *     status: 'Closed'
 *   }
 * });
 */
export async function fetchEvaluationResults(departmentId, params = {}) {
  try {
    // Validate department ID
    if (!departmentId || typeof departmentId !== 'number') {
      throw new Error('Invalid department ID');
    }

    // Set default parameters
    const queryParams = {
      page: params.page ?? 1,
      per_page: params.per_page ?? 50,
      sort_by: params.sort_by ?? 'opened_at',
      sort_direction: params.sort_direction ?? 'desc',
    };

    // Add filters if provided
    if (params.filters) {
      // Flatten filters into query params
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams[`filter_${key}`] = value;
        }
      });
    }

    // Make API request
    const response = await api.get(`/departments/${departmentId}/evaluation-results`, {
      params: queryParams,
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
    });

    // Validate response
    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return {
      success: true,
      data: response.data.data || response.data,
      meta: response.data.meta || {
        current_page: queryParams.page,
        per_page: queryParams.per_page,
        total: response.data.data?.length || 0,
      },
      message: response.data.message,
    };

  } catch (error) {
    return handleApiError(error, 'fetchEvaluationResults');
  }
}

/**
 * Handle API errors consistently
 * 
 * @private
 * @param {Error} error - The error object
 * @param {string} functionName - Name of the function that threw the error
 * @returns {ApiError} Formatted error response
 */
function handleApiError(error, functionName) {
  console.error(`[${functionName}] API Error:`, error);

  // Network error
  if (!error.response) {
    return {
      success: false,
      error: 'NetworkError',
      message: error.message || 'Network error. Please check your connection and try again.',
      details: {
        function: functionName,
        originalError: error.message,
      },
    };
  }

  // Server error response
  const status = error.response.status;
  const data = error.response.data;

  // Handle different status codes
  if (status === 401) {
    return {
      success: false,
      error: 'Unauthorized',
      message: 'You are not authorized to access this resource. Please log in.',
      status,
      details: {
        function: functionName,
      },
    };
  }

  if (status === 403) {
    return {
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to access this department.',
      status,
      details: {
        function: functionName,
      },
    };
  }

  if (status === 404) {
    return {
      success: false,
      error: 'NotFound',
      message: 'The requested resource was not found.',
      status,
      details: {
        function: functionName,
      },
    };
  }

  if (status >= 500) {
    return {
      success: false,
      error: 'ServerError',
      message: data?.message || 'Server error. Please try again later.',
      status,
      details: {
        function: functionName,
        serverMessage: data?.message,
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: 'ApiError',
    message: data?.message || error.message || 'An error occurred while fetching data.',
    status,
    details: {
      function: functionName,
      serverMessage: data?.message,
      errors: data?.errors,
    },
  };
}

/**
 * Validate filter criteria
 * 
 * @param {FilterCriteria} filters - Filter criteria to validate
 * @returns {Object} Validation result
 * @returns {boolean} result.valid - Whether filters are valid
 * @returns {string[]} result.errors - Array of validation errors
 * 
 * @example
 * const validation = validateFilters({
 *   academicYear: '2024-2025',
 *   status: 'Active'
 * });
 * 
 * if (!validation.valid) {
 *   console.error('Invalid filters:', validation.errors);
 * }
 */
export function validateFilters(filters) {
  const errors = [];

  if (!filters || typeof filters !== 'object') {
    errors.push('Filters must be an object');
    return { valid: false, errors };
  }

  // Validate status if provided
  if (filters.status) {
    const validStatuses = ['Active', 'Closed', 'Pending'];
    if (!validStatuses.includes(filters.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Validate academic year format if provided
  if (filters.academicYear) {
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(filters.academicYear)) {
      errors.push('Invalid academic year format. Expected format: YYYY-YYYY (e.g., 2024-2025)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build query string from filter criteria
 * 
 * @param {FilterCriteria} filters - Filter criteria
 * @returns {string} Query string
 * 
 * @example
 * const queryString = buildFilterQueryString({
 *   academicYear: '2024-2025',
 *   semester: '1st Semester',
 *   status: 'Active'
 * });
 * // Returns: "filter_academicYear=2024-2025&filter_semester=1st Semester&filter_status=Active"
 */
export function buildFilterQueryString(filters) {
  if (!filters || typeof filters !== 'object') {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(`filter_${key}`, value);
    }
  });

  return params.toString();
}

// Export all functions as named exports
export default {
  fetchReportsData,
  fetchAnalyticsData,
  fetchEvaluationResults,
  validateFilters,
  buildFilterQueryString,
};
