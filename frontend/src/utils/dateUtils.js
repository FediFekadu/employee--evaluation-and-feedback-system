/**
 * Date utility functions for evaluation availability logic
 * Handles date normalization, parsing, and comparison with comprehensive error handling
 */

/**
 * Normalizes various date formats to YYYY-MM-DD string format
 * Handles ISO timestamps, date strings, and Date objects
 * @param {string|Date} dateInput - Date in various formats
 * @returns {string|null} - Normalized date string in YYYY-MM-DD format or null if invalid
 */
export const normalizeToDateString = (dateInput) => {
  try {
    if (!dateInput) {
      return null;
    }

    let date;
    
    if (typeof dateInput === 'string') {
      // Handle ISO timestamp format (e.g., "2025-12-30T00:00:00.000000Z")
      if (dateInput.includes('T')) {
        date = new Date(dateInput);
      } else {
        // Handle date-only string (e.g., "2025-12-30")
        date = new Date(dateInput + 'T00:00:00.000Z');
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      // Try to convert other types to Date
      date = new Date(dateInput);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input:', dateInput);
      return null;
    }

    // Extract date portion in UTC to avoid timezone issues and format as YYYY-MM-DD
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error normalizing date:', error, 'Input:', dateInput);
    return null;
  }
};

/**
 * Extracts date portion from ISO timestamp
 * @param {string} isoTimestamp - ISO 8601 timestamp
 * @returns {string|null} - Date portion in YYYY-MM-DD format or null if invalid
 */
export const extractDateFromISO = (isoTimestamp) => {
  try {
    if (!isoTimestamp || typeof isoTimestamp !== 'string') {
      return null;
    }

    // For ISO timestamps, extract just the date part before 'T'
    if (isoTimestamp.includes('T')) {
      const datePart = isoTimestamp.split('T')[0];
      // Validate the extracted date part
      const date = new Date(datePart + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        return null;
      }
      return datePart;
    }

    // If no 'T' found, treat as regular date string
    return normalizeToDateString(isoTimestamp);
  } catch (error) {
    console.error('Error extracting date from ISO timestamp:', error, 'Input:', isoTimestamp);
    return null;
  }
};

/**
 * Compares two dates after normalizing them to the same format
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {number} - -1 if date1 < date2, 0 if equal, 1 if date1 > date2, null if comparison fails
 */
export const compareDates = (date1, date2) => {
  try {
    const normalizedDate1 = normalizeToDateString(date1);
    const normalizedDate2 = normalizeToDateString(date2);

    if (!normalizedDate1 || !normalizedDate2) {
      console.warn('Cannot compare dates - one or both are invalid:', { date1, date2 });
      return null;
    }

    if (normalizedDate1 < normalizedDate2) return -1;
    if (normalizedDate1 > normalizedDate2) return 1;
    return 0;
  } catch (error) {
    console.error('Error comparing dates:', error, 'Inputs:', { date1, date2 });
    return null;
  }
};

/**
 * Parses evaluation date with error handling
 * @param {string|Date} dateString - Date to parse
 * @returns {Object} - Object with success flag and parsed date or error
 */
export const parseEvaluationDate = (dateString) => {
  try {
    const normalized = normalizeToDateString(dateString);
    
    if (!normalized) {
      return {
        success: false,
        error: 'Invalid date format',
        date: null
      };
    }

    return {
      success: true,
      error: null,
      date: normalized
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      date: null
    };
  }
};

/**
 * Determines if an evaluation is available based on opened_at and closed_at dates
 * @param {string|Date} openedAt - When evaluation opens
 * @param {string|Date|null} closedAt - When evaluation closes (null means no close date)
 * @param {string|Date} currentDate - Current date (defaults to today)
 * @returns {boolean} - True if evaluation is available, false otherwise
 */
export const isEvaluationAvailable = (openedAt, closedAt = null, currentDate = new Date()) => {
  try {
    // Normalize all dates
    const normalizedOpenDate = normalizeToDateString(openedAt);
    const normalizedCurrentDate = normalizeToDateString(currentDate);
    const normalizedCloseDate = closedAt ? normalizeToDateString(closedAt) : null;

    // If we can't parse the open date or current date, default to available for safety
    if (!normalizedOpenDate || !normalizedCurrentDate) {
      console.warn('Could not parse dates for availability check, defaulting to available:', {
        openedAt,
        closedAt,
        currentDate
      });
      return true;
    }

    // Check if evaluation has opened (opened_at <= current_date)
    const hasOpened = normalizedOpenDate <= normalizedCurrentDate;

    // Check if evaluation is still open (closed_at is null or closed_at > current_date)
    let isStillOpen = true;
    if (normalizedCloseDate) {
      isStillOpen = normalizedCloseDate > normalizedCurrentDate;
    }

    const isAvailable = hasOpened && isStillOpen;

    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Evaluation availability check:', {
        openedAt: normalizedOpenDate,
        closedAt: normalizedCloseDate,
        currentDate: normalizedCurrentDate,
        hasOpened,
        isStillOpen,
        isAvailable
      });
    }

    return isAvailable;
  } catch (error) {
    console.error('Error checking evaluation availability:', error, {
      openedAt,
      closedAt,
      currentDate
    });
    // Default to available on error for better user experience
    return true;
  }
};

/**
 * Gets current date in YYYY-MM-DD format
 * @returns {string} - Current date in YYYY-MM-DD format
 */
export const getCurrentDateString = () => {
  return normalizeToDateString(new Date());
};

/**
 * Checks if a date string is in valid YYYY-MM-DD format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid format, false otherwise
 */
export const isValidDateFormat = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Check basic format with regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
  const date = new Date(dateString + 'T00:00:00.000Z');
  return !isNaN(date.getTime());
};

/**
 * Formats a date for user-friendly display
 * @param {string|Date} dateInput - Date in various formats
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date string or original if formatting fails
 */
export const formatDateForDisplay = (dateInput, options = {}) => {
  try {
    if (!dateInput) {
      return '';
    }

    let date;
    
    if (typeof dateInput === 'string') {
      // Handle ISO timestamp format (e.g., "2025-12-30T00:00:00.000000Z")
      if (dateInput.includes('T')) {
        // For ISO timestamps, we want to show the date as intended, not affected by timezone
        const datePart = dateInput.split('T')[0]; // Extract "2025-12-30"
        date = new Date(datePart + 'T12:00:00.000Z'); // Use noon UTC to avoid timezone issues
      } else {
        // Handle date-only string (e.g., "2025-12-30")
        date = new Date(dateInput + 'T12:00:00.000Z'); // Use noon UTC to avoid timezone issues
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      // Try to convert other types to Date
      date = new Date(dateInput);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date input for formatting:', dateInput);
      return dateInput; // Return original if can't format
    }

    // Default formatting options
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC', // Use UTC to avoid timezone conversion issues
      ...options
    };

    // Format the date using toLocaleDateString
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting date for display:', error, 'Input:', dateInput);
    return dateInput; // Return original if formatting fails
  }
};