import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentStudents() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newStudent, setNewStudent] = useState({ name: '', student_id: '', year_level: '1', semester: 'Semester I', default_password: '' });
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

  const studentList = department?.students || [];

  const semesterLabel = (s) => (s === 1 ? 'Semester I' : s === 2 ? 'Semester II' : String(s || 'Unknown'));
  const groupedStudents = useMemo(() => {
    const groups = {};
    studentList.forEach((s) => {
      const y = Number(s.year_level ?? NaN);
      const semNum = Number(s.semester ?? NaN);
      const key = `${isNaN(y) ? 'Unknown' : y}__${isNaN(semNum) ? 'Unknown' : semNum}`;
      if (!groups[key]) groups[key] = { year: y, semester: semNum, items: [] };
      groups[key].items.push(s);
    });
    Object.values(groups).forEach((g) => g.items.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))));
    const order = Object.values(groups).sort((a, b) => {
      const ya = Number(a.year ?? 999);
      const yb = Number(b.year ?? 999);
      if (ya !== yb) return ya - yb;
      const sa = Number(a.semester ?? 3);
      const sb = Number(b.semester ?? 3);
      return sa - sb;
    });
    return order;
  }, [studentList]);

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.student_id) {
      alert('Name and Student ID are required');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: newStudent.name,
        student_id: newStudent.student_id,
        year_level: Number(newStudent.year_level),
        semester: newStudent.semester === 'Semester II' ? 2 : 1,
        default_password: newStudent.default_password || 'student123',
      };
      const res = await api.post(`/departments/${deptId}/students`, payload);
      const created = res.data?.student || res.data;
      setDepartment((prev) => ({
        ...prev,
        students: [created, ...(prev?.students || [])],
      }));
      setNewStudent({ name: '', student_id: '', year_level: '1', semester: 'Semester I', default_password: '' });
      const shownPwd = payload.default_password;
      setMessage(shownPwd ? `Student added. Default password: ${shownPwd}` : 'Student added successfully');
    } catch (e) {
      alert('Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  const updateStudentYearSemester = async (s, newYear, newSem) => {
    try {
      const res = await api.put(`/students/${s.id}`, { year_level: newYear, semester: newSem });
      const updated = res.data;
      setDepartment((prev) => {
        if (!prev) return prev;
        const students = (prev.students || []).map((st) => st.id === s.id ? { ...st, year_level: updated.year_level, semester: updated.semester } : st);
        return { ...prev, students };
      });
      alert('Student updated');
    } catch (e) {
      alert('Failed to update student');
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;

  return (
    <div className="dept-card">
      <h3>Manage Students</h3>
      <p style={{ color: 'var(--muted)' }}>Add, group, and edit students by year and semester.</p>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="dept-btn dept-btn-primary" onClick={addStudent} disabled={saving}>{saving ? 'Saving…' : 'Add Student'}</button>
        <label className="dept-btn dept-btn-ghost" style={{ cursor: 'pointer' }}>
          Upload Excel
          <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={() => alert('Upload handling coming soon')} />
        </label>
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>New Student</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          <input className="dept-input" placeholder="Name" value={newStudent.name} onChange={(e) => setNewStudent((f) => ({ ...f, name: e.target.value }))} />
          <input className="dept-input" placeholder="Student ID" value={newStudent.student_id} onChange={(e) => setNewStudent((f) => ({ ...f, student_id: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1 }}>
              Year
              <select className="dept-select" value={newStudent.year_level} onChange={(e) => setNewStudent((f) => ({ ...f, year_level: e.target.value }))}>
                {[1,2,3,4,5].map((y) => (
                  <option key={y} value={String(y)}>Year {y}</option>
                ))}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Semester
              <select className="dept-select" value={newStudent.semester} onChange={(e) => setNewStudent((f) => ({ ...f, semester: e.target.value }))}>
                <option value="Semester I">Semester I</option>
                <option value="Semester II">Semester II</option>
              </select>
            </label>
          </div>
          <input className="dept-input" placeholder="Default password (optional)" value={newStudent.default_password} onChange={(e) => setNewStudent((f) => ({ ...f, default_password: e.target.value }))} />
          {message && <p style={{ color: 'var(--muted)' }}>{message}</p>}
          <p style={{ color: 'var(--muted)' }}>If left blank, default password is <strong>student123</strong>.</p>
        </div>
      </div>

      <div className="dept-card" style={{ marginTop: 12 }}>
        <h4>Students by Year & Semester</h4>
        {groupedStudents.length === 0 && <p style={{ color: 'var(--muted)' }}>No students found.</p>}
        {groupedStudents.length > 0 && (
          groupedStudents.map((grp) => (
            <div key={`${grp.year}-${grp.semester}`} className="dept-card" style={{ marginTop: 8 }}>
              <h5>Year {grp.year ?? 'Unknown'}, {semesterLabel(grp.semester)}</h5>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th align="left">Name</th>
                    <th align="left">Student ID</th>
                    <th align="left">Year</th>
                    <th align="left">Semester</th>
                    <th align="left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grp.items.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.student_id}</td>
                      <td>
                        <select className="dept-select" defaultValue={String(s.year_level || '')} onChange={(e) => { s.__editYear = e.target.value; }}>
                          {[1,2,3,4,5].map((y) => (
                            <option key={y} value={String(y)}>Year {y}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select className="dept-select" defaultValue={Number(s.semester ?? 1)} onChange={(e) => { s.__editSem = Number(e.target.value); }}>
                          <option value={1}>Semester I</option>
                          <option value={2}>Semester II</option>
                        </select>
                      </td>
                      <td>
                        <button className="dept-btn dept-btn-ghost" onClick={() => {
                          const newYear = Number(s.__editYear ?? s.year_level);
                          const newSem = Number(s.__editSem ?? s.semester);
                          updateStudentYearSemester(s, newYear, newSem);
                        }}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DepartmentStudents;