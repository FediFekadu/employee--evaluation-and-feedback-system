import { useState, useCallback, useRef } from 'react';
import exportService from '../services/exportService';
import { generateCsvFromEvaluationResults } from '../utils/csvFallback';

/**
 * Custom hook for handling export operations with state management
 * Provides loading states, progress tracking, error handling, and retry mechanisms
 */
export const useExport = () => {
  const [exportState, setExportState] = useState({
    loading: false,
    progress: 0,
    stage: null,
    error: null,
    notification: null
  });

  const activeExportRef = useRef(null);

  /**
   * Update export progress
   */
  const updateProgress = useCallback((progressData) => {
    setExportState(prev => ({
      ...prev,
      progress: progressData.progress || 0,
      stage: progressData.stage || prev.stage
    }));
  }, []);

  /**
   * Set export notification
   */
  const setNotification = useCallback((notification) => {
    setExportState(prev => ({
      ...prev,
      notification
    }));
  }, []);

  /**
   * Clear export notification
   */
  const clearNotification = useCallback(() => {
    setExportState(prev => ({
      ...prev,
      notification: null
    }));
  }, []);

  /**
   * Export individual evaluation
   */
  const exportEvaluation = useCallback(async (evaluationId, format, options = {}) => {
    try {
      // Reset state
      setExportState({
        loading: true,
        progress: 0,
        stage: 'initializing',
        error: null,
        notification: {
          type: 'info',
          title: 'Preparing Export',
          message: `Generating ${format.toUpperCase()} report for evaluation...`,
          progress: 0
        }
      });

      // Store active export reference
      activeExportRef.current = `evaluation_${evaluationId}_${format}`;

      // Perform export
      const result = await exportService.exportEvaluation(
        evaluationId,
        format,
        options,
        updateProgress
      );

      if (result.success) {
        // Auto-download if blob/URL is available
        if (result.blob || result.downloadUrl) {
          const downloadResult = exportService.downloadFile(
            result.blob || result.downloadUrl,
            result.filename
          );

          if (downloadResult.success) {
            setExportState(prev => ({
              ...prev,
              loading: false,
              progress: 100,
              stage: 'completed',
              notification: {
                type: 'success',
                title: 'Export Successful',
                message: `${format.toUpperCase()} report has been downloaded successfully.`,
                details: `File: ${result.filename}${result.size ? ` (${formatFileSize(result.size)})` : ''}`
              }
            }));
          } else {
            throw new Error(downloadResult.error);
          }
        } else {
          // Show success without auto-download
          setExportState(prev => ({
            ...prev,
            loading: false,
            progress: 100,
            stage: 'completed',
            notification: {
              type: 'success',
              title: 'Export Ready',
              message: result.message || 'Export completed successfully.',
              downloadUrl: result.downloadUrl,
              filename: result.filename
            }
          }));
        }

        return result;

      } else {
        // Attempt client-side fallback for limited data cases
        const msg = (result.error || '').toLowerCase();
        const isLimitedData = msg.includes('limited') || msg.includes('minimum responses');
        const canClientFallback = ['csv', 'excel'].includes(String(format).toLowerCase()) && options.fallbackData;

        if (isLimitedData && canClientFallback) {
          try {
            const { blob, filename } = generateCsvFromEvaluationResults(options.fallbackData, {
              evaluationId,
              preferredFilename: `evaluation_${evaluationId}_report.csv`
            });

            const downloadResult = exportService.downloadFile(blob, filename);
            if (!downloadResult.success) throw new Error(downloadResult.error);

            setExportState(prev => ({
              ...prev,
              loading: false,
              progress: 100,
              stage: 'completed',
              notification: {
                type: 'warning',
                title: 'Export Completed with Warning',
                message: 'Limited data detected. A lightweight CSV was generated client-side.',
                details: `File: ${filename}`
              }
            }));

            return { success: true, blob, filename, format: 'csv', evaluationId, warning: true };
          } catch (fallbackError) {
            // Fall back to error notification if client-side generation fails
            const errorNotification = {
              type: 'error',
              title: 'Export Failed',
              message: `Failed to generate ${format.toUpperCase()} report.`,
              details: fallbackError.message || result.error
            };

            if (result.canRetry && result.retryFunction) {
              errorNotification.onRetry = () => {
                clearNotification();
                return result.retryFunction();
              };
              errorNotification.retryText = `Retry (${result.attempts}/${result.maxRetries})`;
            }

            setExportState(prev => ({
              ...prev,
              loading: false,
              error: fallbackError.message || result.error,
              notification: errorNotification
            }));

            return { success: false, error: fallbackError.message || result.error };
          }
        }

        // No fallback available; show error
        const errorNotification = {
          type: 'error',
          title: 'Export Failed',
          message: `Failed to generate ${format.toUpperCase()} report.`,
          details: result.error
        };

        if (result.canRetry && result.retryFunction) {
          errorNotification.onRetry = () => {
            clearNotification();
            return result.retryFunction();
          };
          errorNotification.retryText = `Retry (${result.attempts}/${result.maxRetries})`;
        }

        setExportState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
          notification: errorNotification
        }));

        return result;
      }

    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred during export.';
      
      setExportState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        notification: {
          type: 'error',
          title: 'Export Failed',
          message: `Failed to generate ${format.toUpperCase()} report.`,
          details: errorMessage,
          onRetry: () => exportEvaluation(evaluationId, format, options)
        }
      }));

      return { success: false, error: errorMessage };

    } finally {
      activeExportRef.current = null;
    }
  }, [updateProgress, clearNotification]);

  /**
   * Export department evaluations
   */
  const exportDepartment = useCallback(async (departmentId, format, options = {}) => {
    try {
      // Reset state
      setExportState({
        loading: true,
        progress: 0,
        stage: 'initializing',
        error: null,
        notification: {
          type: 'info',
          title: 'Preparing Export',
          message: `Generating ${format.toUpperCase()} report for department evaluations...`,
          progress: 0
        }
      });

      // Store active export reference
      activeExportRef.current = `department_${departmentId}_${format}`;

      // Perform export
      const result = await exportService.exportDepartment(
        departmentId,
        format,
        options,
        updateProgress
      );

      if (result.success) {
        // Auto-download if blob/URL is available
        if (result.blob || result.downloadUrl) {
          const downloadResult = exportService.downloadFile(
            result.blob || result.downloadUrl,
            result.filename
          );

          if (downloadResult.success) {
            const evaluationCount = options.evaluations?.length || 'all';
            setExportState(prev => ({
              ...prev,
              loading: false,
              progress: 100,
              stage: 'completed',
              notification: {
                type: 'success',
                title: 'Export Successful',
                message: `${format.toUpperCase()} report has been downloaded successfully.`,
                details: `File: ${result.filename} (${evaluationCount} evaluations)${result.size ? ` - ${formatFileSize(result.size)}` : ''}`
              }
            }));
          } else {
            throw new Error(downloadResult.error);
          }
        } else {
          // Show success without auto-download
          setExportState(prev => ({
            ...prev,
            loading: false,
            progress: 100,
            stage: 'completed',
            notification: {
              type: 'success',
              title: 'Export Ready',
              message: result.message || 'Export completed successfully.',
              downloadUrl: result.downloadUrl,
              filename: result.filename
            }
          }));
        }

        return result;

      } else {
        // Handle export failure
        const errorNotification = {
          type: 'error',
          title: 'Export Failed',
          message: `Failed to generate ${format.toUpperCase()} report.`,
          details: result.error
        };

        // Add retry option if available
        if (result.canRetry && result.retryFunction) {
          errorNotification.onRetry = () => {
            clearNotification();
            return result.retryFunction();
          };
          errorNotification.retryText = `Retry (${result.attempts}/${result.maxRetries})`;
        }

        setExportState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
          notification: errorNotification
        }));

        return result;
      }

    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred during export.';
      
      setExportState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        notification: {
          type: 'error',
          title: 'Export Failed',
          message: `Failed to generate ${format.toUpperCase()} report.`,
          details: errorMessage,
          onRetry: () => exportDepartment(departmentId, format, options)
        }
      }));

      return { success: false, error: errorMessage };

    } finally {
      activeExportRef.current = null;
    }
  }, [updateProgress, clearNotification]);

  /**
   * Cancel current export
   */
  const cancelExport = useCallback(() => {
    if (activeExportRef.current) {
      const cancelled = exportService.cancelExport(activeExportRef.current);
      if (cancelled) {
        setExportState(prev => ({
          ...prev,
          loading: false,
          stage: 'cancelled',
          notification: {
            type: 'info',
            title: 'Export Cancelled',
            message: 'Export operation has been cancelled.'
          }
        }));
      }
      activeExportRef.current = null;
      return cancelled;
    }
    return false;
  }, []);

  /**
   * Reset export state
   */
  const resetExport = useCallback(() => {
    setExportState({
      loading: false,
      progress: 0,
      stage: null,
      error: null,
      notification: null
    });
    activeExportRef.current = null;
  }, []);

  /**
   * Download file manually (for delayed downloads)
   */
  const downloadFile = useCallback((source, filename) => {
    const result = exportService.downloadFile(source, filename);
    
    if (result.success) {
      setNotification({
        type: 'success',
        title: 'Download Started',
        message: `Downloading ${filename}...`
      });
    } else {
      setNotification({
        type: 'error',
        title: 'Download Failed',
        message: result.error
      });
    }

    return result;
  }, [setNotification]);

  return {
    // State
    loading: exportState.loading,
    progress: exportState.progress,
    stage: exportState.stage,
    error: exportState.error,
    notification: exportState.notification,
    
    // Actions
    exportEvaluation,
    exportDepartment,
    cancelExport,
    resetExport,
    downloadFile,
    setNotification,
    clearNotification
  };
};

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default useExport;