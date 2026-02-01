import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/ErrorHandling/LoadingSpinner';

function CollegeAdminAdmins() {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState('');

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', department_id: '' });

  useEffect(() => {
    let mounted = true;
    setDeptLoading(true);
    setDeptError('');
    api
      .get('/departments')
      .then((res) => {
        if (!mounted) return;
        const list = res.data || [];
        setDepartments(list);
        if (!selectedDeptId && list.length) setSelectedDeptId(String(list[0].id));
      })
      .catch(() => { if (mounted) setDeptError('Failed to load departments'); })
      .finally(() => { if (mounted) setDeptLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <section className="card">
      <h3>Department Admins</h3>
      <p style={{ color: 'var(--muted)' }}>Create department admins and assign to a department.</p>

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

      {deptLoading && <LoadingSpinner size="small" showMessage={false} showElapsed={false} />}
      {deptError && <p style={{ color: 'red' }}>{deptError}</p>}

      <div className="card" style={{ marginTop: 16 }}>
        <h4>Assigned Department Admins</h4>
        {adminsLoading && <LoadingSpinner size="small" showMessage={false} showElapsed={false} />}
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
  );
}

export default CollegeAdminAdmins;