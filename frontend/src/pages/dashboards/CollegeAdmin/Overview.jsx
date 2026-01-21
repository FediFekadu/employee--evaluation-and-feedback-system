import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

function CollegeAdminOverview() {
  const [stats, setStats] = useState({
    departments: 0,
    instructors: 0,
    students: 0,
    courses: 0,
    activeEvaluations: 0,
    completedEvaluations: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all dashboard data in parallel
      const [
        departmentsRes,
        instructorsRes,
        studentsRes,
        coursesRes,
        evaluationsRes
      ] = await Promise.allSettled([
        api.get('/departments'),
        api.get('/teachers'),
        api.get('/students'),
        api.get('/courses'),
        api.get('/evaluations')
      ]);

      const departments = departmentsRes.status === 'fulfilled' ? departmentsRes.value.data : [];
      const instructors = instructorsRes.status === 'fulfilled' ? instructorsRes.value.data : [];
      const students = studentsRes.status === 'fulfilled' ? studentsRes.value.data : [];
      const courses = coursesRes.status === 'fulfilled' ? coursesRes.value.data : [];
      const evaluations = evaluationsRes.status === 'fulfilled' ? (evaluationsRes.value.data?.data || []) : [];

      // Calculate stats
      const activeEvaluations = evaluations.filter(e => e.status === 'open').length;
      const completedEvaluations = evaluations.filter(e => e.status === 'closed').length;
      
      setStats({
        departments: departments.length,
        instructors: instructors.length,
        students: students.length,
        courses: courses.length,
        activeEvaluations,
        completedEvaluations,
        averageRating: 4.2 // Mock data - would come from actual evaluation results
      });

      // Mock recent activity
      setRecentActivity([
        { id: 1, type: 'evaluation', message: 'New evaluation opened for CS101', time: '2 hours ago' },
        { id: 2, type: 'department', message: 'Computer Science department updated', time: '4 hours ago' },
        { id: 3, type: 'instructor', message: 'Dr. Smith assigned to new course', time: '1 day ago' },
        { id: 4, type: 'student', message: '25 new students enrolled', time: '2 days ago' }
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary)', trend }) => (
    <div className="dashboard-stat-card">
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
    <Link to={to} className="quick-action-card">
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

  return (
    <div className="dashboard-overview">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, Admin</h1>
          <p>Here's what's happening with your college evaluation system today.</p>
        </div>
        <button className="btn btn-primary" onClick={loadDashboardData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Departments"
          value={stats.departments}
          subtitle="Active departments"
          icon="🏢"
          color="#3b82f6"
          trend={{ type: 'up', value: 5 }}
        />
        <StatCard
          title="Instructors"
          value={stats.instructors}
          subtitle="Teaching staff"
          icon="👨‍🏫"
          color="#10b981"
          trend={{ type: 'up', value: 12 }}
        />
        <StatCard
          title="Students"
          value={stats.students}
          subtitle="Enrolled students"
          icon="👥"
          color="#f59e0b"
          trend={{ type: 'up', value: 8 }}
        />
        <StatCard
          title="Active Courses"
          value={stats.courses}
          subtitle="This semester"
          icon="📚"
          color="#8b5cf6"
        />
        <StatCard
          title="Active Evaluations"
          value={stats.activeEvaluations}
          subtitle="Currently open"
          icon="📊"
          color="#ef4444"
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating.toFixed(1)}
          subtitle="Overall satisfaction"
          icon="⭐"
          color="#22d3ee"
          trend={{ type: 'up', value: 3 }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <QuickActionCard
              title="Manage Departments"
              description="Add, edit, or remove departments"
              to="/admin/departments"
              icon="🏢"
              color="#3b82f6"
            />
            <QuickActionCard
              title="Create Evaluation"
              description="Set up new course evaluations"
              to="/admin/evaluations"
              icon="📝"
              color="#10b981"
            />
            <QuickActionCard
              title="View Reports"
              description="Analyze evaluation results"
              to="/admin/reports"
              icon="📈"
              color="#f59e0b"
            />
            <QuickActionCard
              title="Manage Courses"
              description="Add courses and assign instructors"
              to="/admin/courses"
              icon="📚"
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'evaluation' && '📊'}
                  {activity.type === 'department' && '🏢'}
                  {activity.type === 'instructor' && '👨‍🏫'}
                  {activity.type === 'student' && '👥'}
                </div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-section">
          <h2>System Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div>
                <h4>Database</h4>
                <p>Online</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div>
                <h4>API Services</h4>
                <p>Operational</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator warning"></div>
              <div>
                <h4>Email Service</h4>
                <p>Degraded</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div>
                <h4>File Storage</h4>
                <p>Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollegeAdminOverview;