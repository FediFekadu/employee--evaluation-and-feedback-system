/**
 * Constants for Department Reports Dashboard
 * Defines thresholds, colors, configuration values, and other constants
 */

// ============================================================================
// Data Quality Thresholds
// ============================================================================

export const DATA_QUALITY_THRESHOLDS = {
  // Participation rate thresholds
  EXCELLENT_PARTICIPATION: 80, // >= 80% is excellent
  GOOD_PARTICIPATION: 60, // >= 60% is good
  WARNING_PARTICIPATION: 70, // < 70% triggers warning
  CRITICAL_PARTICIPATION: 50, // < 50% is critical
  
  // Minimum response thresholds
  MINIMUM_RESPONSES: 10, // Minimum responses for reliable data
  MINIMUM_RESPONSES_EXCELLENT: 20, // Minimum for excellent data quality
  
  // Score thresholds
  EXCELLENT_SCORE: 90,
  VERY_GOOD_SCORE: 80,
  GOOD_SCORE: 70,
  SATISFACTORY_SCORE: 60,
  NEEDS_IMPROVEMENT_SCORE: 50,
  
  // Anomaly detection
  ANOMALY_STANDARD_DEVIATIONS: 2, // Values beyond 2 std devs are anomalies
};

// ============================================================================
// Performance Level Configuration
// ============================================================================

export const PERFORMANCE_LEVELS = {
  EXCELLENT: {
    label: 'Excellent',
    minScore: 90,
    color: '#10b981', // green-500
    bgColor: '#d1fae5', // green-100
  },
  VERY_GOOD: {
    label: 'Very Good',
    minScore: 80,
    color: '#3b82f6', // blue-500
    bgColor: '#dbeafe', // blue-100
  },
  GOOD: {
    label: 'Good',
    minScore: 70,
    color: '#8b5cf6', // violet-500
    bgColor: '#ede9fe', // violet-100
  },
  SATISFACTORY: {
    label: 'Satisfactory',
    minScore: 60,
    color: '#f59e0b', // amber-500
    bgColor: '#fef3c7', // amber-100
  },
  NEEDS_IMPROVEMENT: {
    label: 'Needs Improvement',
    minScore: 50,
    color: '#f97316', // orange-500
    bgColor: '#ffedd5', // orange-100
  },
  UNSATISFACTORY: {
    label: 'Unsatisfactory',
    minScore: 0,
    color: '#ef4444', // red-500
    bgColor: '#fee2e2', // red-100
  },
};

// ============================================================================
// Chart Colors (WCAG AA Compliant)
// ============================================================================

export const CHART_COLORS = {
  // Primary color palette
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'],
  
  // Performance colors (ordered from best to worst)
  performance: [
    '#10b981', // Excellent - green
    '#3b82f6', // Very Good - blue
    '#8b5cf6', // Good - violet
    '#f59e0b', // Satisfactory - amber
    '#f97316', // Needs Improvement - orange
    '#ef4444', // Unsatisfactory - red
  ],
  
  // Participation colors
  participation: {
    excellent: '#10b981', // green-500
    good: '#3b82f6', // blue-500
    warning: '#f59e0b', // amber-500
    critical: '#ef4444', // red-500
  },
  
  // Data quality colors
  dataQuality: {
    excellent: '#10b981', // green-500
    good: '#3b82f6', // blue-500
    limited: '#f59e0b', // amber-500
    insufficient: '#ef4444', // red-500
  },
  
  // Trend colors
  trends: {
    positive: '#10b981', // green-500
    neutral: '#6b7280', // gray-500
    negative: '#ef4444', // red-500
  },
  
  // Background colors for charts
  backgrounds: {
    light: '#f9fafb', // gray-50
    medium: '#f3f4f6', // gray-100
    dark: '#e5e7eb', // gray-200
  },
};

// ============================================================================
// Pagination Configuration
// ============================================================================

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [25, 50, 100, 200],
  MAX_PAGE_SIZE: 200,
  PAGINATION_THRESHOLD: 50, // Show pagination when records exceed this
};

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  // Cache durations (in milliseconds)
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 2 * 60 * 1000, // 2 minutes
  
  // Request timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  EXPORT_TIMEOUT: 60000, // 60 seconds for exports
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second base delay
  
  // Rate limiting
  MAX_EXPORTS_PER_MINUTE: 5,
  
  // Debounce delays
  SEARCH_DEBOUNCE: 300, // 300ms for search
  FILTER_DEBOUNCE: 500, // 500ms for filters
};

// ============================================================================
// Export Configuration
// ============================================================================

export const EXPORT_CONFIG = {
  FORMATS: ['csv', 'pdf', 'excel'],
  
  MAX_RECORDS: 1000, // Maximum records per export
  
  CSV: {
    DELIMITER: ',',
    LINE_BREAK: '\n',
    QUOTE_CHAR: '"',
    ESCAPE_CHAR: '"',
  },
  
  PDF: {
    PAGE_SIZE: 'A4',
    ORIENTATION: 'landscape',
    MARGIN: 10,
  },
  
  EXCEL: {
    SHEET_NAMES: {
      SUMMARY: 'Summary',
      EVALUATIONS: 'Evaluations',
      RANKINGS: 'Teacher Rankings',
      TRENDS: 'Trends',
    },
  },
};

// ============================================================================
// Filter Configuration
// ============================================================================

export const FILTER_CONFIG = {
  // Session storage keys
  STORAGE_KEY: 'department_reports_filters',
  
  // Default filter values
  DEFAULT_FILTERS: {
    academicYear: undefined,
    semester: undefined,
    yearLevel: undefined,
    course: undefined,
    instructor: undefined,
    status: undefined,
  },
  
  // Filter labels
  LABELS: {
    academicYear: 'Academic Year',
    semester: 'Semester',
    yearLevel: 'Year Level',
    course: 'Course',
    instructor: 'Instructor',
    status: 'Status',
  },
};

// ============================================================================
// Sort Configuration
// ============================================================================

export const SORT_CONFIG = {
  DEFAULT_FIELD: 'opened_at',
  DEFAULT_DIRECTION: 'desc',
  
  FIELDS: {
    opened_at: 'Date Opened',
    course: 'Course',
    instructor: 'Instructor',
    year: 'Year Level',
    status: 'Status',
    participation: 'Participation Rate',
    weighted_score: 'Weighted Score',
  },
};

// ============================================================================
// Chart Configuration
// ============================================================================

export const CHART_CONFIG = {
  // Default dimensions
  DEFAULT_HEIGHT: 400,
  MOBILE_HEIGHT: 300,
  
  // Responsive breakpoints
  BREAKPOINTS: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
  },
  
  // Animation duration
  ANIMATION_DURATION: 300,
  
  // Tooltip configuration
  TOOLTIP: {
    CURSOR: { strokeDasharray: '3 3' },
    CONTENT_STYLE: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      padding: '0.5rem',
    },
  },
  
  // Score range buckets for distribution chart
  SCORE_RANGES: [
    { min: 0, max: 50, label: '0-50' },
    { min: 51, max: 60, label: '51-60' },
    { min: 61, max: 70, label: '61-70' },
    { min: 71, max: 80, label: '71-80' },
    { min: 81, max: 90, label: '81-90' },
    { min: 91, max: 100, label: '91-100' },
  ],
};

// ============================================================================
// UI Configuration
// ============================================================================

export const UI_CONFIG = {
  // Loading states
  SKELETON_COUNT: 3,
  
  // Empty states
  EMPTY_STATE_MESSAGES: {
    NO_EVALUATIONS: 'No evaluations found',
    NO_ANALYTICS: 'No analytics data available',
    NO_RESULTS: 'No results match your filters',
    NO_DATA: 'No data available',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    EXPORT_ERROR: 'Export failed. Please try again.',
    LOAD_ERROR: 'Failed to load data. Please refresh the page.',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    EXPORT_SUCCESS: 'Export completed successfully',
    REFRESH_SUCCESS: 'Data refreshed successfully',
  },
  
  // Notification duration
  NOTIFICATION_DURATION: 5000, // 5 seconds
  
  // Top performers count
  TOP_PERFORMERS_COUNT: 10,
  
  // Needs improvement threshold
  NEEDS_IMPROVEMENT_THRESHOLD: 'below_average', // or specific score
};

// ============================================================================
// Accessibility Configuration
// ============================================================================

export const A11Y_CONFIG = {
  // ARIA labels
  ARIA_LABELS: {
    FILTER_PANEL: 'Filter evaluations',
    SEARCH_INPUT: 'Search evaluations',
    SORT_BUTTON: 'Sort evaluations',
    EXPORT_BUTTON: 'Export data',
    REFRESH_BUTTON: 'Refresh data',
    CLEAR_FILTERS: 'Clear all filters',
  },
  
  // Keyboard shortcuts
  KEYBOARD_SHORTCUTS: {
    SEARCH: '/',
    REFRESH: 'r',
    EXPORT: 'e',
    CLEAR_FILTERS: 'c',
  },
  
  // Focus management
  FOCUS_TRAP_ENABLED: true,
  
  // Screen reader announcements
  LIVE_REGION_POLITENESS: 'polite',
};

// ============================================================================
// Weighted Score Configuration
// ============================================================================

export const WEIGHTED_SCORE_CONFIG = {
  WEIGHTS: {
    STUDENT: 0.5, // 50%
    PEER: 0.3, // 30%
    HOD: 0.2, // 20%
  },
  
  LABELS: {
    STUDENT: 'Student Evaluation',
    PEER: 'Peer Evaluation',
    HOD: 'HOD Evaluation',
  },
};

// ============================================================================
// Time Period Configuration
// ============================================================================

export const TIME_PERIOD_CONFIG = {
  PERIODS: ['week', 'month', 'quarter', 'year'],
  
  DEFAULT_PERIOD: 'month',
  
  LABELS: {
    week: 'Last Week',
    month: 'Last Month',
    quarter: 'Last Quarter',
    year: 'Last Year',
  },
  
  // Minimum periods for trend display
  MINIMUM_TREND_PERIODS: 2,
};

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION_RULES = {
  // Score validation
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  
  // Participation validation
  MIN_PARTICIPATION: 0,
  MAX_PARTICIPATION: 100,
  
  // Search query
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  
  // Export
  MIN_EXPORT_RECORDS: 1,
  MAX_EXPORT_RECORDS: 1000,
};

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_EXPORT: true,
  ENABLE_CHARTS: true,
  ENABLE_RANKINGS: true,
  ENABLE_DATA_QUALITY: true,
  ENABLE_TRENDS: true,
  ENABLE_PRIVACY_MODE: true,
  ENABLE_ADVANCED_FILTERS: true,
};

export const REPORT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];

export const EVALUATION_WEIGHTS = {
  student: 0.5,
  peer: 0.3,
  hod: 0.2,
};

export const getPerformanceStatus = (score) => {
  const s = Number(score || 0);
  if (s >= 4.5) return 'Excellent';
  if (s >= 4.0) return 'Very Good';
  if (s >= 3.5) return 'Good';
  return 'Needs Improvement';
};

export const computeWeightedScore = (studentAvg, peerAvg, hodAvg) => {
  const s = Number(studentAvg || 0);
  const p = Number(peerAvg || 0);
  const h = Number(hodAvg || 0);
  const w = (s * EVALUATION_WEIGHTS.student) + (p * EVALUATION_WEIGHTS.peer) + (h * EVALUATION_WEIGHTS.hod);
  return Math.round(w * 100) / 100;
};

const toISODate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatRangeLabel = (from, to) => {
  const fmt = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString('default', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  };
  if (from === to) return fmt(from);
  return `${fmt(from)}–${fmt(to)}`;
};

export const computeDateRange = (period, customFrom, customTo) => {
  const now = new Date();
  let from = toISODate(now);
  let to = toISODate(now);
  if (period === 'daily') {
    from = toISODate(now);
    to = toISODate(now);
  } else if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    from = toISODate(start);
    to = toISODate(now);
  } else if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    from = toISODate(start);
    to = toISODate(now);
  } else if (period === 'yearly') {
    const start = new Date(now.getFullYear(), 0, 1);
    from = toISODate(start);
    to = toISODate(now);
  } else if (period === 'custom') {
    if (customFrom) from = customFrom;
    if (customTo) to = customTo || customFrom;
  }
  return { from, to, label: formatRangeLabel(from, to) };
};
