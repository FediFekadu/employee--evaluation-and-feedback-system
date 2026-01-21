import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useErrorHandling } from '../hooks/useErrorHandling';
import api from '../services/api';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';
import ErrorAlert from './ErrorHandling/ErrorAlert';
import InteractiveVisualAnalytics from './InteractiveVisualAnalytics';
import { exportService } from '../services/exportService';

/**
 * EnhancedPerformanceInsights Component
 * 
 * Advanced performance insights with interactive visualizations, comparative analysis,
 * predictive analytics, and comprehensive benchmarking capabilities.
 */
function EnhancedPerformanceInsights({ 
  departmentId, 
  periods = null,
  className = '',
  onInsightAction = null,
  refreshInterval = null,
  enablePredictiveAnalytics = true,
  enableComparativeAnalysis = true,
  enableExport = true
}) {
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Enhanced state management
  const [selectedPeriods, setSelectedPeriods] = useState(periods);
  const [analysisMode, setAnalysisMode] = useState('comprehensive'); // 'comprehensive', 'trends', 'benchmarks', 'predictive'
  const [comparisonTarget, setComparisonTarget] = useState('department'); // 'department', 'college', 'historical'
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'detailed', 'export'
  const [selectedMetrics, setSelectedMetrics] = useState(['performance', 'participation', 'satisfaction']);
  const [timeRange, setTimeRange] = useState('semester'); // 'semester', 'year', 'custom'

  const { handleApiCall, addError } = useErrorHandling();

  // Generate intelligent period selection
  const getIntelligentPeriods = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentSemester = currentMonth <= 6 ? 1 : 2;
    
    switch (timeRange) {
      case 'semester':
        return [
          `${currentYear}-${currentSemester}`,
          currentSemester === 1 ? `${currentYear - 1}-2` : `${currentYear}-1`
        ];
      case 'year':
        return [
          `${currentYear}-1`, `${currentYear}-2`,
          `${currentYear - 1}-1`, `${currentYear - 1}-2`
        ];
      case 'custom':
        return selectedPeriods || [`${currentYear}-${currentSemester}`];
      default:
        return [`${currentYear}-${currentSemester}`];
    }
  }, [timeRange, selectedPeriods]);

  // Load enhanced performance insights
  const loadPerformanceInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const periodsToUse = getIntelligentPeriods();
      
      const params = {
        periods: periodsToUse,
        analysis_mode: analysisMode,
        comparison_target: comparisonTarget,
        metrics: selectedMetrics,
        include_predictive: enablePredictiveAnalytics,
        include_comparative: enableComparativeAnalysis,
        include_recommendations: true,
        include_visualizations: true
      };

      const response = await handleApiCall(
        () => api.get(`/departments/${departmentId}/enhanced-performance-insights`, { params }),
        'enhanced_performance_insights_load'
      );

      setInsightsData(response.data.data);
    } catch (err) {
      console.error('Failed to load enhanced performance insights:', err);
      const errorId = addError(err, 'enhanced_performance_insights_load');
      setError('Failed to load performance insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [departmentId, analysisMode, comparisonTarget, selectedMetrics, enablePredictiveAnalytics, enableComparativeAnalysis, getIntelligentPeriods, handleApiCall, addError]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadPerformanceInsights();
    } catch (err) {
      console.error('Failed to refresh performance insights:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadPerformanceInsights]);

  // Handle metric selection
  const handleMetricToggle = useCallback((metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  }, []);

  // Export functionality
  const handleExport = useCallback(async (format, dataType = 'all') => {
    if (!insightsData) return;

    try {
      let exportData = {};
      
      switch (dataType) {
        case 'summary':
          exportData = {
            'Performance Summary': insightsData.performance_summary,
            'Key Metrics': insightsData.key_metrics,
            'Generated': new Date().toISOString()
          };
          break;
        case 'trends':
          exportData = insightsData.trend_analysis || {};
          break;
        case 'benchmarks':
          exportData = insightsData.benchmark_analysis || {};
          break;
        case 'recommendations':
          exportData = {
            'Actionable Insights': insightsData.actionable_insights || [],
            'Recommendations': insightsData.recommendations || []
          };
          break;
        default:
          exportData = insightsData;
      }

      await exportService.exportData(exportData, `performance-insights-${departmentId}-${dataType}`, format);
    } catch (err) {
      console.error('Export failed:', err);
      addError(err, 'performance_insights_export');
    }
  }, [insightsData, departmentId, addError]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (departmentId) {
      loadPerformanceInsights();
    }
  }, [departmentId, loadPerformanceInsights]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(handleRefresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, handleRefresh]);

  // Processed insights with enhanced analytics
  const processedInsights = useMemo(() => {
    if (!insightsData) return null;

    const insights = {
      performance: insightsData.performance_summary || {},
      trends: insightsData.trend_analysis || {},
      benchmarks: insightsData.benchmark_analysis || {},
      predictions: insightsData.predictive_analysis || {},
      recommendations: insightsData.actionable_insights || [],
      alerts: insightsData.performance_alerts || []
    };

    // Calculate performance scores
    insights.scores = {
      overall: insights.performance.overall_score || 0,
      performance: insights.performance.performance_score || 0,
      participation: insights.performance.participation_rate || 0,
      satisfaction: insights.performance.satisfaction_score || 0,
      improvement: insights.trends.improvement_rate || 0
    };

    // Calculate trend indicators
    insights.trendIndicators = {
      performance: insights.trends.performance_trend || 'stable',
      participation: insights.trends.participation_trend || 'stable',
      satisfaction: insights.trends.satisfaction_trend || 'stable',
      overall: insights.trends.overall_trend || 'stable'
    };

    return insights;
  }, [insightsData]);

  // Performance level classification
  const getPerformanceLevel = useCallback((score) => {
    if (score >= 90) return { level: 'excellent', color: '#10b981', icon: '🌟' };
    if (score >= 80) return { level: 'good', color: '#3b82f6', icon: '👍' };
    if (score >= 70) return { level: 'satisfactory', color: '#f59e0b', icon: '⚡' };
    return { level: 'needs_improvement', color: '#ef4444', icon: '📈' };
  }, []);

  // Trend direction indicators
  const getTrendIndicator = useCallback((trend) => {
    switch (trend) {
      case 'improving': return { icon: '📈', color: '#10b981', text: 'Improving' };
      case 'declining': return { icon: '📉', color: '#ef4444', text: 'Declining' };
      case 'stable': return { icon: '➡️', color: '#6b7280', text: 'Stable' };
      default: return { icon: '❓', color: '#6b7280', text: 'Unknown' };
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`enhanced-performance-insights loading ${className}`}>
        <LoadingSpinner size="large" message="Loading enhanced performance insights..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-performance-insights error ${className}`}>
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
      <div className={`enhanced-performance-insights no-data ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Performance Insights Available</h3>
          <p>No performance data found for the selected criteria and time range.</p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={loadPerformanceInsights}>
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-performance-insights ${className}`}>
      {/* Enhanced Header */}
      <div className="insights-header">
        <div className="header-main">
          <h3 className="insights-title">Enhanced Performance Insights</h3>
          <div className="header-controls">
            <div className="analysis-mode-selector">
              <select
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="mode-select"
              >
                <option value="comprehensive">Comprehensive Analysis</option>
                <option value="trends">Trend Analysis</option>
                <option value="benchmarks">Benchmark Analysis</option>
                <option value="predictive">Predictive Analysis</option>
              </select>
            </div>
            
            <div className="time-range-selector">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="time-select"
              >
                <option value="semester">Current vs Previous Semester</option>
                <option value="year">Full Academic Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div className="comparison-selector">
              <select
                value={comparisonTarget}
                onChange={(e) => setComparisonTarget(e.target.value)}
                className="comparison-select"
              >
                <option value="department">vs Department Average</option>
                <option value="college">vs College Average</option>
                <option value="historical">vs Historical Data</option>
              </select>
            </div>
            
            {enableExport && (
              <div className="export-controls">
                <select
                  onChange={(e) => e.target.value && handleExport('excel', e.target.value)}
                  value=""
                  className="export-select"
                >
                  <option value="">Export...</option>
                  <option value="summary">Summary Report</option>
                  <option value="trends">Trend Analysis</option>
                  <option value="benchmarks">Benchmark Data</option>
                  <option value="recommendations">Recommendations</option>
                  <option value="all">Complete Report</option>
                </select>
              </div>
            )}
            
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

        {/* Metric Selection */}
        <div className="metric-selector">
          <label>Focus Metrics:</label>
          <div className="metric-checkboxes">
            {['performance', 'participation', 'satisfaction', 'engagement', 'completion'].map(metric => (
              <label key={metric} className="metric-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric)}
                  onChange={() => handleMetricToggle(metric)}
                />
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Dashboard */}
      {processedInsights && (
        <div className="insights-dashboard">
          {/* Key Performance Indicators */}
          <div className="kpi-section">
            <h4 className="section-title">📊 Key Performance Indicators</h4>
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">🎯</span>
                  <span className="kpi-label">Overall Performance</span>
                </div>
                <div className="kpi-value">
                  <span className="kpi-score">{processedInsights.scores.overall.toFixed(1)}%</span>
                  <div className="kpi-trend">
                    {getTrendIndicator(processedInsights.trendIndicators.overall).icon}
                    <span className="trend-text">
                      {getTrendIndicator(processedInsights.trendIndicators.overall).text}
                    </span>
                  </div>
                </div>
                {processedInsights.benchmarks.overall && (
                  <div className="kpi-benchmark">
                    vs {comparisonTarget}: {processedInsights.benchmarks.overall > 0 ? '+' : ''}{processedInsights.benchmarks.overall.toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">📈</span>
                  <span className="kpi-label">Teaching Performance</span>
                </div>
                <div className="kpi-value">
                  <span className="kpi-score">{processedInsights.scores.performance.toFixed(1)}%</span>
                  <div className="kpi-trend">
                    {getTrendIndicator(processedInsights.trendIndicators.performance).icon}
                    <span className="trend-text">
                      {getTrendIndicator(processedInsights.trendIndicators.performance).text}
                    </span>
                  </div>
                </div>
                {processedInsights.benchmarks.performance && (
                  <div className="kpi-benchmark">
                    vs {comparisonTarget}: {processedInsights.benchmarks.performance > 0 ? '+' : ''}{processedInsights.benchmarks.performance.toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">👥</span>
                  <span className="kpi-label">Participation Rate</span>
                </div>
                <div className="kpi-value">
                  <span className="kpi-score">{processedInsights.scores.participation.toFixed(1)}%</span>
                  <div className="kpi-trend">
                    {getTrendIndicator(processedInsights.trendIndicators.participation).icon}
                    <span className="trend-text">
                      {getTrendIndicator(processedInsights.trendIndicators.participation).text}
                    </span>
                  </div>
                </div>
                {processedInsights.benchmarks.participation && (
                  <div className="kpi-benchmark">
                    vs {comparisonTarget}: {processedInsights.benchmarks.participation > 0 ? '+' : ''}{processedInsights.benchmarks.participation.toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-icon">😊</span>
                  <span className="kpi-label">Satisfaction Score</span>
                </div>
                <div className="kpi-value">
                  <span className="kpi-score">{processedInsights.scores.satisfaction.toFixed(1)}%</span>
                  <div className="kpi-trend">
                    {getTrendIndicator(processedInsights.trendIndicators.satisfaction).icon}
                    <span className="trend-text">
                      {getTrendIndicator(processedInsights.trendIndicators.satisfaction).text}
                    </span>
                  </div>
                </div>
                {processedInsights.benchmarks.satisfaction && (
                  <div className="kpi-benchmark">
                    vs {comparisonTarget}: {processedInsights.benchmarks.satisfaction > 0 ? '+' : ''}{processedInsights.benchmarks.satisfaction.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Visualizations */}
          <div className="visualization-section">
            <h4 className="section-title">📈 Interactive Analytics</h4>
            <div className="visualization-container">
              <InteractiveVisualAnalytics
                departmentId={departmentId}
                data={insightsData.visualization_data}
                chartTypes={['performance_trends', 'participation_analysis', 'comparative_benchmarks']}
                enableInteractivity={true}
                enableExport={enableExport}
                className="performance-visualizations"
              />
            </div>
          </div>

          {/* Trend Analysis */}
          {(analysisMode === 'comprehensive' || analysisMode === 'trends') && processedInsights.trends && (
            <div className="trend-analysis-section">
              <h4 className="section-title">📊 Trend Analysis</h4>
              <div className="trend-grid">
                {Object.entries(processedInsights.trends).map(([metric, trendData]) => (
                  <div key={metric} className="trend-card">
                    <div className="trend-header">
                      <span className="trend-metric">{metric.replace('_', ' ').toUpperCase()}</span>
                      <span className={`trend-direction ${trendData.direction}`}>
                        {getTrendIndicator(trendData.direction).icon}
                      </span>
                    </div>
                    <div className="trend-details">
                      <div className="trend-change">
                        <span className="change-value">
                          {trendData.change > 0 ? '+' : ''}{trendData.change.toFixed(1)}%
                        </span>
                        <span className="change-period">vs previous period</span>
                      </div>
                      {trendData.prediction && (
                        <div className="trend-prediction">
                          <span className="prediction-label">Projected:</span>
                          <span className="prediction-value">
                            {trendData.prediction > 0 ? '+' : ''}{trendData.prediction.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchmark Analysis */}
          {(analysisMode === 'comprehensive' || analysisMode === 'benchmarks') && processedInsights.benchmarks && (
            <div className="benchmark-section">
              <h4 className="section-title">⚖️ Benchmark Analysis</h4>
              <div className="benchmark-comparison">
                <div className="benchmark-chart">
                  <InteractiveVisualAnalytics
                    departmentId={departmentId}
                    data={insightsData.benchmark_data}
                    chartTypes={['benchmark_comparison']}
                    enableInteractivity={true}
                    className="benchmark-visualization"
                  />
                </div>
                <div className="benchmark-insights">
                  {Object.entries(processedInsights.benchmarks).map(([metric, value]) => (
                    <div key={metric} className={`benchmark-insight ${value > 0 ? 'above' : 'below'}`}>
                      <span className="benchmark-metric">{metric.replace('_', ' ')}</span>
                      <span className="benchmark-value">
                        {value > 0 ? '+' : ''}{value.toFixed(1)}% vs {comparisonTarget}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Predictive Analysis */}
          {enablePredictiveAnalytics && (analysisMode === 'comprehensive' || analysisMode === 'predictive') && processedInsights.predictions && (
            <div className="predictive-section">
              <h4 className="section-title">🔮 Predictive Analysis</h4>
              <div className="prediction-grid">
                {Object.entries(processedInsights.predictions).map(([metric, prediction]) => (
                  <div key={metric} className="prediction-card">
                    <div className="prediction-header">
                      <span className="prediction-metric">{metric.replace('_', ' ').toUpperCase()}</span>
                      <span className="prediction-confidence">
                        {prediction.confidence}% confidence
                      </span>
                    </div>
                    <div className="prediction-forecast">
                      <div className="forecast-value">
                        <span className="forecast-number">{prediction.forecast.toFixed(1)}%</span>
                        <span className="forecast-period">next period</span>
                      </div>
                      <div className="forecast-range">
                        Range: {prediction.range.min.toFixed(1)}% - {prediction.range.max.toFixed(1)}%
                      </div>
                    </div>
                    {prediction.factors && (
                      <div className="prediction-factors">
                        <span className="factors-label">Key factors:</span>
                        <span className="factors-list">{prediction.factors.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Alerts */}
          {processedInsights.alerts && processedInsights.alerts.length > 0 && (
            <div className="alerts-section">
              <h4 className="section-title">🚨 Performance Alerts</h4>
              <div className="alerts-container">
                {processedInsights.alerts.map((alert, index) => (
                  <div key={index} className={`alert-card ${alert.severity}`}>
                    <div className="alert-header">
                      <span className="alert-icon">
                        {alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className="alert-title">{alert.title}</span>
                    </div>
                    <div className="alert-content">
                      <p className="alert-description">{alert.description}</p>
                      {alert.recommendation && (
                        <div className="alert-recommendation">
                          <strong>Recommendation:</strong> {alert.recommendation}
                        </div>
                      )}
                    </div>
                    {alert.action && (
                      <div className="alert-actions">
                        <button
                          className="alert-action-btn"
                          onClick={() => onInsightAction?.(alert)}
                        >
                          {alert.action}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          {processedInsights.recommendations && processedInsights.recommendations.length > 0 && (
            <div className="recommendations-section">
              <h4 className="section-title">💡 Actionable Recommendations</h4>
              <div className="recommendations-grid">
                {processedInsights.recommendations.map((recommendation, index) => (
                  <div key={index} className={`recommendation-card ${recommendation.priority}`}>
                    <div className="recommendation-header">
                      <span className="recommendation-icon">
                        {recommendation.type === 'improvement' ? '📈' : 
                         recommendation.type === 'maintenance' ? '🔧' : 
                         recommendation.type === 'strategic' ? '🎯' : '💡'}
                      </span>
                      <span className="recommendation-title">{recommendation.title}</span>
                      <span className={`recommendation-priority ${recommendation.priority}`}>
                        {recommendation.priority}
                      </span>
                    </div>
                    <div className="recommendation-content">
                      <p className="recommendation-description">{recommendation.description}</p>
                      <div className="recommendation-impact">
                        <span className="impact-label">Expected Impact:</span>
                        <span className="impact-value">{recommendation.expected_impact}</span>
                      </div>
                      {recommendation.timeline && (
                        <div className="recommendation-timeline">
                          <span className="timeline-label">Timeline:</span>
                          <span className="timeline-value">{recommendation.timeline}</span>
                        </div>
                      )}
                    </div>
                    {recommendation.actions && (
                      <div className="recommendation-actions">
                        {recommendation.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            className="recommendation-action-btn"
                            onClick={() => onInsightAction?.(recommendation, action)}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="insights-metadata">
        <small className="metadata-text">
          Analysis Mode: {analysisMode} | 
          Time Range: {timeRange} | 
          Comparison: {comparisonTarget} | 
          Metrics: {selectedMetrics.join(', ')} | 
          Generated: {new Date(insightsData.generated_at).toLocaleString()}
        </small>
      </div>
    </div>
  );
}

export default EnhancedPerformanceInsights;