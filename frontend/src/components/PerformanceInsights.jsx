import React, { useState, useEffect, useMemo } from 'react';
import { useErrorHandling } from '../hooks/useErrorHandling';
import api from '../services/api';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';
import ErrorAlert from './ErrorHandling/ErrorAlert';
import VisualAnalytics from './VisualAnalytics';

/**
 * PerformanceInsights Component
 * 
 * Displays comprehensive performance insights including trends, benchmarking,
 * and actionable recommendations for department improvement.
 */
function PerformanceInsights({ 
  departmentId, 
  periods = null,
  includeTrends = true,
  includeBenchmarking = true,
  className = '',
  onInsightClick = null,
  refreshInterval = null
}) {
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState(periods);
  const [refreshing, setRefreshing] = useState(false);

  const { handleApiCall, addError } = useErrorHandling();

  // Generate default periods if not provided
  const getDefaultPeriods = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentSemester = currentMonth <= 6 ? 1 : 2;
    
    return [
      `${currentYear}-${currentSemester}`, // Current period
      currentSemester === 1 ? `${currentYear - 1}-2` : `${currentYear}-1` // Previous period
    ];
  };

  // Load performance insights data
  const loadPerformanceInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const periodsToUse = selectedPeriods || getDefaultPeriods();
      
      const params = {
        periods: periodsToUse,
        include_trends: includeTrends,
        include_benchmarking: includeBenchmarking,
      };

      const response = await handleApiCall(
        () => api.get(`/departments/${departmentId}/performance-insights`, { params }),
        'performance_insights_load'
      );

      setInsightsData(response.data.data);
    } catch (err) {
      console.error('Failed to load performance insights:', err);
      const errorId = addError(err, 'performance_insights_load');
      setError('Failed to load performance insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadPerformanceInsights();
    } catch (err) {
      console.error('Failed to refresh performance insights:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle period selection change
  const handlePeriodChange = (newPeriods) => {
    setSelectedPeriods(newPeriods);
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (departmentId) {
      loadPerformanceInsights();
    }
  }, [departmentId, selectedPeriods, includeTrends, includeBenchmarking]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(handleRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Memoized trend analysis
  const trendAnalysis = useMemo(() => {
    if (!insightsData?.trends) return null;

    const { data, changes, overall_trend } = insightsData.trends;
    
    return {
      direction: overall_trend.direction,
      performanceChange: overall_trend.performance_change,
      participationChange: overall_trend.participation_change,
      overallChange: overall_trend.overall_change,
      strength: Math.abs(overall_trend.overall_change) * 10, // Scale to 0-100
      latestChange: changes[changes.length - 1],
      periodCount: data.length,
    };
  }, [insightsData]);

  // Memoized insight categories
  const insightCategories = useMemo(() => {
    if (!insightsData?.actionable_insights) return { positive: [], warning: [], alert: [] };

    return insightsData.actionable_insights.reduce((categories, insight) => {
      categories[insight.type] = categories[insight.type] || [];
      categories[insight.type].push(insight);
      return categories;
    }, { positive: [], warning: [], alert: [] });
  }, [insightsData]);

  // Format percentage change
  const formatChange = (value, showSign = true) => {
    if (value === 0) return '0%';
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Get trend icon
  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  // Get insight icon
  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return '✅';
      case 'warning': return '⚠️';
      case 'alert': return '🚨';
      default: return 'ℹ️';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`performance-insights-container loading ${className}`}>
        <LoadingSpinner size="large" showMessage={false} showElapsed={false} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`performance-insights-container error ${className}`}>
        <ErrorAlert
          error={{ response: { data: { message: error } } }}
          onRetry={loadPerformanceInsights}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  // No data state
  if (!insightsData) {
    return (
      <div className={`performance-insights-container no-data ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Performance Insights</h3>
          <p>No performance insights data available for the selected periods.</p>
          <button className="dept-btn dept-btn-primary" onClick={loadPerformanceInsights}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-insights-container ${className}`}>
      {/* Header with controls */}
      <div className="insights-header">
        <h3 className="insights-title">Performance Insights</h3>
        <div className="insights-controls">
          <select
            value={selectedPeriods ? selectedPeriods.join(',') : ''}
            onChange={(e) => {
              const periods = e.target.value ? e.target.value.split(',') : getDefaultPeriods();
              handlePeriodChange(periods);
            }}
            className="period-select"
          >
            <option value="">Current vs Previous</option>
            <option value="2024-1,2023-2,2023-1">Last 3 Semesters</option>
            <option value="2024-2,2024-1,2023-2,2023-1">Last 4 Semesters</option>
          </select>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh insights"
          >
            {refreshing ? '🔄' : '↻'}
          </button>
        </div>
      </div>

      <div className="insights-content">
        {/* Current Performance Overview */}
        <div className="insights-section current-performance">
          <h4 className="section-title">📊 Current Performance</h4>
          <div className="performance-overview">
            <div className="overview-card">
              <div className="overview-value">
                {insightsData.current_performance.statistics.average_performance_score.toFixed(1)}%
              </div>
              <div className="overview-label">Average Performance</div>
              {trendAnalysis && (
                <div className={`overview-change ${trendAnalysis.performanceChange >= 0 ? 'positive' : 'negative'}`}>
                  {formatChange(trendAnalysis.performanceChange)} from previous period
                </div>
              )}
            </div>
            
            <div className="overview-card">
              <div className="overview-value">
                {insightsData.current_performance.statistics.average_participation_rate.toFixed(1)}%
              </div>
              <div className="overview-label">Participation Rate</div>
              {trendAnalysis && (
                <div className={`overview-change ${trendAnalysis.participationChange >= 0 ? 'positive' : 'negative'}`}>
                  {formatChange(trendAnalysis.participationChange)} from previous period
                </div>
              )}
            </div>
            
            <div className="overview-card">
              <div className="overview-value">
                {insightsData.current_performance.statistics.total_evaluations}
              </div>
              <div className="overview-label">Total Evaluations</div>
            </div>
            
            <div className="overview-card">
              <div className="overview-value">
                {insightsData.current_performance.statistics.total_responses}
              </div>
              <div className="overview-label">Total Responses</div>
            </div>
          </div>

          {/* Performance Distribution */}
          {insightsData.current_performance.performance_distribution && (
            <div className="distribution-summary">
              <h5>Performance Distribution</h5>
              <div className="distribution-stats">
                {Object.entries(insightsData.current_performance.performance_distribution.distribution).map(([level, data]) => (
                  <div key={level} className="distribution-stat">
                    <span className="distribution-label">
                      {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="distribution-value">
                      {data.count} ({data.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trend Analysis */}
        {includeTrends && trendAnalysis && (
          <div className="insights-section trends-section">
            <h4 className="section-title">
              {getTrendIcon(trendAnalysis.direction)} Trend Analysis
            </h4>
            <div className="trend-summary">
              <div className="trend-overview">
                <div className="trend-direction">
                  <span className="trend-label">Overall Trend:</span>
                  <span className={`trend-value ${trendAnalysis.direction}`}>
                    {trendAnalysis.direction.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="trend-strength">
                  <span className="trend-label">Change Magnitude:</span>
                  <span className="trend-value">
                    {formatChange(trendAnalysis.overallChange)}
                  </span>
                </div>
              </div>
              
              {trendAnalysis.latestChange && (
                <div className="latest-change">
                  <h6>Latest Period Change ({trendAnalysis.latestChange.from_period} → {trendAnalysis.latestChange.to_period})</h6>
                  <div className="change-metrics">
                    <span className="change-metric">
                      Performance: {formatChange(trendAnalysis.latestChange.performance_change)}
                    </span>
                    <span className="change-metric">
                      Participation: {formatChange(trendAnalysis.latestChange.participation_change)}
                    </span>
                    <span className="change-metric">
                      Evaluations: {trendAnalysis.latestChange.evaluation_change >= 0 ? '+' : ''}{trendAnalysis.latestChange.evaluation_change}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visual trend chart */}
            <div className="trend-chart">
              <VisualAnalytics
                departmentId={departmentId}
                chartTypes={['participation_trends']}
                height="200px"
                showLegend={false}
                className="trend-visualization"
              />
            </div>
          </div>
        )}

        {/* Benchmarking */}
        {includeBenchmarking && insightsData.benchmarking && (
          <div className="insights-section benchmarking-section">
            <h4 className="section-title">📈 Historical Benchmarking</h4>
            <div className="benchmark-comparison">
              {insightsData.benchmarking.benchmark_data.map((benchmark) => (
                <div key={benchmark.period} className="benchmark-card">
                  <div className="benchmark-period">{benchmark.period}</div>
                  <div className="benchmark-metrics">
                    <div className="benchmark-metric">
                      <span className="benchmark-value">{benchmark.average_performance_score.toFixed(1)}%</span>
                      <span className="benchmark-label">Performance</span>
                    </div>
                    <div className="benchmark-metric">
                      <span className="benchmark-value">{benchmark.average_participation_rate.toFixed(1)}%</span>
                      <span className="benchmark-label">Participation</span>
                    </div>
                    <div className="benchmark-metric">
                      <span className="benchmark-value">{benchmark.total_evaluations}</span>
                      <span className="benchmark-label">Evaluations</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Insights */}
        <div className="insights-section actionable-insights">
          <h4 className="section-title">💡 Actionable Insights</h4>
          
          {/* Positive insights */}
          {insightCategories.positive.length > 0 && (
            <div className="insight-category">
              <h5>✅ Strengths & Achievements</h5>
              {insightCategories.positive.map((insight, index) => (
                <div 
                  key={index} 
                  className="insight-card positive"
                  onClick={() => onInsightClick?.(insight)}
                >
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                  <div className="insight-action">{insight.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* Warning insights */}
          {insightCategories.warning.length > 0 && (
            <div className="insight-category">
              <h5>⚠️ Areas for Attention</h5>
              {insightCategories.warning.map((insight, index) => (
                <div 
                  key={index} 
                  className="insight-card warning"
                  onClick={() => onInsightClick?.(insight)}
                >
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                  <div className="insight-action">{insight.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* Alert insights */}
          {insightCategories.alert.length > 0 && (
            <div className="insight-category">
              <h5>🚨 Urgent Actions Required</h5>
              {insightCategories.alert.map((insight, index) => (
                <div 
                  key={index} 
                  className="insight-card alert"
                  onClick={() => onInsightClick?.(insight)}
                >
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                  <div className="insight-action">{insight.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* No insights */}
          {Object.values(insightCategories).every(category => category.length === 0) && (
            <div className="no-insights">
              <div className="empty-icon">💡</div>
              <p>No specific insights available for the current data.</p>
              <p>This typically indicates stable performance with no significant changes.</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="insights-metadata">
          <small className="metadata-text">
            Periods Analyzed: {insightsData.metadata.periods_analyzed.join(', ')} | 
            Trends: {includeTrends ? 'Included' : 'Excluded'} | 
            Benchmarking: {includeBenchmarking ? 'Included' : 'Excluded'} | 
            Generated: {new Date(insightsData.generated_at).toLocaleString()}
          </small>
        </div>
      </div>
    </div>
  );
}

export default PerformanceInsights;