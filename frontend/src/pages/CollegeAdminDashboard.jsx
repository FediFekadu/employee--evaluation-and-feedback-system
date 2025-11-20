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
  // Instructors state
  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [instructorsError, setInstructorsError] = useState('');
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [instructorForm, setInstructorForm] = useState({ name: '', email: '', title: '', department_id: '' });
  // Courses state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ department_id: '', course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });

  useEffect(() => {
    if (active !== 'departments' && active !== 'admins' && active !== 'instructors') return;
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

  // Load instructors when viewing the instructors tab
  useEffect(() => {
    if (active !== 'instructors') return;
    let mounted = true;
    async function loadInstructors() {
      setInstructorsLoading(true);
      setInstructorsError('');
      try {
        const res = await api.get('/teachers');
        if (!mounted) return;
        setInstructors(res.data || []);
      } catch (e) {
        if (!mounted) return;
        setInstructorsError('Failed to load instructors');
      } finally {
        if (!mounted) return;
        setInstructorsLoading(false);
      }
    }
    loadInstructors();
    return () => { mounted = false; };
  }, [active]);

  // Load courses when viewing the courses tab
  useEffect(() => {
    if (active !== 'courses') return;
    let mounted = true;
    async function loadCourses() {
      setCoursesLoading(true);
      setCoursesError('');
      try {
        const res = await api.get('/courses');
        if (!mounted) return;
        setCourses(res.data?.data || []);
      } catch (e) {
        if (!mounted) return;
        setCoursesError('Failed to load courses');
      } finally {
        if (!mounted) return;
        setCoursesLoading(false);
      }
    }
    loadCourses();
    return () => { mounted = false; };
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
              <p style={{ color: 'var(--muted)' }}>Create and view instructors across all departments.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => setShowInstructorModal(true)}>Add Instructor</button>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <h4>All Instructors</h4>
                {instructorsLoading && <p style={{ color: 'var(--muted)' }}>Loading instructors…</p>}
                {instructorsError && <p style={{ color: 'red' }}>{instructorsError}</p>}
                {!instructorsLoading && !instructorsError && (
                  <table className="table" style={{ width: '100%', marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Name</th>
                        <th style={{ textAlign: 'left' }}>Email</th>
                        <th style={{ textAlign: 'left' }}>Title</th>
                        <th style={{ textAlign: 'left' }}>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(instructors || []).map((t) => (
                        <tr key={t.id}>
                          <td>{t.name}</td>
                          <td>{t.email}</td>
                          <td>{t.title || '—'}</td>
                          <td>{t.department ? `${t.department.name} (${t.department.code})` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {showInstructorModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
                  <div className="card" style={{ width: 460 }}>
                    <h3>Add Instructor</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input className="btn btn-ghost" placeholder="Name" value={instructorForm.name} onChange={(e) => setInstructorForm((f) => ({ ...f, name: e.target.value }))} />
                      <input className="btn btn-ghost" placeholder="Email" value={instructorForm.email} onChange={(e) => setInstructorForm((f) => ({ ...f, email: e.target.value }))} />
                      <input className="btn btn-ghost" placeholder="Title" value={instructorForm.title} onChange={(e) => setInstructorForm((f) => ({ ...f, title: e.target.value }))} />
                      <label>
                        Department
                        <select className="btn btn-ghost" value={instructorForm.department_id} onChange={(e) => setInstructorForm((f) => ({ ...f, department_id: e.target.value }))}>
                          <option value="">Select department…</option>
                          {departments.map((d) => (
                            <option key={d.id} value={String(d.id)}>{d.name} ({d.code})</option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setShowInstructorModal(false)}>Cancel</button>
                        <button
                          className="btn btn-primary"
                          onClick={async () => {
                            if (!instructorForm.name || !instructorForm.email || !instructorForm.department_id) {
                              alert('Name, email, and department are required');
                              return;
                            }
                            try {
                              const res = await api.post('/teachers', {
                                name: instructorForm.name,
                                email: instructorForm.email,
                                title: instructorForm.title || undefined,
                                department_id: Number(instructorForm.department_id),
                              });
                              setInstructors((prev) => [res.data, ...prev]);
                              setInstructorForm({ name: '', email: '', title: '', department_id: '' });
                              setShowInstructorModal(false);
                              if (res.data?.default_password) {
                                alert(`Instructor added. Default password: ${res.data.default_password}`);
                              }
                            } catch (e) {
                              alert('Failed to add instructor');
                            }
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                <select className="btn btn-ghost" aria-label="Department filter" value={assignForm.department_id} onChange={(e) => setAssignForm((f) => ({ ...f, department_id: e.target.value }))}>
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>{d.name}</option>
                  ))}
                </select>
                <select className="btn btn-ghost" aria-label="Year filter">
                  <option>All Years</option>
                  {[1,2,3,4,5].map((y) => (
                    <option key={y}>Year {y}</option>
                  ))}
                </select>
                <select className="btn btn-ghost" aria-label="Semester filter">
                  <option>All Semesters</option>
                  <option>Semester I</option>
                  <option>Semester II</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary">Add Course</button>
                <button className="btn btn-ghost" onClick={() => setShowAssignModal(true)}>Assign Instructor</button>
                <button className="btn btn-ghost">Edit Course</button>
                <button className="btn btn-ghost">Archive</button>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                {coursesLoading && <p style={{ color: 'var(--muted)' }}>Loading courses…</p>}
                {coursesError && <p style={{ color: 'red' }}>{coursesError}</p>}
                {!coursesLoading && !coursesError && (
                  <table className="table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Course</th>
                        <th style={{ textAlign: 'left' }}>Department</th>
                        <th style={{ textAlign: 'left' }}>Assigned Instructors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses
                        .filter((c) => !assignForm.department_id || String(c.department_id) === String(assignForm.department_id))
                        .map((c) => (
                        <tr key={c.id}>
                          <td>{c.title} ({c.code})</td>
                          <td>{c.department?.name || '-'}</td>
                          <td>
                            {(c.teachers || []).length === 0 && <span style={{ color: 'var(--muted)' }}>—</span>}
                            {(c.teachers || []).length > 0 && (
                              <ul>
                                {c.teachers.map((t) => (
                                  <li key={`${c.id}-${t.id}`}>{t.name} — Year {t?.pivot?.year_level ?? '-'}, {t?.pivot?.semester ?? '-'}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {showAssignModal && (
                <div className="modal-overlay">
                  <div className="modal">
                    <h4>Assign Instructor to Course</h4>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <label>
                        Department
                        <select className="btn btn-ghost" value={assignForm.department_id} onChange={(e) => setAssignForm((f) => ({ ...f, department_id: e.target.value, course_id: '' }))}>
                          <option value="">Select department</option>
                          {departments.map((d) => (
                            <option key={d.id} value={String(d.id)}>{d.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Course
                        <select className="btn btn-ghost" value={assignForm.course_id} onChange={(e) => setAssignForm((f) => ({ ...f, course_id: e.target.value }))}>
                          <option value="">Select course</option>
                          {courses.filter((c) => !assignForm.department_id || String(c.department_id) === String(assignForm.department_id)).map((c) => (
                            <option key={c.id} value={String(c.id)}>{c.title} ({c.code})</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Instructor
                        <select className="btn btn-ghost" value={assignForm.teacher_id} onChange={(e) => setAssignForm((f) => ({ ...f, teacher_id: e.target.value }))}>
                          <option value="">Select instructor</option>
                          {instructors.filter((t) => !assignForm.department_id || String(t.department_id) === String(assignForm.department_id)).map((t) => (
                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <label style={{ flex: 1 }}>
                          Year
                          <select className="btn btn-ghost" value={assignForm.year_level} onChange={(e) => setAssignForm((f) => ({ ...f, year_level: e.target.value }))}>
                            {[1,2,3,4,5].map((y) => (
                              <option key={y} value={String(y)}>Year {y}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ flex: 1 }}>
                          Semester
                          <select className="btn btn-ghost" value={assignForm.semester} onChange={(e) => setAssignForm((f) => ({ ...f, semester: e.target.value }))}>
                            <option value="Semester I">Semester I</option>
                            <option value="Semester II">Semester II</option>
                          </select>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-primary" onClick={async () => {
                          if (!assignForm.course_id || !assignForm.teacher_id) {
                            alert('Select course and instructor');
                            return;
                          }
                          try {
                            const res = await api.post(`/courses/${assignForm.course_id}/assign-teacher`, {
                              teacher_id: Number(assignForm.teacher_id),
                              year_level: Number(assignForm.year_level),
                              semester: assignForm.semester,
                            });
                            const updated = res.data?.course;
                            setCourses((prev) => prev.map((c) => c.id === updated.id ? updated : c));
                            setShowAssignModal(false);
                            setAssignForm({ department_id: '', course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });
                            alert('Instructor assigned');
                          } catch (e) {
                            alert('Failed to assign instructor');
                          }
                        }}>Assign</button>
                        <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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