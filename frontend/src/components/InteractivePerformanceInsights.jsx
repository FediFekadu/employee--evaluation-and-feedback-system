import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApiRequest } from '../hooks/useApiRequest';
import { PRIORITY } from '../utils/requestManager';
import exportService from '../services/exportService';
import DashboardCard from './EnhancedDashboard/DashboardCard';
import LoadingState from './EnhancedDashboard/LoadingState';
import EmptyState from './EnhancedDashboard/EmptyState';
import StatCard from './EnhancedDashboard/StatCard';

/**
 * Interactive Performance Insights Component
 * 
 * Displays comparative analysis with department averages, benchmarks,
 * trend analysis, and interactive performance metrics.
 */
function InteractivePerformanceInsights({
  departmentId,
  teacherId = null,
  period = null,
  timeRange = '1year',
  className = '',
  enableExport = true,
  enableComparison = true,
  showTrends = true,
  showBenchmarks = true,
  comparisonMode = 'department' // 'department', 'college', 'historical'
}) {
  const [insightsData, setInsightsData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Interactive state
  const [selectedMetric, setSelectedMetric] = useState('overall_performance');
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeRange);
  const [comparisonType, setComparisonType] = useState(comparisonMode);
  const [hoveredInsight, setHoveredInsight] = useState(null);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  const { loading, get } = useApiRequest();

  // Load performance insights data
  const loadPerformanceInsights = useCallback(async () => {
    try {
      setError(null);

      const params = {
        time_range: selectedTimeframe,
        comparison_mode: comparisonType,
        include_trends: showTrends,
        include_benchmarks: showBenchmarks,
        metric: selectedMetric
      };

      if (period) {
        params.period = period;
      }

      if (teacherId) {
        params.teacher_id = teacherId;
      }

      const endpoint = teacherId 
        ? `/teachers/${teacherId}/performance-insights`
        : `/departments/${departmentId}/performance-insights`;

      const response = await get(
        endpoint,
        params,
        {
          priority: PRIORITY.MEDIUM,
          skipCache: false
        }
      );

      if (response) {
        setInsightsData(response.data);
      }
    } catch (err) {
      console.error('Failed to load performance insights:', err);
      
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        setError(`Too many requests. The system will automatically retry in ${Math.round(waitTime/1000)} seconds.`);
        
        setTimeout(() => {
          setError(null);
          loadPerformanceInsights();
        }, waitTime);
        return;
      }
      
      setError('Failed to load performance insights data. Please try again.');
    }
  }, [departmentId, teacherId, selectedTimeframe, comparisonType, showTrends, showBenchmarks, selectedMetric, period, get]);

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

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (departmentId || teacherId) {
      loadPerformanceInsights();
    }
  }, [loadPerformanceInsights]);

  // Process insights data for display
  const processedInsights = useMemo(() => {
    if (!insightsData) return null;

    const {
      metrics,
      comparisons,
      trends,
      benchmarks,
      recommendations
    } = insightsData;

    return {
      keyMetrics: processKeyMetrics(metrics),
      comparativeAnalysis: processComparativeAnalysis(comparisons, benchmarks),
      trendAnalysis: processTrendAnalysis(trends),
      recommendations: processRecommendations(recommendations),
      rawData: insightsData
    };
  }, [insightsData]);

  // Process key metrics
  const processKeyMetrics = (metrics) => {
    if (!metrics) return [];

    return Object.entries(metrics).map(([key, data]) => ({
      id: key,
      title: formatMetricTitle(key),
      value: data.value,
      change: data.change,
      trend: data.trend,
      benchmark: data.benchmark,
      percentile: data.percentile,
      description: data.description,
      color: getMetricColor(data.value, data.benchmark)
    }));
  };

  // Process comparative analysis
  const processComparativeAnalysis = (comparisons, benchmarks) => {
    if (!comparisons) return null;

    return {
      departmentAverage: comparisons.department_average,
      collegeAverage: comparisons.college_average,
      nationalAverage: comparisons.national_average,
      peerComparison: comparisons.peer_comparison,
      benchmarks: benchmarks,
      ranking: comparisons.ranking
    };
  };

  // Process trend analysis
  const processTrendAnalysis = (trends) => {
    if (!trends) return [];

    return trends.map(trend => ({
      ...trend,
      formattedPeriod: formatPeriod(trend.period),
      trendDirection: getTrendDirection(trend.change),
      significance: getTrendSignificance(trend.change, trend.confidence)
    }));
  };

  // Process recommendations
  const processRecommendations = (recommendations) => {
    if (!recommendations) return [];

    return recommendations.map(rec => ({
      ...rec,
      priority: rec.priority || 'medium',
      category: rec.category || 'general',
      impact: rec.impact || 'medium',
      effort: rec.effort || 'medium'
    }));
  };

  // Utility functions
  const formatMetricTitle = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMetricColor = (value, benchmark) => {
    if (!benchmark) return 'var(--neutral-500)';
    
    const ratio = value / benchmark;
    if (ratio >= 1.1) return 'var(--success-green-500)';
    if (ratio >= 0.9) return 'var(--primary-blue-500)';
    if (ratio >= 0.7) return 'var(--warning-orange-500)';
    return 'var(--error-red-500)';
  };

  const formatPeriod = (period) => {
    return new Date(period).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getTrendDirection = (change) => {
    if (change > 5) return 'strong-up';
    if (change > 0) return 'up';
    if (change < -5) return 'strong-down';
    if (change < 0) return 'down';
    return 'stable';
  };

  const getTrendSignificance = (change, confidence) => {
    const absChange = Math.abs(change);
    if (absChange > 10 && confidence > 0.8) return 'high';
    if (absChange > 5 && confidence > 0.6) return 'medium';
    return 'low';
  };

  // Handle tooltip
  const handleTooltip = useCallback((event, content) => {
    if (!content) {
      setTooltip({ visible: false, x: 0, y: 0, content: null });
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content
    });
  }, []);

  // Export insights data
  const handleExport = useCallback(async (format) => {
    if (!insightsData || exporting) return;
    
    try {
      setExporting(true);
      setExportProgress(0);
      
      const exportData = {
        insights: processedInsights,
        metadata: insightsData.metadata,
        selectedMetric: selectedMetric,
        selectedTimeframe: selectedTimeframe,
        comparisonType: comparisonType
      };
      
      const result = await exportService.exportDepartment(
        departmentId,
        format,
        {
          additionalParams: {
            export_type: 'performance_insights',
            insights_data: exportData
          }
        },
        (progress) => {
          setExportProgress(progress.progress || 0);
        }
      );
      
      if (result.success) {
        exportService.downloadFile(result.blob, result.filename);
      } else {
        setError(`Export failed: ${result.error}`);
      }
      
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [insightsData, processedInsights, selectedMetric, selectedTimeframe, comparisonType, departmentId, exporting]);

  // Render key metrics
  const renderKeyMetrics = () => {
    if (!processedInsights?.keyMetrics) return null;

    return (
      <div className="key-metrics-grid">
        {processedInsights.keyMetrics.map((metric) => (
          <StatCard
            key={metric.id}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            color={metric.color}
            onClick={() => setSelectedMetric(metric.id)}
            isSelected={selectedMetric === metric.id}
            onMouseEnter={(e) => handleTooltip(e, metric.description)}
            onMouseLeave={() => handleTooltip(null)}
          />
        ))}
      </div>
    );
  };

  // Render comparative analysis
  const renderComparativeAnalysis = () => {
    if (!processedInsights?.comparativeAnalysis || !enableComparison) return null;

    const { departmentAverage, collegeAverage, peerComparison, ranking } = processedInsights.comparativeAnalysis;

    return (
      <div className="comparative-analysis">
        <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
          Comparative Analysis
        </h3>
        
        <div className="comparison-grid">
          {departmentAverage && (
            <div className="comparison-item">
              <div className="comparison-label text-caption">Department Average</div>
              <div className="comparison-value text-heading-2">{departmentAverage.toFixed(1)}</div>
              <div className="comparison-context text-body-small">
                {ranking?.department && `Rank: ${ranking.department.position}/${ranking.department.total}`}
              </div>
            </div>
          )}
          
          {collegeAverage && (
            <div className="comparison-item">
              <div className="comparison-label text-caption">College Average</div>
              <div className="comparison-value text-heading-2">{collegeAverage.toFixed(1)}</div>
              <div className="comparison-context text-body-small">
                {ranking?.college && `Rank: ${ranking.college.position}/${ranking.college.total}`}
              </div>
            </div>
          )}
          
          {peerComparison && (
            <div className="comparison-item">
              <div className="comparison-label text-caption">Peer Average</div>
              <div className="comparison-value text-heading-2">{peerComparison.average.toFixed(1)}</div>
              <div className="comparison-context text-body-small">
                {peerComparison.percentile && `${peerComparison.percentile}th percentile`}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render trend analysis
  const renderTrendAnalysis = () => {
    if (!processedInsights?.trendAnalysis || !showTrends) return null;

    return (
      <div className="trend-analysis">
        <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
          Trend Analysis
        </h3>
        
        <div className="trend-chart">
          <svg viewBox="0 0 400 200" className="trend-svg">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y * 2}
                x2="400"
                y2={y * 2}
                stroke="var(--border-light)"
                strokeWidth="1"
                opacity="0.5"
              />
            ))}
            
            {/* Trend line */}
            {processedInsights.trendAnalysis.length > 1 && (
              <polyline
                points={processedInsights.trendAnalysis.map((trend, index) => {
                  const x = (index / (processedInsights.trendAnalysis.length - 1)) * 400;
                  const y = 200 - (trend.value / 100) * 200;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="var(--primary-blue-500)"
                strokeWidth="3"
                className="trend-line"
              />
            )}
            
            {/* Data points */}
            {processedInsights.trendAnalysis.map((trend, index) => {
              const x = (index / (processedInsights.trendAnalysis.length - 1)) * 400;
              const y = 200 - (trend.value / 100) * 200;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="var(--primary-blue-500)"
                  className="trend-point"
                  onMouseEnter={(e) => handleTooltip(e, `${trend.formattedPeriod}: ${trend.value.toFixed(1)}`)}
                  onMouseLeave={() => handleTooltip(null)}
                />
              );
            })}
          </svg>
          
          <div className="trend-labels">
            {processedInsights.trendAnalysis.map((trend, index) => (
              <span key={index} className="trend-label text-caption">
                {trend.formattedPeriod}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render recommendations
  const renderRecommendations = () => {
    if (!processedInsights?.recommendations) return null;

    return (
      <div className="recommendations">
        <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
          Recommendations
        </h3>
        
        <div className="recommendations-list">
          {processedInsights.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`recommendation-item priority-${rec.priority}`}
              onMouseEnter={() => setHoveredInsight(rec)}
              onMouseLeave={() => setHoveredInsight(null)}
            >
              <div className="recommendation-header">
                <div className="recommendation-title font-medium">{rec.title}</div>
                <div className="recommendation-badges">
                  <span className={`priority-badge priority-${rec.priority}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className={`impact-badge impact-${rec.impact}`}>
                    Impact: {rec.impact}
                  </span>
                </div>
              </div>
              
              <div className="recommendation-description text-body-small">
                {rec.description}
              </div>
              
              {rec.actions && (
                <div className="recommendation-actions">
                  <div className="actions-label text-caption font-medium">Suggested Actions:</div>
                  <ul className="actions-list">
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="action-item text-body-small">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render controls
  const renderControls = () => {
    return (
      <div className="insights-controls">
        <div className="control-group">
          <label className="text-caption font-medium">Metric</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="enhanced-input enhanced-input-sm"
          >
            <option value="overall_performance">Overall Performance</option>
            <option value="teaching_effectiveness">Teaching Effectiveness</option>
            <option value="student_engagement">Student Engagement</option>
            <option value="course_organization">Course Organization</option>
            <option value="feedback_quality">Feedback Quality</option>
          </select>
        </div>

        <div className="control-group">
          <label className="text-caption font-medium">Timeframe</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="enhanced-input enhanced-input-sm"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="2years">Last 2 Years</option>
          </select>
        </div>

        {enableComparison && (
          <div className="control-group">
            <label className="text-caption font-medium">Comparison</label>
            <select
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              className="enhanced-input enhanced-input-sm"
            >
              <option value="department">Department</option>
              <option value="college">College</option>
              <option value="historical">Historical</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`interactive-performance-insights ${className}`}>
        <LoadingState 
          type="skeleton"
          message="Loading performance insights..."
          size="large"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`interactive-performance-insights ${className}`}>
        <EmptyState
          variant="error"
          description={error}
          action={loadPerformanceInsights}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  // No data state
  if (!insightsData) {
    return (
      <div className={`interactive-performance-insights ${className}`}>
        <EmptyState
          variant="no-data"
          title="No Performance Insights"
          description="No performance insights data available for the selected criteria."
          action={loadPerformanceInsights}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className={`interactive-performance-insights ${className} fade-in`}>
      <DashboardCard
        title="Performance Insights"
        subtitle={`Comprehensive analysis for ${selectedTimeframe}`}
        icon="📈"
        variant="primary"
        headerActions={
          <div className="insights-header-actions enhanced-flex enhanced-gap-3">
            {/* Export controls */}
            {enableExport && (
              <div className="export-controls enhanced-flex enhanced-gap-1">
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  title="Export as CSV"
                >
                  CSV
                </button>
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  title="Export as PDF"
                >
                  PDF
                </button>
              </div>
            )}
            
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh insights data"
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
        {/* Export progress */}
        {exporting && (
          <div className="export-progress" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="enhanced-flex enhanced-items-center enhanced-gap-2">
              <div className="enhanced-spinner" style={{ width: '16px', height: '16px' }} />
              <span className="text-body-small">Exporting... {exportProgress}%</span>
            </div>
            <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${exportProgress}%`,
                  height: '4px',
                  backgroundColor: 'var(--primary-blue-500)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        {renderControls()}

        {/* Key Metrics */}
        <div className="insights-section" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
            Key Performance Metrics
          </h3>
          {renderKeyMetrics()}
        </div>

        {/* Comparative Analysis */}
        {enableComparison && (
          <div className="insights-section" style={{ marginBottom: 'var(--space-6)' }}>
            {renderComparativeAnalysis()}
          </div>
        )}

        {/* Trend Analysis */}
        {showTrends && (
          <div className="insights-section" style={{ marginBottom: 'var(--space-6)' }}>
            {renderTrendAnalysis()}
          </div>
        )}

        {/* Recommendations */}
        <div className="insights-section">
          {renderRecommendations()}
        </div>

        {/* Metadata */}
        {insightsData.metadata && (
          <div className="insights-metadata" style={{ marginTop: 'var(--space-4)' }}>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Analysis Period: {insightsData.metadata.period} | 
              Data Points: {insightsData.metadata.data_points} | 
              Generated: {new Date(insightsData.generated_at).toLocaleString()}
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="insights-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'var(--background-elevated)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            pointerEvents: 'none',
            maxWidth: '300px',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.4
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default InteractivePerformanceInsights;