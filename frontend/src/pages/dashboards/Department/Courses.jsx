import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentCourses() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('courses');

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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');

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

  const filteredCourses = useMemo(() => {
    return courseOptions.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = !filterYear || (course.teachers || []).some(t => 
        String(t?.pivot?.year_level) === filterYear
      );
      return matchesSearch && matchesYear;
    });
  }, [courseOptions, searchTerm, filterYear]);

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
      alert('Instructor assigned');
    } catch (e) {
      alert('Failed to assign instructor');
    } finally {
      setAssignSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="courses-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-dashboard">
        <div className="error-state">
          <div className="error-icon">📚</div>
          <h2>Unable to Load Courses</h2>
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
          <h1>Course Management</h1>
          <p>Manage courses, assignments, and instructor allocations</p>
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
          className={`tab-button ${activeTab === 'create' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <span className="tab-icon">➕</span>
          Create Course
        </button>
        <button 
          className={`tab-button ${activeTab === 'assign' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          <span className="tab-icon">👨‍🏫</span>
          Assign Instructor
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
          </div>

          {/* Courses Grid */}
          <div className="courses-grid">
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h3>No Courses Found</h3>
                <p>Start by creating your first course</p>
                <button 
                  className="dept-btn dept-btn-primary"
                  onClick={() => setActiveTab('create')}
                >
                  Create Course
                </button>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-header">
                    <div className="course-info">
                      <h3 className="course-title">{course.title}</h3>
                      <span className="course-code">{course.code}</span>
                      {(course.year_level || course.semester) && (
                        <div className="course-meta">
                          {course.year_level && <span className="meta-badge">Year {course.year_level}</span>}
                          {course.semester && <span className="meta-badge">{course.semester}</span>}
                        </div>
                      )}
                    </div>
                    <div className="course-status">
                      <span className="status-badge active">Active</span>
                    </div>
                  </div>
                  
                  {course.description && (
                    <p className="course-description">{course.description}</p>
                  )}
                  
                  <div className="course-instructors">
                    <h4>Assigned Instructors</h4>
                    {(course.teachers || []).length === 0 ? (
                      <p className="no-instructors">No instructors assigned</p>
                    ) : (
                      <div className="instructor-list">
                        {(course.teachers || []).map((teacher) => (
                          <div key={`${course.id}-${teacher.id}`} className="instructor-item">
                            <div className="instructor-info">
                              <span className="instructor-name">{teacher.name}</span>
                              <span className="instructor-details">
                                Year {teacher?.pivot?.year_level || '-'} • {teacher?.pivot?.semester || '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'create' && (
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
                  onChange={(e) => setAssignForm((f) => ({ ...f, course_id: e.target.value }))}
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
                <label className="form-label">Instructor *</label>
                <select 
                  className="form-select" 
                  value={assignForm.teacher_id} 
                  onChange={(e) => setAssignForm((f) => ({ ...f, teacher_id: e.target.value }))}
                >
                  <option value="">Select instructor</option>
                  {teacherOptions.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
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
              
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select 
                  className="form-select" 
                  value={assignForm.semester} 
                  onChange={(e) => setAssignForm((f) => ({ ...f, semester: e.target.value }))}
                >
                  <option value="Semester I">Semester I</option>
                  <option value="Semester II">Semester II</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-primary" 
                disabled={assignSubmitting} 
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
    </div>
  );
}

export default DepartmentCourses;