import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApiRequest } from '../hooks/useApiRequest';
import { PRIORITY } from '../utils/requestManager';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';
import ErrorAlert from './ErrorHandling/ErrorAlert';

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
 * VisualAnalytics Component
 * 
 * Displays interactive charts and visual analytics for evaluation data.
 * Supports multiple chart types including performance distribution, trends, and comparisons.
 */
function VisualAnalytics({ 
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
        if (typeof period === 'string' && period.includes(':')) {
          const [from, to] = period.split(':');
          params.from_date = from;
          params.to_date = to || from;
        } else {
          params.period = period;
        }
      }

      const response = await get(
        `/departments/${departmentId}/visual-analytics`,
        params,
        {
          priority: PRIORITY.LOW, // Analytics are low priority
          skipCache: false // Use caching for analytics
        }
      );

      if (response) {
        setVisualData(response.data);
      }
    } catch (err) {
      console.error('Failed to load visual analytics:', err);
      
      // Handle rate limiting errors specifically
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        
        setError(`Too many requests. The system will automatically retry in ${Math.round(waitTime/1000)} seconds.`);
        
        // Auto-retry after the server-specified or default backoff period
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
      // Ensure refresh interval is at least 60 seconds to avoid rate limiting
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
      '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8',
      '#6f42c1', '#fd7e14', '#20c997', '#6c757d', '#343a40'
    ];
    
    if (typeof key === 'string') {
      // Generate consistent color based on string hash
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
        return <div className="chart-placeholder">Chart type '{type}' not supported</div>;
    }
  };

  // Render pie chart
  const renderPieChart = (data, title) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="pie-chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="pie-chart">
          <div className="pie-chart-visual">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div
                  key={item.name}
                  className="pie-slice"
                  style={{
                    '--percentage': `${percentage}%`,
                    '--color': item.color,
                    '--rotation': `${data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0)}deg`,
                  }}
                  title={`${item.name}: ${item.value} (${percentage.toFixed(1)}%)`}
                  onClick={() => onChartClick?.(chartType, item)}
                />
              );
            })}
          </div>
          {showLegend && (
            <div className="chart-legend">
              {data.map((item) => (
                <div key={item.name} className="legend-item">
                  <span 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">
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

  // Render line chart
  const renderLineChart = (data, title, chartConfig) => {
    if (!data.length) return <div className="no-data">No data available</div>;

    const maxValue = Math.max(...data.map(item => item[chartConfig.y_axis] || 0));
    const minValue = Math.min(...data.map(item => item[chartConfig.y_axis] || 0));
    const range = maxValue - minValue || 1;

    return (
      <div className="line-chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="line-chart">
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
                  stroke="#e9ecef"
                  strokeWidth="1"
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
                stroke="#007bff"
                strokeWidth="2"
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
                    r="4"
                    fill="#007bff"
                    className="data-point"
                    title={`${item[chartConfig.x_axis]}: ${item[chartConfig.y_axis]}`}
                    onClick={() => onChartClick?.(chartType, item)}
                  />
                );
              })}
            </svg>
          </div>
          
          {/* X-axis labels */}
          <div className="x-axis-labels">
            {data.map((item, index) => (
              <span key={index} className="axis-label">
                {item[chartConfig.x_axis]}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render bar chart
  const renderBarChart = (data, title, chartConfig) => {
    if (!data.length) return <div className="no-data">No data available</div>;

    const yAxes = Array.isArray(chartConfig.y_axes) ? chartConfig.y_axes : [chartConfig.y_axis];
    const maxValue = Math.max(...data.flatMap(item => 
      yAxes.map(axis => item[axis] || 0)
    ));

    return (
      <div className="bar-chart-container">
        <h4 className="chart-title">{title}</h4>
        <div className="bar-chart">
          <div className="chart-bars">
            {data.map((item, index) => (
              <div key={index} className="bar-group">
                {yAxes.map((axis, axisIndex) => {
                  const value = item[axis] || 0;
                  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  
                  return (
                    <div
                      key={axis}
                      className="bar"
                      style={{
                        height: `${height}%`,
                        backgroundColor: item.color || getDefaultColor(axisIndex),
                      }}
                      title={`${item[chartConfig.x_axis]}: ${axis} = ${value}`}
                      onClick={() => onChartClick?.(chartType, { ...item, axis, value })}
                    />
                  );
                })}
                <span className="bar-label">{item[chartConfig.x_axis]}</span>
              </div>
            ))}
          </div>
          
          {showLegend && yAxes.length > 1 && (
            <div className="chart-legend">
              {yAxes.map((axis, index) => (
                <div key={axis} className="legend-item">
                  <span 
                    className="legend-color" 
                    style={{ backgroundColor: getDefaultColor(index) }}
                  />
                  <span className="legend-label">
                    {axis.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`visual-analytics loading ${className}`} style={{ height }}>
        <LoadingSpinner size="large" showMessage={false} showElapsed={false} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`visual-analytics error ${className}`} style={{ height }}>
        <ErrorAlert
          error={{ 
            response: { 
              data: { 
                message: error,
                status: 500
              } 
            } 
          }}
          onRetry={loadVisualAnalytics}
          onDismiss={() => setError(null)}
        />
      </div>
    );
  }

  // No data state
  if (!visualData?.charts || Object.keys(visualData.charts).length === 0) {
    return (
      <div className={`visual-analytics no-data ${className}`} style={{ height }}>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Analytics Data</h3>
          <p>No visual analytics data available for the selected criteria.</p>
          <button className="dept-btn dept-btn-primary" onClick={loadVisualAnalytics}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`visual-analytics ${className}`} style={{ height }}>
      {/* Chart selector */}
      {Object.keys(processedCharts).length > 1 && (
        <div className="chart-selector">
          <div className="chart-tabs">
            {Object.keys(processedCharts).map((chartType) => (
              <button
                key={chartType}
                className={`chart-tab ${selectedChart === chartType ? 'active' : ''}`}
                onClick={() => setSelectedChart(chartType)}
              >
                {processedCharts[chartType].title}
              </button>
            ))}
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh analytics data"
          >
            {refreshing ? '🔄' : '↻'}
          </button>
        </div>
      )}

      {/* Chart display */}
      <div className="chart-display">
        {processedCharts[selectedChart] && renderChart(selectedChart, processedCharts[selectedChart])}
      </div>

      {/* Chart metadata */}
      {visualData.metadata && (
        <div className="chart-metadata">
          <small className="metadata-text">
            Department: {visualData.metadata.department_name} | 
            Period: {visualData.metadata.period} | 
            Generated: {new Date(visualData.generated_at).toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
}

export default VisualAnalytics;
