import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import DepartmentTemplateManager from '../../../components/DepartmentTemplateManager';

// Add CSS animations
const styles = `
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .participation-update {
    animation: slideIn 0.3s ease-out;
  }
  
  .low-participation-alert {
    animation: pulse 2s infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// Participation Indicator Component
function ParticipationIndicator({ evaluationId, getParticipationForEvaluation, eligibleStudents, lowParticipationThreshold = 30 }) {
  const participation = getParticipationForEvaluation(evaluationId);
  const [previousRate, setPreviousRate] = useState(participation.rate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trend, setTrend] = useState('stable');

  // Track participation changes for visual feedback
  useEffect(() => {
    if (participation.rate !== previousRate) {
      setIsUpdating(true);
      
      // Determine trend
      if (participation.rate > previousRate) {
        setTrend('increasing');
      } else if (participation.rate < previousRate) {
        setTrend('decreasing');
      } else {
        setTrend('stable');
      }
      
      setPreviousRate(participation.rate);
      
      // Reset updating state after animation
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [participation.rate, previousRate]);

  const getStatusColor = (rate) => {
    if (rate >= 70) return '#27ae60';
    if (rate >= 40) return '#f39c12';
    return '#e74c3c';
  };

  const getStatusText = (rate) => {
    if (rate >= 70) return 'High';
    if (rate >= 40) return 'Medium';
    return 'Low';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '📊';
    }
  };

  return (
    <div style={{ 
      minWidth: 140, 
      padding: 8,
      borderRadius: 6,
      backgroundColor: isUpdating ? '#f8f9fa' : 'transparent',
      border: isUpdating ? '2px solid #3498db' : '1px solid transparent',
      transition: 'all 0.3s ease'
    }}>
      {/* Header with counts and percentage */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '0.85em', 
        marginBottom: 4,
        fontWeight: 'bold'
      }}>
        <span>{participation.count}/{eligibleStudents}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: getStatusColor(participation.rate) }}>
            {participation.rate.toFixed(1)}%
          </span>
          <span style={{ fontSize: '0.8em' }}>{getTrendIcon()}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ 
        width: '100%', 
        height: 8, 
        backgroundColor: '#ecf0f1', 
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4
      }}>
        <div 
          style={{ 
            width: `${Math.min(participation.rate, 100)}%`, 
            height: '100%',
            backgroundColor: getStatusColor(participation.rate),
            transition: 'width 0.5s ease',
            position: 'relative'
          }}
        >
          {/* Animated pulse effect for updates */}
          {isUpdating && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              animation: 'pulse 1s ease-in-out'
            }} />
          )}
        </div>
      </div>

      {/* Status and alerts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: '0.7em', 
          color: getStatusColor(participation.rate),
          fontWeight: 'bold'
        }}>
          {getStatusText(participation.rate)}
        </span>
        
        {participation.rate < lowParticipationThreshold && (
          <div style={{ 
            fontSize: '0.7em', 
            color: '#e74c3c',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            ⚠️ Low
          </div>
        )}
      </div>

      {/* Last submission time */}
      {participation.lastSubmissionAt && (
        <div style={{ 
          fontSize: '0.6em', 
          color: 'var(--muted)', 
          marginTop: 2,
          textAlign: 'center'
        }}>
          Last: {new Date(participation.lastSubmissionAt).toLocaleTimeString()}
        </div>
      )}

      {/* Update indicator */}
      {isUpdating && (
        <div style={{
          fontSize: '0.6em',
          color: '#3498db',
          textAlign: 'center',
          marginTop: 2,
          fontWeight: 'bold'
        }}>
          🔄 Updating...
        </div>
      )}
    </div>
  );
}

// Live Analytics Dashboard Component
function LiveAnalyticsDashboard({ evaluations, participationData, getParticipationForEvaluation, eligibleStudents }) {
  const [selectedMetric, setSelectedMetric] = useState('participation');
  
  const overallStats = useMemo(() => {
    const activeEvaluations = evaluations.filter(ev => !ev.closed_at);
    const totalParticipation = activeEvaluations.reduce((sum, ev) => {
      const participation = getParticipationForEvaluation(ev.id);
      return sum + participation.count;
    }, 0);
    
    const averageParticipationRate = activeEvaluations.length > 0 
      ? activeEvaluations.reduce((sum, ev) => {
          const participation = getParticipationForEvaluation(ev.id);
          return sum + participation.rate;
        }, 0) / activeEvaluations.length
      : 0;

    const lowParticipationCount = activeEvaluations.filter(ev => {
      const participation = getParticipationForEvaluation(ev.id);
      return participation.rate < 30;
    }).length;

    return {
      activeEvaluations: activeEvaluations.length,
      totalParticipation,
      averageParticipationRate,
      lowParticipationCount
    };
  }, [evaluations, getParticipationForEvaluation]);

  return (
    <div style={{ 
      padding: 16, 
      backgroundColor: '#f8f9fa', 
      borderRadius: 8, 
      border: '1px solid #dee2e6',
      marginBottom: 16
    }}>
      <h5 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>📊 Live Analytics Dashboard</h5>
      
      {/* Metric selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['participation', 'trends', 'alerts'].map(metric => (
          <button
            key={metric}
            className={`dept-btn ${selectedMetric === metric ? 'dept-btn-primary' : 'dept-btn-ghost'}`}
            style={{ fontSize: '0.8em', padding: '4px 8px' }}
            onClick={() => setSelectedMetric(metric)}
          >
            {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: 12,
        marginBottom: 12
      }}>
        <div style={{ textAlign: 'center', padding: 8, backgroundColor: 'white', borderRadius: 4 }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#3498db' }}>
            {overallStats.activeEvaluations}
          </div>
          <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>Active Evaluations</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: 8, backgroundColor: 'white', borderRadius: 4 }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#27ae60' }}>
            {overallStats.totalParticipation}
          </div>
          <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>Total Responses</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: 8, backgroundColor: 'white', borderRadius: 4 }}>
          <div style={{ 
            fontSize: '1.5em', 
            fontWeight: 'bold', 
            color: overallStats.averageParticipationRate >= 70 ? '#27ae60' : 
                   overallStats.averageParticipationRate >= 40 ? '#f39c12' : '#e74c3c'
          }}>
            {overallStats.averageParticipationRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>Avg Participation</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: 8, backgroundColor: 'white', borderRadius: 4 }}>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#e74c3c' }}>
            {overallStats.lowParticipationCount}
          </div>
          <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>Low Participation</div>
        </div>
      </div>

      {/* Detailed view based on selected metric */}
      {selectedMetric === 'participation' && (
        <div>
          <h6 style={{ margin: '8px 0', color: '#2c3e50' }}>Participation Breakdown</h6>
          <div style={{ display: 'grid', gap: 8 }}>
            {evaluations.filter(ev => !ev.closed_at).map(ev => {
              const participation = getParticipationForEvaluation(ev.id);
              return (
                <div key={ev.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 8,
                  backgroundColor: 'white',
                  borderRadius: 4,
                  fontSize: '0.8em'
                }}>
                  <span>{ev.course?.title} - {ev.teacher?.name}</span>
                  <ParticipationIndicator 
                    evaluationId={ev.id}
                    getParticipationForEvaluation={getParticipationForEvaluation}
                    eligibleStudents={eligibleStudents}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentEvaluations() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State management for evaluations and participation
  const [evaluations, setEvaluations] = useState([]);
  const [participationData, setParticipationData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Simple refresh functions
  const refreshEvaluations = useCallback(async () => {
    try {
      const response = await api.get(`/evaluations?department_id=${deptId}&academic_year=${academicYear}&semester=${semester}`);
      setEvaluations(response.data?.data || response.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh evaluations:', error);
      // Don't show error to user for background refresh failures
      // The UI will show stale data which is acceptable
    }
  }, [deptId]);

  const refreshParticipation = useCallback(async () => {
    // Simple participation data refresh
    setLastUpdate(new Date());
  }, []);

  const reconnectEvaluations = useCallback(() => {
    refreshEvaluations();
  }, [refreshEvaluations]);

  const reconnectParticipation = useCallback(() => {
    refreshParticipation();
  }, [refreshParticipation]);

  const getParticipationForEvaluation = useCallback((evaluationId) => {
    // Simple participation calculation
    const evaluation = evaluations.find(e => e.id === evaluationId);
    if (!evaluation) {
      return { count: 0, rate: 0, lastSubmissionAt: null };
    }
    
    const count = evaluation.feedbacks?.length || 0;
    const expected = evaluation.course?.enrolled_students || 0;
    const rate = expected > 0 ? (count / expected) * 100 : 0;
    
    return {
      count,
      rate,
      lastSubmissionAt: evaluation.updated_at
    };
  }, [evaluations]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const currentYear = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  }, []);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('Semester I');

  const [openForm, setOpenForm] = useState({ teacher_id: '', opened_at: '', closed_at: '' });
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [assignedCoursesForTeacher, setAssignedCoursesForTeacher] = useState([]);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [evalDetail, setEvalDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [evalFilter, setEvalFilter] = useState('');
  const [evalSortKey, setEvalSortKey] = useState('opened_at');
  const [evalSortDir, setEvalSortDir] = useState('desc');
  const [evalPage, setEvalPage] = useState(1);
  const [evalPageSize, setEvalPageSize] = useState(5);

  // Enhanced state for monitoring and analytics
  const [analyticsData, setAnalyticsData] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [weightedScores, setWeightedScores] = useState({});
  const [comprehensiveStats, setComprehensiveStats] = useState({});
  
  // Enhanced filtering and sorting state
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all', // all, active, closed
    performanceRange: 'all', // all, high, medium, low
    participationRange: 'all' // all, high, medium, low
  });
  
  // Monitoring state
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [updateFrequency, setUpdateFrequency] = useState(30000); // 30 seconds
  const [participationAlerts, setParticipationAlerts] = useState([]);
  const [lowParticipationThreshold, setLowParticipationThreshold] = useState(30); // 30%

  // Template management state
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateQuestions, setTemplateQuestions] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [peerTemplate, setPeerTemplate] = useState(null);
  const [peerTemplateQuestions, setPeerTemplateQuestions] = useState([]);
  const [peerTemplateLoading, setPeerTemplateLoading] = useState(false);
  const [hodTemplate, setHodTemplate] = useState(null);
  const [hodTemplateQuestions, setHodTemplateQuestions] = useState([]);
  const [hodTemplateLoading, setHodTemplateLoading] = useState(false);

  // Load department template
  const loadDepartmentTemplate = useCallback(async () => {
    if (!deptId) return;
    
    setTemplateLoading(true);
    try {
      const response = await api.get(`/departments/${deptId}/template`);
      setCurrentTemplate(response.data.template);
      setTemplateQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Failed to load department template:', error);
      // Don't show error to user - template might not exist yet
    } finally {
      setTemplateLoading(false);
    }
  }, [deptId]);

  // Load peer department template
  const loadPeerDepartmentTemplate = useCallback(async () => {
    if (!deptId) return;
    setPeerTemplateLoading(true);
    try {
      const response = await api.get(`/departments/${deptId}/peer-template`);
      setPeerTemplate(response.data.template);
      setPeerTemplateQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Failed to load peer department template:', error);
    } finally {
      setPeerTemplateLoading(false);
    }
  }, [deptId]);

  // Load HOD department template
  const loadHodDepartmentTemplate = useCallback(async () => {
    if (!deptId) return;
    setHodTemplateLoading(true);
    try {
      const response = await api.get(`/departments/${deptId}/hod-template`);
      setHodTemplate(response.data.template);
      setHodTemplateQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Failed to load HOD department template:', error);
    } finally {
      setHodTemplateLoading(false);
    }
  }, [deptId]);

  // Refresh template data
  const refreshTemplate = useCallback(() => {
    loadDepartmentTemplate();
    loadPeerDepartmentTemplate();
    loadHodDepartmentTemplate();
  }, [loadDepartmentTemplate]);

  useEffect(() => { setAcademicYear(currentYear); }, [currentYear]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api
      .get(`/departments/${deptId}`)
      .then((res) => { if (mounted) setDepartment(res.data); })
      .catch(() => { if (mounted) setError('Failed to load department'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [deptId]);

  // Load department template when department changes
  useEffect(() => {
    if (deptId) {
      loadDepartmentTemplate();
      loadPeerDepartmentTemplate();
      loadHodDepartmentTemplate();
    }
  }, [deptId, loadDepartmentTemplate]);

  // Load analytics data for evaluations
  const loadAnalyticsData = async (evaluationId, signal) => {
    try {
      const res = await api.get(`/evaluations/${evaluationId}/analytics`, signal ? { signal } : undefined);
      const analytics = res.data;
      
      setAnalyticsData(prev => ({
        ...prev,
        [evaluationId]: analytics
      }));

      // Calculate weighted scores (Student 50%, Peer 30%, Admin 20%)
      if (analytics.student_score !== undefined && analytics.peer_score !== undefined && analytics.admin_score !== undefined) {
        const weightedScore = (analytics.student_score * 0.5) + (analytics.peer_score * 0.3) + (analytics.admin_score * 0.2);
        const performancePercentage = (weightedScore / 5) * 100;
        
        setWeightedScores(prev => ({
          ...prev,
          [evaluationId]: {
            weighted_score: weightedScore,
            performance_percentage: performancePercentage,
            student_score: analytics.student_score,
            peer_score: analytics.peer_score,
            admin_score: analytics.admin_score
          }
        }));
      }

      // Calculate comprehensive stats
      if (analytics.total_responses > 0) {
        const avgRating = analytics.average_rating || 0;
        let performanceCategory = 'needs_improvement';
        
        if (avgRating >= 4.5) performanceCategory = 'excellent';
        else if (avgRating >= 4.0) performanceCategory = 'very_good';
        else if (avgRating >= 3.5) performanceCategory = 'good';
        else if (avgRating >= 3.0) performanceCategory = 'satisfactory';
        
        const statisticalSignificance = analytics.total_responses >= 10 ? 'significant' : 'limited';
        
        setComprehensiveStats(prev => ({
          ...prev,
          [evaluationId]: {
            average_rating: avgRating,
            total_responses: analytics.total_responses,
            performance_category: performanceCategory,
            statistical_significance: statisticalSignificance
          }
        }));
      }
    } catch (e) {
      const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';
      const isCanceled = e.code === 'ERR_CANCELED' || e.name === 'CanceledError' || e.name === 'AbortError' || msg.includes('aborted') || msg.includes('canceled') || msg.includes('cancelled');
      if (!isCanceled) {
        console.error('Failed to load analytics for evaluation', evaluationId, e);
      }
    }
  };

  // Load analytics for all evaluations when they change
  useEffect(() => {
    if (evaluations.length > 0) {
      const controller = new AbortController();
      evaluations.forEach(evaluation => {
        loadAnalyticsData(evaluation.id, controller.signal);
      });
      return () => controller.abort();
    }
  }, [evaluations]);

  // Generate participation alerts based on data
  useEffect(() => {
    const alerts = [];
    
    Object.entries(participationData).forEach(([evaluationId, data]) => {
      const evaluation = evaluations.find(ev => ev.id === parseInt(evaluationId));
      if (evaluation && !evaluation.closed_at && data.rate < lowParticipationThreshold) {
        alerts.push({
          evaluationId: parseInt(evaluationId),
          type: 'low_participation',
          message: `Low participation (${data.rate.toFixed(1)}%) in evaluation ${evaluationId}`,
          severity: data.rate < 15 ? 'high' : 'medium'
        });
      }
    });
    
    setParticipationAlerts(alerts);
  }, [participationData, evaluations, lowParticipationThreshold]);

  // Manual refresh function for both evaluations and participation
  const refreshAllData = useCallback(() => {
    refreshEvaluations();
    refreshParticipation();
  }, [refreshEvaluations, refreshParticipation]);

  // Manual refresh function
  const refreshAll = useCallback(() => {
    refreshEvaluations();
    refreshParticipation();
  }, [refreshEvaluations, refreshParticipation]);

  // Load initial data when department changes
  useEffect(() => { 
    if (deptId && academicYear && semester) {
      refreshAllData();
    }
  }, [deptId, academicYear, semester, refreshAllData]);

  // Session evaluations list moved to Manage Evaluations page

  const teacherOptions = department?.teachers || [];
  const courseOptions = department?.courses || [];

  // Peer-to-peer tables state
  const [peerFilter, setPeerFilter] = useState('');
  const [peerSortKey, setPeerSortKey] = useState('opened_at');
  const [peerSortDir, setPeerSortDir] = useState('desc');
  const [peerPage, setPeerPage] = useState(1);
  const [peerPageSize, setPeerPageSize] = useState(5);

  const [prevPeerFilter, setPrevPeerFilter] = useState('');
  const [prevPeerSortKey, setPrevPeerSortKey] = useState('closed_at');
  const [prevPeerSortDir, setPrevPeerSortDir] = useState('desc');
  const [prevPeerPage, setPrevPeerPage] = useState(1);
  const [prevPeerPageSize, setPrevPeerPageSize] = useState(5);

  // HOD (Admin) evaluation tables state
  const [hodFilter, setHodFilter] = useState('');
  const [hodSortKey, setHodSortKey] = useState('opened_at');
  const [hodSortDir, setHodSortDir] = useState('desc');
  const [hodPage, setHodPage] = useState(1);
  const [hodPageSize, setHodPageSize] = useState(5);

  const [prevHodFilter, setPrevHodFilter] = useState('');
  const [prevHodSortKey, setPrevHodSortKey] = useState('closed_at');
  const [prevHodSortDir, setPrevHodSortDir] = useState('desc');
  const [prevHodPage, setPrevHodPage] = useState(1);
  const [prevHodPageSize, setPrevHodPageSize] = useState(5);

  const getTextMatch = (txt) => (txt || '').toString().toLowerCase();
  const matchFilter = (ev, filterText) => {
    const f = filterText.trim().toLowerCase();
    if (!f) return true;
    const courseTxt = getTextMatch(ev.course?.title) + ' ' + getTextMatch(ev.course?.code);
    const teacherTxt = getTextMatch(ev.teacher?.name);
    return courseTxt.includes(f) || teacherTxt.includes(f);
  };

  const getPeerScore = (evId) => {
    const analytics = analyticsData[evId];
    if (!analytics || analytics.peer_score === undefined || analytics.peer_score === null) return null;
    return Number(analytics.peer_score);
  };

  const getHodScore = (evId) => {
    const analytics = analyticsData[evId];
    if (!analytics || analytics.admin_score === undefined || analytics.admin_score === null) return null;
    return Number(analytics.admin_score);
  };

  const sortEvaluations = (items, sortKey, sortDir, mode = 'peer') => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...items].sort((a, b) => {
      const aPeer = mode === 'hod' ? getHodScore(a.id) : getPeerScore(a.id);
      const bPeer = mode === 'hod' ? getHodScore(b.id) : getPeerScore(b.id);
      switch (sortKey) {
        case 'course': {
          const aVal = getTextMatch(a.course?.title);
          const bVal = getTextMatch(b.course?.title);
          return aVal.localeCompare(bVal) * dir;
        }
        case 'teacher': {
          const aVal = getTextMatch(a.teacher?.name);
          const bVal = getTextMatch(b.teacher?.name);
          return aVal.localeCompare(bVal) * dir;
        }
        case 'opened_at': {
          const aVal = a.opened_at || '';
          const bVal = b.opened_at || '';
          return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * dir;
        }
        case 'closed_at': {
          const aVal = a.closed_at || '';
          const bVal = b.closed_at || '';
          return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * dir;
        }
        case 'peer_score': {
          const aVal = aPeer ?? -Infinity;
          const bVal = bPeer ?? -Infinity;
          return (aVal - bVal) * dir;
        }
        case 'hod_score': {
          const aVal = aPeer ?? -Infinity;
          const bVal = bPeer ?? -Infinity;
          return (aVal - bVal) * dir;
        }
        default:
          return 0;
      }
    });
    return sorted;
  };

  const computeAcademicYear = (dateStr) => {
    if (!dateStr) return academicYear || currentYear;
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-based
    return m >= 8 ? `${y}/${String((y + 1) % 100).padStart(2, '0')}` : `${y - 1}/${String(y % 100).padStart(2, '0')}`;
  };

  const mapSemester = (dateStr) => {
    if (!dateStr) return semester || 'Semester I';
    const m = new Date(dateStr).getMonth();
    return (m >= 8 || m <= 0) ? 'Semester I' : 'Semester II';
  };

  // Prefer department->courses->teachers if present; otherwise, fetch teacher->courses from API.
  const loadAssignedCoursesForTeacher = async (teacherId) => {
    const tid = Number(teacherId);
    const deptCourses = (department?.courses || []);
    const hasTeacherRelation = deptCourses.some(c => Array.isArray(c.teachers));
    if (hasTeacherRelation) {
      return deptCourses.filter(c => (c.teachers || []).some(t => Number(t.id) === tid));
    }
    try {
      const res = await api.get(`/teachers/${tid}`);
      return res.data?.courses || [];
    } catch (err) {
      console.error('Failed to load teacher courses:', err);
      return [];
    }
  };

  const proceedToConfirm = async () => {
    if (!openForm.teacher_id || !openForm.opened_at) {
      alert('Instructor and open date are required');
      return;
    }
    const ay = (academicYear || '').trim() || computeAcademicYear(openForm.opened_at);
    const sem = (semester || '').trim() || mapSemester(openForm.opened_at);
    setAcademicYear(ay);
    setSemester(sem);
    const courses = await loadAssignedCoursesForTeacher(openForm.teacher_id);
    setAssignedCoursesForTeacher(courses);
    setConfirming(true);
  };

  const finalizeOpen = async () => {
    setEvalSubmitting(true);
    try {
      const teacherId = Number(openForm.teacher_id);
      const opened_at = openForm.opened_at;
      const closed_at = openForm.closed_at || null;
      const ay = academicYear || computeAcademicYear(opened_at);
      const sem = semester || mapSemester(opened_at);
      const created = [];
      for (const course of assignedCoursesForTeacher) {
        const pivot = (course.teachers || []).find(t => t.id === teacherId)?.pivot || {};
        const year_level = Number(pivot?.year_level || course.year_level || 1);
        const payload = {
          course_id: Number(course.id),
          teacher_id: teacherId,
          academic_year: ay,
          semester: sem,
          year_level,
          opened_at,
          closed_at,
        };
        const res = await api.post('/evaluations', payload);
        created.push(res.data);
      }
      if (created.length === 0) {
        alert('No assigned courses found for this instructor.');
      } else {
        setEvaluations(prev => [...created, ...prev]);
        alert(`Evaluations opened: ${created.length}`);
      }
      setOpenForm({ teacher_id: '', opened_at: '', closed_at: '' });
      setAssignedCoursesForTeacher([]);
      setConfirming(false);
    } catch (e) {
      console.error('Failed to open evaluations:', e);
      const errorMessage = e.response?.data?.message || e.message || 'Failed to open evaluations. Please try again.';
      alert(errorMessage);
    } finally {
      setEvalSubmitting(false);
    }
  };

  const closeEvaluation = async (evaluation) => {
    try {
      await api.put(`/evaluations/${evaluation.id}`, { closed_at: new Date().toISOString().slice(0, 10) });
      setEvaluations((prev) => prev.map((ev) => ev.id === evaluation.id ? { ...ev, closed_at: new Date().toISOString().slice(0, 10) } : ev));
      alert('Evaluation closed');
    } catch (e) {
      console.error('Failed to close evaluation:', e);
      const errorMessage = e.response?.data?.message || e.message || 'Failed to close evaluation. Please try again.';
      alert(errorMessage);
    }
  };

  const loadSummary = async (evaluationId) => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await api.get(`/evaluations/${evaluationId}/summary`);
      setSummary(res.data);
    } catch (e) {
      // ignore
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadEvaluationDetail = async (evaluationId) => {
    setDetailLoading(true);
    setEvalDetail(null);
    try {
      const res = await api.get(`/evaluations/${evaluationId}`);
      setEvalDetail(res.data);
    } catch (e) {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEvalId) {
      loadSummary(selectedEvalId);
      loadEvaluationDetail(selectedEvalId);
    }
  }, [selectedEvalId]);

  const exportSummaryCSV = () => {
    if (!summary) { alert('No summary to export'); return; }
    const rows = [['question_id','average_rating','responses_count']];
    (summary.questions || []).forEach((q) => rows.push([q.question_id, q.average_rating ?? '', q.responses_count]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation_${summary.evaluation_id}_summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="dept-card">
        <h3>Open Evaluations</h3>
        <p style={{ color: 'var(--muted)' }}>Select instructor, academic year, semester, and dates, then confirm Student/Peer/HOD enablement.</p>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <label>
            Instructor
            <select className="dept-select" value={openForm.teacher_id} onChange={(e) => setOpenForm((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">Select instructor</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              Academic year
              <input className="dept-input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder={currentYear} />
            </label>
            <label style={{ flex: 1 }}>
              Semester
              <select className="dept-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
              </select>
            </label>
          </div>
          <label>
            Open date
            <input type="date" className="dept-input" value={openForm.opened_at} onChange={(e) => setOpenForm((f) => ({ ...f, opened_at: e.target.value }))} />
          </label>
          <label>
            Close date (optional)
            <input type="date" className="dept-input" value={openForm.closed_at} onChange={(e) => setOpenForm((f) => ({ ...f, closed_at: e.target.value }))} />
          </label>
          <button className="dept-btn dept-btn-primary" onClick={proceedToConfirm} disabled={evalSubmitting}>
            {evalSubmitting ? 'Preparing…' : 'Next → Confirm'}
          </button>
        </div>

        {confirming && (
          <div style={{ marginTop: 16 }}>
            <h4>Confirmation</h4>
            <div style={{ marginBottom: 8, color: 'var(--muted)' }}>
              Session: {academicYear || currentYear}, {semester} • Open: {openForm.opened_at || '—'} • Close: {openForm.closed_at || '—'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {/* Box 1: Student Evaluation */}
              <div style={{ padding: 12, border: '1px solid #dee2e6', borderRadius: 8, background: '#fff' }}>
                <h5 style={{ margin: 0 }}>Student Evaluation</h5>
                <p style={{ color: 'var(--muted)' }}>Student evaluation will be ENABLED</p>
                <ul style={{ marginTop: 8 }}>
                  {assignedCoursesForTeacher.length === 0 ? (
                    <li style={{ color: 'var(--muted)' }}>No assigned courses found for this instructor.</li>
                  ) : (
                    assignedCoursesForTeacher.map((c) => {
                      const teacherId = Number(openForm.teacher_id);
                      const pivot = (c.teachers || []).find(t => t.id === teacherId)?.pivot || {};
                      const year = pivot?.year_level ?? c.year_level ?? '—';
                      return (
                        <li key={c.id}>{c.title} — Year {year}</li>
                      );
                    })
                  )}
                </ul>
                <small style={{ color: 'var(--muted)' }}>
                  Display assigned courses here, e.g. HCI for 2nd year, Networking for 4th year
                </small>
              </div>

              {/* Box 2: Peer Evaluation */}
              <div style={{ padding: 12, border: '1px solid #dee2e6', borderRadius: 8, background: '#fff' }}>
                <h5 style={{ margin: 0 }}>Peer Evaluation</h5>
                <p style={{ color: 'var(--muted)' }}>Peer evaluation will be ENABLED</p>
                <ul style={{ marginTop: 8 }}>
                  <li>Peer teachers can evaluate other teachers</li>
                  <li>Once per semester</li>
                  <li>No course logic here — correct</li>
                </ul>
              </div>

              {/* Box 3: HOD Evaluation */}
              <div style={{ padding: 12, border: '1px solid #dee2e6', borderRadius: 8, background: '#fff' }}>
                <h5 style={{ margin: 0 }}>HOD Evaluation</h5>
                <p style={{ color: 'var(--muted)' }}>HOD evaluation will be ENABLED</p>
                <ul style={{ marginTop: 8 }}>
                  <li>Only users with HOD role can access</li>
                  <li>Done once per semester</li>
                  <li>Simple and clean — correct</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button className="dept-btn dept-btn-primary" onClick={finalizeOpen} disabled={evalSubmitting}>
                {evalSubmitting ? 'Opening…' : 'Confirmation → Open'}
              </button>
              <button className="dept-btn dept-btn-ghost" style={{ marginLeft: 8 }} onClick={() => setConfirming(false)} disabled={evalSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Department Evaluation Template</h4>
        <p style={{ color: 'var(--muted)' }}>Configure the evaluation questions that will be used for all evaluations in this department. Students will see these questions when filling out any evaluation.</p>
        {templateLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p>Loading template...</p>
          </div>
        ) : (
          <DepartmentTemplateManager 
            departmentId={deptId}
            template={currentTemplate}
            questions={templateQuestions}
            onTemplateSaved={refreshTemplate}
          />
        )}
      </div>

      {/* Peer Evaluation Template */}
      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Peer Evaluation Template</h4>
        <p style={{ color: 'var(--muted)' }}>Configure the questions peers use when evaluating instructors. Managed separately from student questions.</p>
        {peerTemplateLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p>Loading peer template...</p>
          </div>
        ) : (
          <DepartmentTemplateManager 
            departmentId={deptId}
            template={peerTemplate}
            questions={peerTemplateQuestions}
            onTemplateSaved={refreshTemplate}
            audience="peer"
          />
        )}
      </div>

      {/* HOD Evaluation Template */}
      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>HOD Evaluation Template</h4>
        <p style={{ color: 'var(--muted)' }}>Configure the questions HODs use when evaluating instructors. Managed separately from student and peer questions.</p>
        {hodTemplateLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p>Loading HOD template...</p>
          </div>
        ) : (
          <DepartmentTemplateManager
            departmentId={deptId}
            template={hodTemplate}
            questions={hodTemplateQuestions}
            onTemplateSaved={refreshTemplate}
            audience="hod"
          />
        )}
      </div>

      {/* HOD evaluations tables removed per request */}
      

      {false && (<div className="dept-card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4>Session Evaluations ({academicYear}, {semester})</h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Connection Status Indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: '0.8em',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6'
            }}>
              <span>🔄</span>
              <span style={{ color: '#6c757d' }}>
                Manual Refresh Mode
              </span>
            </div>
            
            <button 
              className="dept-btn dept-btn-primary"
              onClick={refreshAll}
              title="Refresh data"
            >
              🔄 Refresh
            </button>
            <button 
              className="dept-btn dept-btn-ghost"
              onClick={refreshAllData}
              title="Manually refresh all data"
            >
              🔄 Refresh
            </button>
            {lastUpdate && (
              <span style={{ color: 'var(--muted)', fontSize: '0.8em' }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Live Analytics Dashboard removed per request */}

        {/* Participation Alerts */}
        {participationAlerts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ color: '#e74c3c', marginBottom: 8 }}>⚠️ Participation Alerts</h5>
            {participationAlerts.map((alert, index) => (
              <div 
                key={index}
                className={alert.severity === 'high' ? 'low-participation-alert' : ''}
                style={{ 
                  padding: 8, 
                  backgroundColor: alert.severity === 'high' ? '#ffebee' : '#fff3e0',
                  border: `1px solid ${alert.severity === 'high' ? '#e74c3c' : '#ff9800'}`,
                  borderRadius: 4,
                  marginBottom: 4,
                  fontSize: '0.9em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{alert.message}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {alert.severity === 'high' && (
                    <span style={{ 
                      fontSize: '0.7em', 
                      padding: '2px 6px', 
                      backgroundColor: '#e74c3c', 
                      color: 'white', 
                      borderRadius: 3,
                      fontWeight: 'bold'
                    }}>
                      URGENT
                    </span>
                  )}
                  <button 
                    className="dept-btn dept-btn-ghost"
                    style={{ fontSize: '0.7em', padding: '2px 6px' }}
                    onClick={() => {
                      // Navigate to specific evaluation
                      setSelectedEvalId(alert.evaluationId);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
          <input 
            className="dept-input" 
            placeholder="Filter by course/instructor" 
            value={evalFilter} 
            onChange={(e) => { setEvalPage(1); setEvalFilter(e.target.value); }} 
          />
          <select 
            className="dept-select" 
            value={advancedFilters.status} 
            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="closed">Closed Only</option>
          </select>
          <select 
            className="dept-select" 
            value={advancedFilters.performanceRange} 
            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, performanceRange: e.target.value }))}
          >
            <option value="all">All Performance</option>
            <option value="high">High Performance</option>
            <option value="medium">Medium Performance</option>
            <option value="low">Low Performance</option>
          </select>
          <select 
            className="dept-select" 
            value={advancedFilters.participationRange} 
            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, participationRange: e.target.value }))}
          >
            <option value="all">All Participation</option>
            <option value="high">High Participation (70%+)</option>
            <option value="medium">Medium Participation (40-70%)</option>
            <option value="low">Low Participation (&lt;40%)</option>
          </select>
        </div>

        {/* Sort and Display Options */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
          <label>
            Sort by
            <select className="dept-select" value={evalSortKey} onChange={(e) => setEvalSortKey(e.target.value)}>
              <option value="opened_at">Opened Date</option>
              <option value="closed_at">Closed Date</option>
              <option value="course">Course</option>
              <option value="teacher">Instructor</option>
              <option value="participation">Participation Rate</option>
              <option value="performance">Performance Score</option>
            </select>
          </label>
          <button className="dept-btn dept-btn-ghost" onClick={() => setEvalSortDir((d) => d === 'asc' ? 'desc' : 'asc')}>
            {evalSortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          <label>
            Page size
            <select className="dept-select" value={evalPageSize} onChange={(e) => { setEvalPage(1); setEvalPageSize(Number(e.target.value)); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>
        </div>
        {loading && <p>Loading evaluations…</p>}
        {!loading && evaluations.length === 0 && <p style={{ color: 'var(--muted)' }}>No evaluations for this session.</p>}
        {!loading && evaluations.length > 0 && (
          (() => {
            const filteredAndSorted = getFilteredAndSortedEvaluations();
            const total = filteredAndSorted.length;
            const start = (evalPage - 1) * evalPageSize;
            const pageItems = filteredAndSorted.slice(start, start + evalPageSize);
            const pageCount = Math.max(1, Math.ceil(total / evalPageSize));
            return (
              <div>
                <div className="dept-table-responsive">
                  <table className="dept-table-fixed">
                    <thead>
                      <tr>
                        <th align="left">Course</th>
                        <th align="left">Instructor</th>
                        <th align="left">Year</th>
                        <th align="left">Status</th>
                        <th align="left">Participation</th>
                        {showAnalytics && <th align="left">Performance</th>}
                        {showAnalytics && <th align="left">Weighted Score</th>}
                        <th align="left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((ev) => {
                        const participation = participationData[ev.id];
                        const stats = comprehensiveStats[ev.id];
                        const weightedScore = weightedScores[ev.id];
                        
                        return (
                          <tr key={ev.id}>
                            <td>{ev.course?.title} ({ev.course?.code})</td>
                            <td>{ev.teacher?.name}</td>
                            <td>{ev.year_level ? `Year ${ev.year_level}` : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span 
                                  style={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    backgroundColor: ev.closed_at ? '#95a5a6' : '#27ae60',
                                    display: 'inline-block'
                                  }}
                                />
                                {ev.closed_at ? 'Closed' : 'Active'}
                              </div>
                            </td>
                            <td>
                              <ParticipationIndicator 
                                evaluationId={ev.id}
                                getParticipationForEvaluation={getParticipationForEvaluation}
                                eligibleStudents={department?.students?.length || 0}
                                lowParticipationThreshold={lowParticipationThreshold}
                              />
                            </td>
                            {showAnalytics && (
                              <td>
                                {stats ? (
                                  <div style={{ minWidth: 100 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                                      {stats.average_rating.toFixed(2)}/5.0
                                    </div>
                                    <div style={{ 
                                      fontSize: '0.7em', 
                                      color: stats.performance_category === 'excellent' ? '#27ae60' :
                                             stats.performance_category === 'very_good' ? '#2ecc71' :
                                             stats.performance_category === 'good' ? '#f39c12' :
                                             stats.performance_category === 'satisfactory' ? '#e67e22' :
                                             stats.performance_category === 'needs_improvement' ? '#e74c3c' : '#95a5a6'
                                    }}>
                                      {stats.performance_category.replace('_', ' ').toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>
                                      {stats.total_responses} responses
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>No data</span>
                                )}
                              </td>
                            )}
                            {showAnalytics && (
                              <td>
                                {weightedScore ? (
                                  <div style={{ minWidth: 120 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                                      {weightedScore.performance_percentage.toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>
                                      S:{weightedScore.student_score.toFixed(1)} P:{weightedScore.peer_score.toFixed(1)} A:{weightedScore.admin_score.toFixed(1)}
                                    </div>
                                    <div style={{ fontSize: '0.7em', color: 'var(--muted)' }}>
                                      (50% + 30% + 20%)
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--muted)' }}>No data</span>
                                )}
                              </td>
                            )}
                            <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <button className="dept-btn dept-btn-primary" onClick={() => setSelectedEvalId(ev.id)}>
                                View Results
                              </button>
                              {!ev.closed_at && (
                                <button className="dept-btn dept-btn-ghost" onClick={() => closeEvaluation(ev)}>
                                  Close
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Enhanced Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9em' }}>
                    Showing {start + 1}-{Math.min(start + evalPageSize, total)} of {total} evaluations
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button 
                      className="dept-btn dept-btn-ghost" 
                      disabled={evalPage <= 1} 
                      onClick={() => setEvalPage(1)}
                    >
                      First
                    </button>
                    <button 
                      className="dept-btn dept-btn-ghost" 
                      disabled={evalPage <= 1} 
                      onClick={() => setEvalPage(p => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span style={{ color: 'var(--muted)' }}>
                      Page {evalPage} of {pageCount}
                    </span>
                    <button 
                      className="dept-btn dept-btn-ghost" 
                      disabled={evalPage >= pageCount} 
                      onClick={() => setEvalPage(p => Math.min(pageCount, p + 1))}
                    >
                      Next
                    </button>
                    <button 
                      className="dept-btn dept-btn-ghost" 
                      disabled={evalPage >= pageCount} 
                      onClick={() => setEvalPage(pageCount)}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        )}

      </div>)}

      {/* Comprehensive Evaluation Results section removed per request */}
    </div>
  );
}

export default DepartmentEvaluations;