/**
 * Utility functions for calculations and data transformations
 * Handles aggregations, statistics, and data processing
 */

import { DATA_QUALITY_THRESHOLDS } from '../constants/reportsConstants';
import {
  calculateParticipationRate,
  getDataQuality,
  getPerformanceLevel,
} from './reportsFormatters';

// ============================================================================
// Statistical Calculations
// ============================================================================

/**
 * Calculates the mean (average) of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Mean value
 */
export const calculateMean = (values) => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

/**
 * Calculates the median of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Median value
 */
export const calculateMedian = (values) => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * Calculates the standard deviation of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} Standard deviation
 */
export const calculateStandardDeviation = (values) => {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  
  return Math.sqrt(variance);
};

/**
 * Calculates percentile rank for a value in a dataset
 * @param {number} value - Value to find percentile for
 * @param {number[]} values - Array of all values
 * @returns {number} Percentile rank (0-100)
 */
export const calculatePercentile = (value, values) => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  
  if (index === -1) return 100;
  return (index / sorted.length) * 100;
};

// ============================================================================
// Teacher Performance Calculations
// ============================================================================

/**
 * Extracts teacher performance data from evaluations
 * @param {Object[]} evaluations - Array of evaluations
 * @returns {Object[]} Array of teacher performance objects
 */
export const extractTeacherPerformance = (evaluations) => {
  return evaluations
    .filter(eval => eval.weighted_scores)
    .map(eval => ({
      teacher_id: eval.teacher.id,
      teacher_name: eval.teacher.name,
      course_title: eval.course.title,
      course_code: eval.course.code,
      performance_score: eval.weighted_scores.weighted_score,
      average_rating: eval.analytics?.average_rating || 0,
      participation_rate: eval.participation.participation_rate,
      total_responses: eval.participation.total_responses,
      weighted_score: eval.weighted_scores.weighted_score,
    }));
};

/**
 * Gets top performing teachers
 * @param {Object[]} evaluations - Array of evaluations
 * @param {number} count - Number of top performers to return
 * @returns {Object[]} Array of top teacher performances
 */
export const getTopPerformers = (evaluations, count = 10) => {
  const performances = extractTeacherPerformance(evaluations);
  
  return performances
    .sort((a, b) => b.weighted_score - a.weighted_score)
    .slice(0, count);
};

/**
 * Gets teachers needing improvement (below average)
 * @param {Object[]} evaluations - Array of evaluations
 * @returns {Object[]} Array of teacher performances below average
 */
export const getTeachersNeedingImprovement = (evaluations) => {
  const performances = extractTeacherPerformance(evaluations);
  
  if (performances.length === 0) return [];
  
  const averageScore = calculateMean(
    performances.map(p => p.weighted_score)
  );
  
  return performances
    .filter(p => p.weighted_score < averageScore)
    .sort((a, b) => a.weighted_score - b.weighted_score);
};

/**
 * Calculates department-wide average score
 * @param {Object[]} evaluations - Array of evaluations
 * @returns {number} Average weighted score
 */
export const calculateDepartmentAverage = (evaluations) => {
  const scores = evaluations
    .filter(eval => eval.weighted_scores)
    .map(eval => eval.weighted_scores.weighted_score);
  
  return calculateMean(scores);
};

// ============================================================================
// Data Quality Calculations
// ============================================================================

/**
 * Calculates comprehensive data quality metrics
 * @param {Object[]} evaluations - Array of evaluations
 * @returns {Object} Data quality metrics object
 */
export const calculateDataQualityMetrics = (evaluations) => {
  // Calculate participation warnings
  const participation_warnings = generateParticipationWarnings(evaluations);
  
  // Calculate completeness score
  const totalReceived = evaluations.reduce(
    (sum, e) => sum + e.participation.total_responses,
    0
  );
  const totalExpected = evaluations.reduce(
    (sum, e) => sum + e.participation.expected_responses,
    0
  );
  const completeness_score = totalExpected > 0 
    ? (totalReceived / totalExpected) * 100 
    : 0;
  
  // Calculate reliability score (based on data quality distribution)
  const qualityScores = evaluations.map(e => {
    const quality = e.participation.data_quality;
    return quality === 'Excellent' ? 100 : quality === 'Good' ? 75 : 50;
  });
  const reliability_score = calculateMean(qualityScores);
  
  // Detect anomalies
  const anomalies = detectAnomalies(evaluations);
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    evaluations,
    participation_warnings,
    completeness_score,
    reliability_score
  );
  
  // Determine overall quality
  const overall_quality = completeness_score >= 80 && reliability_score >= 75
    ? 'Excellent'
    : completeness_score >= 60 && reliability_score >= 60
    ? 'Good'
    : 'Limited';
  
  return {
    overall_quality,
    participation_warnings,
    completeness_score,
    reliability_score,
    recommendations,
    anomalies,
  };
};

/**
 * Generates participation warnings for low participation evaluations
 * @param {Object[]} evaluations - Array of evaluations
 * @returns {Object[]} Array of participation warnings
 */
export const generateParticipationWarnings = (evaluations) => {
  return evaluations
    .filter(eval => 
      eval.participation.participation_rate < DATA_QUALITY_THRESHOLDS.WARNING_PARTICIPATION
    )
    .map(eval => {
      const rate = eval.participation.participation_rate;
      const severity = rate < DATA_QUALITY_THRESHOLDS.CRITICAL_PARTICIPATION
        ? 'Critical'
        : 'Warning';
      
      const message = severity === 'Critical'
        ? `Critical: Only ${rate.toFixed(1)}% participation. Immediate action needed.`
        : `Warning: ${rate.toFixed(1)}% participation is below target of 70%.`;
      
      return {
        evaluation_id: eval.id,
        course: `${eval.course.code} - ${eval.course.title}`,
        instructor: eval.teacher.name,
        participation_rate: rate,
        severity,
        message,
      };
    })
    .sort((a, b) => a.participation_rate - b.participation_rate);
};

/**
 * Detects anomalies in evaluation data
 * @param {Object[]} evaluations - Array of evaluations
 * @returns {Object[]} Array of detected anomalies
 */
export const detectAnomalies = (evaluations) => {
  const anomalies = [];
  
  // Detect score anomalies
  const scores = evaluations
    .filter(e => e.weighted_scores)
    .map(e => e.weighted_scores.weighted_score);
  
  if (scores.length > 0) {
    const mean = calculateMean(scores);
    const stdDev = calculateStandardDeviation(scores);
    const threshold = DATA_QUALITY_THRESHOLDS.ANOMALY_STANDARD_DEVIATIONS;
    
    evaluations.forEach(eval => {
      if (eval.weighted_scores) {
        const score = eval.weighted_scores.weighted_score;
        const deviation = Math.abs(score - mean) / stdDev;
        
        if (deviation > threshold) {
          anomalies.push({
            evaluation_id: eval.id,
            type: 'score',
            value: score,
            expected_range: [
              mean - threshold * stdDev,
              mean + threshold * stdDev,
            ],
            deviation,
          });
        }
      }
    });
  }
  
  // Detect participation anomalies
  const participationRates = evaluations.map(e => e.participation.participation_rate);
  
  if (participationRates.length > 0) {
    const mean = calculateMean(participationRates);
    const stdDev = calculateStandardDeviation(participationRates);
    const threshold = DATA_QUALITY_THRESHOLDS.ANOMALY_STANDARD_DEVIATIONS;
    
    evaluations.forEach(eval => {
      const rate = eval.participation.participation_rate;
      const deviation = Math.abs(rate - mean) / stdDev;
      
      if (deviation > threshold) {
        anomalies.push({
          evaluation_id: eval.id,
          type: 'participation',
          value: rate,
          expected_range: [
            Math.max(0, mean - threshold * stdDev),
            Math.min(100, mean + threshold * stdDev),
          ],
          deviation,
        });
      }
    });
  }
  
  return anomalies;
};

/**
 * Generates actionable recommendations based on data quality
 * @param {Object[]} evaluations - Array of evaluations
 * @param {Object[]} warnings - Participation warnings
 * @param {number} completeness - Completeness score
 * @param {number} reliability - Reliability score
 * @returns {Object[]} Array of recommendations
 */
export const generateRecommendations = (evaluations, warnings, completeness, reliability) => {
  const recommendations = [];
  
  // Low participation recommendations
  if (warnings.length > 0) {
    const criticalCount = warnings.filter(w => w.severity === 'Critical').length;
    
    if (criticalCount > 0) {
      recommendations.push({
        priority: 'High',
        category: 'Participation',
        title: 'Address Critical Participation Issues',
        description: `${criticalCount} evaluation(s) have critically low participation rates.`,
        action_items: [
          'Send reminder emails to students',
          'Extend evaluation deadlines if possible',
          'Investigate technical barriers to submission',
          'Consider incentives for participation',
        ],
      });
    }
  }
  
  // Low completeness recommendations
  if (completeness < 70) {
    recommendations.push({
      priority: 'High',
      category: 'Data Quality',
      title: 'Improve Data Completeness',
      description: `Overall data completeness is ${completeness.toFixed(1)}%, below the 70% target.`,
      action_items: [
        'Review evaluation scheduling and timing',
        'Ensure all expected evaluations are created',
        'Check for missing evaluation types (Student/Peer/HOD)',
        'Verify student enrollment data accuracy',
      ],
    });
  }
  
  // Low reliability recommendations
  if (reliability < 70) {
    recommendations.push({
      priority: 'Medium',
      category: 'Data Quality',
      title: 'Enhance Data Reliability',
      description: `Data reliability score is ${reliability.toFixed(1)}%, indicating quality concerns.`,
      action_items: [
        'Review evaluation questions for clarity',
        'Provide guidance to evaluators',
        'Check for technical issues affecting submissions',
        'Validate response consistency',
      ],
    });
  }
  
  // Performance distribution recommendations
  const performances = extractTeacherPerformance(evaluations);
  const lowPerformers = performances.filter(
    p => p.weighted_score < DATA_QUALITY_THRESHOLDS.SATISFACTORY_SCORE
  );
  
  if (lowPerformers.length > performances.length * 0.2) {
    recommendations.push({
      priority: 'Medium',
      category: 'Performance',
      title: 'Support Teachers with Low Scores',
      description: `${lowPerformers.length} teacher(s) have scores below satisfactory level.`,
      action_items: [
        'Provide professional development opportunities',
        'Conduct one-on-one feedback sessions',
        'Identify common areas for improvement',
        'Create mentorship programs',
      ],
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

// ============================================================================
// Trend Calculations
// ============================================================================

/**
 * Calculates trend data from evaluations grouped by period
 * @param {Object[]} evaluations - Array of evaluations
 * @param {Function} periodKey - Function to extract period key from evaluation
 * @returns {Object} Trend data object
 */
export const calculateTrendData = (evaluations, periodKey) => {
  const trends = {};
  
  // Group evaluations by period
  const grouped = evaluations.reduce((acc, eval) => {
    const key = periodKey(eval);
    if (!acc[key]) acc[key] = [];
    acc[key].push(eval);
    return acc;
  }, {});
  
  // Calculate metrics for each period
  Object.entries(grouped).forEach(([period, evals]) => {
    const totalResponses = evals.reduce(
      (sum, e) => sum + e.participation.total_responses,
      0
    );
    const totalExpected = evals.reduce(
      (sum, e) => sum + e.participation.expected_responses,
      0
    );
    const rate = totalExpected > 0 ? (totalResponses / totalExpected) * 100 : 0;
    
    const scores = evals
      .filter(e => e.weighted_scores)
      .map(e => e.weighted_scores.weighted_score);
    const average_score = scores.length > 0 ? calculateMean(scores) : undefined;
    
    trends[period] = {
      responses: totalResponses,
      expected: totalExpected,
      rate,
      average_score,
    };
  });
  
  return trends;
};

// ============================================================================
// Filter and Sort Utilities
// ============================================================================

/**
 * Applies filters to evaluations array
 * @param {Object[]} evaluations - Array of evaluations
 * @param {Object} filters - Filter criteria
 * @returns {Object[]} Filtered evaluations
 */
export const applyFilters = (evaluations, filters) => {
  return evaluations.filter(eval => {
    if (filters.academicYear && eval.academic_year !== filters.academicYear) {
      return false;
    }
    if (filters.semester && eval.semester !== filters.semester) {
      return false;
    }
    if (filters.yearLevel && eval.year_level !== filters.yearLevel) {
      return false;
    }
    if (filters.course && eval.course.code !== filters.course) {
      return false;
    }
    if (filters.instructor && eval.teacher.name !== filters.instructor) {
      return false;
    }
    if (filters.status && eval.status !== filters.status) {
      return false;
    }
    return true;
  });
};

/**
 * Sorts evaluations by specified field and direction
 * @param {Object[]} evaluations - Array of evaluations
 * @param {string} sortBy - Field to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Object[]} Sorted evaluations
 */
export const sortEvaluations = (evaluations, sortBy, direction) => {
  const sorted = [...evaluations].sort((a, b) => {
    let aVal;
    let bVal;
    
    switch (sortBy) {
      case 'opened_at':
        aVal = new Date(a.opened_at).getTime();
        bVal = new Date(b.opened_at).getTime();
        break;
      case 'course':
        aVal = a.course.title;
        bVal = b.course.title;
        break;
      case 'instructor':
        aVal = a.teacher.name;
        bVal = b.teacher.name;
        break;
      case 'year':
        aVal = a.year_level;
        bVal = b.year_level;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'participation':
        aVal = a.participation.participation_rate;
        bVal = b.participation.participation_rate;
        break;
      case 'weighted_score':
        aVal = a.weighted_scores?.weighted_score || 0;
        bVal = b.weighted_scores?.weighted_score || 0;
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

/**
 * Paginates an array of items
 * @param {Array} items - Array of items
 * @param {number} page - Current page (1-indexed)
 * @param {number} perPage - Items per page
 * @returns {Object} Paginated items and metadata
 */
export const paginateItems = (items, page, perPage) => {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};
