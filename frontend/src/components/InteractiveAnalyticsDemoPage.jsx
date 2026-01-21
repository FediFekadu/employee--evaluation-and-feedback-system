import React, { useState } from 'react';
import {
  InteractiveVisualAnalytics,
  InteractiveTeacherRankings,
  InteractivePerformanceInsights,
  DashboardCard
} from './index';

/**
 * Interactive Analytics Demo Page
 * 
 * Demonstrates the interactive visual analytics components with
 * filtering, sorting, drill-down capabilities, tooltips, and export functionality.
 */
function InteractiveAnalyticsDemoPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('1');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1year');

  // Mock department options
  const departments = [
    { id: '1', name: 'Computer Science' },
    { id: '2', name: 'Mathematics' },
    { id: '3', name: 'Physics' },
    { id: '4', name: 'Chemistry' }
  ];

  const handleChartClick = (chartType, data) => {
    console.log('Chart clicked:', chartType, data);
    // Handle chart interactions - could navigate to detailed view, filter data, etc.
  };

  return (
    <div className="interactive-analytics-demo">
      <div className="demo-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="text-display">Interactive Visual Analytics Demo</h1>
        <p className="text-body-large" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Explore enhanced charts with interactivity, filtering, drill-down capabilities, tooltips, and export functionality.
        </p>
      </div>

      {/* Demo Controls */}
      <DashboardCard
        title="Demo Controls"
        subtitle="Configure the analytics components"
        icon="⚙️"
        variant="secondary"
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <div className="demo-controls enhanced-flex enhanced-gap-4 enhanced-flex-wrap">
          <div className="control-group">
            <label className="text-caption font-medium">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="enhanced-input"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="text-caption font-medium">Time Range</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="enhanced-input"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="2years">Last 2 Years</option>
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Interactive Visual Analytics */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <InteractiveVisualAnalytics
          departmentId={selectedDepartment}
          chartTypes={['performance_distribution', 'participation_trends', 'score_comparison']}
          timeRange={selectedTimeRange}
          onChartClick={handleChartClick}
          enableExport={true}
          enableFiltering={true}
          enableDrillDown={true}
          showTooltips={true}
          showLegend={true}
          refreshInterval={null} // Disable auto-refresh for demo
        />
      </div>

      {/* Interactive Teacher Rankings */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <InteractiveTeacherRankings
          departmentId={selectedDepartment}
          timeRange={selectedTimeRange}
          enableExport={true}
          enableFiltering={true}
          showTrends={true}
          showBenchmarks={true}
          pageSize={10}
        />
      </div>

      {/* Interactive Performance Insights */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <InteractivePerformanceInsights
          departmentId={selectedDepartment}
          timeRange={selectedTimeRange}
          enableExport={true}
          enableComparison={true}
          showTrends={true}
          showBenchmarks={true}
          comparisonMode="department"
        />
      </div>

      {/* Feature Highlights */}
      <DashboardCard
        title="Interactive Features"
        subtitle="Key capabilities of the enhanced analytics components"
        icon="✨"
        variant="info"
      >
        <div className="feature-highlights">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4 className="feature-title text-heading-4">Interactive Charts</h4>
                <p className="feature-description text-body-small">
                  Click on chart elements to drill down, filter data, and explore detailed insights.
                  Hover for contextual tooltips with additional information.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🔍</div>
              <div className="feature-content">
                <h4 className="feature-title text-heading-4">Advanced Filtering</h4>
                <p className="feature-description text-body-small">
                  Filter data by performance level, evaluation count, score ranges, and more.
                  Real-time updates as you adjust filter criteria.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <div className="feature-content">
                <h4 className="feature-title text-heading-4">Sortable Rankings</h4>
                <p className="feature-description text-body-small">
                  Sort teacher rankings by any column with visual indicators.
                  Multi-level sorting and trend analysis with benchmark comparisons.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <div className="feature-content">
                <h4 className="feature-title text-heading-4">Export Functionality</h4>
                <p className="feature-description text-body-small">
                  Export charts and data in multiple formats (CSV, Excel, PDF).
                  Maintains visual formatting and includes filtered data.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-content">
                <h4 className="feature-title text-heading-4">Comparative Analysis</h4>
                <p className="feature-description text-body-small">
                  Compare performance against department averages, benchmarks, and peer groups.
                  Historical trend analysis with confidence indicators.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💡</div>
              <div className="feature-content">
                <h4 className="feature-title text-heading-4">Smart Recommendations</h4>
                <p className="feature-description text-body-small">
                  AI-powered insights and recommendations based on performance data.
                  Prioritized action items with impact and effort estimates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

export default InteractiveAnalyticsDemoPage;