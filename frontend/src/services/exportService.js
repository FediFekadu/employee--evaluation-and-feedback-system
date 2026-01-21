import api from './api';

/**
 * Export Service for handling evaluation and department report exports
 * Provides comprehensive error handling, retry mechanisms, and file download management
 */
class ExportService {
  constructor() {
    this.activeExports = new Map(); // Track active export operations
    this.retryAttempts = new Map(); // Track retry attempts per export
    this.maxRetries = 3;
    this.retryDelay = 1000; // Base delay in milliseconds
  }

  /**
   * Export individual evaluation results
   * @param {number} evaluationId - The evaluation ID to export
   * @param {string} format - Export format (csv, pdf, excel)
   * @param {Object} options - Additional export options
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Export result with download information
   */
  async exportEvaluation(evaluationId, format, options = {}, onProgress = null) {
    const exportKey = `evaluation_${evaluationId}_${format}`;
    
    try {
      // Check if export is already in progress
      if (this.activeExports.has(exportKey)) {
        throw new Error('Export already in progress for this evaluation and format');
      }

      // Mark export as active
      this.activeExports.set(exportKey, true);
      
      // Initialize progress
      if (onProgress) {
        onProgress({ stage: 'initializing', progress: 0 });
      }

      // Prepare request data
      const requestData = {
        format: format.toLowerCase(),
        preserve_privacy: options.preservePrivacy ?? true,
        report_type: options.reportType ?? 'teacher',
        department_id: options.departmentId,
        ...options.additionalParams
      };

      // Validate format
      if (!['csv', 'pdf', 'excel'].includes(requestData.format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      if (onProgress) {
        onProgress({ stage: 'preparing', progress: 10 });
      }

      // Make API request with timeout and progress tracking
      const response = await this._makeExportRequest(
        `/evaluations/${evaluationId}/export`,
        requestData,
        onProgress
      );

      // Handle different response types
      if (response.headers['content-type']?.includes('application/json')) {
        // JSON response - likely an error or status update
        const jsonData = JSON.parse(await response.data.text());
        
        if (jsonData.error) {
          throw new Error(jsonData.message || 'Export failed');
        }
        
        // Handle async export (if implemented)
        if (jsonData.download_url) {
          return {
            success: true,
            downloadUrl: jsonData.download_url,
            filename: jsonData.filename || `evaluation_${evaluationId}_report.${format}`,
            fileInfo: jsonData.file_info,
            message: jsonData.message
          };
        }
      }

      // Handle blob response (direct file download)
      const result = await this._handleBlobDownload(
        response,
        `evaluation_${evaluationId}_report.${format}`,
        onProgress
      );

      // Reset retry count on success
      this.retryAttempts.delete(exportKey);

      return {
        success: true,
        ...result,
        evaluationId,
        format
      };

    } catch (error) {
      return this._handleExportError(error, exportKey, () => 
        this.exportEvaluation(evaluationId, format, options, onProgress)
      );
    } finally {
      // Clean up active export tracking
      this.activeExports.delete(exportKey);
    }
  }

  /**
   * Export department evaluation results
   * @param {number} departmentId - The department ID to export
   * @param {string} format - Export format (csv, pdf, excel)
   * @param {Object} options - Additional export options
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Export result with download information
   */
  async exportDepartment(departmentId, format, options = {}, onProgress = null) {
    const exportKey = `department_${departmentId}_${format}`;
    
    try {
      // Check if export is already in progress
      if (this.activeExports.has(exportKey)) {
        throw new Error('Export already in progress for this department and format');
      }

      // Mark export as active
      this.activeExports.set(exportKey, true);
      
      // Initialize progress
      if (onProgress) {
        onProgress({ stage: 'initializing', progress: 0 });
      }

      // Prepare request data
      const requestData = {
        format: format.toLowerCase(),
        evaluations: options.evaluations || [],
        filters: options.filters || {},
        sort_by: options.sortBy,
        sort_direction: options.sortDirection,
        preserve_privacy: options.preservePrivacy ?? true,
        include_analytics: options.includeAnalytics ?? true,
        ...options.additionalParams
      };

      // Validate format
      if (!['csv', 'pdf', 'excel'].includes(requestData.format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      if (onProgress) {
        onProgress({ stage: 'preparing', progress: 10 });
      }

      // Make API request
      const response = await this._makeExportRequest(
        `/departments/${departmentId}/export`,
        requestData,
        onProgress
      );

      // Handle response
      const result = await this._handleBlobDownload(
        response,
        `department_${departmentId}_evaluations_report.${format}`,
        onProgress
      );

      // Reset retry count on success
      this.retryAttempts.delete(exportKey);

      return {
        success: true,
        ...result,
        departmentId,
        format
      };

    } catch (error) {
      return this._handleExportError(error, exportKey, () => 
        this.exportDepartment(departmentId, format, options, onProgress)
      );
    } finally {
      // Clean up active export tracking
      this.activeExports.delete(exportKey);
    }
  }

  /**
   * Make export API request with proper error handling and timeout
   * @private
   */
  async _makeExportRequest(endpoint, data, onProgress) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    try {
      if (onProgress) {
        onProgress({ stage: 'requesting', progress: 20 });
      }

      const response = await api.post(endpoint, data, {
        responseType: 'blob',
        signal: controller.signal,
        timeout: 300000, // 5 minutes
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 60) + 20;
            onProgress({ stage: 'downloading', progress: Math.min(progress, 80) });
          }
        }
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Export request timed out. Please try again or use a different format.');
      }
      
      // Handle different error types
      if (error.response) {
        // Server responded with error status
        if (error.response.data instanceof Blob) {
          // Try to parse blob as JSON for error details
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || `Server error: ${error.response.status}`);
          } catch {
            throw new Error(`Server error: ${error.response.status} ${error.response.statusText}`);
          }
        } else {
          throw new Error(error.response.data?.message || `Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      } else {
        // Other error
        throw error;
      }
    }
  }

  /**
   * Handle blob download and file management
   * @private
   */
  async _handleBlobDownload(response, defaultFilename, onProgress) {
    try {
      if (onProgress) {
        onProgress({ stage: 'processing', progress: 85 });
      }

      // Determine content type and filename
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'];
      
      let filename = defaultFilename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob
      const blob = new Blob([response.data], { type: contentType });
      const size = blob.size;

      // Validate file size
      if (size === 0) {
        throw new Error('Export file is empty. Please try again.');
      }

      // Create download URL
      const url = window.URL.createObjectURL(blob);

      if (onProgress) {
        onProgress({ stage: 'ready', progress: 100 });
      }

      return {
        blob,
        url,
        filename,
        size,
        contentType,
        downloadUrl: url
      };

    } catch (error) {
      throw new Error(`Failed to process download: ${error.message}`);
    }
  }

  /**
   * Handle export errors with retry logic
   * @private
   */
  async _handleExportError(error, exportKey, retryFunction) {
    const currentAttempts = this.retryAttempts.get(exportKey) || 0;
    
    // Determine if error is retryable
    const isRetryable = this._isRetryableError(error);
    
    if (isRetryable && currentAttempts < this.maxRetries) {
      // Increment retry count
      this.retryAttempts.set(exportKey, currentAttempts + 1);
      
      // Calculate delay with exponential backoff
      const delay = this.retryDelay * Math.pow(2, currentAttempts);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the operation
      return retryFunction();
    }

    // Clean up retry tracking
    this.retryAttempts.delete(exportKey);

    // Return error result
    return {
      success: false,
      error: error.message || 'Export failed',
      isRetryable,
      attempts: currentAttempts + 1,
      maxRetries: this.maxRetries,
      canRetry: isRetryable && currentAttempts < this.maxRetries,
      retryFunction: isRetryable ? retryFunction : null
    };
  }

  /**
   * Determine if an error is retryable
   * @private
   */
  _isRetryableError(error) {
    const retryableMessages = [
      'network error',
      'timeout',
      'connection',
      'temporary',
      'server error: 5', // 5xx errors
      'request timed out'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Download a file from URL or blob
   * @param {string|Blob} source - URL string or Blob object
   * @param {string} filename - Filename for download
   */
  downloadFile(source, filename) {
    try {
      let url;
      
      if (source instanceof Blob) {
        url = window.URL.createObjectURL(source);
      } else if (typeof source === 'string') {
        url = source;
      } else {
        throw new Error('Invalid source for download');
      }

      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL if we created it
      if (source instanceof Blob) {
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }

      return { success: true, filename };

    } catch (error) {
      return { 
        success: false, 
        error: `Download failed: ${error.message}` 
      };
    }
  }

  /**
   * Cancel an active export
   * @param {string} exportKey - The export key to cancel
   */
  cancelExport(exportKey) {
    if (this.activeExports.has(exportKey)) {
      this.activeExports.delete(exportKey);
      this.retryAttempts.delete(exportKey);
      return true;
    }
    return false;
  }

  /**
   * Get active exports
   * @returns {Array} List of active export keys
   */
  getActiveExports() {
    return Array.from(this.activeExports.keys());
  }

  /**
   * Clear all active exports and retry attempts
   */
  clearAll() {
    this.activeExports.clear();
    this.retryAttempts.clear();
  }
}

// Create and export singleton instance
const exportService = new ExportService();
export default exportService;

// Named exports for specific functions
export const {
  exportEvaluation,
  exportDepartment,
  downloadFile,
  cancelExport,
  getActiveExports,
  clearAll
} = exportService;