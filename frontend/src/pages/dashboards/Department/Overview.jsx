import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentOverview() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentYear = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  }, []);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('Semester I');

  const [evaluations, setEvaluations] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);

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

  const loadEvaluations = async () => {
    setEvalLoading(true);
    try {
      const res = await api.get('/evaluations', { params: { department_id: deptId, academic_year: academicYear, semester } });
      setEvaluations(res.data?.data || []);
    } catch (e) {
      // ignore
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => { if (deptId && academicYear && semester) loadEvaluations(); }, [deptId, academicYear, semester]);

  const evaluationStatus = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return 'Not started';
    const anyOpen = evaluations.some((ev) => ev.opened_at <= todayStr && (!ev.closed_at || ev.closed_at >= todayStr));
    const allClosed = evaluations.length > 0 && evaluations.every((ev) => ev.closed_at && ev.closed_at < todayStr);
    if (anyOpen) return 'Ongoing';
    if (allClosed) return 'Completed';
    return 'Scheduled';
  }, [evaluations, todayStr]);

  const stats = useMemo(() => {
    if (!department) return [];
    
    const activeEvaluations = evaluations.filter(ev => 
      ev.opened_at <= todayStr && (!ev.closed_at || ev.closed_at >= todayStr)
    ).length;

    return [
      {
        title: 'Total Instructors',
        value: department.teachers?.length ?? 0,
        icon: '👨‍🏫',
        color: '#3b82f6',
        trend: '+2 this month',
        trendUp: true
      },
      {
        title: 'Total Students',
        value: department.students?.length ?? 0,
        icon: '👨‍🎓',
        color: '#10b981',
        trend: '+15 this semester',
        trendUp: true
      },
      {
        title: 'Active Courses',
        value: department.courses?.length ?? 0,
        icon: '📚',
        color: '#f59e0b',
        trend: 'All active',
        trendUp: true
      },
      {
        title: 'Active Evaluations',
        value: activeEvaluations,
        icon: '📝',
        color: '#8b5cf6',
        trend: evaluationStatus,
        trendUp: activeEvaluations > 0
      }
    ];
  }, [department, evaluations, evaluationStatus, todayStr]);

  const quickActions = [
    {
      title: 'Create Evaluation',
      description: 'Start new teacher evaluation',
      icon: '📝',
      color: '#3b82f6',
      link: `/department/${id}/evaluations`,
      badge: evaluations.filter(e => !e.closed_at).length || null
    },
    {
      title: 'Manage Courses',
      description: 'View and edit courses',
      icon: '📚',
      color: '#10b981',
      link: `/department/${id}/courses`,
      badge: department?.courses?.length || null
    },
    {
      title: 'View Reports',
      description: 'Generate analytics reports',
      icon: '📈',
      color: '#f59e0b',
      link: `/department/${id}/reports`,
      badge: 'New'
    },
    {
      title: 'Manage Staff',
      description: 'Instructor management',
      icon: '👥',
      color: '#8b5cf6',
      link: `/department/${id}/instructors`,
      badge: department?.teachers?.length || null
    }
  ];

  const recentEvaluations = evaluations.slice(0, 5);

  if (loading) {
    return (
      <div className="department-dashboard">
        <div className="dashboard-header">
          <div className="loading-skeleton">
            <div className="skeleton-title"></div>
            <div className="skeleton-subtitle"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="department-dashboard">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load Department</h2>
          <p>{error}</p>
          <button className="dept-btn dept-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="department-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome to {department?.name}</h1>
          <p>Manage your department efficiently with our comprehensive dashboard</p>
        </div>
        <div className="department-badge">
          <div className="badge-info">
            <span className="badge-year">{academicYear}</span>
            <span className="badge-semester">{semester}</span>
          </div>
          <div className="badge-department">{department?.name}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="department-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="department-stat-card">
            <div className="stat-header">
              <div 
                className="stat-icon"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                <span className="trend-arrow">{stat.trendUp ? '↗' : '↘'}</span>
                {stat.trend}
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Content Grid */}
      <div className="department-content-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="department-actions-grid">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="department-action-card"
              >
                <div 
                  className="action-icon"
                  style={{ backgroundColor: `${action.color}20`, color: action.color }}
                >
                  {action.icon}
                </div>
                <div className="action-content">
                  <h4>{action.title}</h4>
                  <p>{action.description}</p>
                </div>
                {action.badge && (
                  <div className="action-badge" style={{ backgroundColor: action.color }}>
                    {action.badge}
                  </div>
                )}
                <div className="action-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="dashboard-section">
          <h2>Recent Evaluations</h2>
          {evalLoading ? (
            <p>Loading evaluations...</p>
          ) : recentEvaluations.length > 0 ? (
            <div className="evaluations-list">
              {recentEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="evaluation-item">
                  <div className="evaluation-info">
                    <h4>{evaluation.course?.title}</h4>
                    <p className="evaluation-instructor">{evaluation.teacher?.name}</p>
                    <p className="evaluation-due">Opened: {evaluation.opened_at}</p>
                  </div>
                  <div className={`evaluation-status ${evaluation.closed_at ? 'completed' : 'pending'}`}>
                    {evaluation.closed_at ? 'Completed' : 'Active'}
                  </div>
                </div>
              ))}
              <Link to={`/department/${id}/evaluations`} className="view-all-link">
                View All Evaluations →
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Evaluations Yet</h3>
              <p>Start by creating your first teacher evaluation</p>
              <Link to={`/department/${id}/evaluations`} className="dept-btn dept-btn-primary">
                Create Evaluation
              </Link>
            </div>
          )}
        </div>

        {/* Department Info */}
        <div className="dashboard-section">
          <h2>Department Information</h2>
          <div className="department-info">
            <div className="info-item">
              <span className="info-label">Department Name:</span>
              <span className="info-value">{department?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Academic Year:</span>
              <span className="info-value">{academicYear}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Semester:</span>
              <span className="info-value">{semester}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentOverview;