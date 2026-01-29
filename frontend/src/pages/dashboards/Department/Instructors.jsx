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
  const [expandedId, setExpandedId] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [loadingDetailsId, setLoadingDetailsId] = useState(null);

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

  const loadInstructorDetails = async (instructorId) => {
    if (detailsById[instructorId]) return;
    setLoadingDetailsId(instructorId);
    try {
      const res = await api.get(`/teachers/${instructorId}`);
      setDetailsById((prev) => ({ ...prev, [instructorId]: res.data }));
    } catch (e) {
      // Silently fail in UI; counts will show as 0/—
    } finally {
      setLoadingDetailsId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    loadInstructorDetails(id);
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

          {/* Instructors Grid (Compact, responsive) */}
          <div className="instructors-grid compact">
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
              filteredInstructors.map((instructor) => {
                const details = detailsById[instructor.id];
                const coursesCount = details?.courses?.length ?? instructor.courses?.length ?? '—';
                const evaluationsCount = details?.evaluations?.length ?? instructor.evaluations?.length ?? '—';

                return (
                  <div key={instructor.id} className={`instructor-card compact ${expandedId === instructor.id ? 'expanded' : ''}`}>
                    <div className="card-top">
                      <div className="instructor-avatar small">
                        {instructor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="instructor-info">
                        <div className="name-row">
                          <span className="instructor-name">{instructor.name}</span>
                          {instructor.title && (
                            <span className="title-badge">{instructor.title}</span>
                          )}
                        </div>
                        <div className="meta-row">
                          <span
                            className="email-text"
                            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {instructor.email || '—'}
                          </span>
                        </div>
                      </div>
                      <div className="compact-stats">
                        <div className="stat-chip">
                          <span className="label">Courses</span>
                          <span className="value">{coursesCount}</span>
                          {loadingDetailsId === instructor.id && <span className="loading-dot" style={{ color: 'var(--text-muted)', marginLeft: 2 }}>•</span>}
                        </div>
                        <div className="stat-chip">
                          <span className="label">Evaluations</span>
                          <span className="value">{evaluationsCount}</span>
                          {loadingDetailsId === instructor.id && <span className="loading-dot" style={{ color: 'var(--text-muted)', marginLeft: 2 }}>•</span>}
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          className="action-btn view"
                          onClick={() => toggleExpand(instructor.id)}
                          title={expandedId === instructor.id ? 'Hide details' : 'View details'}
                        >
                          {expandedId === instructor.id ? 'Hide' : 'Details'}
                        </button>
                        <button className="action-btn edit" title="Edit instructor">Edit</button>
                      </div>
                    </div>

                    {expandedId === instructor.id && (
                      <div className="card-details">
                        {loadingDetailsId === instructor.id && !details && (
                          <div className="loading-inline">
                            <span className="loading-spinner small"></span>
                            Loading details...
                          </div>
                        )}

                        {details && (
                          <>
                            <div className="courses-list">
                              <div className="section-title">Assigned Courses</div>
                              {details.courses?.length ? (
                                <div className="course-list">
                                  {details.courses.map((course) => (
                                    <div key={course.id} className="course-list-item">
                                      {course.code} • {course.title}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="empty-inline">No courses assigned</div>
                              )}
                            </div>

                            <div className="evaluations-summary">
                              <div className="section-title">Evaluations</div>
                              <div className="summary-row">
                                {(() => {
                                  const evals = details.evaluations || [];
                                  const today = new Date();
                                  const openCount = evals.filter(e => {
                                    const opened = e.opened_at ? new Date(e.opened_at) : null;
                                    const closed = e.closed_at ? new Date(e.closed_at) : null;
                                    return opened && opened <= today && (!closed || closed >= today);
                                  }).length;
                                  const closedCount = evals.length - openCount;
                                  return (
                                    <>
                                      <div className="summary-chip">Total <span className="value">{evals.length}</span></div>
                                      <div className="summary-chip">Open <span className="value">{openCount}</span></div>
                                      <div className="summary-chip">Closed <span className="value">{closedCount}</span></div>
                                    </>
                                  );
                                })()}
                                <a className="summary-link" href={`/department/${deptId}/results`}>
                                  View Results
                                </a>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
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