/**
 * Utility functions for formatting data in Department Reports Dashboard
 * Handles dates, percentages, scores, and other data transformations
 */

import { 
  PERFORMANCE_LEVELS, 
  DATA_QUALITY_THRESHOLDS,
  WEIGHTED_SCORE_CONFIG 
} from '../constants/reportsConstants';

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Formats a date string for display
 * @param {string|Date|null|undefined} dateString - ISO date string or Date object
 * @param {Intl.DateTimeFormatOptions} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a date string for display with time
 * @param {string|Date|null|undefined} dateString - ISO date string or Date object
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  return formatDate(dateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 * @param {string|Date|null|undefined} dateString - ISO date string or Date object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'N/A';
  }
};

/**
 * Formats an academic period (year and semester)
 * @param {string} academicYear - Academic year string (e.g., "2023-2024")
 * @param {string} semester - Semester string (e.g., "1st Semester")
 * @returns {string} Formatted academic period
 */
export const formatAcademicPeriod = (academicYear, semester) => {
  return `${academicYear} - ${semester}`;
};

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Formats a percentage value
 * @param {number|null|undefined} value - Numeric value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formats a score value
 * @param {number|null|undefined} score - Numeric score (0-100)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted score string
 */
export const formatScore = (score, decimals = 2) => {
  if (score === null || score === undefined || isNaN(score)) {
    return 'N/A';
  }
  
  return score.toFixed(decimals);
};

/**
 * Formats a count with thousands separator
 * @param {number|null|undefined} count - Numeric count
 * @returns {string} Formatted count string
 */
export const formatCount = (count) => {
  if (count === null || count === undefined || isNaN(count)) {
    return '0';
  }
  
  return count.toLocaleString('en-US');
};

/**
 * Formats a ratio as "x/y"
 * @param {number} numerator - Numerator value
 * @param {number} denominator - Denominator value
 * @returns {string} Formatted ratio string
 */
export const formatRatio = (numerator, denominator) => {
  return `${formatCount(numerator)}/${formatCount(denominator)}`;
};

// ============================================================================
// Performance Level Formatting
// ============================================================================

/**
 * Gets performance level based on score
 * @param {number} score - Weighted score (0-100)
 * @returns {string} Performance level
 */
export const getPerformanceLevel = (score) => {
  if (score >= PERFORMANCE_LEVELS.EXCELLENT.minScore) return 'Excellent';
  if (score >= PERFORMANCE_LEVELS.VERY_GOOD.minScore) return 'Very Good';
  if (score >= PERFORMANCE_LEVELS.GOOD.minScore) return 'Good';
  if (score >= PERFORMANCE_LEVELS.SATISFACTORY.minScore) return 'Satisfactory';
  if (score >= PERFORMANCE_LEVELS.NEEDS_IMPROVEMENT.minScore) return 'Needs Improvement';
  return 'Unsatisfactory';
};

/**
 * Gets performance level color
 * @param {string} level - Performance level
 * @returns {string} Color hex code
 */
export const getPerformanceLevelColor = (level) => {
  const levelKey = level.toUpperCase().replace(/ /g, '_');
  return PERFORMANCE_LEVELS[levelKey]?.color || PERFORMANCE_LEVELS.UNSATISFACTORY.color;
};

/**
 * Gets performance level background color
 * @param {string} level - Performance level
 * @returns {string} Background color hex code
 */
export const getPerformanceLevelBgColor = (level) => {
  const levelKey = level.toUpperCase().replace(/ /g, '_');
  return PERFORMANCE_LEVELS[levelKey]?.bgColor || PERFORMANCE_LEVELS.UNSATISFACTORY.bgColor;
};

// ============================================================================
// Data Quality Formatting
// ============================================================================

/**
 * Gets data quality level based on participation metrics
 * @param {number} totalResponses - Number of responses received
 * @param {number} expectedResponses - Number of expected responses
 * @returns {string} Data quality level
 */
export const getDataQuality = (totalResponses, expectedResponses) => {
  if (expectedResponses === 0) return 'Limited';
  
  const participationRate = (totalResponses / expectedResponses) * 100;
  
  if (
    participationRate >= DATA_QUALITY_THRESHOLDS.EXCELLENT_PARTICIPATION &&
    totalResponses >= DATA_QUALITY_THRESHOLDS.MINIMUM_RESPONSES_EXCELLENT
  ) {
    return 'Excellent';
  }
  
  if (
    participationRate >= DATA_QUALITY_THRESHOLDS.GOOD_PARTICIPATION &&
    totalResponses >= DATA_QUALITY_THRESHOLDS.MINIMUM_RESPONSES
  ) {
    return 'Good';
  }
  
  return 'Limited';
};

/**
 * Formats data quality with icon
 * @param {string} quality - Data quality level
 * @returns {{label: string, icon: string, color: string}} Quality info object
 */
export const formatDataQuality = (quality) => {
  const qualityMap = {
    Excellent: { label: 'Excellent', icon: '✓', color: '#10b981' },
    Good: { label: 'Good', icon: '✓', color: '#3b82f6' },
    Limited: { label: 'Limited', icon: '!', color: '#f59e0b' },
  };
  
  return qualityMap[quality] || qualityMap.Limited;
};

// ============================================================================
// Participation Formatting
// ============================================================================

/**
 * Calculates participation rate
 * @param {number} totalResponses - Number of responses received
 * @param {number} expectedResponses - Number of expected responses
 * @returns {number} Participation rate (0-100)
 */
export const calculateParticipationRate = (totalResponses, expectedResponses) => {
  if (expectedResponses === 0) return 0;
  return (totalResponses / expectedResponses) * 100;
};

/**
 * Formats participation rate with color coding
 * @param {number} rate - Participation rate (0-100)
 * @returns {{formatted: string, color: string, severity: string}} Formatted rate info
 */
export const formatParticipationRate = (rate) => {
  const formatted = formatPercentage(rate);
  
  if (rate >= DATA_QUALITY_THRESHOLDS.EXCELLENT_PARTICIPATION) {
    return { formatted, color: '#10b981', severity: 'excellent' };
  }
  if (rate >= DATA_QUALITY_THRESHOLDS.WARNING_PARTICIPATION) {
    return { formatted, color: '#3b82f6', severity: 'good' };
  }
  if (rate >= DATA_QUALITY_THRESHOLDS.CRITICAL_PARTICIPATION) {
    return { formatted, color: '#f59e0b', severity: 'warning' };
  }
  return { formatted, color: '#ef4444', severity: 'critical' };
};

// ============================================================================
// Weighted Score Formatting
// ============================================================================

/**
 * Formats weighted score breakdown
 * @param {Object|undefined} weightedScores - Weighted scores object
 * @returns {string} Formatted breakdown string
 */
export const formatWeightedScoreBreakdown = (weightedScores) => {
  if (!weightedScores) return 'N/A';
  
  const { student_score, peer_score, admin_score } = weightedScores;
  
  return [
    `Student: ${formatScore(student_score)} (${WEIGHTED_SCORE_CONFIG.WEIGHTS.STUDENT * 100}%)`,
    `Peer: ${formatScore(peer_score)} (${WEIGHTED_SCORE_CONFIG.WEIGHTS.PEER * 100}%)`,
    `HOD: ${formatScore(admin_score)} (${WEIGHTED_SCORE_CONFIG.WEIGHTS.HOD * 100}%)`,
  ].join(' | ');
};

/**
 * Calculates weighted score from components
 * @param {number} studentScore - Student evaluation score
 * @param {number} peerScore - Peer evaluation score
 * @param {number} hodScore - HOD evaluation score
 * @returns {number} Calculated weighted score
 */
export const calculateWeightedScore = (studentScore, peerScore, hodScore) => {
  const { STUDENT, PEER, HOD } = WEIGHTED_SCORE_CONFIG.WEIGHTS;
  return (studentScore * STUDENT) + (peerScore * PEER) + (hodScore * HOD);
};

// ============================================================================
// Trend Formatting
// ============================================================================

/**
 * Formats trend direction
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {{direction: string, change: number, formatted: string, color: string}} Trend info
 */
export const formatTrend = (current, previous) => {
  const change = current - previous;
  const percentChange = previous !== 0 ? (change / previous) * 100 : 0;
  
  let direction;
  let color;
  
  if (Math.abs(percentChange) < 1) {
    direction = 'neutral';
    color = '#6b7280';
  } else if (change > 0) {
    direction = 'up';
    color = '#10b981';
  } else {
    direction = 'down';
    color = '#ef4444';
  }
  
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const formatted = `${arrow} ${formatPercentage(Math.abs(percentChange))}`;
  
  return { direction, change, formatted, color };
};

// ============================================================================
// Text Formatting
// ============================================================================

/**
 * Truncates text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formats a list of items with proper grammar
 * @param {string[]} items - Array of items
 * @param {number} maxItems - Maximum items to show before "and X more"
 * @returns {string} Formatted list string
 */
export const formatList = (items, maxItems = 3) => {
  if (items.length === 0) return 'None';
  if (items.length === 1) return items[0];
  if (items.length <= maxItems) {
    const lastItem = items[items.length - 1];
    const otherItems = items.slice(0, -1);
    return `${otherItems.join(', ')} and ${lastItem}`;
  }
  
  const visibleItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  return `${visibleItems.join(', ')} and ${remainingCount} more`;
};

/**
 * Pluralizes a word based on count
 * @param {number} count - Count value
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional, defaults to singular + 's')
 * @returns {string} Pluralized string with count
 */
export const pluralize = (count, singular, plural) => {
  const word = count === 1 ? singular : (plural || `${singular}s`);
  return `${formatCount(count)} ${word}`;
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Checks if a value is a valid score (0-100)
 * @param {any} value - Value to check
 * @returns {boolean} True if valid score
 */
export const isValidScore = (value) => {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100;
};

/**
 * Checks if a value is a valid percentage (0-100)
 * @param {any} value - Value to check
 * @returns {boolean} True if valid percentage
 */
export const isValidPercentage = (value) => {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100;
};

/**
 * Sanitizes a numeric value to ensure it's within valid range
 * @param {number|null|undefined} value - Value to sanitize
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Sanitized value
 */
export const sanitizeNumericValue = (value, min = 0, max = 100) => {
  if (value === null || value === undefined || isNaN(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
};
