import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function CollegeAdminDashboard() {
  const [active, setActive] = useState('overview');
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deptEditForm, setDeptEditForm] = useState({ name: '', code: '' });
  const [selectedDeptId, setSelectedDeptId] = useState('');
  // Admin creation form state (Department Admins section)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  // Admin management state
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', department_id: '' });

  useEffect(() => {
    if (active !== 'departments' && active !== 'admins') return;
    let mounted = true;
    setDeptLoading(true);
    setDeptError('');
    api
      .get('/departments')
      .then((res) => {
        if (!mounted) return;
        setDepartments(res.data || []);
        if (!selectedDeptId && (res.data || []).length) {
          setSelectedDeptId(String(res.data[0].id));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setDeptError('Failed to load departments');
      })
      .finally(() => {
        if (!mounted) return;
        setDeptLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [active]);

  // Load department admins when viewing the admins tab
  useEffect(() => {
    if (active !== 'admins') return;
    let mounted = true;
    async function loadAdmins() {
      setAdminsLoading(true);
      setAdminsError('');
      try {
        const res = await api.get('/department-admins');
        if (!mounted) return;
        setAdmins(res.data || []);
      } catch (e) {
        if (!mounted) return;
        setAdminsError('Failed to load department admins');
      } finally {
        if (!mounted) return;
        setAdminsLoading(false);
      }
    }
    loadAdmins();
    return () => { mounted = false; };
  }, [active]);

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
              <p style={{ color: 'var(--muted)' }}>Add or update departments.</p>

              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <div>
                  <label>Name</label>
                  <input className="btn btn-ghost" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g., Computer Science" />
                </div>
                <div>
                  <label>Code</label>
                  <input className="btn btn-ghost" value={newDeptCode} onChange={(e) => setNewDeptCode(e.target.value)} placeholder="e.g., CS" />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!newDeptName || !newDeptCode) return;
                    try {
                      const res = await api.post('/departments', { name: newDeptName, code: newDeptCode });
                      setDepartments((prev) => [res.data, ...prev]);
                      setNewDeptName('');
                      setNewDeptCode('');
                    } catch (e) {
                      alert('Failed to create department');
                    }
                  }}
                >
                  Add Department
                </button>
              </div>
              {deptLoading && <p style={{ color: 'var(--muted)', marginTop: 12 }}>Loading departments…</p>}
              {deptError && <p style={{ color: 'red' }}>{deptError}</p>}

              <div className="card" style={{ marginTop: 16 }}>
                <h4>Departments List</h4>
                {deptLoading ? (
                  <p style={{ color: 'var(--muted)' }}>Loading…</p>
                ) : (
                  <table className="table" style={{ width: '100%', marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Name</th>
                        <th style={{ textAlign: 'left' }}>Code</th>
                        <th style={{ textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((d) => (
                        <tr key={d.id}>
                          <td>
                            {editingDeptId === d.id ? (
                              <input
                                className="btn btn-ghost"
                                value={deptEditForm.name}
                                onChange={(e) => setDeptEditForm((f) => ({ ...f, name: e.target.value }))}
                              />
                            ) : (
                              d.name
                            )}
                          </td>
                          <td>
                            {editingDeptId === d.id ? (
                              <input
                                className="btn btn-ghost"
                                value={deptEditForm.code}
                                onChange={(e) => setDeptEditForm((f) => ({ ...f, code: e.target.value }))}
                              />
                            ) : (
                              d.code
                            )}
                          </td>
                          <td style={{ display: 'flex', gap: 8 }}>
                            {editingDeptId === d.id ? (
                              <>
                                <button
                                  className="btn btn-primary"
                                  onClick={async () => {
                                    try {
                                      const res = await api.put(`/departments/${d.id}`, {
                                        name: deptEditForm.name,
                                        code: deptEditForm.code,
                                      });
                                      setDepartments((prev) => prev.map((x) => (x.id === d.id ? res.data : x)));
                                      setEditingDeptId(null);
                                      setDeptEditForm({ name: '', code: '' });
                                    } catch (e) {
                                      alert('Failed to update department');
                                    }
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => {
                                    setEditingDeptId(null);
                                    setDeptEditForm({ name: '', code: '' });
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => {
                                    setEditingDeptId(d.id);
                                    setDeptEditForm({ name: d.name, code: d.code });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={async () => {
                                    const ok = confirm('Delete this department?');
                                    if (!ok) return;
                                    try {
                                      await api.delete(`/departments/${d.id}`);
                                      setDepartments((prev) => prev.filter((x) => x.id !== d.id));
                                    } catch (e) {
                                      alert('Failed to delete department');
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {active === 'admins' && (
            <section className="card">
              <h3>Department Admins</h3>
              <p style={{ color: 'var(--muted)' }}>Create department admins with default credentials and assign to a department.</p>

              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <div>
                  <label>Department</label>
                  <select className="btn btn-ghost" value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Admin Email</label>
                  <input className="btn btn-ghost" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" />
                </div>
                <div>
                  <label>Admin Name</label>
                  <input className="btn btn-ghost" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label>Default Password</label>
                  <input className="btn btn-ghost" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Provide a temporary password" />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!selectedDeptId || !adminEmail || !adminPassword) {
                      alert('Department, email, and password are required');
                      return;
                    }
                    try {
                      const res = await api.post(`/departments/${selectedDeptId}/assign-admin`, {
                        email: adminEmail,
                        name: adminName || undefined,
                        password: adminPassword,
                      });
                      setAdminEmail('');
                      setAdminName('');
                      setAdminPassword('');
                      // Refresh admins list
                      try {
                        const list = await api.get('/department-admins');
                        setAdmins(list.data || []);
                      } catch {}
                      alert(`Department admin created/assigned: ${res.data.user.email}. Share the default credentials to the admin.`);
                    } catch (e) {
                      alert('Failed to create/assign department admin');
                    }
                  }}
                >
                  Create & Assign Department Admin
                </button>
              </div>

              {deptLoading && <p style={{ color: 'var(--muted)', marginTop: 12 }}>Loading departments…</p>}
              {deptError && <p style={{ color: 'red' }}>{deptError}</p>}

              <div className="card" style={{ marginTop: 16 }}>
                <h4>Assigned Department Admins</h4>
                {adminsLoading && <p style={{ color: 'var(--muted)' }}>Loading admins…</p>}
                {adminsError && <p style={{ color: 'red' }}>{adminsError}</p>}
                {!adminsLoading && !adminsError && (
                  <table className="table" style={{ width: '100%', marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Name</th>
                        <th style={{ textAlign: 'left' }}>Email</th>
                        <th style={{ textAlign: 'left' }}>Department</th>
                        <th style={{ textAlign: 'left' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((a) => (
                        <tr key={a.id}>
                          <td>
                            {editingId === a.id ? (
                              <input
                                className="btn btn-ghost"
                                value={editForm.name}
                                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              />
                            ) : (
                              a.name || '—'
                            )}
                          </td>
                          <td>
                            {editingId === a.id ? (
                              <input
                                className="btn btn-ghost"
                                value={editForm.email}
                                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                              />
                            ) : (
                              a.email
                            )}
                          </td>
                          <td>
                            {editingId === a.id ? (
                              <select
                                className="btn btn-ghost"
                                value={editForm.department_id}
                                onChange={(e) => setEditForm((f) => ({ ...f, department_id: e.target.value }))}
                              >
                                {departments.map((d) => (
                                  <option key={d.id} value={String(d.id)}>
                                    {d.name} ({d.code})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              a.department ? `${a.department.name} (${a.department.code})` : '—'
                            )}
                          </td>
                          <td style={{ display: 'flex', gap: 8 }}>
                            {editingId === a.id ? (
                              <>
                                <input
                                  className="btn btn-ghost"
                                  type="password"
                                  placeholder="New password (optional)"
                                  value={editForm.password}
                                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                                />
                                <button
                                  className="btn btn-primary"
                                  onClick={async () => {
                                    try {
                                      await api.put(`/department-admins/${a.id}`, {
                                        name: editForm.name || undefined,
                                        email: editForm.email || undefined,
                                        password: editForm.password || undefined,
                                        department_id: editForm.department_id ? Number(editForm.department_id) : undefined,
                                      });
                                      setEditingId(null);
                                      setEditForm({ name: '', email: '', password: '', department_id: '' });
                                      // Refresh admins list
                                      const list = await api.get('/department-admins');
                                      setAdmins(list.data || []);
                                    } catch (e) {
                                      alert('Failed to update admin');
                                    }
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditForm({ name: '', email: '', password: '', department_id: '' });
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => {
                                    setEditingId(a.id);
                                    setEditForm({
                                      name: a.name || '',
                                      email: a.email || '',
                                      password: '',
                                      department_id: String(a.department_id ?? (departments[0]?.id ? String(departments[0]?.id) : '')),
                                    });
                                  }}
                                >
                                  Edit / Reassign
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={async () => {
                                    const ok = confirm('Delete this department admin?');
                                    if (!ok) return;
                                    try {
                                      await api.delete(`/department-admins/${a.id}`);
                                      setAdmins((prev) => prev.filter((x) => x.id !== a.id));
                                    } catch (e) {
                                      alert('Failed to delete admin');
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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