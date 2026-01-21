import React from 'react';

function ParticipationAnalysis({ participationData, loading = false }) {
  // Helper function to get participation level class
  const getParticipationLevelClass = (rate) => {
    if (rate >= 80) return 'participation-high';
    if (rate >= 60) return 'participation-medium';
    return 'participation-low';
  };

  // Helper function to get trend direction class
  const getTrendClass = (change) => {
    if (change > 0) return 'trend-positive';
    if (change < 0) return 'trend-negative';
    return 'trend-neutral';
  };

  if (loading) {
    return (
      <div className="participation-analysis">
        <div className="analysis-loading">
          <div className="loading-placeholder">Loading participation analysis...</div>
        </div>
      </div>
    );
  }

  if (!participationData) {
    return (
      <div className="participation-analysis">
        <div className="no-analysis">
          <div className="empty-state-icon">📊</div>
          <h4>No Participation Data Available</h4>
          <p>Participation analysis will be available once students begin responding to this evaluation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="participation-analysis">
      {/* Overall Participation Summary */}
      <div className="analysis-subsection">
        <h4>📈 Participation Overview</h4>
        <div className="participation-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <div className="summary-value">
                  {participationData.overall_rate || 0}%
                </div>
                <div className="summary-label">Overall Rate</div>
                <div className={`summary-indicator ${getParticipationLevelClass(participationData.overall_rate || 0)}`}>
                  {participationData.overall_rate >= 80 ? 'High' :
                   participationData.overall_rate >= 60 ? 'Medium' : 'Low'}
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📝</div>
              <div className="summary-content">
                <div className="summary-value">
                  {participationData.total_responses || 0}
                </div>
                <div className="summary-label">Total Responses</div>
                <div className="summary-subtitle">
                  of {participationData.expected_responses || 0} expected
                </div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">⏱️</div>
              <div className="summary-content">
                <div className="summary-value">
                  {participationData.avg_completion_time ? 
                    `${Math.round(participationData.avg_completion_time)} min` : 
                    'N/A'
                  }
                </div>
                <div className="summary-label">Avg. Time</div>
                <div className="summary-subtitle">per response</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Breakdown */}
      {participationData.demographics && participationData.demographics.length > 0 && (
        <div className="analysis-subsection">
          <h4>👤 Demographic Breakdown</h4>
          <div className="demographics-grid">
            {participationData.demographics.map((demo, index) => (
              <div key={index} className="demographic-item">
                <div className="demo-header">
                  <div className="demo-category">{demo.category}</div>
                  <div className={`demo-rate ${getParticipationLevelClass(demo.participation_rate)}`}>
                    {demo.participation_rate}%
                  </div>
                </div>
                <div className="demo-details">
                  <div className="demo-count">
                    {demo.responses} of {demo.total} students
                  </div>
                  <div className="demo-progress">
                    <div 
                      className="progress-bar"
                      style={{ width: `${demo.participation_rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participation Trends */}
      {participationData.trends && participationData.trends.length > 0 && (
        <div className="analysis-subsection">
          <h4>📊 Participation Trends</h4>
          <div className="trends-container">
            <div className="trends-list">
              {participationData.trends.map((trend, index) => (
                <div key={index} className="trend-item">
                  <div className="trend-header">
                    <div className="trend-period">{trend.period}</div>
                    <div className="trend-metrics">
                      <span className="trend-value">{trend.participation_rate}%</span>
                      <span className={`trend-change ${getTrendClass(trend.change)}`}>
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </span>
                    </div>
                  </div>
                  <div className="trend-details">
                    <div className="trend-responses">
                      {trend.responses} responses
                    </div>
                    <div className="trend-date">
                      {new Date(trend.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Response Quality Analysis */}
      {participationData.quality_metrics && (
        <div className="analysis-subsection">
          <h4>✅ Response Quality</h4>
          <div className="quality-metrics">
            <div className="quality-grid">
              <div className="quality-item">
                <div className="quality-label">Complete Responses</div>
                <div className="quality-value">
                  {participationData.quality_metrics.complete_responses || 0}%
                </div>
                <div className="quality-bar">
                  <div 
                    className="quality-progress complete"
                    style={{ width: `${participationData.quality_metrics.complete_responses || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="quality-item">
                <div className="quality-label">Partial Responses</div>
                <div className="quality-value">
                  {participationData.quality_metrics.partial_responses || 0}%
                </div>
                <div className="quality-bar">
                  <div 
                    className="quality-progress partial"
                    style={{ width: `${participationData.quality_metrics.partial_responses || 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="quality-item">
                <div className="quality-label">Incomplete Responses</div>
                <div className="quality-value">
                  {participationData.quality_metrics.incomplete_responses || 0}%
                </div>
                <div className="quality-bar">
                  <div 
                    className="quality-progress incomplete"
                    style={{ width: `${participationData.quality_metrics.incomplete_responses || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Placeholder */}
      {participationData.charts && participationData.charts.length > 0 && (
        <div className="analysis-subsection">
          <h4>📈 Visual Analysis</h4>
          <div className="charts-grid">
            {participationData.charts.map((chart, index) => (
              <div key={index} className="chart-container">
                <div className="chart-header">
                  <h5>{chart.title}</h5>
                  <span className="chart-type">{chart.type}</span>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-icon">📊</div>
                  <div className="chart-info">
                    <p>{chart.description || `${chart.type} chart with ${chart.data?.length || 0} data points`}</p>
                    <small>Chart visualization will be implemented in future updates</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights and Recommendations */}
      {participationData.insights && participationData.insights.length > 0 && (
        <div className="analysis-subsection">
          <h4>💡 Insights & Recommendations</h4>
          <div className="insights-list">
            {participationData.insights.map((insight, index) => (
              <div key={index} className={`insight-item ${insight.type || 'neutral'}`}>
                <div className="insight-icon">
                  {insight.type === 'positive' ? '✅' :
                   insight.type === 'warning' ? '⚠️' :
                   insight.type === 'negative' ? '❌' : 'ℹ️'}
                </div>
                <div className="insight-content">
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                  {insight.recommendation && (
                    <div className="insight-recommendation">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipationAnalysis;