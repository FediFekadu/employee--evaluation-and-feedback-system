import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentStudents() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('students');

  const [newStudent, setNewStudent] = useState({ name: '', student_id: '', year_level: '1', semester: 'Semester I', default_password: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

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
  
  const filteredStudents = useMemo(() => {
    return studentList.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (student.student_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = !filterYear || String(student.year_level) === filterYear;
      const matchesSemester = !filterSemester || String(student.semester) === filterSemester;
      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [studentList, searchTerm, filterYear, filterSemester]);

  const groupedStudents = useMemo(() => {
    const groups = {};
    filteredStudents.forEach((s) => {
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
  }, [filteredStudents]);

  const addStudent = async () => {
    if (!newStudent.name || !newStudent.student_id) {
      setMessage('Name and Student ID are required');
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
      setMessage(shownPwd ? `✅ Student added. Default password: ${shownPwd}` : '✅ Student added successfully');
      setActiveTab('students');
    } catch (e) {
      setMessage('❌ Failed to add student');
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
      alert('Student updated successfully');
    } catch (e) {
      alert('Failed to update student');
    }
  };

  if (loading) {
    return (
      <div className="students-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="students-dashboard">
        <div className="error-state">
          <div className="error-icon">👨‍🎓</div>
          <h2>Unable to Load Students</h2>
          <p>{error}</p>
          <button className="dept-btn dept-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="students-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Student Management</h1>
          <p>Manage student enrollment and academic information</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-number">{studentList.length}</span>
            <span className="stat-label">Total Students</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{groupedStudents.length}</span>
            <span className="stat-label">Year Groups</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'students' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <span className="tab-icon">👨‍🎓</span>
          All Students
        </button>
        <button 
          className={`tab-button ${activeTab === 'add' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <span className="tab-icon">➕</span>
          Add Student
        </button>
        <button 
          className={`tab-button ${activeTab === 'bulk' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <span className="tab-icon">📊</span>
          Bulk Import
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <div className="tab-content">
          {/* Search and Filter */}
          <div className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search students by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select 
              className="filter-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All Years</option>
              {[1,2,3,4,5].map(year => (
                <option key={year} value={String(year)}>Year {year}</option>
              ))}
            </select>
            <select 
              className="filter-select"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester I</option>
              <option value="2">Semester II</option>
            </select>
          </div>

          {/* Students by Year Groups */}
          <div className="students-groups">
            {groupedStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🎓</div>
                <h3>No Students Found</h3>
                <p>Start by adding your first student</p>
                <button 
                  className="dept-btn dept-btn-primary"
                  onClick={() => setActiveTab('add')}
                >
                  Add Student
                </button>
              </div>
            ) : (
              groupedStudents.map((group) => (
                <div key={`${group.year}-${group.semester}`} className="student-group">
                  <div className="group-header">
                    <h3>Year {group.year ?? 'Unknown'} - {semesterLabel(group.semester)}</h3>
                    <span className="group-count">{group.items.length} students</span>
                  </div>
                  
                  <div className="students-table-container">
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student ID</th>
                          <th>Year</th>
                          <th>Semester</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <div className="student-info">
                                <div className="student-avatar">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="student-name">{student.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="student-id">{student.student_id}</span>
                            </td>
                            <td>
                              <select 
                                className="table-select" 
                                defaultValue={String(student.year_level || '')} 
                                onChange={(e) => { student.__editYear = e.target.value; }}
                              >
                                {[1,2,3,4,5].map((y) => (
                                  <option key={y} value={String(y)}>Year {y}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select 
                                className="table-select" 
                                defaultValue={Number(student.semester ?? 1)} 
                                onChange={(e) => { student.__editSem = Number(e.target.value); }}
                              >
                                <option value={1}>Semester I</option>
                                <option value={2}>Semester II</option>
                              </select>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button 
                                  className="action-btn save"
                                  onClick={() => {
                                    const newYear = Number(student.__editYear ?? student.year_level);
                                    const newSem = Number(student.__editSem ?? student.semester);
                                    updateStudentYearSemester(student, newYear, newSem);
                                  }}
                                >
                                  💾 Save
                                </button>
                                <button className="action-btn edit">
                                  ✏️ Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="tab-content">
          <div className="form-section">
            <div className="form-header">
              <h2>Add New Student</h2>
              <p>Register a new student in the department</p>
            </div>
            
            {message && (
              <div className={`form-message ${message.includes('❌') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g., John Doe"
                  value={newStudent.name} 
                  onChange={(e) => setNewStudent((f) => ({ ...f, name: e.target.value }))} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g., STU2024001"
                  value={newStudent.student_id} 
                  onChange={(e) => setNewStudent((f) => ({ ...f, student_id: e.target.value }))} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Year Level *</label>
                <select 
                  className="form-select" 
                  value={newStudent.year_level} 
                  onChange={(e) => setNewStudent((f) => ({ ...f, year_level: e.target.value }))}
                >
                  {[1,2,3,4,5].map((y) => (
                    <option key={y} value={String(y)}>Year {y}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select 
                  className="form-select" 
                  value={newStudent.semester} 
                  onChange={(e) => setNewStudent((f) => ({ ...f, semester: e.target.value }))}
                >
                  <option value="Semester I">Semester I</option>
                  <option value="Semester II">Semester II</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Default Password</label>
                <input 
                  className="form-input" 
                  type="password"
                  placeholder="Leave blank for default (student123)"
                  value={newStudent.default_password} 
                  onChange={(e) => setNewStudent((f) => ({ ...f, default_password: e.target.value }))} 
                />
                <small className="form-hint">If left blank, default password will be "student123"</small>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-ghost"
                onClick={() => {
                  setNewStudent({ name: '', student_id: '', year_level: '1', semester: 'Semester I', default_password: '' });
                  setMessage('');
                }}
              >
                Clear Form
              </button>
              <button 
                className="dept-btn dept-btn-primary" 
                onClick={addStudent} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Adding...
                  </>
                ) : (
                  'Add Student'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="tab-content">
          <div className="form-section">
            <div className="form-header">
              <h2>Bulk Import Students</h2>
              <p>Upload a CSV or Excel file to add multiple students at once</p>
            </div>
            
            <div className="upload-area">
              <div className="upload-icon">📊</div>
              <h3>Upload Student Data</h3>
              <p>Drag and drop your file here, or click to browse</p>
              <input 
                type="file" 
                accept=".xlsx,.csv" 
                style={{ display: 'none' }} 
                onChange={() => alert('Bulk upload feature coming soon')} 
              />
              <button className="dept-btn dept-btn-primary">
                Choose File
              </button>
            </div>
            
            <div className="upload-instructions">
              <h4>File Format Requirements:</h4>
              <ul>
                <li>Supported formats: CSV, Excel (.xlsx)</li>
                <li>Required columns: Name, Student ID, Year Level, Semester</li>
                <li>Optional columns: Default Password</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentStudents;