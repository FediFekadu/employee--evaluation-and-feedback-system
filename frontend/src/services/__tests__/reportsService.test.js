import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import api from '../api';
import {
  fetchReportsData,
  fetchAnalyticsData,
  fetchEvaluationResults,
  validateFilters,
  buildFilterQueryString,
} from '../reportsService';

// Mock the api module
vi.mock('../api');

describe('reportsService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchReportsData', () => {
    it('should fetch reports data successfully with default parameters', async () => {
      const mockData = {
        data: [
          { id: 1, course: { title: 'Math 101' }, status: 'Active' },
          { id: 2, course: { title: 'Physics 201' }, status: 'Closed' },
        ],
      };

      api.get.mockResolvedValue({ data: mockData });

      const result = await fetchReportsData(1);

      expect(api.get).toHaveBeenCalledWith('/departments/1/reports', {
        params: {
          optimize: false,
          summary_only: false,
          period: 'month',
          cache: true,
        },
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });

    it('should fetch reports data with custom parameters', async () => {
      const mockData = { data: [] };
      api.get.mockResolvedValue({ data: mockData });

      await fetchReportsData(1, {
        optimize: true,
        summary_only: true,
        period: 'quarter',
        cache: false,
      });

      expect(api.get).toHaveBeenCalledWith('/departments/1/reports', {
        params: {
          optimize: true,
          summary_only: true,
          period: 'quarter',
          cache: false,
        },
        timeout: 30000,
      });
    });

    it('should handle invalid department ID', async () => {
      const result = await fetchReportsData(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NetworkError');
      expect(result.message).toContain('Invalid department ID');
    });

    it('should handle network errors', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const result = await fetchReportsData(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NetworkError');
      expect(result.message).toContain('Network error');
    });

    it('should handle 401 unauthorized errors', async () => {
      api.get.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      });

      const result = await fetchReportsData(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(result.status).toBe(401);
    });

    it('should handle 403 forbidden errors', async () => {
      api.get.mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      });

      const result = await fetchReportsData(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden');
      expect(result.status).toBe(403);
    });

    it('should handle 404 not found errors', async () => {
      api.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      });

      const result = await fetchReportsData(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NotFound');
      expect(result.status).toBe(404);
    });

    it('should handle 500 server errors', async () => {
      api.get.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      const result = await fetchReportsData(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ServerError');
      expect(result.status).toBe(500);
    });
  });

  describe('fetchAnalyticsData', () => {
    it('should fetch analytics data successfully with default parameters', async () => {
      const mockData = {
        data: {
          summary: {
            total_evaluations: 10,
            active_evaluations: 5,
            closed_evaluations: 5,
          },
          trends: {},
          period: 'month',
        },
      };

      api.get.mockResolvedValue({ data: mockData });

      const result = await fetchAnalyticsData(1);

      expect(api.get).toHaveBeenCalledWith('/departments/1/analytics', {
        params: {
          cache: true,
          period: 'month',
        },
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
    });

    it('should fetch analytics data with custom parameters', async () => {
      const mockData = { data: {} };
      api.get.mockResolvedValue({ data: mockData });

      await fetchAnalyticsData(1, {
        period: 'year',
        cache: false,
      });

      expect(api.get).toHaveBeenCalledWith('/departments/1/analytics', {
        params: {
          cache: false,
          period: 'year',
        },
        timeout: 30000,
      });
    });

    it('should handle invalid department ID', async () => {
      const result = await fetchAnalyticsData('invalid');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NetworkError');
    });

    it('should handle network errors', async () => {
      api.get.mockRejectedValue(new Error('Connection failed'));

      const result = await fetchAnalyticsData(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NetworkError');
    });
  });

  describe('fetchEvaluationResults', () => {
    it('should fetch evaluation results with default parameters', async () => {
      const mockData = {
        data: [
          { id: 1, course: { title: 'Math 101' } },
          { id: 2, course: { title: 'Physics 201' } },
        ],
        meta: {
          current_page: 1,
          per_page: 50,
          total: 2,
        },
      };

      api.get.mockResolvedValue({ data: mockData });

      const result = await fetchEvaluationResults(1);

      expect(api.get).toHaveBeenCalledWith('/departments/1/evaluation-results', {
        params: {
          page: 1,
          per_page: 50,
          sort_by: 'opened_at',
          sort_direction: 'desc',
        },
        timeout: 30000,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData.data);
      expect(result.meta).toEqual(mockData.meta);
    });

    it('should fetch evaluation results with pagination', async () => {
      const mockData = { data: [], meta: {} };
      api.get.mockResolvedValue({ data: mockData });

      await fetchEvaluationResults(1, {
        page: 2,
        per_page: 25,
      });

      expect(api.get).toHaveBeenCalledWith('/departments/1/evaluation-results', {
        params: {
          page: 2,
          per_page: 25,
          sort_by: 'opened_at',
          sort_direction: 'desc',
        },
        timeout: 30000,
      });
    });

    it('should fetch evaluation results with sorting', async () => {
      const mockData = { data: [], meta: {} };
      api.get.mockResolvedValue({ data: mockData });

      await fetchEvaluationResults(1, {
        sort_by: 'weighted_score',
        sort_direction: 'asc',
      });

      expect(api.get).toHaveBeenCalledWith('/departments/1/evaluation-results', {
        params: {
          page: 1,
          per_page: 50,
          sort_by: 'weighted_score',
          sort_direction: 'asc',
        },
        timeout: 30000,
      });
    });

    it('should fetch evaluation results with filters', async () => {
      const mockData = { data: [], meta: {} };
      api.get.mockResolvedValue({ data: mockData });

      await fetchEvaluationResults(1, {
        filters: {
          academicYear: '2024-2025',
          semester: '1st Semester',
          status: 'Active',
        },
      });

      expect(api.get).toHaveBeenCalledWith('/departments/1/evaluation-results', {
        params: {
          page: 1,
          per_page: 50,
          sort_by: 'opened_at',
          sort_direction: 'desc',
          filter_academicYear: '2024-2025',
          filter_semester: '1st Semester',
          filter_status: 'Active',
        },
        timeout: 30000,
      });
    });

    it('should ignore empty filter values', async () => {
      const mockData = { data: [], meta: {} };
      api.get.mockResolvedValue({ data: mockData });

      await fetchEvaluationResults(1, {
        filters: {
          academicYear: '2024-2025',
          semester: '',
          status: null,
          yearLevel: undefined,
        },
      });

      expect(api.get).toHaveBeenCalledWith('/departments/1/evaluation-results', {
        params: {
          page: 1,
          per_page: 50,
          sort_by: 'opened_at',
          sort_direction: 'desc',
          filter_academicYear: '2024-2025',
        },
        timeout: 30000,
      });
    });

    it('should handle invalid department ID', async () => {
      const result = await fetchEvaluationResults(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NetworkError');
    });

    it('should provide default meta when not in response', async () => {
      const mockData = {
        data: [{ id: 1 }],
      };

      api.get.mockResolvedValue({ data: mockData });

      const result = await fetchEvaluationResults(1);

      expect(result.meta).toBeDefined();
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.per_page).toBe(50);
    });
  });

  describe('validateFilters', () => {
    it('should validate valid filters', () => {
      const filters = {
        academicYear: '2024-2025',
        semester: '1st Semester',
        status: 'Active',
      };

      const result = validateFilters(filters);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid status', () => {
      const filters = {
        status: 'InvalidStatus',
      };

      const result = validateFilters(filters);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid status');
    });

    it('should reject invalid academic year format', () => {
      const filters = {
        academicYear: '2024',
      };

      const result = validateFilters(filters);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid academic year format');
    });

    it('should accept valid academic year format', () => {
      const filters = {
        academicYear: '2024-2025',
      };

      const result = validateFilters(filters);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle null filters', () => {
      const result = validateFilters(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Filters must be an object');
    });

    it('should handle empty filters', () => {
      const result = validateFilters({});

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accumulate multiple errors', () => {
      const filters = {
        academicYear: 'invalid',
        status: 'InvalidStatus',
      };

      const result = validateFilters(filters);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('buildFilterQueryString', () => {
    it('should build query string from filters', () => {
      const filters = {
        academicYear: '2024-2025',
        semester: '1st Semester',
        status: 'Active',
      };

      const queryString = buildFilterQueryString(filters);

      expect(queryString).toContain('filter_academicYear=2024-2025');
      expect(queryString).toContain('filter_semester=1st+Semester');
      expect(queryString).toContain('filter_status=Active');
    });

    it('should ignore empty values', () => {
      const filters = {
        academicYear: '2024-2025',
        semester: '',
        status: null,
        yearLevel: undefined,
      };

      const queryString = buildFilterQueryString(filters);

      expect(queryString).toContain('filter_academicYear=2024-2025');
      expect(queryString).not.toContain('filter_semester');
      expect(queryString).not.toContain('filter_status');
      expect(queryString).not.toContain('filter_yearLevel');
    });

    it('should return empty string for null filters', () => {
      const queryString = buildFilterQueryString(null);

      expect(queryString).toBe('');
    });

    it('should return empty string for empty filters', () => {
      const queryString = buildFilterQueryString({});

      expect(queryString).toBe('');
    });

    it('should handle special characters in values', () => {
      const filters = {
        course: 'Math & Physics',
      };

      const queryString = buildFilterQueryString(filters);

      expect(queryString).toContain('filter_course=Math+%26+Physics');
    });
  });
});
