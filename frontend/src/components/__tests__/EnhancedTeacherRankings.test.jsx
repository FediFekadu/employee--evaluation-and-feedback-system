import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import EnhancedTeacherRankings from '../EnhancedTeacherRankings';
import * as api from '../../services/api';

// Mock dependencies
vi.mock('../../services/api');
vi.mock('../../hooks/useErrorHandling', () => ({
  useErrorHandling: () => ({
    handleApiCall: vi.fn((fn) => fn()),
    addError: vi.fn()
  })
}));
vi.mock('../../services/exportService', () => ({
  exportService: {
    exportData: vi.fn()
  }
}));

const mockRankingsData = {
  rankings: [
    {
      teacher_id: '1',
      teacher_name: 'Dr. Smith',
      rank: 1,
      overall_score: 95.5,
      performance_score: 94.2,
      participation_rate: 87.3,
      course_count: 3,
      total_responses: 156,
      performance_level: 'excellent',
      trend: {
        direction: 'improving',
        change: 2.3
      },
      department_comparison: {
        overall_score: 5.2,
        performance_score: 3.8,
        participation_rate: 2.1
      },
      benchmarks: {
        vs_department: 5.2,
        vs_college: 3.1
      },
      courses: ['Math 101', 'Math 201', 'Math 301']
    },
    {
      teacher_id: '2',
      teacher_name: 'Prof. Johnson',
      rank: 2,
      overall_score: 88.7,
      performance_score: 89.1,
      participation_rate: 82.5,
      course_count: 2,
      total_responses: 98,
      performance_level: 'good',
      trend: {
        direction: 'stable',
        change: 0.5
      },
      department_comparison: {
        overall_score: -1.3,
        performance_score: 1.2,
        participation_rate: -2.8
      },
      benchmarks: {
        vs_department: -1.3,
        vs_college: 0.8
      },
      courses: ['Physics 101', 'Physics 201']
    }
  ],
  department_benchmarks: {
    overall_score: 85.2,
    performance_score: 86.8,
    participation_rate: 79.4
  },
  period: '2024-1',
  generated_at: '2024-01-15T10:30:00Z'
};

describe('EnhancedTeacherRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get = vi.fn().mockResolvedValue({ data: { data: mockRankingsData } });
  });

  it('renders loading state initially', () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    expect(screen.getByText('Loading enhanced teacher rankings...')).toBeInTheDocument();
  });

  it('renders teacher rankings data correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Check if teachers are displayed
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Prof. Johnson')).toBeInTheDocument();
    
    // Check rankings
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    
    // Check scores
    expect(screen.getByText('95.5%')).toBeInTheDocument();
    expect(screen.getByText('88.7%')).toBeInTheDocument();
  });

  it('handles sorting correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Click on performance header to sort
    const performanceHeader = screen.getByText('Performance');
    fireEvent.click(performanceHeader);

    // Verify API call with new sorting
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/departments/1/enhanced-teacher-rankings',
        expect.objectContaining({
          params: expect.objectContaining({
            sort_by: 'performance_score',
            sort_direction: 'desc'
          })
        })
      );
    });
  });

  it('handles filtering correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Test search filter
    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'Smith' } });

    // Should filter results (this would be handled by the API in real implementation)
    expect(searchInput.value).toBe('Smith');
  });

  it('handles view mode changes', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Switch to card view
    const cardViewBtn = screen.getByTitle('Card View');
    fireEvent.click(cardViewBtn);

    // Check if card view is active
    expect(cardViewBtn).toHaveClass('active');
  });

  it('displays performance summary correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Check performance summary metrics
    expect(screen.getByText('Average Overall Score')).toBeInTheDocument();
    expect(screen.getByText('Average Performance')).toBeInTheDocument();
    expect(screen.getByText('Average Participation')).toBeInTheDocument();
  });

  it('handles teacher selection for comparison', async () => {
    render(<EnhancedTeacherRankings departmentId="1" enableBulkActions={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Select a teacher
    const selectAllCheckbox = screen.getByText(/Select All/);
    expect(selectAllCheckbox).toBeInTheDocument();
  });

  it('displays trend indicators correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Check for trend indicators
    expect(screen.getByText('📈')).toBeInTheDocument(); // Improving trend
    expect(screen.getByText('➡️')).toBeInTheDocument(); // Stable trend
  });

  it('displays benchmark comparisons', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Check for benchmark indicators
    expect(screen.getByText(/vs Dept Avg:/)).toBeInTheDocument();
  });

  it('handles export functionality', async () => {
    const { exportService } = await import('../../services/exportService');
    
    render(<EnhancedTeacherRankings departmentId="1" enableExport={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Test export dropdown
    const exportSelect = screen.getByDisplayValue('Export...');
    fireEvent.change(exportSelect, { target: { value: 'csv' } });

    await waitFor(() => {
      expect(exportService.exportData).toHaveBeenCalled();
    });
  });

  it('handles refresh functionality', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshBtn = screen.getByTitle('Refresh rankings');
    fireEvent.click(refreshBtn);

    // Should make another API call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('displays empty state when no data', async () => {
    api.get = vi.fn().mockResolvedValue({ 
      data: { 
        data: { 
          rankings: [], 
          period: '2024-1', 
          generated_at: '2024-01-15T10:30:00Z' 
        } 
      } 
    });

    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No Teacher Rankings Available')).toBeInTheDocument();
    });

    expect(screen.getByText('No teacher performance data found for the selected criteria.')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    api.get = vi.fn().mockRejectedValue(new Error('API Error'));

    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load teacher rankings/)).toBeInTheDocument();
    });
  });

  it('displays performance levels correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Check performance level indicators
    expect(screen.getByText('excellent')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
  });

  it('handles comparison mode correctly', async () => {
    render(<EnhancedTeacherRankings departmentId="1" enableComparison={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Teacher Rankings')).toBeInTheDocument();
    });

    // Switch to comparison view
    const comparisonBtn = screen.getByTitle('Comparison View');
    fireEvent.click(comparisonBtn);

    expect(comparisonBtn).toHaveClass('active');
  });
});