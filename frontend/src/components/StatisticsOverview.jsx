import { useMemo } from 'react';

function StatisticsOverview({ evaluations = [] }) {
  // Calculate statistics from evaluations data
  const statistics = useMemo(() => {
    const totalEvaluations = evaluations.length;
    const activeEvaluations = evaluations.filter(e => e.status === 'Active').length;
    const closedEvaluations = evaluations.filter(e => e.status === 'Closed').length;
    
    // Calculate total students across all evaluations
    const totalStudents = evaluations.reduce((sum, e) => {
      const responses = e.participation?.total_responses || 0;
      return sum + responses;
    }, 0);
    
    // Calculate average participation rate
    const avgParticipation = totalEvaluations > 0 
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.participation?.participation_rate || 0), 0) / totalEvaluations)
      : 0;
    
    // Calculate total instructors (unique)
    const uniqueInstructors = new Set(evaluations.map(e => e.teacher?.id).filter(Boolean)).size;
    
    return {
      totalEvaluations,
      activeEvaluations,
      closedEvaluations,
      totalStudents,
      avgParticipation,
      uniqueInstructors
    };
  }, [evaluations]);

  const statsCards = [
    {
      id: 'evaluations',
      title: 'Total Evaluations',
      value: statistics.totalEvaluations,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '📊',
      trend: '+12%',
      trendLabel: 'than last month'
    },
    {
      id: 'instructors',
      title: 'Total Instructors',
      value: statistics.uniqueInstructors,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '👨‍🏫',
      trend: '+8%',
      trendLabel: 'than last month'
    },
    {
      id: 'students',
      title: 'Total Students',
      value: statistics.totalStudents.toLocaleString(),
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: '🎓',
      trend: '+15%',
      trendLabel: 'than last month'
    },
    {
      id: 'participation',
      title: 'Avg Participation',
      value: `${statistics.avgParticipation}%`,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      icon: '📈',
      trend: '+5%',
      trendLabel: 'than last month'
    }
  ];

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

export default StatisticsOverview;