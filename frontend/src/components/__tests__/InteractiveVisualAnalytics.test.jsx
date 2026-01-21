import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import InteractiveVisualAnalytics from '../InteractiveVisualAnalytics';

// Mock the dependencies
vi.mock('../../hooks/useApiRequest', () => ({
  useApiRequest: () => ({
    loading: false,
    get: vi.fn()
  })
}));

vi.mock('../../services/exportService', () => ({
  default: {
    exportDepartment: vi.fn(),
    downloadFile: vi.fn()
  }
}));

describe('InteractiveVisualAnalytics', () => {
  const defaultProps = {
    departmentId: '1',
    chartTypes: ['performance_distribution'],
    enableExport: true,
    enableFiltering: true,
    enableDrillDown: true,
    showTooltips: true
  };

  it('renders without crashing', () => {
    const { container } = render(<InteractiveVisualAnalytics {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className and height', () => {
    const { container } = render(
      <InteractiveVisualAnalytics 
        {...defaultProps} 
        className="custom-class" 
        height="600px" 
      />
    );
    
    const element = container.firstChild;
    expect(element).toHaveClass('interactive-visual-analytics');
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveStyle({ height: '600px' });
  });

  it('handles minimal props', () => {
    const { container } = render(
      <InteractiveVisualAnalytics departmentId="1" />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('accepts all prop types without errors', () => {
    const allProps = {
      departmentId: '123',
      chartTypes: ['pie', 'bar', 'line'],
      period: '2024-01',
      timeRange: '6months',
      height: '800px',
      className: 'test-class',
      onChartClick: vi.fn(),
      showLegend: false,
      showTooltips: false,
      refreshInterval: 30000,
      enableExport: false,
      enableFiltering: false,
      enableDrillDown: false
    };

    const { container } = render(<InteractiveVisualAnalytics {...allProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});