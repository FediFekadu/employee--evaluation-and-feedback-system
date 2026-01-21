import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExport } from '../useExport';

// Mock the export service
vi.mock('../../services/exportService', () => ({
  default: {
    exportEvaluation: vi.fn(),
    exportDepartment: vi.fn(),
    downloadFile: vi.fn(),
    cancelExport: vi.fn()
  }
}));

describe('useExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useExport());

    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.stage).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.notification).toBe(null);
  });

  it('should provide export functions', () => {
    const { result } = renderHook(() => useExport());

    expect(typeof result.current.exportEvaluation).toBe('function');
    expect(typeof result.current.exportDepartment).toBe('function');
    expect(typeof result.current.cancelExport).toBe('function');
    expect(typeof result.current.resetExport).toBe('function');
    expect(typeof result.current.downloadFile).toBe('function');
    expect(typeof result.current.setNotification).toBe('function');
    expect(typeof result.current.clearNotification).toBe('function');
  });

  it('should handle successful export', async () => {
    const mockExportService = await import('../../services/exportService');
    mockExportService.default.exportEvaluation.mockResolvedValue({
      success: true,
      blob: new Blob(['test'], { type: 'text/csv' }),
      filename: 'test.csv',
      size: 4
    });

    mockExportService.default.downloadFile.mockReturnValue({
      success: true,
      filename: 'test.csv'
    });

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportEvaluation(1, 'csv');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.notification?.type).toBe('success');
  });

  it('should handle export failure', async () => {
    const mockExportService = await import('../../services/exportService');
    mockExportService.default.exportEvaluation.mockResolvedValue({
      success: false,
      error: 'Export failed',
      canRetry: true,
      retryFunction: vi.fn()
    });

    const { result } = renderHook(() => useExport());

    await act(async () => {
      await result.current.exportEvaluation(1, 'csv');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Export failed');
    expect(result.current.notification?.type).toBe('error');
  });

  it('should reset export state', () => {
    const { result } = renderHook(() => useExport());

    act(() => {
      result.current.setNotification({
        type: 'info',
        message: 'Test notification'
      });
    });

    expect(result.current.notification).toBeTruthy();

    act(() => {
      result.current.resetExport();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.stage).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.notification).toBe(null);
  });

  it('should clear notifications', () => {
    const { result } = renderHook(() => useExport());

    act(() => {
      result.current.setNotification({
        type: 'info',
        message: 'Test notification'
      });
    });

    expect(result.current.notification).toBeTruthy();

    act(() => {
      result.current.clearNotification();
    });

    expect(result.current.notification).toBe(null);
  });
});