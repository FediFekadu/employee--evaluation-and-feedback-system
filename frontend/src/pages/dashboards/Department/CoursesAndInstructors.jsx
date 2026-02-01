import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import '../../../styles/courses-instructors.css';
import '../../../styles/courses.css';
import '../../../styles/instructors.css';

function DepartmentCoursesAndInstructors() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

  // Course-related state
  const [courseForm, setCourseForm] = useState({ 
    title: '', 
    code: '', 
    description: '', 
    year_level: '', 
    semester: '', 
    teacher_ids: [] 
  });
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({ course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Instructor-related state
  const [newInstructor, setNewInstructor] = useState({ name: '', email: '', title: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [instructorSaving, setInstructorSaving] = useState(false);
  const [instructorMessage, setInstructorMessage] = useState('');
  const [instructorSearchTerm, setInstructorSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [loadingDetailsId, setLoadingDetailsId] = useState(null);

  // Remove-related state
  const [removeForm, setRemoveForm] = useState({ 
    course_id: '', 
    teacher_id: '', 
    semester: 'Semester I' 
  });
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

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

  const teacherOptions = department?.teachers || [];
  const courseOptions = department?.courses || [];

  // Course filtering logic
  const availableTeachers = useMemo(() => {
    if (!assignForm.course_id || !assignForm.semester) {
      return teacherOptions;
    }
    
    const selectedCourse = courseOptions.find(c => c.id === Number(assignForm.course_id));
    if (!selectedCourse) {
      return teacherOptions;
    }
    
    const assignedTeacherIds = (selectedCourse.teachers || [])
      .filter(teacher => teacher.pivot?.semester === assignForm.semester)
      .map(teacher => teacher.id);
    
    return teacherOptions.filter(teacher => !assignedTeacherIds.includes(teacher.id));
  }, [teacherOptions, courseOptions, assignForm.course_id, assignForm.semester]);

  const filteredCourses = useMemo(() => {
    return courseOptions.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
                           course.code.toLowerCase().includes(courseSearchTerm.toLowerCase());
      const matchesYear = !filterYear || (course.teachers || []).some(t => 
        String(t?.pivot?.year_level) === filterYear
      );
      return matchesSearch && matchesYear;
    });
  }, [courseOptions, courseSearchTerm, filterYear]);

  // Instructor filtering logic
  const filteredInstructors = useMemo(() => {
    return teacherOptions.filter(instructor => 
      instructor.name.toLowerCase().includes(instructorSearchTerm.toLowerCase()) ||
      (instructor.email || '').toLowerCase().includes(instructorSearchTerm.toLowerCase()) ||
      (instructor.title || '').toLowerCase().includes(instructorSearchTerm.toLowerCase())
    );
  }, [teacherOptions, instructorSearchTerm]);

  // Course functions
  const submitCourse = async () => {
    if (!courseForm.title || !courseForm.code) {
      alert('Course title and code are required');
      return;
    }
    setCourseSubmitting(true);
    try {
      const res = await api.post('/courses', {
        department_id: deptId,
        title: courseForm.title,
        code: courseForm.code,
        description: courseForm.description || undefined,
        year_level: courseForm.year_level || undefined,
        semester: courseForm.semester || undefined,
        teacher_ids: courseForm.teacher_ids.map((t) => Number(t)),
      });
      setDepartment((prev) => prev ? { ...prev, courses: [res.data, ...(prev.courses || [])] } : prev);
      setCourseForm({ title: '', code: '', description: '', year_level: '', semester: '', teacher_ids: [] });
      alert('Course created and instructors assigned');
    } catch (e) {
      alert('Failed to create course');
    } finally {
      setCourseSubmitting(false);
    }
  };

  const assignInstructor = async () => {
    if (!assignForm.course_id || !assignForm.teacher_id) {
      alert('Select course and instructor');
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await api.post(`/courses/${assignForm.course_id}/assign-teacher`, {
        teacher_id: Number(assignForm.teacher_id),
        year_level: Number(assignForm.year_level),
        semester: assignForm.semester,
      });
      const updatedCourse = res.data?.course;
      setDepartment((prev) => {
        if (!prev) return prev;
        const courses = (prev.courses || []).map((c) => c.id === updatedCourse.id ? updatedCourse : c);
        return { ...prev, courses };
      });
      setAssignForm({ course_id: '', teacher_id: '', year_level: '1', semester: 'Semester I' });
      alert('Instructor assigned successfully');
    } catch (e) {
      const errorData = e.response?.data;
      if (errorData?.error === 'duplicate_assignment') {
        alert(`Assignment failed: ${errorData.message}`);
      } else if (errorData?.error === 'teacher_already_assigned') {
        alert(`Assignment failed: ${errorData.message}`);
      } else if (errorData?.error === 'department_mismatch') {
        alert(`Assignment failed: ${errorData.message}`);
      } else {
        alert('Failed to assign instructor. Please try again.');
      }
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Remove instructor function
  const removeInstructor = async () => {
    if (!removeForm.course_id || !removeForm.teacher_id) {
      alert('Please select course and instructor to remove');
      return;
    }
    
    setRemoveSubmitting(true);
    try {
      const res = await api.post(`/courses/${removeForm.course_id}/remove-teacher`, {
        teacher_id: Number(removeForm.teacher_id),
        semester: removeForm.semester,
      });
      const updatedCourse = res.data?.course;
      setDepartment((prev) => {
        if (!prev) return prev;
        const courses = (prev.courses || []).map((c) => c.id === updatedCourse.id ? updatedCourse : c);
        return { ...prev, courses };
      });
      setRemoveForm({ 
        course_id: '', 
        teacher_id: '', 
        semester: 'Semester I' 
      });
      alert('Instructor removed successfully');
    } catch (e) {
      const errorData = e.response?.data;
      if (errorData?.error) {
        alert(`Removal failed: ${errorData.message}`);
      } else {
        alert('Failed to remove instructor. Please try again.');
      }
    } finally {
      setRemoveSubmitting(false);
    }
  };

  // Get assigned instructors for selected course and semester
  const getAssignedInstructors = () => {
    if (!removeForm.course_id || !removeForm.semester) return [];
    
    const selectedCourse = courseOptions.find(c => c.id === Number(removeForm.course_id));
    if (!selectedCourse) return [];
    
    return (selectedCourse.teachers || [])
      .filter(teacher => teacher.pivot?.semester === removeForm.semester)
      .map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        year_level: teacher.pivot?.year_level,
        semester: teacher.pivot?.semester
      }));
  };

  // Instructor functions
  const addInstructor = async () => {
    if (!newInstructor.name || !newInstructor.email) {
      setInstructorMessage('Name and email are required');
      return;
    }
    setInstructorSaving(true);
    setInstructorMessage('');
    try {
      const fd = new FormData();
      fd.append('name', newInstructor.name);
      fd.append('email', newInstructor.email);
      if (newInstructor.title) fd.append('title', newInstructor.title);
      fd.append('department_id', String(deptId));
      if (photoFile) fd.append('photo', photoFile);
      const res = await api.post('/teachers', fd);
      setDepartment((prev) => ({
        ...prev,
        teachers: [res.data, ...(prev?.teachers || [])],
      }));
      setNewInstructor({ name: '', email: '', title: '' });
      setPhotoFile(null);
      const pwd = res.data?.default_password;
      setInstructorMessage(pwd ? `✅ Instructor added. Default password: ${pwd}` : '✅ Instructor added successfully');
    } catch (e) {
      const serverMsg = e?.response?.data?.message;
      const errors = e?.response?.data?.errors;
      let detail = '';
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        if (firstKey && errors[firstKey]?.length) detail = ` (${errors[firstKey][0]})`;
      } else if (serverMsg) {
        detail = ` (${serverMsg})`;
      }
      setInstructorMessage(`❌ Failed to add instructor${detail}`);
    } finally {
      setInstructorSaving(false);
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
      <div className="courses-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-dashboard">
        <div className="error-state">
          <div className="error-icon">📚</div>
          <h2>Unable to Load Data</h2>
          <p>{error}</p>
          <button className="dept-btn dept-btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Courses & Instructors</h1>
          <p>Manage courses, instructors, and teaching assignments</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-number">{courseOptions.length}</span>
            <span className="stat-label">Total Courses</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{teacherOptions.length}</span>
            <span className="stat-label">Instructors</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'courses' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <span className="tab-icon">📚</span>
          All Courses
        </button>
        <button 
          className={`tab-button ${activeTab === 'instructors' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('instructors')}
        >
          <span className="tab-icon">👨‍🏫</span>
          All Instructors
        </button>
        <button 
          className={`tab-button ${activeTab === 'create-course' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('create-course')}
        >
          <span className="tab-icon">➕</span>
          Create Course
        </button>
        <button 
          className={`tab-button ${activeTab === 'add-instructor' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('add-instructor')}
        >
          <span className="tab-icon">👤</span>
          Add Instructor
        </button>
        <button 
          className={`tab-button ${activeTab === 'assign' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          <span className="tab-icon">🔗</span>
          Assign to Course
        </button>
        <button 
          className={`tab-button ${activeTab === 'remove' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('remove')}
        >
          <span className="tab-icon">🗑️</span>
          Remove from Course
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'courses' && (
        <div className="tab-content">
          {/* Search and Filter */}
          <div className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search courses by title or code..."
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
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
          </div>

          {/* Courses List */}
          <div className="courses-list-container">
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No Courses Found</h3>
                <p>Start by creating your first course</p>
                <button 
                  className="dept-btn dept-btn-primary"
                  onClick={() => setActiveTab('create-course')}
                >
                  Create Course
                </button>
              </div>
            ) : (
              <div className="courses-list compact-rows">
                {filteredCourses.map((course) => {
                  const teachers = course.teachers || [];
                  const visibleTeachers = teachers.slice(0, 3);
                  const remainingCount = Math.max(0, teachers.length - visibleTeachers.length);
                  return (
                    <div
                      key={course.id}
                      className="course-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        border: '1px solid var(--neutral-200)',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: 'var(--neutral-50)'
                      }}
                    >
                      <div className="course-icon" style={{ fontSize: 18, lineHeight: '18px' }}>📚</div>

                      <div className="course-main-compact" style={{ minWidth: 0 }}>
                        <div className="title-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 className="course-title" style={{ fontSize: 14, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</h3>
                          <span className="course-code-badge" style={{ fontSize: 11, padding: '2px 6px', borderRadius: 10, background: 'var(--neutral-200)', color: 'var(--text-muted)' }}>{course.code}</span>
                        </div>
                        <div className="meta-row" style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {course.year_level && <span>Year {course.year_level}</span>}
                          {course.year_level && course.semester && <span style={{ margin: '0 6px' }}>•</span>}
                          {course.semester && <span>{course.semester}</span>}
                        </div>
                        <div className="teachers-row" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {visibleTeachers.length === 0 ? (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No instructors assigned</span>
                          ) : (
                            visibleTeachers.map((teacher) => (
                              <div key={`${course.id}-${teacher.id}`} className="instructor-chip" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--neutral-200)', borderRadius: 12, padding: '2px 6px', gap: 6 }}>
                                <span
                                  className="avatar"
                                  style={{ width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--neutral-200)', overflow: 'hidden', fontSize: 11, fontWeight: 600 }}
                                >
                                  {teacher.photo_url ? (
                                    <img src={teacher.photo_url} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    (teacher.name || 'U')
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .toUpperCase()
                                  )}
                                </span>
                                <span className="name" style={{ fontSize: 12, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacher.name}</span>
                              </div>
                            ))
                          )}
                          {remainingCount > 0 && (
                            <span className="more-chip" style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{remainingCount} more</span>
                          )}
                        </div>
                      </div>

                      <div className="course-actions compact" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className="status-badge active" style={{ fontSize: 11, padding: '2px 6px' }}>Active</span>
                        <button className="action-btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setActiveTab('assign')}>Assign</button>
                        <button className="action-btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => {
                          setAssignForm(prev => ({ ...prev, course_id: String(course.id) }));
                          setActiveTab('assign');
                        }}>Quick Assign</button>
                        <button 
                          className="action-btn remove" 
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          onClick={() => {
                            if ((course.teachers || []).length > 0) {
                              setRemoveForm(prev => ({ ...prev, course_id: String(course.id) }));
                              setActiveTab('remove');
                            } else {
                              alert('No instructors assigned to this course.');
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div className="tab-content">
          {/* Search Bar */}
          <div className="search-filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search instructors by name, email, or title..."
                value={instructorSearchTerm}
                onChange={(e) => setInstructorSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Instructors Grid */}
          <div className="instructors-grid-container">
            <div className="instructors-grid compact">
            {filteredInstructors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🏫</div>
                <h3>No Instructors Found</h3>
                <p>Start by adding your first instructor</p>
                <button 
                  className="dept-btn dept-btn-primary"
                  onClick={() => setActiveTab('add-instructor')}
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
                        {instructor.photo_url ? (
                          <img src={instructor.photo_url} alt={instructor.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          instructor.name.charAt(0).toUpperCase()
                        )}
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
                        <button 
                          className="action-btn edit" 
                          onClick={() => setActiveTab('courses')}
                          title="View courses"
                        >
                          Courses
                        </button>
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
        </div>
      )}

      {activeTab === 'create-course' && (
        <div className="tab-content">
          <div className="form-section">
            <div className="form-header">
              <h2>Create New Course</h2>
              <p>Add a new course to the department curriculum</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g., Introduction to Computer Science"
                  value={courseForm.title} 
                  onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g., CS101"
                  value={courseForm.code} 
                  onChange={(e) => setCourseForm((f) => ({ ...f, code: e.target.value }))} 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Year Level</label>
                <select 
                  className="form-select" 
                  value={courseForm.year_level} 
                  onChange={(e) => setCourseForm((f) => ({ ...f, year_level: e.target.value }))}
                >
                  <option value="">Select Year Level</option>
                  {[1,2,3,4,5].map((y) => (
                    <option key={y} value={String(y)}>Year {y}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select 
                  className="form-select" 
                  value={courseForm.semester} 
                  onChange={(e) => setCourseForm((f) => ({ ...f, semester: e.target.value }))}
                >
                  <option value="">Select Semester</option>
                  <option value="Semester I">Semester I</option>
                  <option value="Semester II">Semester II</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Course description and objectives..."
                  value={courseForm.description} 
                  onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                  rows="4"
                />
              </div>
              
              <div className="form-group full-width">
                <label className="form-label">Assign Instructors</label>
                <select 
                  className="form-select" 
                  multiple 
                  size={Math.min(6, Math.max(3, teacherOptions.length))} 
                  value={courseForm.teacher_ids} 
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setCourseForm((f) => ({ ...f, teacher_ids: opts }));
                  }}
                >
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                <small className="form-hint">Hold Ctrl/Cmd to select multiple instructors</small>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-primary" 
                onClick={submitCourse} 
                disabled={courseSubmitting}
              >
                {courseSubmitting ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Creating...
                  </>
                ) : (
                  'Create Course'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'add-instructor' && (
        <div className="tab-content">
          <div className="form-section">
            <div className="form-header">
              <h2>Add New Instructor</h2>
              <p>Add a new faculty member to the department</p>
            </div>
            
            {instructorMessage && (
              <div className={`form-message ${instructorMessage.includes('❌') ? 'error' : 'success'}`}>
                {instructorMessage}
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
              <div className="form-group full-width">
                <label className="form-label">Instructor Photo</label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
                <small className="form-hint">Optional: Upload a profile picture (JPEG/PNG/WebP/GIF, up to 8 MB)</small>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-ghost"
                onClick={() => {
                  setNewInstructor({ name: '', email: '', title: '' });
                  setPhotoFile(null);
                  setInstructorMessage('');
                }}
              >
                Clear Form
              </button>
              <button 
                className="dept-btn dept-btn-primary" 
                onClick={addInstructor} 
                disabled={instructorSaving}
              >
                {instructorSaving ? (
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

      {activeTab === 'assign' && (
        <div className="tab-content">
          <div className="form-section">
            <div className="form-header">
              <h2>Assign Instructor to Course</h2>
              <p>Assign instructors to specific courses for different years and semesters</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select 
                  className="form-select" 
                  value={assignForm.course_id} 
                  onChange={(e) => setAssignForm((f) => ({ ...f, course_id: e.target.value, teacher_id: '' }))}
                >
                  <option value="">Select course</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select 
                  className="form-select" 
                  value={assignForm.semester} 
                  onChange={(e) => setAssignForm((f) => ({ ...f, semester: e.target.value, teacher_id: '' }))}
                >
                  <option value="Semester I">Semester I</option>
                  <option value="Semester II">Semester II</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Instructor *</label>
                <select 
                  className="form-select" 
                  value={assignForm.teacher_id} 
                  onChange={(e) => setAssignForm((f) => ({ ...f, teacher_id: e.target.value }))}
                  disabled={!assignForm.course_id || !assignForm.semester}
                >
                  <option value="">
                    {!assignForm.course_id || !assignForm.semester 
                      ? 'Select course and semester first' 
                      : availableTeachers.length === 0 
                        ? 'No available instructors for this course/semester'
                        : 'Select instructor'
                    }
                  </option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {assignForm.course_id && assignForm.semester && availableTeachers.length === 0 && (
                  <small className="form-hint error">
                    All instructors are already assigned to this course for {assignForm.semester}
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">Year Level *</label>
                <select 
                  className="form-select" 
                  value={assignForm.year_level} 
                  onChange={(e) => setAssignForm((f) => ({ ...f, year_level: e.target.value }))}
                >
                  {[1,2,3,4,5].map((y) => (
                    <option key={y} value={String(y)}>Year {y}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-primary" 
                disabled={assignSubmitting || !assignForm.course_id || !assignForm.teacher_id || availableTeachers.length === 0} 
                onClick={assignInstructor}
              >
                {assignSubmitting ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Assigning...
                  </>
                ) : (
                  'Assign Instructor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'remove' && (
        <div className="tab-content">
          <div className="form-section">
            <div className="form-header">
              <h2>Remove Instructor from Course</h2>
              <p>Remove instructor assignments from specific courses</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select 
                  className="form-select" 
                  value={removeForm.course_id} 
                  onChange={(e) => {
                    setRemoveForm((f) => ({ 
                      ...f, 
                      course_id: e.target.value, 
                      teacher_id: '' 
                    }));
                  }}
                >
                  <option value="">Select course</option>
                  {courseOptions.filter(c => (c.teachers || []).length > 0).map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select 
                  className="form-select" 
                  value={removeForm.semester} 
                  onChange={(e) => {
                    setRemoveForm((f) => ({ 
                      ...f, 
                      semester: e.target.value, 
                      teacher_id: '' 
                    }));
                  }}
                >
                  <option value="Semester I">Semester I</option>
                  <option value="Semester II">Semester II</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Instructor to Remove *</label>
                <select 
                  className="form-select" 
                  value={removeForm.teacher_id} 
                  onChange={(e) => setRemoveForm((f) => ({ ...f, teacher_id: e.target.value }))}
                  disabled={!removeForm.course_id || !removeForm.semester}
                >
                  <option value="">
                    {!removeForm.course_id || !removeForm.semester 
                      ? 'Select course and semester first' 
                      : getAssignedInstructors().length === 0 
                        ? 'No instructors assigned for this course/semester'
                        : 'Select instructor to remove'
                    }
                  </option>
                  {getAssignedInstructors().map((instructor) => (
                    <option key={instructor.id} value={String(instructor.id)}>
                      {instructor.name} (Year {instructor.year_level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {removeForm.course_id && removeForm.teacher_id && (
              <div className="remove-preview">
                <h3>Removal Preview</h3>
                <div className="preview-card warning">
                  <div className="preview-row">
                    <span className="preview-label">Course:</span>
                    <span className="preview-value">
                      {courseOptions.find(c => c.id === Number(removeForm.course_id))?.title} 
                      ({courseOptions.find(c => c.id === Number(removeForm.course_id))?.code})
                    </span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">Semester:</span>
                    <span className="preview-value">{removeForm.semester}</span>
                  </div>
                  <div className="preview-row">
                    <span className="preview-label">Instructor to Remove:</span>
                    <span className="preview-value remove">
                      {getAssignedInstructors().find(i => i.id === Number(removeForm.teacher_id))?.name}
                      {' '}(Year {getAssignedInstructors().find(i => i.id === Number(removeForm.teacher_id))?.year_level})
                    </span>
                  </div>
                  <div className="warning-message">
                    <span className="warning-icon">⚠️</span>
                    <span>This action will remove the instructor's assignment from this course. This cannot be undone.</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-ghost"
                onClick={() => {
                  setRemoveForm({ 
                    course_id: '', 
                    teacher_id: '', 
                    semester: 'Semester I' 
                  });
                }}
              >
                Clear Form
              </button>
              <button 
                className="dept-btn dept-btn-danger" 
                disabled={removeSubmitting || !removeForm.course_id || !removeForm.teacher_id || getAssignedInstructors().length === 0} 
                onClick={removeInstructor}
              >
                {removeSubmitting ? (
                  <>
                    <span className="loading-spinner small"></span>
                    Removing...
                  </>
                ) : (
                  'Remove Instructor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentCoursesAndInstructors;