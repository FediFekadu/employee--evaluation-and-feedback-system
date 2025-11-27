import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentInstructors() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newInstructor, setNewInstructor] = useState({ name: '', email: '', title: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api
      .get(`/departments/${deptId}`)
      .then((res) => { if (mounted) setDepartment(res.data); })
      .catch(() => { if (mounted) setError('Failed to load department'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [deptId]);

  const addInstructor = async () => {
    if (!newInstructor.name || !newInstructor.email) {
      alert('Name and email are required');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await api.post('/teachers', {
        name: newInstructor.name,
        email: newInstructor.email,
        title: newInstructor.title || undefined,
        department_id: deptId,
      });
      setDepartment((prev) => ({
        ...prev,
        teachers: [res.data, ...(prev?.teachers || [])],
      }));
      setNewInstructor({ name: '', email: '', title: '' });
      const pwd = res.data?.default_password;
      setMessage(pwd ? `Instructor added. Default password: ${pwd}` : 'Instructor added successfully');
    } catch (e) {
      alert('Failed to add instructor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;

  return (
    <div className="dept-card">
      <h3>Manage Instructors</h3>
      <p style={{ color: 'var(--muted)' }}>View and manage department instructors. Add/update requires backend endpoints.</p>

      <div className="dept-card" style={{ marginTop: 8 }}>
        <h4>Instructors</h4>
        {(department.teachers || []).length === 0 && <p style={{ color: 'var(--muted)' }}>No instructors found.</p>}
        {(department.teachers || []).length > 0 && (
          <ul>
            {department.teachers.map((t) => (
              <li key={t.id}>{t.name} ({t.email || '—'})</li>
            ))}
          </ul>
        )}
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Add Instructor</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          <input className="dept-input" placeholder="Name" value={newInstructor.name} onChange={(e) => setNewInstructor((f) => ({ ...f, name: e.target.value }))} />
          <input className="dept-input" placeholder="Email" value={newInstructor.email} onChange={(e) => setNewInstructor((f) => ({ ...f, email: e.target.value }))} />
          <input className="dept-input" placeholder="Title" value={newInstructor.title} onChange={(e) => setNewInstructor((f) => ({ ...f, title: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="dept-btn dept-btn-primary" onClick={addInstructor} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
          {message && <p style={{ color: 'var(--muted)' }}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default DepartmentInstructors;