import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import EnhancedPerformanceInsights from '../EnhancedPerformanceInsights';
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
vi.mock('../InteractiveVisualAnalytics', () => {
  return function MockInteractiveVisualAnalytics({ className }) {
    return <div className={className} data-testid="interactive-visual-analytics">Mock Interactive Visual Analytics</div>;
  };
});

const mockInsightsData = {
  performance_summary: {
    overall_score: 87.5,
    performance_score: 89.2,
    participation_rate: 82.3,
    satisfaction_score: 85.7
  },
  trend_analysis: {
    overall_trend: 'improving',
    performance_trend: 'improving',
    participation_trend: 'stable',
    satisfaction_trend: 'improving',
    improvement_rate: 3.2,
    performance: {
      direction: 'improving',
      change: 2.8,
      prediction: 4.1
    },
    participation: {
      direction: 'stable',
      change: 0.3,
      prediction: 1.2
    }
  },
  benchmark_analysis: {
    overall: 2.3,
    performance: 3.1,
    participation: -1.2,
    satisfaction: 1.8
  },
  predictive_analysis: {
    performance: {
      forecast: 91.5,
      confidence: 85,
      range: { min: 88.2, max: 94.8 },
      factors: ['trend consistency', 'seasonal patterns']
    },
    participation: {
      forecast: 84.1,
      confidence: 78,
      range: { min: 80.5, max: 87.7 },
      factors: ['engagement initiatives', 'course scheduling']
    }
  },
  actionable_insights: [
    {
      type: 'improvement',
      title: 'Enhance Student Engagement',
      description: 'Participation rates show room for improvement in certain courses.',
      expected_impact: '+5% participation increase',
      timeline: '2-3 months',
      priority: 'high',
      actions: ['Implement interactive sessions', 'Review course materials']
    },
    {
      type: 'maintenance',
      title: 'Maintain Performance Standards',
      description: 'Current performance levels are excellent and should be sustained.',
      expected_impact: 'Sustained excellence',
      timeline: 'Ongoing',
      priority: 'medium',
      actions: ['Continue current practices', 'Monitor trends']
    }
  ],
  performance_alerts: [
    {
      severity: 'medium',
      title: 'Participation Rate Decline',
      description: 'Slight decline in participation rates observed in recent evaluations.',
      recommendation: 'Review engagement strategies and course delivery methods.',
      action: 'Create Action Plan'
    }
  ],
  key_metrics: {
    total_evaluations: 45,
    total_responses: 1250,
    response_rate: 78.5,
    completion_rate: 92.3
  },
  visualization_data: {
    performance_trends: [],
    participation_analysis: [],
    comparative_benchmarks: []
  },
  benchmark_data: {},
  generated_at: '2024-01-15T10:30:00Z'
};

describe('EnhancedPerformanceInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get = vi.fn().mockResolvedValue({ data: { data: mockInsightsData } });
  });

  it('renders loading state initially', () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    expect(screen.getByText('Loading enhanced performance insights...')).toBeInTheDocument();
  });

  it('renders performance insights data correctly', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check KPI section
    expect(screen.getByText('📊 Key Performance Indicators')).toBeInTheDocument();
    expect(screen.getByText('Overall Performance')).toBeInTheDocument();
    expect(screen.getByText('Teaching Performance')).toBeInTheDocument();
    expect(screen.getByText('Participation Rate')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction Score')).toBeInTheDocument();
  });

  it('displays KPI values correctly', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check KPI values
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText('89.2%')).toBeInTheDocument();
    expect(screen.getByText('82.3%')).toBeInTheDocument();
    expect(screen.getByText('85.7%')).toBeInTheDocument();
  });

  it('handles analysis mode changes', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Change analysis mode
    const modeSelect = screen.getByDisplayValue('Comprehensive Analysis');
    fireEvent.change(modeSelect, { target: { value: 'trends' } });

    // Verify API call with new mode
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/departments/1/enhanced-performance-insights',
        expect.objectContaining({
          params: expect.objectContaining({
            analysis_mode: 'trends'
          })
        })
      );
    });
  });

  it('handles time range changes', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Change time range
    const timeSelect = screen.getByDisplayValue('Current vs Previous Semester');
    fireEvent.change(timeSelect, { target: { value: 'year' } });

    // Should trigger data reload
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('handles metric selection', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Toggle a metric
    const engagementCheckbox = screen.getByLabelText('Engagement');
    fireEvent.click(engagementCheckbox);

    expect(engagementCheckbox).toBeChecked();
  });

  it('displays trend analysis correctly', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check trend indicators
    expect(screen.getByText('Improving')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
    expect(screen.getByText('➡️')).toBeInTheDocument();
  });

  it('displays benchmark analysis', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check benchmark section
    expect(screen.getByText('⚖️ Benchmark Analysis')).toBeInTheDocument();
  });

  it('displays predictive analysis when enabled', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" enablePredictiveAnalytics={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check predictive section
    expect(screen.getByText('🔮 Predictive Analysis')).toBeInTheDocument();
    expect(screen.getByText('91.5%')).toBeInTheDocument(); // Forecast value
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('displays performance alerts', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check alerts section
    expect(screen.getByText('🚨 Performance Alerts')).toBeInTheDocument();
    expect(screen.getByText('Participation Rate Decline')).toBeInTheDocument();
    expect(screen.getByText('Create Action Plan')).toBeInTheDocument();
  });

  it('displays actionable recommendations', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check recommendations section
    expect(screen.getByText('💡 Actionable Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Enhance Student Engagement')).toBeInTheDocument();
    expect(screen.getByText('Maintain Performance Standards')).toBeInTheDocument();
  });

  it('handles recommendation actions', async () => {
    const mockOnInsightAction = vi.fn();
    render(<EnhancedPerformanceInsights departmentId="1" onInsightAction={mockOnInsightAction} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Click on a recommendation action
    const actionBtn = screen.getByText('Implement interactive sessions');
    fireEvent.click(actionBtn);

    expect(mockOnInsightAction).toHaveBeenCalled();
  });

  it('handles export functionality', async () => {
    const { exportService } = await import('../../services/exportService');
    
    render(<EnhancedPerformanceInsights departmentId="1" enableExport={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Test export dropdown
    const exportSelect = screen.getByDisplayValue('Export...');
    fireEvent.change(exportSelect, { target: { value: 'summary' } });

    await waitFor(() => {
      expect(exportService.exportData).toHaveBeenCalled();
    });
  });

  it('handles refresh functionality', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshBtn = screen.getByTitle('Refresh insights');
    fireEvent.click(refreshBtn);

    // Should make another API call
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('displays interactive visualizations', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check for interactive analytics component
    expect(screen.getByTestId('interactive-visual-analytics')).toBeInTheDocument();
  });

  it('displays comparison target correctly', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check comparison selector
    const comparisonSelect = screen.getByDisplayValue('vs Department Average');
    fireEvent.change(comparisonSelect, { target: { value: 'college' } });

    // Should trigger data reload
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it('displays empty state when no data', async () => {
    api.get = vi.fn().mockResolvedValue({ data: { data: null } });

    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No Performance Insights Available')).toBeInTheDocument();
    });

    expect(screen.getByText('No performance data found for the selected criteria and time range.')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    api.get = vi.fn().mockRejectedValue(new Error('API Error'));

    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load performance insights/)).toBeInTheDocument();
    });
  });

  it('displays priority levels correctly', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check priority indicators
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('handles alert actions', async () => {
    const mockOnInsightAction = vi.fn();
    render(<EnhancedPerformanceInsights departmentId="1" onInsightAction={mockOnInsightAction} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Click on alert action
    const alertActionBtn = screen.getByText('Create Action Plan');
    fireEvent.click(alertActionBtn);

    expect(mockOnInsightAction).toHaveBeenCalled();
  });

  it('displays metadata correctly', async () => {
    render(<EnhancedPerformanceInsights departmentId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Enhanced Performance Insights')).toBeInTheDocument();
    });

    // Check metadata
    expect(screen.getByText(/Analysis Mode: comprehensive/)).toBeInTheDocument();
    expect(screen.getByText(/Generated:/)).toBeInTheDocument();
  });
});