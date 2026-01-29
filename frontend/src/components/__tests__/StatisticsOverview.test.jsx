import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatisticsOverview from '../StatisticsOverview';

describe('StatisticsOverview', () => {
  const mockEvaluations = [
    {
      id: 1,
      status: 'Active',
      teacher: { id: 1, name: 'John Doe' },
      participation: { total_responses: 25, participation_rate: 80 }
    },
    {
      id: 2,
      status: 'Closed',
      teacher: { id: 2, name: 'Jane Smith' },
      participation: { total_responses: 30, participation_rate: 90 }
    },
    {
      id: 3,
      status: 'Active',
      teacher: { id: 1, name: 'John Doe' },
      participation: { total_responses: 20, participation_rate: 70 }
    }
  ];

  it('renders statistics cards correctly', () => {
    render(<StatisticsOverview evaluations={mockEvaluations} />);
    
    // Check if all stat cards are rendered
    expect(screen.getByText('Total Evaluations')).toBeInTheDocument();
    expect(screen.getByText('Total Instructors')).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Avg Participation')).toBeInTheDocument();
    
    // Check calculated values
    expect(screen.getByText('3')).toBeInTheDocument(); // Total evaluations
    expect(screen.getByText('2')).toBeInTheDocument(); // Unique instructors
    expect(screen.getByText('75')).toBeInTheDocument(); // Total students (25+30+20)
    expect(screen.getByText('80%')).toBeInTheDocument(); // Average participation
  });

  it('handles empty evaluations array', () => {
    render(<StatisticsOverview evaluations={[]} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Total evaluations
    expect(screen.getByText('0%')).toBeInTheDocument(); // Average participation
  });

  it('handles undefined evaluations prop', () => {
    render(<StatisticsOverview />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});