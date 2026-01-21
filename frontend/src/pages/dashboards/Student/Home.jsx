import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

function StudentHome() {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState({
    name: 'Student',
    yearLevel: null,
    semester: null,
    department: null
  });
  const [stats, setStats] = useState({
    availableEvaluations: 0,
    completedEvaluations: 0,
    pendingEvaluations: 0,
    totalCourses: 0
  });
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const completionRate = stats.availableEvaluations > 0
    ? Math.round((stats.completedEvaluations / stats.availableEvaluations) * 100)
    : 0;

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Get student info from localStorage
      const yearLevel = localStorage.getItem('year_level');
      const semester = localStorage.getItem('semester');
      const studentId = localStorage.getItem('student_id');
      const deptId = localStorage.getItem('department_id');
      
      setStudentInfo({
        name: localStorage.getItem('student_name') || 'Student',
        yearLevel: yearLevel || 'N/A',
        semester: semester === '2' ? 'Semester II' : 'Semester I',
        department: localStorage.getItem('department_name') || 'Department'
      });

      // Load actual evaluations from API
      if (deptId && yearLevel) {
        const semesterStr = semester === '2' ? 'Semester II' : 'Semester I';
        try {
          const res = await api.get(`/evaluations?department_id=${deptId}&open_only=true&year_level=${yearLevel}&semester=${encodeURIComponent(semesterStr)}`);
          const evaluationsList = res.data?.data || [];
          setEvaluations(evaluationsList);
          
          const studentDbId = localStorage.getItem('student_db_id');
          const completed = evaluationsList.filter(ev => 
            (ev.feedbacks || []).some(fb => Number(fb.student_id) === Number(studentDbId))
          ).length;
          
          setStats({
            availableEvaluations: evaluationsList.length,
            completedEvaluations: completed,
            pendingEvaluations: evaluationsList.length - completed,
            totalCourses: evaluationsList.length
          });
        } catch (error) {
          console.error('Error loading evaluations:', error);
          // Fallback to mock data
          setStats({
            availableEvaluations: 0,
            completedEvaluations: 0,
            pendingEvaluations: 0,
            totalCourses: 0
          });
        }
      }

    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary)' }) => (
    <div className="student-stat-card">
      <div className="stat-icon" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{loading ? '...' : value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, to, icon, color = 'var(--primary)' }) => (
    <Link to={to} className="student-action-card">
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
    <div className="student-dashboard">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {studentInfo.name}!</h1>
          <p>Ready to share your feedback and help improve our courses?</p>
        </div>
        <div className="student-badge">
          <div className="badge-info">
            <span className="badge-year">Year {studentInfo.yearLevel}</span>
            <span className="badge-semester">{studentInfo.semester}</span>
          </div>
          <div className="badge-department">{studentInfo.department}</div>
        </div>
      </div>

      {/* Hero CTA */}
      <div className="student-hero" onClick={() => navigate('/dashboard/evaluations')}>
        <div className="hero-content">
          <div className="hero-title">Make Your Voice Count</div>
          <div className="hero-subtitle">Complete your evaluations to improve teaching quality</div>
        </div>
        <div className="hero-cta">Start Now →</div>
      </div>

      {/* Stats Grid */}
      <div className="student-stats-grid">
        <StatCard
          title="Available Evaluations"
          value={stats.availableEvaluations}
          subtitle="Ready to complete"
          icon="📝"
          color="#3b82f6"
        />
        <StatCard
          title="Completed"
          value={stats.completedEvaluations}
          subtitle="This semester"
          icon="✅"
          color="#10b981"
        />
        <StatCard
          title="Pending"
          value={stats.pendingEvaluations}
          subtitle="Need your feedback"
          icon="⏳"
          color="#f59e0b"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          subtitle="Enrolled this semester"
          icon="📚"
          color="#8b5cf6"
        />
        <div className="student-stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
            🎯
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{loading ? '...' : completionRate + '%'}</h3>
            <p className="stat-title">Completion Rate</p>
            <div className="progress-ring">
              <svg viewBox="0 0 36 36">
                <path
                  className="ring-bg"
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="ring-progress"
                  strokeDasharray={`${completionRate}, 100`}
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="progress-text">{completionRate}% completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="student-content-grid">
        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="student-actions-grid">
            <QuickActionCard
              title="Start Evaluations"
              description="Complete pending course evaluations"
              to="/dashboard/evaluations"
              icon="📝"
              color="#3b82f6"
            />
            <QuickActionCard
              title="View Progress"
              description="Check your evaluation history"
              to="/dashboard/evaluations"
              icon="📊"
              color="#10b981"
            />
            <QuickActionCard
              title="Update Profile"
              description="Manage your account settings"
              to="/dashboard/profile"
              icon="👤"
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* Available Evaluations */}
        <div className="dashboard-section">
          <h2>Available Evaluations</h2>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading evaluations...</p>
            </div>
          ) : evaluations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Evaluations Available</h3>
              <p>There are no open evaluations for your courses at this time.</p>
            </div>
          ) : (
            <>
              <div className="home-evaluations-grid">
                {evaluations.slice(0, 3).map((evaluation) => {
                  const studentDbId = localStorage.getItem('student_db_id');
                  const isSubmitted = (evaluation?.feedbacks || []).some(fb => Number(fb.student_id) === Number(studentDbId));
                  const today = new Date().toISOString().slice(0,10);
                  const isClosed = evaluation.closed_at && evaluation.closed_at < today;
                  const isNotYetOpen = evaluation.opened_at && evaluation.opened_at > today;
                  
                  return (
                    <div 
                      key={evaluation.id} 
                      className="home-evaluation-card"
                      onClick={() => navigate('/dashboard/evaluations')}
                    >
                      <div className="evaluation-header">
                        <div className="course-info">
                          <h4>{evaluation.course?.title || 'Course'}</h4>
                          <span className="course-code">{evaluation.course?.code}</span>
                        </div>
                        <div className="evaluation-status">
                          {isSubmitted ? (
                            <span className="status-badge completed">✅ Done</span>
                          ) : isClosed ? (
                            <span className="status-badge closed">🔒 Closed</span>
                          ) : isNotYetOpen ? (
                            <span className="status-badge pending">⏳ Soon</span>
                          ) : (
                            <span className="status-badge open">📝 Open</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="instructor-info">
                        <div className="instructor-avatar">
                          {(evaluation.teacher?.name || 'T').charAt(0).toUpperCase()}
                        </div>
                        <div className="instructor-details">
                          <span className="instructor-name">{evaluation.teacher?.name || 'Instructor'}</span>
                          <span className="evaluation-period">{evaluation.academic_year} • {evaluation.semester}</span>
                        </div>
                      </div>
                      
                      <div className="evaluation-dates">
                        <div className="date-info">
                          <span className="date-label">Opens:</span>
                          <span className="date-value">{evaluation.opened_at}</span>
                        </div>
                        {evaluation.closed_at && (
                          <div className="date-info">
                            <span className="date-label">Closes:</span>
                            <span className="date-value">{evaluation.closed_at}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-action">
                        {isSubmitted ? (
                          <span className="action-text completed">Evaluation Completed</span>
                        ) : isClosed || isNotYetOpen ? (
                          <span className="action-text disabled">
                            {isClosed ? 'Evaluation Closed' : 'Not Available Yet'}
                          </span>
                        ) : (
                          <span className="action-text active">Click to Evaluate →</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {evaluations.length > 3 && (
                <Link to="/dashboard/evaluations" className="view-all-link">
                  View All {evaluations.length} Evaluations →
                </Link>
              )}
            </>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="dashboard-section">
          <h2>Upcoming Deadlines</h2>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Checking upcoming deadlines...</p>
            </div>
          ) : (
            (() => {
              const today = new Date();
              const soon = new Date();
              soon.setDate(today.getDate() + 7);
              const upcoming = evaluations.filter(ev => ev.closed_at && new Date(ev.closed_at) <= soon && new Date(ev.closed_at) >= today);
              if (upcoming.length === 0) {
                return (
                  <div className="empty-state">
                    <div className="empty-icon">⏰</div>
                    <h3>No deadlines in the next week</h3>
                    <p>Great job staying on top of your evaluations!</p>
                  </div>
                );
              }
              return (
                <div className="evaluations-list">
                  {upcoming.slice(0,5).map(ev => (
                    <div key={ev.id} className="evaluation-item">
                      <div className="evaluation-info">
                        <h4>{ev.course?.title || 'Course'} • {ev.teacher?.name || 'Instructor'}</h4>
                        <p className="evaluation-due">Closes: {ev.closed_at} • {ev.academic_year} • {ev.semester}</p>
                      </div>
                      <span className="evaluation-status pending">Due soon</span>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>

        {/* Tips & Guidelines */}
        <div className="dashboard-section">
          <h2>Evaluation Tips</h2>
          <div className="tips-list">
            <div className="tip-item">
              <span className="tip-icon">💡</span>
              <div>
                <h4>Be Honest & Constructive</h4>
                <p>Your feedback helps improve the learning experience</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🎯</span>
              <div>
                <h4>Focus on Specifics</h4>
                <p>Provide detailed examples when possible</p>
              </div>
            </div>
            <div className="tip-item">
              <span className="tip-icon">🤝</span>
              <div>
                <h4>Stay Respectful</h4>
                <p>Maintain professionalism in all feedback</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;