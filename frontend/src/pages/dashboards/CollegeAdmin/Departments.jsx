import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function CollegeAdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [deptEditForm, setDeptEditForm] = useState({ name: '', code: '' });

  useEffect(() => {
    let mounted = true;
    setDeptLoading(true);
    setDeptError('');
    api
      .get('/departments')
      .then((res) => { if (mounted) setDepartments(res.data || []); })
      .catch(() => { if (mounted) setDeptError('Failed to load departments'); })
      .finally(() => { if (mounted) setDeptLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
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
      {deptLoading && <LoadingSpinner size="small" showMessage={false} showElapsed={false} />}
      {deptError && <p style={{ color: 'red' }}>{deptError}</p>}

      <div className="card" style={{ marginTop: 16 }}>
        <h4>Departments List</h4>
        {deptLoading ? (
          <LoadingSpinner size="small" showMessage={false} showElapsed={false} />
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
  );
}

export default CollegeAdminDepartments;