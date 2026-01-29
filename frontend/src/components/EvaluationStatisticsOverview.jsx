import { useMemo } from 'react';

function EvaluationStatisticsOverview({ evaluationResults }) {
  // Calculate statistics from evaluation results data
  const statistics = useMemo(() => {
    if (!evaluationResults) return null;
    
    const finalScore = evaluationResults.final_score || 
                      evaluationResults.weighted_scores?.weighted_score || 0;
    
    const totalResponses = evaluationResults.quick_stats?.total_responses || 
                          evaluationResults.participation?.total_responses || 0;
    
    const participationRate = evaluationResults.participation?.participation_rate || 0;
    
    const dataQuality = evaluationResults.quick_stats?.data_quality || 
                       evaluationResults.participation?.data_quality || 'Unknown';
    
    return {
      finalScore: Math.round(finalScore),
      totalResponses,
      participationRate: Math.round(participationRate),
      dataQuality
    };
  }, [evaluationResults]);

  if (!statistics) return null;

  const statsCards = [
    {
      id: 'final-score',
      title: 'Final Score',
      value: `${statistics.finalScore}%`,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '🎯',
      trend: getScoreTrend(statistics.finalScore),
      trendLabel: 'performance level'
    },
    {
      id: 'responses',
      title: 'Total Responses',
      value: statistics.totalResponses,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '📝',
      trend: '+12%',
      trendLabel: 'than expected'
    },
    {
      id: 'participation',
      title: 'Participation Rate',
      value: `${statistics.participationRate}%`,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: '👥',
      trend: getParticipationTrend(statistics.participationRate),
      trendLabel: 'engagement level'
    },
    {
      id: 'quality',
      title: 'Data Quality',
      value: statistics.dataQuality,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      icon: '✨',
      trend: getQualityTrend(statistics.dataQuality),
      trendLabel: 'reliability score'
    }
  ];

  function getScoreTrend(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Average';
    return 'Needs Improvement';
  }

  function getParticipationTrend(rate) {
    if (rate >= 80) return 'High';
    if (rate >= 60) return 'Moderate';
    return 'Low';
  }

  function getQualityTrend(quality) {
    const q = quality.toLowerCase();
    if (q.includes('excellent')) return '⭐⭐⭐';
    if (q.includes('good')) return '⭐⭐';
    if (q.includes('limited')) return '⭐';
    return '—';
  }

  return (
    <div className="statistics-overview">
      <div className="stats-grid">
        {statsCards.map((card) => (
          <div 
            key={card.id} 
            className="stat-card"
            style={{ background: card.gradient }}
          >
            <div className="stat-card-content">
              <div className="stat-header">
                <div className="stat-icon">{card.icon}</div>
                <div className="stat-value">{card.value}</div>
              </div>
              
              <div className="stat-footer">
                <div className="stat-title">{card.title}</div>
                <div className="stat-trend">
                  <span className="trend-value">{card.trend}</span>
                  <span className="trend-label">{card.trendLabel}</span>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="stat-decoration">
              <div className="decoration-circle decoration-circle-1"></div>
              <div className="decoration-circle decoration-circle-2"></div>
              <div className="decoration-shape"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EvaluationStatisticsOverview;