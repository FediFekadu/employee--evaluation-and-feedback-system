import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import api from './services/api';
import Login from './pages/Login';
// Enhanced Error Handling System
import EnhancedErrorRecoveryManager from './components/ErrorHandling/EnhancedErrorRecoveryManager';
// Student dashboard nested
import StudentLayout from './pages/dashboards/Student/Layout';
import StudentHome from './pages/dashboards/Student/Home';
import StudentEvaluations from './pages/dashboards/Student/Evaluations';
import StudentProfile from './pages/dashboards/Student/Profile';
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
        <header className="navbar">
          <div className="container nav-inner">
            <div className="brand">
              <span className="brand-badge" />
              <span>Informatics College • Feedback & Evaluation</span>
            </div>
            <nav className="nav-links">
              <Link className="link" to="/">Home</Link>
              {isLoggedIn ? (
                <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
              ) : (
                <Link className="btn btn-ghost" to="/login">Login</Link>
              )}
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? (
                  // Sun icon
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4a1 1 0 011-1h0a1 1 0 010 2h0a1 1 0 01-1-1zm0 16a1 1 0 011 1h0a1 1 0 010-2h0a1 1 0 01-1 1zm8-8a1 1 0 011-1h0a1 1 0 010 2h0a1 1 0 01-1-1zM4 12a1 1 0 011 1h0a1 1 0 010-2h0a1 1 0 01-1 1zm12.95-5.657a1 1 0 011.414 0h0a1 1 0 01-1.414 1.414h0a1 1 0 010-1.414zM6.636 17.364a1 1 0 011.414 0h0a1 1 0 01-1.414 1.414h0a1 1 0 010-1.414zM17.364 17.364a1 1 0 010 1.414h0a1 1 0 11-1.414-1.414h0a1 1 0 011.414 0zM7.05 6.343a1 1 0 010 1.414h0A1 1 0 115.636 6.343h0A1 1 0 017.05 6.343zM12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>
                ) : (
                  // Moon icon
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1111.21 3c.26 0 .5.15.62.38a1 1 0 01-.17 1.1A7 7 0 1019.52 13a1 1 0 011.1-.17c.23.12.38.36.38.62z"/></svg>
                )}
              </button>
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route
              path="/"
              element={
                <div className="hero">
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
                  <section id="features" className="grid">
                    <div className="card">
                      <h3>Students</h3>
                      <p>Evaluate assigned courses with privacy by default; optionally reveal identity.</p>
                    </div>
                    <div className="card">
                      <h3>Department Admin</h3>
                      <p>Manage semesters, post courses, assign teachers, and open evaluations.</p>
                    </div>
                    <div className="card">
                      <h3>Teachers</h3>
                      <p>View aggregated feedback and peer evaluations to improve teaching quality.</p>
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
              <Route path="manage-evaluations" element={<DepartmentOpenEvaluations />} />
              <Route path="results" element={<DepartmentResultsWrapper />} />
              <Route path="results/:evaluationId" element={<DepartmentEvaluationResultsWrapper />} />
              <Route path="reports" element={<DepartmentReports />} />
            </Route>
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <span>© {new Date().getFullYear()} Informatics College. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </EnhancedErrorRecoveryManager>
  );
}

export default App;