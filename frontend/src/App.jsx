import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import api from './services/api';
import Login from './pages/Login';
// Enhanced Error Handling System
import EnhancedErrorRecoveryManager from './components/ErrorHandling/EnhancedErrorRecoveryManager';
import SystemHeader from './components/SystemHeader';
import './styles/system-header.css';
// Student dashboard nested
import StudentLayout from './pages/dashboards/Student/Layout';
import StudentHome from './pages/dashboards/Student/Home';
import StudentEvaluations from './pages/dashboards/Student/Evaluations';
import StudentProfile from './pages/dashboards/Student/Profile';
import DepartmentComment from './pages/dashboards/Student/DepartmentComment';
// Admin dashboard nested (used by /admin and /superadmin)
import CollegeAdminLayout from './pages/dashboards/CollegeAdmin/Layout';
import CollegeAdminOverview from './pages/dashboards/CollegeAdmin/Overview';
import CollegeAdminDepartments from './pages/dashboards/CollegeAdmin/Departments';
import CollegeAdminAdmins from './pages/dashboards/CollegeAdmin/Admins';
import CollegeAdminInstructors from './pages/dashboards/CollegeAdmin/Instructors';
import CollegeAdminStudents from './pages/dashboards/CollegeAdmin/Students';
import CollegeAdminCourses from './pages/dashboards/CollegeAdmin/Courses';
import CollegeAdminEvaluations from './pages/dashboards/CollegeAdmin/Evaluations';
import CollegeAdminReports from './pages/dashboards/CollegeAdmin/Reports';
import CollegeAdminSettings from './pages/dashboards/CollegeAdmin/Settings';
import CollegeAdminCommunication from './pages/dashboards/CollegeAdmin/Communication';
import CollegeAdminNotifications from './pages/dashboards/CollegeAdmin/Notifications';
// Teacher dashboard nested
import TeacherLayout from './pages/dashboards/Teacher/Layout';
import TeacherHome from './pages/dashboards/Teacher/Home';
import TeacherCourses from './pages/dashboards/Teacher/Courses';
import TeacherFeedback from './pages/dashboards/Teacher/Feedback';
import TeacherProfile from './pages/dashboards/Teacher/Profile';
import TeacherPeerEvaluation from './pages/dashboards/Teacher/PeerEvaluation';
import TeacherPeerEvaluationsList from './pages/dashboards/Teacher/PeerEvaluationsList';
// Department dashboard nested
import DepartmentLayout from './pages/dashboards/Department/Layout';
import DepartmentOverview from './pages/dashboards/Department/Overview';
import DepartmentCoursesAndInstructors from './pages/dashboards/Department/CoursesAndInstructors';
import DepartmentStudents from './pages/dashboards/Department/Students';
import DepartmentEvaluations from './pages/dashboards/Department/Evaluations';
import DepartmentResults from './pages/dashboards/Department/Results';
import DepartmentEvaluationResults from './pages/dashboards/Department/EvaluationResults';
import DepartmentReports from './pages/dashboards/Department/Reports';
import DepartmentOpenEvaluations from './pages/dashboards/Department/openEvaluations';
import HodEvaluations from './pages/dashboards/Department/HodEvaluations';
import DepartmentComments from './pages/dashboards/Department/Comments';
import { DepartmentRouteGuard } from './components/RouteGuard';

// Wrapper components for protected routes
function DepartmentResultsWrapper() {
  const { id } = useParams();
  return (
    <DepartmentRouteGuard departmentId={id}>
      <DepartmentResults />
    </DepartmentRouteGuard>
  );
}

function DepartmentEvaluationResultsWrapper() {
  const { id } = useParams();
  return (
    <DepartmentRouteGuard departmentId={id}>
      <DepartmentEvaluationResults />
    </DepartmentRouteGuard>
  );
}

function App() {
  const location = useLocation();
  const showFooter = location.pathname === '/';
  // Initialize from localStorage synchronously to avoid flicker
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('theme');
      return stored || 'light';
    }
    return 'light';
  });
  const navigate = useNavigate();

  // Keep theme synced across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  }, []);

  // Apply theme and persist
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_role');

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Proceed even if API call fails
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_role');
      }
      navigate('/login');
    }
  };

  return (
    <EnhancedErrorRecoveryManager
      enableGlobalErrorBoundary={true}
      enableUserFeedback={true}
      enableNetworkStatus={false}
      showNetworkDetails={false}
      maxErrors={10}
      autoRecovery={true}
    >
      <div>
        <SystemHeader theme={theme} onToggleTheme={toggleTheme} />

        <main className="has-system-header">
          <Routes>
            <Route
              path="/"
              element={
                <div className="homepage">
                  <section className="hero">
                    <h1>Student Feedback & Teacher Evaluation System</h1>
                    <p>
                      A secure, role‑based platform for collecting student feedback, managing
                      department courses and evaluations, and providing insightful reports for teachers
                      and administrators.
                    </p>
                    <div className="cta">
                      <Link className="btn btn-primary" to="/login">Get Started</Link>
                      <a className="btn btn-ghost" href="#features">Learn More</a>
                    </div>
                  </section>

                  <section className="grid role-cards" aria-label="Roles">
                    <Link to="/login" className="card role-card role-card-click">
                      <div className="card-icon"><i className="bi bi-mortarboard"></i></div>
                      <h3>Students</h3>
                      <p>Evaluate assigned courses with privacy.</p>
                      <div className="card-actions">
                        <span className="card-link">Access <i className="bi bi-arrow-right"></i></span>
                      </div>
                    </Link>
                    <Link to="/login" className="card role-card role-card-click">
                      <div className="card-icon"><i className="bi bi-building"></i></div>
                      <h3>Department</h3>
                      <p>Manage feedback, comments, results and open/close evaluations.</p>
                      <div className="card-actions">
                        <span className="card-link">Access <i className="bi bi-arrow-right"></i></span>
                      </div>
                    </Link>
                    <Link to="/login" className="card role-card role-card-click">
                      <div className="card-icon"><i className="bi bi-person-badge"></i></div>
                      <h3>Teachers</h3>
                      <p>View aggregated feedback and peer evaluations to improve teaching quality.</p>
                      <div className="card-actions">
                        <span className="card-link">Access <i className="bi bi-arrow-right"></i></span>
                      </div>
                    </Link>
                  </section>

                  <section id="features" className="features">
                    <div className="container">
                      <div className="features-grid">
                        <div className="feature-item">
                          <span className="feature-icon"><i className="bi bi-shield-lock"></i></span>
                          <div className="feature-content">
                            <h4>Secure Evaluations</h4>
                            <p>Protected submissions with privacy‑first design.</p>
                          </div>
                        </div>
                        <div className="feature-item">
                          <span className="feature-icon"><i className="bi bi-people"></i></span>
                          <div className="feature-content">
                            <h4>Role‑based Access</h4>
                            <p>Students, departments and teachers get tailored views.</p>
                          </div>
                        </div>
                        <div className="feature-item">
                          <span className="feature-icon"><i className="bi bi-graph-up-arrow"></i></span>
                          <div className="feature-content">
                            <h4>Analytics</h4>
                            <p>Actionable reports and rankings for decision making.</p>
                          </div>
                        </div>
                        <div className="feature-item">
                          <span className="feature-icon"><i className="bi bi-bell"></i></span>
                          <div className="feature-content">
                            <h4>Notifications</h4>
                            <p>Timely updates on openings and results.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

               
                  <section id="about" className="about">
                    <div className="container">
                      <p className="about-text">Built for academic institutions to streamline course evaluations and improve teaching quality.</p>
                    </div>
                  </section>

                  <section id="contact" className="contact">
                    <div className="container">
                      <p className="contact-text">Need access? Use your institutional account to sign in.</p>
                    </div>
                  </section>
                </div>
              }
            />
            <Route path="/login" element={<Login />} />
            {/* Student dashboard */}
            <Route path="/dashboard" element={<StudentLayout />}>
              <Route index element={<StudentHome />} />
              <Route path="evaluations" element={<StudentEvaluations />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="department-comment" element={<DepartmentComment />} />
            </Route>
            {/* College Admin dashboard */}
            <Route path="/admin" element={<CollegeAdminLayout />}>
              <Route index element={<CollegeAdminOverview />} />
              <Route path="departments" element={<CollegeAdminDepartments />} />
              <Route path="admins" element={<CollegeAdminAdmins />} />
              <Route path="instructors" element={<CollegeAdminInstructors />} />
              <Route path="students" element={<CollegeAdminStudents />} />
              <Route path="courses" element={<CollegeAdminCourses />} />
              <Route path="evaluations" element={<CollegeAdminEvaluations />} />
              <Route path="reports" element={<CollegeAdminReports />} />
              <Route path="settings" element={<CollegeAdminSettings />} />
              <Route path="communication" element={<CollegeAdminCommunication />} />
              <Route path="notifications" element={<CollegeAdminNotifications />} />
            </Route>
            {/* Super Admin reuses College Admin layout */}
            <Route path="/superadmin" element={<CollegeAdminLayout />}>
              <Route index element={<CollegeAdminOverview />} />
              <Route path="departments" element={<CollegeAdminDepartments />} />
              <Route path="admins" element={<CollegeAdminAdmins />} />
              <Route path="instructors" element={<CollegeAdminInstructors />} />
              <Route path="students" element={<CollegeAdminStudents />} />
              <Route path="courses" element={<CollegeAdminCourses />} />
              <Route path="evaluations" element={<CollegeAdminEvaluations />} />
              <Route path="reports" element={<CollegeAdminReports />} />
              <Route path="settings" element={<CollegeAdminSettings />} />
              <Route path="communication" element={<CollegeAdminCommunication />} />
              <Route path="notifications" element={<CollegeAdminNotifications />} />
            </Route>
            {/* Teacher dashboard */}
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherHome />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="feedback" element={<TeacherFeedback />} />
              <Route path="peer-evaluations" element={<TeacherPeerEvaluationsList />} />
              <Route path="peer-evaluations/:peerEvaluationId" element={<TeacherPeerEvaluation />} />
              <Route path="profile" element={<TeacherProfile />} />
            </Route>
            {/* Department dashboard */}
            <Route path="/department/:id" element={<DepartmentLayout />}>
              <Route index element={<DepartmentOverview />} />
              <Route path="courses-instructors" element={<DepartmentCoursesAndInstructors />} />
              <Route path="students" element={<DepartmentStudents />} />
              <Route path="evaluations" element={<DepartmentEvaluations />} />
              <Route path="hod-evaluations" element={<HodEvaluations />} />
              <Route path="comments" element={<DepartmentComments />} />
              <Route path="manage-evaluations" element={<DepartmentOpenEvaluations />} />
              <Route path="results" element={<DepartmentResultsWrapper />} />
              <Route path="results/:evaluationId" element={<DepartmentEvaluationResultsWrapper />} />
              <Route path="reports" element={<DepartmentReports />} />
            </Route>
          </Routes>
        </main>

        {showFooter && (
          <footer className="footer">
            <div className="container">
              <span>© {new Date().getFullYear()} Informatics College. All rights reserved.</span>
            </div>
          </footer>
        )}
      </div>
    </EnhancedErrorRecoveryManager>
  );
}

export default App;
