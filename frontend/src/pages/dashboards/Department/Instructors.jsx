import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentInstructors() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('instructors');

  const [newInstructor, setNewInstructor] = useState({ name: '', email: '', title: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const instructors = department?.teachers || [];

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => 
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (instructor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (instructor.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [instructors, searchTerm]);

  const addInstructor = async () => {
    if (!newInstructor.name || !newInstructor.email) {
      setMessage('Name and email are required');
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
      setMessage(pwd ? `✅ Instructor added. Default password: ${pwd}` : '✅ Instructor added successfully');
      setActiveTab('instructors');
    } catch (e) {
      setMessage('❌ Failed to add instructor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="instructors-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading instructors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructors-dashboard">
        <div className="error-state">
          <div className="error-icon">👨‍🏫</div>
          <h2>Unable to Load Instructors</h2>
          <p>{error}</p>
          <button className="dept-btn dept-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="instructors-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Instructor Management</h1>
          <p>Manage department faculty and teaching staff</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-number">{instructors.length}</span>
            <span className="stat-label">Total Instructors</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{instructors.filter(i => i.title).length}</span>
            <span className="stat-label">With Titles</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'instructors' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('instructors')}
        >
          <span className="tab-icon">👨‍🏫</span>
          All Instructors
        </button>
        <button 
          className={`tab-button ${activeTab === 'add' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <span className="tab-icon">➕</span>
          Add Instructor
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'instructors' && (
        <div className="tab-content">
          {/* Search Bar */}
          <div className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search instructors by name, email, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Instructors Grid */}
          <div className="instructors-grid">
            {filteredInstructors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🏫</div>
                <h3>No Instructors Found</h3>
                <p>Start by adding your first instructor</p>
                <button 
                  className="dept-btn dept-btn-primary"
                  onClick={() => setActiveTab('add')}
                >
                  Add Instructor
                </button>
              </div>
            ) : (
              filteredInstructors.map((instructor) => (
                <div key={instructor.id} className="instructor-card">
                  <div className="instructor-avatar">
                    {instructor.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="instructor-info">
                    <h3 className="instructor-name">{instructor.name}</h3>
                    {instructor.title && (
                      <span className="instructor-title">{instructor.title}</span>
                    )}
                    <div className="instructor-contact">
                      <div className="contact-item">
                        <span className="contact-icon">📧</span>
                        <span className="contact-text">{instructor.email || 'No email'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="instructor-actions">
                    <button className="action-btn edit">
                      <span>✏️</span>
                      Edit
                    </button>
                    <button className="action-btn view">
                      <span>👁️</span>
                      View
                    </button>
                  </div>
                  
                  <div className="instructor-stats">
                    <div className="stat-item">
                      <span className="stat-value">
                        {(instructor.courses || []).length}
                      </span>
                      <span className="stat-label">Courses</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {(instructor.evaluations || []).length}
                      </span>
                      <span className="stat-label">Evaluations</span>
                    </div>
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
              <h2>Add New Instructor</h2>
              <p>Add a new faculty member to the department</p>
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
                  placeholder="e.g., Dr. John Smith"
                  value={newInstructor.name} 
                  onChange={(e) => setNewInstructor((f) => ({ ...f, name: e.target.value }))} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  className="form-input" 
                  type="email"
                  placeholder="e.g., john.smith@university.edu"
                  value={newInstructor.email} 
                  onChange={(e) => setNewInstructor((f) => ({ ...f, email: e.target.value }))} 
                />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Academic Title</label>
                <input 
                  className="form-input" 
                  placeholder="e.g., Professor, Associate Professor, Assistant Professor"
                  value={newInstructor.title} 
                  onChange={(e) => setNewInstructor((f) => ({ ...f, title: e.target.value }))} 
                />
                <small className="form-hint">Optional: Academic rank or position title</small>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-ghost"
                onClick={() => {
                  setNewInstructor({ name: '', email: '', title: '' });
                  setMessage('');
                }}
              >
                Clear Form
              </button>
              <button 
                className="dept-btn dept-btn-primary" 
                onClick={addInstructor} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Adding...
                  </>
                ) : (
                  'Add Instructor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentInstructors;