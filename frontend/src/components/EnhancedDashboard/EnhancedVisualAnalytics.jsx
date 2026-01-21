import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApiRequest } from '../../hooks/useApiRequest';
import { PRIORITY } from '../../utils/requestManager';
import DashboardCard from './DashboardCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Enhanced Visual Analytics Component
 * 
 * Modern, interactive charts with enhanced styling, smooth animations,
 * and improved user experience.
 */
function EnhancedVisualAnalytics({ 
  departmentId, 
  chartTypes = ['performance_distribution', 'participation_trends'],
  period = null,
  timeRange = '1year',
  height = '400px',
  className = '',
  onChartClick = null,
  showLegend = true,
  showTooltips = true,
  refreshInterval = null
}) {
  const [visualData, setVisualData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(chartTypes[0]);
  const [refreshing, setRefreshing] = useState(false);

  const { loading, get } = useApiRequest();

  // Load visual analytics data using the request manager
  const loadVisualAnalytics = useCallback(async () => {
    try {
      setError(null);

      const params = {
        chart_types: chartTypes,
        time_range: timeRange,
      };

      if (period) {
        params.period = period;
      }

      const response = await get(
        `/departments/${departmentId}/visual-analytics`,
        params,
        {
          priority: PRIORITY.LOW,
          skipCache: false
        }
      );

      if (response) {
        setVisualData(response.data);
      }
    } catch (err) {
      console.error('Failed to load visual analytics:', err);
      
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        setError(`Too many requests. The system will automatically retry in ${Math.round(waitTime/1000)} seconds.`);
        
        setTimeout(() => {
          setError(null);
          loadVisualAnalytics();
        }, waitTime);
        return;
      }
      
      setError('Failed to load visual analytics data. Please try again.');
    }
  }, [departmentId, chartTypes, period, timeRange, get]);

  // Debounced load function
  const debouncedLoad = useCallback(
    debounce(() => {
      loadVisualAnalytics();
    }, 1000),
    [loadVisualAnalytics]
  );

  // Refresh data
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadVisualAnalytics();
    } catch (err) {
      console.error('Failed to refresh visual analytics:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadVisualAnalytics]);

  // Load data on component mount and when dependencies change (debounced)
  useEffect(() => {
    if (departmentId) {
      debouncedLoad();
    }
  }, [departmentId, debouncedLoad]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const safeInterval = Math.max(refreshInterval, 60000);
      const interval = setInterval(() => {
        if (!loading && !refreshing) {
          handleRefresh();
        }
      }, safeInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loading, refreshing, handleRefresh]);

  // Memoized chart data processing
  const processedCharts = useMemo(() => {
    if (!visualData?.charts) return {};

    const processed = {};
    
    Object.entries(visualData.charts).forEach(([chartType, chartData]) => {
      processed[chartType] = {
        ...chartData,
        processedData: processChartData(chartData),
      };
    });

    return processed;
  }, [visualData]);

  // Process chart data for rendering
  const processChartData = (chartData) => {
    if (!chartData?.data) return [];

    switch (chartData.type) {
      case 'pie':
        return Object.entries(chartData.data).map(([key, value]) => ({
          name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value.count || value,
          percentage: value.percentage || 0,
          color: chartData.colors?.[key] || getDefaultColor(key),
        }));

      case 'line':
        return chartData.data.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString(),
        }));

      case 'bar':
        return chartData.data.map((item, index) => ({
          ...item,
          color: Array.isArray(chartData.colors) 
            ? chartData.colors[index % chartData.colors.length]
            : getDefaultColor(index),
        }));

      default:
        return chartData.data;
    }
  };

  // Get default colors for charts
  const getDefaultColor = (key) => {
    const colors = [
      'var(--primary-blue-500)', 'var(--success-green-500)', 'var(--warning-orange-500)', 
      'var(--error-red-500)', 'var(--primary-blue-300)', 'var(--success-green-300)',
      'var(--warning-orange-300)', 'var(--error-red-300)', 'var(--neutral-500)', 'var(--neutral-400)'
    ];
    
    if (typeof key === 'string') {
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    }
    
    return colors[key % colors.length];
  };

  // Render chart based on type
  const renderChart = (chartType, chartData) => {
    const { type, title, processedData } = chartData;

    switch (type) {
      case 'pie':
        return renderPieChart(processedData, title);
      case 'line':
        return renderLineChart(processedData, title, chartData);
      case 'bar':
        return renderBarChart(processedData, title, chartData);
      default:
        return (
          <div className="chart-placeholder enhanced-card">
            <div className="enhanced-card-body">
              <EmptyState
                icon="📊"
                title="Unsupported Chart Type"
                description={`Chart type '${type}' is not currently supported.`}
                size="small"
              />
            </div>
          </div>
        );
    }
  };

  // Render enhanced pie chart
  const renderPieChart = (data, title) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="enhanced-pie-chart">
        <div className="chart-content">
          <div className="pie-chart-visual">
            <svg viewBox="0 0 200 200" className="pie-svg">
              {data.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const angle = (item.value / total) * 360;
                const startAngle = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0);
                
                const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 100 + 80 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                const y2 = 100 + 80 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                return (
                  <path
                    key={item.name}
                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                    className="pie-slice enhanced-interactive"
                    title={`${item.name}: ${item.value} (${percentage.toFixed(1)}%)`}
                    onClick={() => onChartClick?.(chartType, item)}
                  />
                );
              })}
            </svg>
            <div className="pie-center">
              <div className="pie-total text-heading-3">{total}</div>
              <div className="pie-label text-body-small">Total</div>
            </div>
          </div>
          
          {showLegend && (
            <div className="enhanced-chart-legend">
              {data.map((item) => (
                <div key={item.name} className="legend-item enhanced-flex enhanced-gap-2">
                  <span 
                    className="legend-color" 
                    style={{ 
                      backgroundColor: item.color,
                      width: '12px',
                      height: '12px',
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0
                    }}
                  />
                  <span className="legend-label text-body-small">{item.name}</span>
                  <span className="legend-value text-body-small font-medium">
                    {item.value} ({item.percentage?.toFixed(1) || '0.0'}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render enhanced line chart
  const renderLineChart = (data, title, chartConfig) => {
    if (!data.length) {
      return (
        <EmptyState
          icon="📈"
          title="No Chart Data"
          description="No data available for the selected time range."
          size="small"
        />
      );
    }

    const maxValue = Math.max(...data.map(item => item[chartConfig.y_axis] || 0));
    const minValue = Math.min(...data.map(item => item[chartConfig.y_axis] || 0));
    const range = maxValue - minValue || 1;

    return (
      <div className="enhanced-line-chart">
        <div className="chart-area">
          <svg viewBox="0 0 400 200" className="line-chart-svg">
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
            
            {/* Data line */}
            <polyline
              points={data.map((item, index) => {
                const x = (index / (data.length - 1)) * 400;
                const y = 200 - ((item[chartConfig.y_axis] - minValue) / range) * 200;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="var(--primary-blue-500)"
              strokeWidth="3"
              className="chart-line"
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((item[chartConfig.y_axis] - minValue) / range) * 200;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="var(--primary-blue-500)"
                  className="data-point enhanced-interactive"
                  title={`${item[chartConfig.x_axis]}: ${item[chartConfig.y_axis]}`}
                  onClick={() => onChartClick?.(chartType, item)}
                />
              );
            })}
          </svg>
        </div>
        
        <div className="x-axis-labels enhanced-flex enhanced-flex-between">
          {data.map((item, index) => (
            <span key={index} className="axis-label text-caption">
              {item[chartConfig.x_axis]}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Render enhanced bar chart
  const renderBarChart = (data, title, chartConfig) => {
    if (!data.length) {
      return (
        <EmptyState
          icon="📊"
          title="No Chart Data"
          description="No data available for the selected criteria."
          size="small"
        />
      );
    }

    const yAxes = Array.isArray(chartConfig.y_axes) ? chartConfig.y_axes : [chartConfig.y_axis];
    const maxValue = Math.max(...data.flatMap(item => 
      yAxes.map(axis => item[axis] || 0)
    ));

    return (
      <div className="enhanced-bar-chart">
        <div className="chart-bars">
          {data.map((item, index) => (
            <div key={index} className="bar-group">
              <div className="bars-container">
                {yAxes.map((axis, axisIndex) => {
                  const value = item[axis] || 0;
                  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  
                  return (
                    <div
                      key={axis}
                      className="bar enhanced-interactive"
                      style={{
                        height: `${height}%`,
                        backgroundColor: item.color || getDefaultColor(axisIndex),
                        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                        minHeight: '4px'
                      }}
                      title={`${item[chartConfig.x_axis]}: ${axis} = ${value}`}
                      onClick={() => onChartClick?.(chartType, { ...item, axis, value })}
                    />
                  );
                })}
              </div>
              <span className="bar-label text-caption">{item[chartConfig.x_axis]}</span>
            </div>
          ))}
        </div>
        
        {showLegend && yAxes.length > 1 && (
          <div className="enhanced-chart-legend">
            {yAxes.map((axis, index) => (
              <div key={axis} className="legend-item enhanced-flex enhanced-gap-2">
                <span 
                  className="legend-color" 
                  style={{ 
                    backgroundColor: getDefaultColor(index),
                    width: '12px',
                    height: '12px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
                <span className="legend-label text-body-small">
                  {axis.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`enhanced-visual-analytics ${className}`} style={{ height }}>
        <LoadingState 
          type="skeleton"
          message="Loading visual analytics..."
          size="large"
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-visual-analytics ${className}`} style={{ height }}>
        <EmptyState
          variant="error"
          description={error}
          action={loadVisualAnalytics}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  // No data state
  if (!visualData?.charts || Object.keys(visualData.charts).length === 0) {
    return (
      <div className={`enhanced-visual-analytics ${className}`} style={{ height }}>
        <EmptyState
          variant="no-data"
          action={loadVisualAnalytics}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className={`enhanced-visual-analytics ${className} fade-in`} style={{ height }}>
      <DashboardCard
        title="Visual Analytics"
        subtitle={visualData.metadata?.department_name || 'Department Analytics'}
        icon="📊"
        variant="primary"
        headerActions={
          <div className="chart-controls enhanced-flex enhanced-gap-3">
            {/* Chart selector */}
            {Object.keys(processedCharts).length > 1 && (
              <select
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                className="enhanced-input"
                style={{ width: 'auto', minWidth: '150px' }}
              >
                {Object.keys(processedCharts).map((chartType) => (
                  <option key={chartType} value={chartType}>
                    {processedCharts[chartType].title}
                  </option>
                ))}
              </select>
            )}
            
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh analytics data"
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
        {/* Chart display */}
        <div className="chart-display">
          {processedCharts[selectedChart] && renderChart(selectedChart, processedCharts[selectedChart])}
        </div>

        {/* Chart metadata */}
        {visualData.metadata && (
          <div className="chart-metadata" style={{ marginTop: 'var(--space-4)' }}>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Department: {visualData.metadata.department_name} | 
              Period: {visualData.metadata.period} | 
              Generated: {new Date(visualData.generated_at).toLocaleString()}
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}

export default EnhancedVisualAnalytics;