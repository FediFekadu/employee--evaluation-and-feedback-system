import { describe, it, expect, vi, beforeEach } from 'vitest';
import exportService from '../exportService';

// Mock axios
vi.mock('../api', () => ({
  default: {
    post: vi.fn()
  }
}));

describe('ExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportService.clearAll();
  });

  describe('exportEvaluation', () => {
    it('should validate format parameter', async () => {
      const result = await exportService.exportEvaluation(1, 'invalid-format');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format');
    });

    it('should prevent duplicate exports', async () => {
      // Start first export
      const promise1 = exportService.exportEvaluation(1, 'csv');
      
      // Try to start second export with same parameters
      const result2 = await exportService.exportEvaluation(1, 'csv');
      
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Export already in progress');
      
      // Wait for first export to complete (it will fail due to mocked API)
      await promise1;
    });

    it('should track active exports', () => {
      const activeExports = exportService.getActiveExports();
      expect(Array.isArray(activeExports)).toBe(true);
    });
  });

  describe('exportDepartment', () => {
    it('should validate format parameter', async () => {
      const result = await exportService.exportDepartment(1, 'invalid-format');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format');
    });

    it('should accept valid options', async () => {
      const options = {
        evaluations: [1, 2, 3],
        filters: { status: 'active' },
        sortBy: 'date',
        sortDirection: 'desc'
      };

      // This will fail due to mocked API, but should validate options
      const result = await exportService.exportDepartment(1, 'csv', options);
      
      // The error should be from API call, not validation
      expect(result.error).not.toContain('Unsupported export format');
    });
  });

  describe('downloadFile', () => {
    it('should handle blob downloads', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const result = exportService.downloadFile(blob, 'test.txt');
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test.txt');
    });

    it('should handle invalid sources', () => {
      const result = exportService.downloadFile(null, 'test.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid source');
    });
  });

  describe('cancelExport', () => {
    it('should cancel active exports', () => {
      // Mock an active export
      exportService.activeExports.set('test-export', true);
      
      const result = exportService.cancelExport('test-export');
      expect(result).toBe(true);
      
      // Should not be active anymore
      expect(exportService.getActiveExports()).not.toContain('test-export');
    });

    it('should return false for non-existent exports', () => {
      const result = exportService.cancelExport('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all active exports and retry attempts', () => {
      // Mock some active state
      exportService.activeExports.set('test1', true);
      exportService.retryAttempts.set('test2', 2);
      
      exportService.clearAll();
      
      expect(exportService.getActiveExports()).toHaveLength(0);
      expect(exportService.retryAttempts.size).toBe(0);
    });
  });
});