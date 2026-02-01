import React, { useState, useEffect, useMemo } from 'react';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import api from '../../services/api';
import DashboardCard from './DashboardCard';
import StatCard from './StatCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import VisualAnalytics from '../VisualAnalytics';

/**
 * Enhanced Performance Insights Component
 * 
 * Modern, visually appealing performance insights with enhanced UI design,
 * smooth animations, and improved user experience.
 */
function EnhancedPerformanceInsights({ 
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
      `${currentYear}-${currentSemester}`,
      currentSemester === 1 ? `${currentYear - 1}-2` : `${currentYear}-1`
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
      strength: Math.abs(overall_trend.overall_change) * 10,
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

  // Get trend direction for display
  const getTrendDirection = (direction) => {
    switch (direction) {
      case 'improving': return 'up';
      case 'declining': return 'down';
      case 'stable': return 'neutral';
      default: return 'neutral';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`enhanced-performance-insights ${className}`}>
        <LoadingState 
          type="skeleton"
          size="large"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-performance-insights ${className}`}>
        <EmptyState
          variant="error"
          action={loadPerformanceInsights}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  // No data state
  if (!insightsData) {
    return (
      <div className={`enhanced-performance-insights ${className}`}>
        <EmptyState
          variant="no-data"
          action={loadPerformanceInsights}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className={`enhanced-performance-insights ${className} fade-in`}>
      {/* Header Card */}
      <DashboardCard
        title="Performance Insights"
        subtitle={`Analysis for ${selectedPeriods ? selectedPeriods.join(', ') : 'current period'}`}
        icon="📊"
        variant="primary"
        headerActions={
          <div className="insights-controls enhanced-flex enhanced-gap-3">
            <select
              value={selectedPeriods ? selectedPeriods.join(',') : ''}
              onChange={(e) => {
                const periods = e.target.value ? e.target.value.split(',') : getDefaultPeriods();
                handlePeriodChange(periods);
              }}
              className="enhanced-input"
              style={{ width: 'auto', minWidth: '200px' }}
            >
              <option value="">Current vs Previous</option>
              <option value="2024-1,2023-2,2023-1">Last 3 Semesters</option>
              <option value="2024-2,2024-1,2023-2,2023-1">Last 4 Semesters</option>
            </select>
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh insights"
            >
              {refreshing ? (
                <div className="enhanced-spinner" style={{ width: '14px', height: '14px' }} />
              ) : (
                '↻'
              )}
            </button>
          </div>
        }
      >
        {/* Current Performance Overview */}
        <div className="performance-overview enhanced-grid enhanced-grid-cols-4 enhanced-gap-4">
          <StatCard
            title="Average Performance"
            value={insightsData.current_performance.statistics.average_performance_score}
            format="percentage"
            icon="🎯"
            trend={trendAnalysis ? getTrendDirection(trendAnalysis.direction) : null}
            change={trendAnalysis?.performanceChange}
            variant="primary"
            size="small"
          />
          
          <StatCard
            title="Participation Rate"
            value={insightsData.current_performance.statistics.average_participation_rate}
            format="percentage"
            icon="👥"
            trend={trendAnalysis ? (trendAnalysis.participationChange >= 0 ? 'up' : 'down') : null}
            change={trendAnalysis?.participationChange}
            variant="success"
            size="small"
          />
          
          <StatCard
            title="Total Evaluations"
            value={insightsData.current_performance.statistics.total_evaluations}
            format="integer"
            icon="📝"
            variant="warning"
            size="small"
          />
          
          <StatCard
            title="Total Responses"
            value={insightsData.current_performance.statistics.total_responses}
            format="integer"
            icon="💬"
            variant="info"
            size="small"
          />
        </div>

        {/* Performance Distribution */}
        {insightsData.current_performance.performance_distribution && (
          <div className="performance-distribution" style={{ marginTop: 'var(--space-6)' }}>
            <h4 className="text-heading-5" style={{ marginBottom: 'var(--space-4)' }}>
              Performance Distribution
            </h4>
            <div className="distribution-grid enhanced-grid enhanced-grid-cols-4 enhanced-gap-3">
              {Object.entries(insightsData.current_performance.performance_distribution.distribution).map(([level, data]) => (
                <div key={level} className="enhanced-card distribution-item">
                  <div className="enhanced-card-body" style={{ padding: 'var(--space-4)' }}>
                    <div className="text-heading-4" style={{ color: 'var(--primary-blue-600)' }}>
                      {data.count}
                    </div>
                    <div className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                      {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                      {data.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Trend Analysis */}
      {includeTrends && trendAnalysis && (
        <DashboardCard
          title="Trend Analysis"
          subtitle={`${trendAnalysis.direction.replace('_', ' ').toUpperCase()} trend detected`}
          icon="📈"
          variant="success"
          className="slide-in-right"
        >
          <div className="trend-content enhanced-grid enhanced-grid-cols-2 enhanced-gap-6">
            <div className="trend-summary">
              <div className="trend-metrics enhanced-flex enhanced-flex-col enhanced-gap-4">
                <div className="enhanced-card">
                  <div className="enhanced-card-body" style={{ padding: 'var(--space-4)' }}>
                    <div className="enhanced-flex enhanced-flex-between">
                      <span className="text-body-small">Overall Change</span>
                      <span className={`enhanced-badge ${trendAnalysis.overallChange >= 0 ? 'enhanced-badge-success' : 'enhanced-badge-error'}`}>
                        {formatChange(trendAnalysis.overallChange)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {trendAnalysis.latestChange && (
                  <div className="enhanced-card">
                    <div className="enhanced-card-body" style={{ padding: 'var(--space-4)' }}>
                      <h6 className="text-heading-6" style={{ marginBottom: 'var(--space-2)' }}>
                        Latest Period ({trendAnalysis.latestChange.from_period} → {trendAnalysis.latestChange.to_period})
                      </h6>
                      <div className="change-metrics enhanced-flex enhanced-flex-col enhanced-gap-2">
                        <div className="enhanced-flex enhanced-flex-between">
                          <span className="text-body-small">Performance</span>
                          <span className="text-body-small">{formatChange(trendAnalysis.latestChange.performance_change)}</span>
                        </div>
                        <div className="enhanced-flex enhanced-flex-between">
                          <span className="text-body-small">Participation</span>
                          <span className="text-body-small">{formatChange(trendAnalysis.latestChange.participation_change)}</span>
                        </div>
                        <div className="enhanced-flex enhanced-flex-between">
                          <span className="text-body-small">Evaluations</span>
                          <span className="text-body-small">
                            {trendAnalysis.latestChange.evaluation_change >= 0 ? '+' : ''}{trendAnalysis.latestChange.evaluation_change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visual trend chart */}
            <div className="trend-visualization">
              <VisualAnalytics
                departmentId={departmentId}
                chartTypes={['participation_trends']}
                height="200px"
                showLegend={false}
                className="enhanced-card"
              />
            </div>
          </div>
        </DashboardCard>
      )}

      {/* Benchmarking */}
      {includeBenchmarking && insightsData.benchmarking && (
        <DashboardCard
          title="Historical Benchmarking"
          subtitle="Performance comparison across periods"
          icon="📈"
          variant="info"
          className="slide-in-right"
        >
          <div className="benchmark-grid enhanced-grid enhanced-grid-auto-fit enhanced-gap-4">
            {insightsData.benchmarking.benchmark_data.map((benchmark) => (
              <div key={benchmark.period} className="enhanced-card benchmark-card">
                <div className="enhanced-card-header">
                  <h5 className="text-heading-6">{benchmark.period}</h5>
                </div>
                <div className="enhanced-card-body">
                  <div className="benchmark-metrics enhanced-flex enhanced-flex-col enhanced-gap-3">
                    <div className="enhanced-flex enhanced-flex-between">
                      <span className="text-body-small">Performance</span>
                      <span className="text-body font-semibold">{benchmark.average_performance_score.toFixed(1)}%</span>
                    </div>
                    <div className="enhanced-flex enhanced-flex-between">
                      <span className="text-body-small">Participation</span>
                      <span className="text-body font-semibold">{benchmark.average_participation_rate.toFixed(1)}%</span>
                    </div>
                    <div className="enhanced-flex enhanced-flex-between">
                      <span className="text-body-small">Evaluations</span>
                      <span className="text-body font-semibold">{benchmark.total_evaluations}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Actionable Insights */}
      <DashboardCard
        title="Actionable Insights"
        subtitle="Recommendations and key findings"
        icon="💡"
        variant="warning"
        className="scale-in"
      >
        {Object.values(insightCategories).every(category => category.length === 0) ? (
          <EmptyState
            icon="💡"
            title="No Specific Insights"
            description="No specific insights available for the current data. This typically indicates stable performance with no significant changes."
            size="small"
          />
        ) : (
          <div className="insights-categories enhanced-flex enhanced-flex-col enhanced-gap-6">
            {/* Positive insights */}
            {insightCategories.positive.length > 0 && (
              <div className="insight-category">
                <h5 className="text-heading-5" style={{ color: 'var(--success-green-600)', marginBottom: 'var(--space-4)' }}>
                  ✅ Strengths & Achievements
                </h5>
                <div className="insights-grid enhanced-grid enhanced-grid-auto-fit enhanced-gap-4">
                  {insightCategories.positive.map((insight, index) => (
                    <div 
                      key={index} 
                      className="enhanced-card insight-card positive"
                      onClick={() => onInsightClick?.(insight)}
                      style={{ cursor: onInsightClick ? 'pointer' : 'default' }}
                    >
                      <div className="enhanced-card-body">
                        <h6 className="text-heading-6" style={{ color: 'var(--success-green-700)' }}>
                          {insight.title}
                        </h6>
                        <p className="text-body-small" style={{ margin: 'var(--space-2) 0' }}>
                          {insight.description}
                        </p>
                        <div className="enhanced-badge enhanced-badge-success">
                          {insight.action}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning insights */}
            {insightCategories.warning.length > 0 && (
              <div className="insight-category">
                <h5 className="text-heading-5" style={{ color: 'var(--warning-orange-600)', marginBottom: 'var(--space-4)' }}>
                  ⚠️ Areas for Attention
                </h5>
                <div className="insights-grid enhanced-grid enhanced-grid-auto-fit enhanced-gap-4">
                  {insightCategories.warning.map((insight, index) => (
                    <div 
                      key={index} 
                      className="enhanced-card insight-card warning"
                      onClick={() => onInsightClick?.(insight)}
                      style={{ cursor: onInsightClick ? 'pointer' : 'default' }}
                    >
                      <div className="enhanced-card-body">
                        <h6 className="text-heading-6" style={{ color: 'var(--warning-orange-700)' }}>
                          {insight.title}
                        </h6>
                        <p className="text-body-small" style={{ margin: 'var(--space-2) 0' }}>
                          {insight.description}
                        </p>
                        <div className="enhanced-badge enhanced-badge-warning">
                          {insight.action}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alert insights */}
            {insightCategories.alert.length > 0 && (
              <div className="insight-category">
                <h5 className="text-heading-5" style={{ color: 'var(--error-red-600)', marginBottom: 'var(--space-4)' }}>
                  🚨 Urgent Actions Required
                </h5>
                <div className="insights-grid enhanced-grid enhanced-grid-auto-fit enhanced-gap-4">
                  {insightCategories.alert.map((insight, index) => (
                    <div 
                      key={index} 
                      className="enhanced-card insight-card alert"
                      onClick={() => onInsightClick?.(insight)}
                      style={{ cursor: onInsightClick ? 'pointer' : 'default' }}
                    >
                      <div className="enhanced-card-body">
                        <h6 className="text-heading-6" style={{ color: 'var(--error-red-700)' }}>
                          {insight.title}
                        </h6>
                        <p className="text-body-small" style={{ margin: 'var(--space-2) 0' }}>
                          {insight.description}
                        </p>
                        <div className="enhanced-badge enhanced-badge-error">
                          {insight.action}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardCard>

      {/* Metadata */}
      <div className="insights-metadata" style={{ marginTop: 'var(--space-6)' }}>
        <div className="enhanced-card">
          <div className="enhanced-card-body" style={{ padding: 'var(--space-4)' }}>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Periods Analyzed: {insightsData.metadata.periods_analyzed.join(', ')} | 
              Trends: {includeTrends ? 'Included' : 'Excluded'} | 
              Benchmarking: {includeBenchmarking ? 'Included' : 'Excluded'} | 
              Generated: {new Date(insightsData.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedPerformanceInsights;