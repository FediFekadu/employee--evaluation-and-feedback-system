import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApiRequest } from '../hooks/useApiRequest';
import { PRIORITY } from '../utils/requestManager';
import exportService from '../services/exportService';
import DashboardCard from './EnhancedDashboard/DashboardCard';
import LoadingState from './EnhancedDashboard/LoadingState';
import EmptyState from './EnhancedDashboard/EmptyState';

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
 * Interactive Visual Analytics Component
 * 
 * Enhanced charts with interactivity, filtering, drill-down capabilities,
 * tooltips, and export functionality.
 */
function InteractiveVisualAnalytics({ 
  departmentId, 
  chartTypes = ['performance_distribution', 'participation_trends'],
  period = null,
  timeRange = '1year',
  height = '500px',
  className = '',
  onChartClick = null,
  showLegend = true,
  showTooltips = true,
  refreshInterval = null,
  enableExport = true,
  enableFiltering = true,
  enableDrillDown = true
}) {
  const [visualData, setVisualData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(chartTypes[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Interactive features state
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');
  const [hoveredData, setHoveredData] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [drillDownPath, setDrillDownPath] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('chart'); // 'chart', 'table', 'both'
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });
  const tooltipRef = useRef(null);
  
  // Animation and interaction state
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [fullscreenChart, setFullscreenChart] = useState(null);

  const { loading, get } = useApiRequest();

  // Load visual analytics data
  const loadVisualAnalytics = useCallback(async () => {
    try {
      setError(null);

      const params = {
        chart_types: chartTypes,
        time_range: timeRange,
        filters: filters,
        sort_by: sortBy,
        sort_direction: sortDirection,
        drill_down_path: drillDownPath
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
  }, [departmentId, chartTypes, period, timeRange, filters, sortBy, sortDirection, drillDownPath, get]);

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

  // Load data on component mount and when dependencies change
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

  // Process and filter chart data
  const processedCharts = useMemo(() => {
    if (!visualData?.charts) return {};

    const processed = {};
    
    Object.entries(visualData.charts).forEach(([chartType, chartData]) => {
      let processedData = processChartData(chartData);
      
      // Apply search filter
      if (searchQuery.trim()) {
        processedData = processedData.filter(item => {
          const searchableText = [
            item.name,
            item.label,
            item.category,
            item.description,
            ...(item.tags || [])
          ].filter(Boolean).join(' ').toLowerCase();
          
          return searchableText.includes(searchQuery.toLowerCase());
        });
      }
      
      // Apply filters
      if (enableFiltering && Object.keys(filters).length > 0) {
        processedData = applyFilters(processedData, filters);
      }
      
      // Apply sorting
      processedData = applySorting(processedData, sortBy, sortDirection);
      
      processed[chartType] = {
        ...chartData,
        processedData,
        originalData: chartData.data,
        filteredCount: processedData.length,
        totalCount: chartData.data?.length || 0
      };
    });

    return processed;
  }, [visualData, filters, sortBy, sortDirection, enableFiltering, searchQuery]);

  // Process chart data for rendering
  const processChartData = (chartData) => {
    if (!chartData?.data) return [];

    switch (chartData.type) {
      case 'pie':
        return Object.entries(chartData.data).map(([key, value]) => ({
          id: key,
          name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          label: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: value.count || value,
          percentage: value.percentage || 0,
          color: chartData.colors?.[key] || getDefaultColor(key),
          metadata: value.metadata || {},
          category: value.category || 'default',
          tags: value.tags || [],
          drillDownKey: value.drillDownKey,
          description: value.description
        }));

      case 'line':
        return chartData.data.map((item, index) => ({
          ...item,
          id: item.id || index,
          date: new Date(item.date).toLocaleDateString(),
          formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          metadata: item.metadata || {},
          category: item.category || 'default',
          tags: item.tags || [],
          drillDownKey: item.drillDownKey,
          description: item.description
        }));

      case 'bar':
        return chartData.data.map((item, index) => ({
          ...item,
          id: item.id || index,
          color: Array.isArray(chartData.colors) 
            ? chartData.colors[index % chartData.colors.length]
            : getDefaultColor(index),
          metadata: item.metadata || {},
          category: item.category || 'default',
          tags: item.tags || [],
          drillDownKey: item.drillDownKey,
          description: item.description
        }));

      default:
        return chartData.data.map((item, index) => ({
          ...item,
          id: item.id || index,
          metadata: item.metadata || {},
          category: item.category || 'default',
          tags: item.tags || [],
          drillDownKey: item.drillDownKey,
          description: item.description
        }));
    }
  };

  // Apply filters to data
  const applyFilters = (data, filters) => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        
        if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
          const itemValue = parseFloat(item[key]);
          return itemValue >= value.min && itemValue <= value.max;
        }
        
        if (key === 'category' && item.category) {
          return item.category === value;
        }
        
        if (key === 'tags' && item.tags) {
          return item.tags.includes(value);
        }
        
        return item[key] === value;
      });
    });
  };

  // Apply sorting to data with enhanced options
  const applySorting = (data, sortBy, direction) => {
    return [...data].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Handle special sorting cases
      if (sortBy === 'name' || sortBy === 'label') {
        aVal = (a.name || a.label || '').toLowerCase();
        bVal = (b.name || b.label || '').toLowerCase();
      } else if (sortBy === 'date') {
        aVal = new Date(a.date || a.formattedDate);
        bVal = new Date(b.date || b.formattedDate);
      } else if (sortBy === 'percentage') {
        aVal = parseFloat(a.percentage || 0);
        bVal = parseFloat(b.percentage || 0);
      }
      
      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle date values
      if (aVal instanceof Date && bVal instanceof Date) {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle string values
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      
      if (direction === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
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

  // Handle mouse events for tooltips and interactions
  const handleMouseEnter = useCallback((event, data, chartType) => {
    if (!showTooltips) return;
    
    setHoveredData({ data, chartType });
    
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipContent = generateTooltipContent(data, chartType);
    
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: tooltipContent
    });
  }, [showTooltips]);

  const handleMouseLeave = useCallback(() => {
    setHoveredData(null);
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  }, []);

  const handleClick = useCallback((data, chartType) => {
    // Toggle selection if comparison mode is enabled
    if (comparisonMode) {
      setSelectedItems(prev => {
        const isSelected = prev.some(item => item.id === data.id);
        if (isSelected) {
          return prev.filter(item => item.id !== data.id);
        } else {
          return [...prev, { ...data, chartType }];
        }
      });
    } else {
      setSelectedData({ data, chartType });
    }
    
    // Handle drill-down if enabled
    if (enableDrillDown && data.drillDownKey) {
      setDrillDownPath([...drillDownPath, data.drillDownKey]);
    }
    
    // Call external click handler
    if (onChartClick) {
      onChartClick(chartType, data);
    }
  }, [enableDrillDown, drillDownPath, onChartClick, comparisonMode]);

  const handleDoubleClick = useCallback((data, chartType) => {
    // Double-click to enter fullscreen mode
    setFullscreenChart({ data, chartType, chart: processedCharts[chartType] });
  }, [processedCharts]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, data, chartType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(data, chartType);
    } else if (event.key === 'Escape') {
      setSelectedData(null);
      setSelectedItems([]);
      setFullscreenChart(null);
    }
  }, [handleClick]);

  // Generate enhanced tooltip content
  const generateTooltipContent = (data, chartType) => {
    const chart = processedCharts[chartType];
    if (!chart) return null;

    return (
      <div className="tooltip-content">
        <div className="tooltip-title">{data.name || data.label}</div>
        <div className="tooltip-details">
          {chart.type === 'pie' && (
            <>
              <div><strong>Value:</strong> {data.value?.toLocaleString()}</div>
              <div><strong>Percentage:</strong> {data.percentage?.toFixed(1)}%</div>
              {data.metadata?.total && (
                <div><strong>Total:</strong> {data.metadata.total.toLocaleString()}</div>
              )}
            </>
          )}
          {chart.type === 'bar' && (
            <>
              <div><strong>Value:</strong> {(data.value || data[chart.y_axis])?.toLocaleString()}</div>
              {data.metadata?.benchmark && (
                <div><strong>Benchmark:</strong> {data.metadata.benchmark.toLocaleString()}</div>
              )}
              {data.metadata?.change && (
                <div><strong>Change:</strong> {data.metadata.change > 0 ? '+' : ''}{data.metadata.change}%</div>
              )}
            </>
          )}
          {chart.type === 'line' && (
            <>
              <div><strong>Date:</strong> {data.formattedDate || data.date}</div>
              <div><strong>Value:</strong> {data[chart.y_axis]?.toLocaleString()}</div>
              {data.metadata?.trend && (
                <div><strong>Trend:</strong> {data.metadata.trend}</div>
              )}
              {data.metadata?.previousValue && (
                <div><strong>Previous:</strong> {data.metadata.previousValue.toLocaleString()}</div>
              )}
            </>
          )}
          {data.category && data.category !== 'default' && (
            <div><strong>Category:</strong> {data.category}</div>
          )}
          {data.tags && data.tags.length > 0 && (
            <div><strong>Tags:</strong> {data.tags.join(', ')}</div>
          )}
          {data.description && (
            <div className="tooltip-description">{data.description}</div>
          )}
          {enableDrillDown && data.drillDownKey && (
            <div className="tooltip-action">Click to drill down</div>
          )}
          {comparisonMode && (
            <div className="tooltip-action">
              {selectedItems.some(item => item.id === data.id) ? 'Click to deselect' : 'Click to select for comparison'}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle filter changes with enhanced functionality
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  // Handle search query changes
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Handle sort changes with multi-column support
  const handleSortChange = useCallback((newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  // Handle drill-down navigation
  const handleDrillUp = useCallback(() => {
    if (drillDownPath.length > 0) {
      setDrillDownPath(prev => prev.slice(0, -1));
    }
  }, [drillDownPath]);

  // Handle view mode changes
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Handle comparison mode toggle
  const handleComparisonToggle = useCallback(() => {
    setComparisonMode(prev => !prev);
    if (comparisonMode) {
      setSelectedItems([]);
    }
  }, [comparisonMode]);

  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback((chartType = null) => {
    if (fullscreenChart) {
      setFullscreenChart(null);
    } else if (chartType && processedCharts[chartType]) {
      setFullscreenChart({ 
        chartType, 
        chart: processedCharts[chartType],
        data: processedCharts[chartType].processedData
      });
    }
  }, [fullscreenChart, processedCharts]);

  // Clear all selections and filters
  const handleClearAll = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setSelectedData(null);
    setSelectedItems([]);
    setDrillDownPath([]);
    setSortBy('value');
    setSortDirection('desc');
  }, []);

  // Export chart data with enhanced options
  const handleExport = useCallback(async (format, options = {}) => {
    if (!visualData || exporting) return;
    
    try {
      setExporting(true);
      setExportProgress(0);
      
      const exportData = {
        charts: processedCharts,
        metadata: {
          ...visualData.metadata,
          exportedAt: new Date().toISOString(),
          filters: filters,
          searchQuery: searchQuery,
          sortBy: sortBy,
          sortDirection: sortDirection,
          drillDownPath: drillDownPath,
          selectedChart: selectedChart,
          viewMode: viewMode,
          comparisonMode: comparisonMode,
          selectedItems: selectedItems
        },
        summary: {
          totalCharts: Object.keys(processedCharts).length,
          totalDataPoints: Object.values(processedCharts).reduce((sum, chart) => sum + chart.processedData.length, 0),
          filteredDataPoints: Object.values(processedCharts).reduce((sum, chart) => sum + chart.filteredCount, 0),
          appliedFilters: Object.keys(filters).length,
          hasSearch: !!searchQuery.trim()
        }
      };
      
      // Add chart-specific data based on current selection
      if (selectedChart && processedCharts[selectedChart]) {
        exportData.focusChart = {
          type: selectedChart,
          title: processedCharts[selectedChart].title,
          data: processedCharts[selectedChart].processedData,
          config: processedCharts[selectedChart]
        };
      }
      
      // Add comparison data if in comparison mode
      if (comparisonMode && selectedItems.length > 0) {
        exportData.comparisonData = {
          items: selectedItems,
          summary: generateComparisonSummary(selectedItems)
        };
      }
      
      const result = await exportService.exportDepartment(
        departmentId,
        format,
        {
          additionalParams: {
            export_type: 'interactive_visual_analytics',
            chart_data: exportData,
            include_raw_data: options.includeRawData || false,
            include_metadata: options.includeMetadata !== false,
            chart_format: options.chartFormat || 'embedded'
          }
        },
        (progress) => {
          setExportProgress(progress.progress || 0);
        }
      );
      
      if (result.success) {
        exportService.downloadFile(result.blob, result.filename);
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification({
            type: 'success',
            title: 'Export Successful',
            message: `Analytics exported as ${format.toUpperCase()}`,
            duration: 3000
          });
        }
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
  }, [visualData, processedCharts, filters, searchQuery, sortBy, sortDirection, drillDownPath, selectedChart, viewMode, comparisonMode, selectedItems, departmentId, exporting]);

  // Generate comparison summary for export
  const generateComparisonSummary = useCallback((items) => {
    if (items.length === 0) return null;
    
    const summary = {
      itemCount: items.length,
      chartTypes: [...new Set(items.map(item => item.chartType))],
      categories: [...new Set(items.map(item => item.category).filter(Boolean))],
      totalValue: items.reduce((sum, item) => sum + (item.value || 0), 0),
      averageValue: 0,
      minValue: Math.min(...items.map(item => item.value || 0)),
      maxValue: Math.max(...items.map(item => item.value || 0))
    };
    
    summary.averageValue = summary.totalValue / items.length;
    
    return summary;
  }, []);

  // Render chart based on type
  const renderChart = (chartType, chartData) => {
    const { type, title, processedData } = chartData;

    switch (type) {
      case 'pie':
        return renderInteractivePieChart(processedData, title, chartType);
      case 'line':
        return renderInteractiveLineChart(processedData, title, chartData, chartType);
      case 'bar':
        return renderInteractiveBarChart(processedData, title, chartData, chartType);
      default:
        return (
          <EmptyState
            icon="📊"
            title="Unsupported Chart Type"
            description={`Chart type '${type}' is not currently supported.`}
            size="small"
          />
        );
    }
  };

  // Render interactive pie chart with enhanced features
  const renderInteractivePieChart = (data, title, chartType) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="interactive-pie-chart">
        <div className="chart-content">
          <div className="pie-chart-visual">
            <svg 
              viewBox="0 0 200 200" 
              className="pie-svg"
              role="img"
              aria-label={`${title} pie chart with ${data.length} segments`}
            >
              <title>{title}</title>
              <desc>Interactive pie chart showing data distribution</desc>
              
              {data.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const angle = (item.value / total) * 360;
                const startAngle = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0);
                
                const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 100 + 80 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
                const y2 = 100 + 80 * Math.sin((startAngle + angle - 90) * Math.PI / 180);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                const isSelected = selectedData?.data?.id === item.id;
                const isHovered = hoveredData?.data?.id === item.id;
                const isComparisonSelected = selectedItems.some(selected => selected.id === item.id);
                
                return (
                  <path
                    key={item.id || item.name}
                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                    className={`pie-slice interactive-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isComparisonSelected ? 'comparison-selected' : ''}`}
                    onMouseEnter={(e) => handleMouseEnter(e, item, chartType)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(item, chartType)}
                    onDoubleClick={() => handleDoubleClick(item, chartType)}
                    onKeyDown={(e) => handleKeyDown(e, item, chartType)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${item.name}: ${item.value} (${percentage.toFixed(1)}%)`}
                    style={{
                      cursor: 'pointer',
                      transition: animationEnabled ? 'all 0.2s ease' : 'none',
                      filter: isHovered ? 'brightness(1.1)' : 'none',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: '100px 100px',
                      stroke: isComparisonSelected ? 'var(--primary-blue-600)' : 'none',
                      strokeWidth: isComparisonSelected ? 2 : 0
                    }}
                  />
                );
              })}
            </svg>
            
            <div className="pie-center">
              <div className="pie-total text-heading-3">{total.toLocaleString()}</div>
              <div className="pie-label text-body-small">Total</div>
              {comparisonMode && selectedItems.length > 0 && (
                <div className="pie-comparison text-caption">
                  {selectedItems.length} selected
                </div>
              )}
            </div>
          </div>
          
          {showLegend && (
            <div className="interactive-chart-legend">
              {data.map((item) => {
                const isSelected = selectedData?.data?.id === item.id;
                const isComparisonSelected = selectedItems.some(selected => selected.id === item.id);
                
                return (
                  <div 
                    key={item.id || item.name} 
                    className={`legend-item interactive-legend-item ${isSelected ? 'selected' : ''} ${isComparisonSelected ? 'comparison-selected' : ''}`}
                    onClick={() => handleClick(item, chartType)}
                    onMouseEnter={(e) => handleMouseEnter(e, item, chartType)}
                    onMouseLeave={handleMouseLeave}
                    onKeyDown={(e) => handleKeyDown(e, item, chartType)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Legend item: ${item.name}`}
                  >
                    <span 
                      className="legend-color" 
                      style={{ 
                        backgroundColor: item.color,
                        width: '12px',
                        height: '12px',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0,
                        border: isComparisonSelected ? '2px solid var(--primary-blue-600)' : 'none'
                      }}
                    />
                    <span className="legend-label text-body-small">{item.name}</span>
                    <span className="legend-value text-body-small font-medium">
                      {item.value.toLocaleString()} ({item.percentage?.toFixed(1) || '0.0'}%)
                    </span>
                    {comparisonMode && (
                      <span className="legend-checkbox">
                        {isComparisonSelected ? '✓' : '○'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render interactive line chart with enhanced features
  const renderInteractiveLineChart = (data, title, chartConfig, chartType) => {
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
      <div className="interactive-line-chart">
        <div className="chart-area">
          <svg 
            viewBox="0 0 400 200" 
            className="line-chart-svg"
            role="img"
            aria-label={`${title} line chart with ${data.length} data points`}
          >
            <title>{title}</title>
            <desc>Interactive line chart showing trends over time</desc>
            
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
            
            {/* Data line with gradient */}
            <defs>
              <linearGradient id={`lineGradient-${chartType}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary-blue-500)" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="var(--primary-blue-300)" stopOpacity="0.8"/>
              </linearGradient>
            </defs>
            
            <polyline
              points={data.map((item, index) => {
                const x = (index / (data.length - 1)) * 400;
                const y = 200 - ((item[chartConfig.y_axis] - minValue) / range) * 200;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke={`url(#lineGradient-${chartType})`}
              strokeWidth="3"
              className="chart-line"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))'
              }}
            />
            
            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((item[chartConfig.y_axis] - minValue) / range) * 200;
              const isSelected = selectedData?.data?.id === item.id;
              const isHovered = hoveredData?.data?.id === item.id;
              const isComparisonSelected = selectedItems.some(selected => selected.id === item.id);
              
              return (
                <circle
                  key={item.id || index}
                  cx={x}
                  cy={y}
                  r={isSelected || isHovered ? "8" : "6"}
                  fill="var(--primary-blue-500)"
                  className={`data-point interactive-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isComparisonSelected ? 'comparison-selected' : ''}`}
                  onMouseEnter={(e) => handleMouseEnter(e, item, chartType)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(item, chartType)}
                  onDoubleClick={() => handleDoubleClick(item, chartType)}
                  onKeyDown={(e) => handleKeyDown(e, item, chartType)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Data point: ${item[chartConfig.x_axis]} - ${item[chartConfig.y_axis]}`}
                  style={{
                    cursor: 'pointer',
                    transition: animationEnabled ? 'all 0.2s ease' : 'none',
                    filter: isHovered ? 'brightness(1.2)' : 'none',
                    transform: isSelected ? 'scale(1.3)' : isHovered ? 'scale(1.2)' : 'scale(1)',
                    stroke: isComparisonSelected ? 'var(--primary-blue-600)' : 'var(--background-white)',
                    strokeWidth: isComparisonSelected ? 3 : 2
                  }}
                />
              );
            })}
            
            {/* Trend line if available */}
            {data.length > 1 && (
              <line
                x1="0"
                y1={200 - ((data[0][chartConfig.y_axis] - minValue) / range) * 200}
                x2="400"
                y2={200 - ((data[data.length - 1][chartConfig.y_axis] - minValue) / range) * 200}
                stroke="var(--warning-orange-500)"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.6"
                className="trend-line"
              />
            )}
          </svg>
        </div>
        
        <div className="x-axis-labels enhanced-flex enhanced-flex-between">
          {data.map((item, index) => (
            <span 
              key={item.id || index} 
              className="axis-label text-caption"
              title={item.formattedDate || item[chartConfig.x_axis]}
            >
              {item[chartConfig.x_axis]}
            </span>
          ))}
        </div>
        
        {/* Chart statistics */}
        <div className="chart-stats enhanced-flex enhanced-gap-4 enhanced-justify-center" style={{ marginTop: 'var(--space-3)' }}>
          <span className="stat-item text-caption">
            <strong>Min:</strong> {minValue.toLocaleString()}
          </span>
          <span className="stat-item text-caption">
            <strong>Max:</strong> {maxValue.toLocaleString()}
          </span>
          <span className="stat-item text-caption">
            <strong>Avg:</strong> {(data.reduce((sum, item) => sum + item[chartConfig.y_axis], 0) / data.length).toLocaleString()}
          </span>
          {comparisonMode && selectedItems.length > 0 && (
            <span className="stat-item text-caption">
              <strong>Selected:</strong> {selectedItems.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render interactive bar chart with enhanced features
  const renderInteractiveBarChart = (data, title, chartConfig, chartType) => {
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
      <div className="interactive-bar-chart">
        <div className="chart-bars" role="img" aria-label={`${title} bar chart with ${data.length} bars`}>
          {data.map((item, index) => (
            <div key={item.id || index} className="bar-group">
              <div className="bars-container">
                {yAxes.map((axis, axisIndex) => {
                  const value = item[axis] || 0;
                  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  const isSelected = selectedData?.data?.id === item.id;
                  const isHovered = hoveredData?.data?.id === item.id;
                  const isComparisonSelected = selectedItems.some(selected => selected.id === item.id);
                  
                  return (
                    <div
                      key={axis}
                      className={`bar interactive-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isComparisonSelected ? 'comparison-selected' : ''}`}
                      style={{
                        height: `${height}%`,
                        backgroundColor: item.color || getDefaultColor(axisIndex),
                        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                        minHeight: '4px',
                        cursor: 'pointer',
                        transition: animationEnabled ? 'all 0.2s ease' : 'none',
                        filter: isHovered ? 'brightness(1.1)' : 'none',
                        transform: isSelected ? 'scaleY(1.05)' : 'scaleY(1)',
                        transformOrigin: 'bottom',
                        border: isComparisonSelected ? '2px solid var(--primary-blue-600)' : 'none',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, { ...item, axis, value }, chartType)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick({ ...item, axis, value }, chartType)}
                      onDoubleClick={() => handleDoubleClick({ ...item, axis, value }, chartType)}
                      onKeyDown={(e) => handleKeyDown(e, { ...item, axis, value }, chartType)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${item[chartConfig.x_axis]}: ${axis} = ${value.toLocaleString()}`}
                    >
                      {/* Value label on hover or selection */}
                      {(isHovered || isSelected) && (
                        <div 
                          className="bar-value-label"
                          style={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--background-elevated)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: '500',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-light)',
                            whiteSpace: 'nowrap',
                            zIndex: 10
                          }}
                        >
                          {value.toLocaleString()}
                        </div>
                      )}
                      
                      {/* Comparison checkbox */}
                      {comparisonMode && (
                        <div 
                          className="bar-checkbox"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: isComparisonSelected ? 'var(--primary-blue-500)' : 'var(--background-white)',
                            border: '2px solid var(--primary-blue-500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'white'
                          }}
                        >
                          {isComparisonSelected ? '✓' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span 
                className="bar-label text-caption"
                title={item[chartConfig.x_axis]}
                style={{
                  fontWeight: selectedData?.data?.id === item.id ? '600' : '400',
                  color: selectedData?.data?.id === item.id ? 'var(--primary-blue-600)' : 'var(--text-tertiary)'
                }}
              >
                {item[chartConfig.x_axis]}
              </span>
            </div>
          ))}
        </div>
        
        {showLegend && yAxes.length > 1 && (
          <div className="interactive-chart-legend">
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
        
        {/* Chart statistics */}
        <div className="chart-stats enhanced-flex enhanced-gap-4 enhanced-justify-center" style={{ marginTop: 'var(--space-3)' }}>
          <span className="stat-item text-caption">
            <strong>Items:</strong> {data.length}
          </span>
          <span className="stat-item text-caption">
            <strong>Max:</strong> {maxValue.toLocaleString()}
          </span>
          {yAxes.length === 1 && (
            <span className="stat-item text-caption">
              <strong>Total:</strong> {data.reduce((sum, item) => sum + (item[yAxes[0]] || 0), 0).toLocaleString()}
            </span>
          )}
          {comparisonMode && selectedItems.length > 0 && (
            <span className="stat-item text-caption">
              <strong>Selected:</strong> {selectedItems.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render enhanced filter controls
  const renderFilterControls = () => {
    if (!enableFiltering) return null;

    const currentChart = processedCharts[selectedChart];
    if (!currentChart) return null;

    // Generate filter options from data
    const filterOptions = {};
    
    // Category filter
    const categories = [...new Set(currentChart.processedData.map(item => item.category).filter(Boolean))];
    if (categories.length > 1) {
      filterOptions.category = categories.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }));
    }
    
    // Value range filter for numeric data
    if (currentChart.processedData.length > 0) {
      const values = currentChart.processedData.map(item => item.value || 0).filter(v => typeof v === 'number');
      if (values.length > 0) {
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        if (maxVal > minVal) {
          filterOptions.valueRange = { min: minVal, max: maxVal };
        }
      }
    }
    
    // Tags filter
    const allTags = [...new Set(currentChart.processedData.flatMap(item => item.tags || []))];
    if (allTags.length > 0) {
      filterOptions.tags = allTags.map(tag => ({ value: tag, label: tag }));
    }

    return (
      <div className="filter-controls enhanced-flex enhanced-gap-3 enhanced-flex-wrap">
        {/* Search input */}
        <div className="filter-group">
          <label className="text-caption font-medium">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search data..."
            className="enhanced-input enhanced-input-sm"
            style={{ minWidth: '150px' }}
          />
        </div>

        {/* Category filter */}
        {filterOptions.category && (
          <div className="filter-group">
            <label className="text-caption font-medium">Category</label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="enhanced-input enhanced-input-sm"
            >
              <option value="all">All Categories</option>
              {filterOptions.category.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Value range filter */}
        {filterOptions.valueRange && (
          <div className="filter-group">
            <label className="text-caption font-medium">Value Range</label>
            <div className="enhanced-flex enhanced-gap-2 enhanced-items-center">
              <input
                type="number"
                value={filters.valueRange?.min || filterOptions.valueRange.min}
                onChange={(e) => handleFilterChange('valueRange', {
                  ...filters.valueRange,
                  min: parseFloat(e.target.value) || filterOptions.valueRange.min
                })}
                min={filterOptions.valueRange.min}
                max={filterOptions.valueRange.max}
                className="enhanced-input enhanced-input-sm"
                style={{ width: '80px' }}
              />
              <span className="text-caption">to</span>
              <input
                type="number"
                value={filters.valueRange?.max || filterOptions.valueRange.max}
                onChange={(e) => handleFilterChange('valueRange', {
                  ...filters.valueRange,
                  max: parseFloat(e.target.value) || filterOptions.valueRange.max
                })}
                min={filterOptions.valueRange.min}
                max={filterOptions.valueRange.max}
                className="enhanced-input enhanced-input-sm"
                style={{ width: '80px' }}
              />
            </div>
          </div>
        )}

        {/* Tags filter */}
        {filterOptions.tags && (
          <div className="filter-group">
            <label className="text-caption font-medium">Tags</label>
            <select
              value={filters.tags || 'all'}
              onChange={(e) => handleFilterChange('tags', e.target.value)}
              className="enhanced-input enhanced-input-sm"
            >
              <option value="all">All Tags</option>
              {filterOptions.tags.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear filters button */}
        {(Object.keys(filters).length > 0 || searchQuery.trim()) && (
          <div className="filter-group">
            <label className="text-caption font-medium">&nbsp;</label>
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={handleClearAll}
              title="Clear all filters"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render enhanced sort controls
  const renderSortControls = () => {
    const currentChart = processedCharts[selectedChart];
    if (!currentChart) return null;

    const sortOptions = ['name', 'value'];
    if (currentChart.type === 'bar') {
      sortOptions.push(...(currentChart.y_axes || [currentChart.y_axis]));
    } else if (currentChart.type === 'line') {
      sortOptions.push('date', currentChart.y_axis);
    } else if (currentChart.type === 'pie') {
      sortOptions.push('percentage');
    }

    return (
      <div className="sort-controls enhanced-flex enhanced-gap-2 enhanced-items-center">
        <label className="text-caption font-medium">Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="enhanced-input enhanced-input-sm"
        >
          {sortOptions.map(option => (
            <option key={option} value={option}>
              {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
        <button
          className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    );
  };

  // Render view mode controls
  const renderViewModeControls = () => {
    return (
      <div className="view-mode-controls enhanced-flex enhanced-gap-1">
        <button
          className={`enhanced-btn enhanced-btn-sm ${viewMode === 'chart' ? 'enhanced-btn-primary' : 'enhanced-btn-ghost'}`}
          onClick={() => handleViewModeChange('chart')}
          title="Chart view"
        >
          📊
        </button>
        <button
          className={`enhanced-btn enhanced-btn-sm ${viewMode === 'table' ? 'enhanced-btn-primary' : 'enhanced-btn-ghost'}`}
          onClick={() => handleViewModeChange('table')}
          title="Table view"
        >
          📋
        </button>
        <button
          className={`enhanced-btn enhanced-btn-sm ${viewMode === 'both' ? 'enhanced-btn-primary' : 'enhanced-btn-ghost'}`}
          onClick={() => handleViewModeChange('both')}
          title="Both views"
        >
          📊📋
        </button>
      </div>
    );
  };

  // Render comparison controls
  const renderComparisonControls = () => {
    return (
      <div className="comparison-controls enhanced-flex enhanced-gap-2 enhanced-items-center">
        <button
          className={`enhanced-btn enhanced-btn-sm ${comparisonMode ? 'enhanced-btn-primary' : 'enhanced-btn-ghost'}`}
          onClick={handleComparisonToggle}
          title="Toggle comparison mode"
        >
          {comparisonMode ? '✓' : '○'} Compare
        </button>
        {comparisonMode && selectedItems.length > 0 && (
          <>
            <span className="text-caption">
              {selectedItems.length} selected
            </span>
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={() => setSelectedItems([])}
              title="Clear selection"
            >
              Clear
            </button>
          </>
        )}
      </div>
    );
  };

  // Render drill-down breadcrumb with enhanced navigation
  const renderDrillDownBreadcrumb = () => {
    if (!enableDrillDown || drillDownPath.length === 0) return null;

    return (
      <div className="drill-down-breadcrumb enhanced-flex enhanced-gap-2 enhanced-items-center">
        <button
          className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
          onClick={() => setDrillDownPath([])}
          title="Go to root level"
        >
          🏠 Home
        </button>
        {drillDownPath.map((path, index) => (
          <React.Fragment key={index}>
            <span className="text-caption">›</span>
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={() => setDrillDownPath(prev => prev.slice(0, index + 1))}
              title={`Go to ${path} level`}
            >
              {path}
            </button>
          </React.Fragment>
        ))}
        {drillDownPath.length > 0 && (
          <button
            className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
            onClick={handleDrillUp}
            title="Go back one level"
          >
            ← Back
          </button>
        )}
      </div>
    );
  };

  // Render data table view
  const renderTableView = () => {
    const currentChart = processedCharts[selectedChart];
    if (!currentChart || !currentChart.processedData.length) return null;

    const data = currentChart.processedData;
    const columns = ['name', 'value'];
    
    if (currentChart.type === 'pie') {
      columns.push('percentage');
    } else if (currentChart.type === 'line') {
      columns.splice(1, 0, 'date');
    }

    return (
      <div className="chart-table-view">
        <div className="table-container">
          <table className="enhanced-table">
            <thead>
              <tr>
                {comparisonMode && <th>Select</th>}
                {columns.map(col => (
                  <th 
                    key={col}
                    className={`sortable-header ${sortBy === col ? 'active' : ''}`}
                    onClick={() => handleSortChange(col)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="enhanced-flex enhanced-items-center enhanced-gap-1">
                      <span>{col.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      {sortBy === col && (
                        <span className="sort-indicator">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const isSelected = selectedData?.data?.id === item.id;
                const isComparisonSelected = selectedItems.some(selected => selected.id === item.id);
                
                return (
                  <tr 
                    key={item.id || index}
                    className={`table-row ${isSelected ? 'selected' : ''} ${isComparisonSelected ? 'comparison-selected' : ''}`}
                    onClick={() => handleClick(item, selectedChart)}
                  >
                    {comparisonMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isComparisonSelected}
                          onChange={() => handleClick(item, selectedChart)}
                          className="enhanced-checkbox"
                        />
                      </td>
                    )}
                    <td>
                      <div className="enhanced-flex enhanced-items-center enhanced-gap-2">
                        <span 
                          className="color-indicator"
                          style={{ 
                            backgroundColor: item.color,
                            width: '12px',
                            height: '12px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        />
                        <span>{item.name || item.label}</span>
                      </div>
                    </td>
                    {currentChart.type === 'line' && (
                      <td>{item.formattedDate || item.date}</td>
                    )}
                    <td>{(item.value || 0).toLocaleString()}</td>
                    {currentChart.type === 'pie' && (
                      <td>{item.percentage?.toFixed(1) || '0.0'}%</td>
                    )}
                    <td>
                      <div className="enhanced-flex enhanced-gap-1">
                        {enableDrillDown && item.drillDownKey && (
                          <button
                            className="enhanced-btn enhanced-btn-xs enhanced-btn-ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrillDownPath([...drillDownPath, item.drillDownKey]);
                            }}
                            title="Drill down"
                          >
                            🔍
                          </button>
                        )}
                        <button
                          className="enhanced-btn enhanced-btn-xs enhanced-btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFullscreenToggle(selectedChart);
                          }}
                          title="View details"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table summary */}
        <div className="table-summary enhanced-flex enhanced-justify-between enhanced-items-center" style={{ marginTop: 'var(--space-3)' }}>
          <span className="text-caption">
            Showing {data.length} of {currentChart.totalCount || data.length} items
            {Object.keys(filters).length > 0 && ' (filtered)'}
          </span>
          {comparisonMode && selectedItems.length > 0 && (
            <span className="text-caption">
              {selectedItems.length} items selected for comparison
            </span>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`interactive-visual-analytics ${className}`} style={{ height }}>
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
      <div className={`interactive-visual-analytics ${className}`} style={{ height }}>
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
      <div className={`interactive-visual-analytics ${className}`} style={{ height }}>
        <EmptyState
          variant="no-data"
          action={loadVisualAnalytics}
          actionText="Retry Loading"
        />
      </div>
    );
  }

  return (
    <div className={`interactive-visual-analytics ${className} fade-in`} style={{ height }}>
      <DashboardCard
        title="Interactive Visual Analytics"
        subtitle={visualData.metadata?.department_name || 'Department Analytics'}
        icon="📊"
        variant="primary"
        headerActions={
          <div className="chart-controls enhanced-flex enhanced-gap-3 enhanced-items-center">
            {/* Chart selector */}
            {Object.keys(processedCharts).length > 1 && (
              <select
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                className="enhanced-input enhanced-input-sm"
                style={{ minWidth: '150px' }}
              >
                {Object.keys(processedCharts).map((chartType) => (
                  <option key={chartType} value={chartType}>
                    {processedCharts[chartType].title}
                  </option>
                ))}
              </select>
            )}
            
            {/* View mode controls */}
            {renderViewModeControls()}
            
            {/* Comparison controls */}
            {renderComparisonControls()}
            
            {/* Fullscreen toggle */}
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={() => handleFullscreenToggle(selectedChart)}
              title="Toggle fullscreen"
            >
              {fullscreenChart ? '🗗' : '🗖'}
            </button>
            
            {/* Animation toggle */}
            <button
              className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
              onClick={() => setAnimationEnabled(prev => !prev)}
              title="Toggle animations"
            >
              {animationEnabled ? '🎬' : '⏸️'}
            </button>
            
            {/* Export controls */}
            {enableExport && (
              <div className="export-controls enhanced-flex enhanced-gap-1">
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('csv', { includeRawData: true })}
                  disabled={exporting}
                  title="Export as CSV"
                >
                  CSV
                </button>
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('excel', { includeMetadata: true, chartFormat: 'embedded' })}
                  disabled={exporting}
                  title="Export as Excel"
                >
                  Excel
                </button>
                <button
                  className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                  onClick={() => handleExport('pdf', { chartFormat: 'embedded' })}
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

        {/* Drill-down breadcrumb */}
        {renderDrillDownBreadcrumb()}

        {/* Filter and sort controls */}
        <div className="chart-controls-panel" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="enhanced-flex enhanced-gap-6 enhanced-flex-wrap enhanced-items-end">
            {renderFilterControls()}
            {renderSortControls()}
          </div>
        </div>

        {/* Data summary */}
        {processedCharts[selectedChart] && (
          <div className="data-summary enhanced-flex enhanced-gap-4 enhanced-items-center enhanced-justify-center" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="text-caption">
              <strong>Total:</strong> {processedCharts[selectedChart].totalCount || 0}
            </span>
            <span className="text-caption">
              <strong>Filtered:</strong> {processedCharts[selectedChart].filteredCount || 0}
            </span>
            {searchQuery.trim() && (
              <span className="text-caption">
                <strong>Search:</strong> "{searchQuery}"
              </span>
            )}
            {comparisonMode && selectedItems.length > 0 && (
              <span className="text-caption">
                <strong>Selected:</strong> {selectedItems.length}
              </span>
            )}
          </div>
        )}

        {/* Chart display */}
        {(viewMode === 'chart' || viewMode === 'both') && (
          <div className="chart-display" style={{ marginBottom: viewMode === 'both' ? 'var(--space-6)' : '0' }}>
            {processedCharts[selectedChart] && renderChart(selectedChart, processedCharts[selectedChart])}
          </div>
        )}

        {/* Table display */}
        {(viewMode === 'table' || viewMode === 'both') && (
          <div className="table-display">
            {renderTableView()}
          </div>
        )}

        {/* Comparison summary */}
        {comparisonMode && selectedItems.length > 1 && (
          <div className="comparison-summary" style={{ marginTop: 'var(--space-4)' }}>
            <h4 className="text-heading-4" style={{ marginBottom: 'var(--space-3)' }}>Comparison Summary</h4>
            <div className="enhanced-grid enhanced-grid-cols-4 enhanced-gap-4">
              <div className="stat-card">
                <div className="stat-value text-heading-3">{selectedItems.length}</div>
                <div className="stat-label text-body-small">Items Selected</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-heading-3">
                  {selectedItems.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
                </div>
                <div className="stat-label text-body-small">Total Value</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-heading-3">
                  {(selectedItems.reduce((sum, item) => sum + (item.value || 0), 0) / selectedItems.length).toLocaleString()}
                </div>
                <div className="stat-label text-body-small">Average Value</div>
              </div>
              <div className="stat-card">
                <div className="stat-value text-heading-3">
                  {[...new Set(selectedItems.map(item => item.chartType))].length}
                </div>
                <div className="stat-label text-body-small">Chart Types</div>
              </div>
            </div>
          </div>
        )}

        {/* Chart metadata */}
        {visualData.metadata && (
          <div className="chart-metadata" style={{ marginTop: 'var(--space-4)' }}>
            <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Department: {visualData.metadata.department_name} | 
              Period: {visualData.metadata.period} | 
              Generated: {new Date(visualData.generated_at).toLocaleString()}
              {selectedData && (
                <> | Selected: {selectedData.data.name || selectedData.data.label}</>
              )}
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Fullscreen modal */}
      {fullscreenChart && (
        <div 
          className="fullscreen-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)'
          }}
          onClick={() => setFullscreenChart(null)}
        >
          <div 
            className="fullscreen-content"
            style={{
              backgroundColor: 'var(--background-white)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="enhanced-flex enhanced-justify-between enhanced-items-center" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="text-heading-3">{fullscreenChart.chart.title}</h3>
              <button
                className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost"
                onClick={() => setFullscreenChart(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ minHeight: '400px' }}>
              {renderChart(fullscreenChart.chartType, fullscreenChart.chart)}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          ref={tooltipRef}
          className="chart-tooltip"
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
            maxWidth: '250px'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default InteractiveVisualAnalytics;