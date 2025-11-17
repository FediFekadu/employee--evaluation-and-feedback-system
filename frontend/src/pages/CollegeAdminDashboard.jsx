import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function CollegeAdminDashboard() {
  const [active, setActive] = useState('overview');

  const nav = [
    { key: 'overview', label: 'Overview' },
    { key: 'departments', label: 'Departments' },
    { key: 'admins', label: 'Department Admins' },
    { key: 'instructors', label: 'Instructors' },
    { key: 'students', label: 'Students' },
    { key: 'courses', label: 'Courses' },
    { key: 'evaluations', label: 'Evaluations' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'settings', label: 'System Settings' },
    { key: 'communication', label: 'Communication' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ marginBottom: 6 }}>College Head Dashboard — Informatics College</h2>
      <p style={{ color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
        Manage departments, users, courses, evaluations, reports, and communications.
      </p>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Sidebar */}
        <aside style={{ width: 240 }}>
          <div className="card" style={{ padding: 12 }}>
            <nav style={{ display: 'grid', gap: 8 }}>
              {nav.map((item) => (
                <button
                  key={item.key}
                  className={`btn btn-ghost`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => setActive(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1 }}>
          {active === 'overview' && (
            <section className="grid">
              <div className="card">
                <h3>Overview Stats</h3>
                <ul>
                  <li>Departments: 0</li>
                  <li>Instructors: 0</li>
                  <li>Students: 0</li>
                  <li>Active Courses: 0</li>
                </ul>
              </div>
              <div className="card">
                <h3>Feedback Summary</h3>
                <p>Average rating: —</p>
                <p>Evaluations completed: —</p>
                <p>Pending evaluations: —</p>
              </div>
              <div className="card">
                <h3>Quick Actions</h3>
                <ul>
                  <li><Link to="#">Create semester</Link></li>
                  <li><Link to="#">Post department courses</Link></li>
                  <li><Link to="#">Assign teachers to courses</Link></li>
                  <li><Link to="#">Open evaluations</Link></li>
                </ul>
              </div>
            </section>
          )}

          {active === 'departments' && (
            <section className="card">
              <h3>Manage Departments</h3>
              <p style={{ color: 'var(--muted)' }}>Add, edit, activate/deactivate departments, and assign admins.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Add Department</button>
                <button className="btn btn-ghost">Edit Selected</button>
                <button className="btn btn-ghost">Assign Admin</button>
                <button className="btn btn-ghost">Activate/Deactivate</button>
              </div>
            </section>
          )}

          {active === 'admins' && (
            <section className="card">
              <h3>Department Admins</h3>
              <p style={{ color: 'var(--muted)' }}>Create, reset passwords, update profiles, and assign permissions.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Create Admin</button>
                <button className="btn btn-ghost">Reset Password</button>
                <button className="btn btn-ghost">Update Profile</button>
                <button className="btn btn-ghost">Assign Roles</button>
              </div>
            </section>
          )}

          {active === 'instructors' && (
            <section className="card">
              <h3>Instructors</h3>
              <p style={{ color: 'var(--muted)' }}>Add, assign to departments, update info, activate/deactivate.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Add Instructor</button>
                <button className="btn btn-ghost">Assign to Department</button>
                <button className="btn btn-ghost">Update Info</button>
                <button className="btn btn-ghost">Activate/Deactivate</button>
              </div>
            </section>
          )}

          {active === 'students' && (
            <section className="card">
              <h3>Students</h3>
              <p style={{ color: 'var(--muted)' }}>Import, add, update, and manage student accounts.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <select className="btn btn-ghost" aria-label="Department filter">
                  <option>All Departments</option>
                  <option>Software Engineering</option>
                  <option>Information Systems</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                </select>
                <select className="btn btn-ghost" aria-label="Year filter">
                  <option>All Years</option>
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                  <option>Year 4</option>
                </select>
                <select className="btn btn-ghost" aria-label="Semester filter">
                  <option>All Semesters</option>
                  <option>Semester I</option>
                  <option>Semester II</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Import (CSV)</button>
                <button className="btn btn-ghost">Add Student</button>
                <button className="btn btn-ghost">Update Info</button>
                <button className="btn btn-ghost">Activate/Deactivate</button>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <p style={{ color: 'var(--muted)' }}>Student list appears here…</p>
              </div>
            </section>
          )}

          {active === 'courses' && (
            <section className="card">
              <h3>Courses</h3>
              <p style={{ color: 'var(--muted)' }}>Add courses, filter, and assign instructors.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <select className="btn btn-ghost" aria-label="Department filter">
                  <option>All Departments</option>
                  <option>Software Engineering</option>
                  <option>Information Systems</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                </select>
                <select className="btn btn-ghost" aria-label="Year filter">
                  <option>All Years</option>
                  <option>Year 1</option>
                  <option>Year 2</option>
                  <option>Year 3</option>
                  <option>Year 4</option>
                </select>
                <select className="btn btn-ghost" aria-label="Semester filter">
                  <option>All Semesters</option>
                  <option>Semester I</option>
                  <option>Semester II</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Add Course</button>
                <button className="btn btn-ghost">Assign Instructor</button>
                <button className="btn btn-ghost">Edit Course</button>
                <button className="btn btn-ghost">Archive</button>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <p style={{ color: 'var(--muted)' }}>Course list appears here…</p>
              </div>
            </section>
          )}

          {active === 'evaluations' && (
            <section className="card">
              <h3>Feedback & Evaluation Control</h3>
              <p style={{ color: 'var(--muted)' }}>Open/close evaluations, view summaries, flag low performance, send alerts.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Open Evaluations</button>
                <button className="btn btn-ghost">Close Evaluations</button>
                <button className="btn btn-ghost">View Department Results</button>
                <button className="btn btn-ghost">Flag Instructors</button>
                <button className="btn btn-ghost">Send Alerts</button>
              </div>
            </section>
          )}

          {active === 'reports' && (
            <section className="card">
              <h3>Reports & Analytics</h3>
              <p style={{ color: 'var(--muted)' }}>Generate department and instructor analytics, trends, participation, and export.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <select className="btn btn-ghost" aria-label="Department filter">
                  <option>All Departments</option>
                  <option>Software Engineering</option>
                  <option>Information Systems</option>
                  <option>Computer Science</option>
                  <option>Information Technology</option>
                </select>
                <select className="btn btn-ghost" aria-label="Semester filter">
                  <option>All Semesters</option>
                  <option>Semester I</option>
                  <option>Semester II</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Generate Report (PDF)</button>
                <button className="btn btn-ghost">Export (CSV)</button>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <p style={{ color: 'var(--muted)' }}>Analytics widgets appear here…</p>
              </div>
            </section>
          )}

          {active === 'settings' && (
            <section className="card">
              <h3>System Settings</h3>
              <p style={{ color: 'var(--muted)' }}>Set evaluation schedule, defaults, and college profile.</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <label>
                  Start Date
                  <input type="date" className="btn btn-ghost" />
                </label>
                <label>
                  End Date
                  <input type="date" className="btn btn-ghost" />
                </label>
                <label>
                  Academic Year
                  <input type="text" className="btn btn-ghost" placeholder="2025/26" />
                </label>
                <label>
                  Default Semester
                  <select className="btn btn-ghost">
                    <option>Semester I</option>
                    <option>Semester II</option>
                  </select>
                </label>
              </div>
            </section>
          )}

          {active === 'communication' && (
            <section className="card">
              <h3>Communication Tools</h3>
              <p style={{ color: 'var(--muted)' }}>Announcements and messages to departments and instructors.</p>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <input className="btn btn-ghost" placeholder="Announcement title" />
                <textarea className="btn btn-ghost" placeholder="Announcement message" rows={4} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary">Send to All Departments</button>
                  <button className="btn btn-ghost">Message Admins</button>
                  <button className="btn btn-ghost">Message Instructors</button>
                </div>
              </div>
            </section>
          )}

          {active === 'notifications' && (
            <section className="card">
              <h3>Notifications</h3>
              <p style={{ color: 'var(--muted)' }}>New feedback, issues, and reports.</p>
              <ul style={{ marginTop: 12 }}>
                <li>No new notifications.</li>
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default CollegeAdminDashboard;