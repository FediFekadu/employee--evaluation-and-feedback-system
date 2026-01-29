import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

function TeacherHome() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [metrics, setMetrics] = useState({
    coursesThisSemester: 0,
    participationRate: 0,
    averageRating: 0,
    totalFeedback: 0,
    currentYearLabel: new Date().getFullYear(),
  });

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    const tid = typeof window !== 'undefined' ? localStorage.getItem('teacher_id') : null;
    if (!tid) {
      setError('No teacher account found. Please login as a teacher.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/teachers/${tid}`);
      const t = res.data;
      setTeacher(t);

      const deptId = t?.department?.id || t?.department_id;

      // Pull teacher rankings for summary metrics
      let rankingEntry = null;
      try {
        const rankingsRes = await api.get(`/departments/${deptId}/teacher-rankings`, { params: { limit: 100 } });
        const rankings = rankingsRes?.data?.data?.rankings || [];
        rankingEntry = rankings.find(r => Number(r.teacher_id) === Number(t.id));
      } catch (_) {
        // Rankings may be unavailable; continue gracefully
      }

      // Load recent evaluations in this department and filter for this teacher
      let recent = [];
      try {
        const evalsRes = await api.get('/evaluations', { params: { department_id: deptId } });
        const list = (evalsRes.data?.data || evalsRes.data || []).filter(e => {
          const tidMatch = (e.teacher?.id ?? e.teacher_id);
          return Number(tidMatch) === Number(t.id);
        });
        const topEvals = list.slice(0, 3);
        for (const ev of topEvals) {
          try {
            const aRes = await api.get(`/evaluations/${ev.id}/analytics`);
            const stats = aRes?.data?.analytics || {};
            recent.push({
              id: ev.id,
              course: ev.course?.title || ev.course?.name || 'Course',
              rating: typeof stats.average_rating === 'number' ? stats.average_rating : 0,
              comments: typeof stats.total_responses === 'number' ? stats.total_responses : 0,
              date: ev.opened_at || ev.created_at,
            });
          } catch (_) {
            // If analytics fails, still show basic info
            recent.push({
              id: ev.id,
              course: ev.course?.title || ev.course?.name || 'Course',
              rating: 0,
              comments: 0,
              date: ev.opened_at || ev.created_at,
            });
          }
        }
      } catch (_) {
        // Evaluations may be unavailable; continue gracefully
      }

      setRecentFeedback(recent);

      // Compute metrics from rankings and teacher data
      const coursesThisSemester = Array.isArray(t?.courses) ? t.courses.length : 0;
      const avgRating = rankingEntry && typeof rankingEntry.average_performance_score === 'number'
        ? (rankingEntry.average_performance_score / 100) * 5
        : (recent.length ? (recent.reduce((s, f) => s + (f.rating || 0), 0) / recent.length) : 0);
      const totalFeedback = rankingEntry?.total_responses ?? recent.reduce((s, f) => s + (f.comments || 0), 0);
      const participationRate = rankingEntry?.average_participation_rate ?? 0;

      setMetrics({
        coursesThisSemester,
        participationRate,
        averageRating: avgRating,
        totalFeedback,
        currentYearLabel: new Date().getFullYear(),
      });
    } catch (e) {
      setError('Failed to load teacher details.');
    } finally {
      setLoading(false);
    }
  };

  const courses = teacher?.courses || [];

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary)', trend }) => (
    <div className="teacher-stat-card">
      <div className="stat-header">
        <div className="stat-icon" style={{ backgroundColor: color + '20', color }}>
          {icon}
        </div>
        {trend && (
          <div className={`stat-trend ${trend.type}`}>
            <span className="trend-arrow">{trend.type === 'up' ? '↗' : '↘'}</span>
            {trend.value}%
          </div>
        )}
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{loading ? '...' : value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, to, icon, color = 'var(--primary)' }) => (
    <Link to={to} className="teacher-action-card">
      <div className="action-icon" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div className="action-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="action-arrow">→</div>
    </Link>
  );

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadTeacherData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {teacher?.name || 'Professor'}!</h1>
          <p>Here's your teaching performance and student feedback overview.</p>
        </div>
        <div className="teacher-badge">
          <div className="badge-info">
            <span className="badge-title">{teacher?.title || 'Professor'}</span>
            <span className="badge-department">{teacher?.department?.name || 'Department'}</span>
          </div>
          <div className="badge-email">{teacher?.email}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="teacher-stats-grid">
        <StatCard
          title="Active Courses"
          value={metrics.coursesThisSemester}
          subtitle="This semester"
          icon="📚"
          color="#3b82f6"
        />
        <StatCard
          title="Participation Rate"
          value={`${Number(metrics.participationRate || 0).toFixed(1)}%`}
          subtitle="Across evaluations"
          icon="👥"
          color="#10b981"
          trend={metrics.participationRate ? { type: 'up', value: 0 } : undefined}
        />
        <StatCard
          title="Average Rating"
          value={metrics.averageRating.toFixed(1)}
          subtitle="Student evaluations"
          icon="⭐"
          color="#f59e0b"
          trend={metrics.averageRating ? { type: 'up', value: 0 } : undefined}
        />
        <StatCard
          title="Total Feedback"
          value={metrics.totalFeedback}
          subtitle="This academic year"
          icon="💬"
          color="#8b5cf6"
        />
      </div>

      {/* Main Content */}
      <div className="teacher-content-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="teacher-actions-grid">
            <QuickActionCard
              title="View Courses"
              description="Manage your course assignments"
              to="/teacher/courses"
              icon="📚"
              color="#3b82f6"
            />
            <QuickActionCard
              title="Check Feedback"
              description="Review student evaluations"
              to="/teacher/feedback"
              icon="📊"
              color="#10b981"
            />
            <QuickActionCard
              title="Peer Evaluations"
              description="Evaluate assigned peers"
              to="/teacher/peer-evaluations"
              icon="👥"
              color="#ef4444"
            />
            <QuickActionCard
              title="Update Profile"
              description="Manage your information"
              to="/teacher/profile"
              icon="👤"
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="dashboard-section">
          <h2>Recent Feedback</h2>
          <div className="feedback-list">
            {recentFeedback.map(feedback => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-info">
                  <h4>{feedback.course}</h4>
                  <p className="feedback-date">{new Date(feedback.date).toLocaleDateString()}</p>
                </div>
                <div className="feedback-stats">
                  <div className="rating">
                    <span className="rating-value">⭐ {feedback.rating}</span>
                  </div>
                  <div className="comments">
                    <span className="comments-count">💬 {feedback.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/teacher/feedback" className="view-all-link">
            View All Feedback →
          </Link>
        </div>

        {/* Performance Insights */}
        <div className="dashboard-section">
          <h2>Performance Insights</h2>
          <div className="insights-list">
            <div className="insight-item positive">
              <span className="insight-icon">📈</span>
              <div>
                <h4>Improving Trend</h4>
                <p>Your ratings have increased by 5% this semester</p>
              </div>
            </div>
            <div className="insight-item neutral">
              <span className="insight-icon">💡</span>
              <div>
                <h4>Student Engagement</h4>
                <p>89% of students completed evaluations</p>
              </div>
            </div>
            <div className="insight-item positive">
              <span className="insight-icon">🎯</span>
              <div>
                <h4>Strong Performance</h4>
                <p>Above department average in all metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherHome;