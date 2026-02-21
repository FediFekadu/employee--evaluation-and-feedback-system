import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import '../../../styles/courses.css';
 
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

  // Get available teachers for assignment (exclude those already assigned to the selected course for the same semester)
  const availableTeachers = useMemo(() => {
    if (!assignForm.course_id || !assignForm.semester) {
      return teacherOptions;
    }
    
    const selectedCourse = courseOptions.find(c => c.id === Number(assignForm.course_id));
    if (!selectedCourse) {
      return teacherOptions;
    }
    
    // Get teachers already assigned to this course for the same semester
    const assignedTeacherIds = (selectedCourse.teachers || [])
      .filter(teacher => teacher.pivot?.semester === assignForm.semester)
      .map(teacher => teacher.id);
    
    // Return teachers not already assigned to this course for the same semester
    return teacherOptions.filter(teacher => !assignedTeacherIds.includes(teacher.id));
  }, [teacherOptions, courseOptions, assignForm.course_id, assignForm.semester]);

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

          {/* Courses List */}
          <div className="courses-list-container">
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
              <div className="courses-list">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="course-list-item">
                    <div className="course-item-header">
                      <div className="course-icon">
                        📚
                      </div>
                      <div className="course-main-info">
                        <div className="course-title-row">
                          <h3 className="course-title">{course.title}</h3>
                          <span className="course-code-badge">{course.code}</span>
                        </div>
                        <div className="course-meta-row">
                          {course.year_level && <span className="meta-info">Year {course.year_level}</span>}
                          {course.semester && <span className="meta-info">{course.semester}</span>}
                          <span className="instructor-count">{(course.teachers || []).length} Instructor{(course.teachers || []).length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="course-actions">
                        <span className="status-badge active">Active</span>
                        <button className="action-btn">Assign</button>
                        <button className="action-btn">Reassign</button>
                      </div>
                    </div>
                    
                    {course.description && (
                      <div className="course-description">
                        {course.description}
                      </div>
                    )}
                    
                    <div className="course-instructors-section">
                      <div className="section-label">Assigned Instructors</div>
                      {(course.teachers || []).length === 0 ? (
                        <div className="no-instructors">No instructors assigned</div>
                      ) : (
                        <div className="instructors-list">
                          {(course.teachers || []).map((teacher) => (
                            <div key={`${course.id}-${teacher.id}`} className="instructor-item">
                              <span className="instructor-name" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <span
                                  className="instructor-avatar"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    marginRight: 6,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--neutral-200)',
                                    overflow: 'hidden',
                                    fontWeight: 600
                                  }}
                                >
                                  {teacher.photo_url ? (
                                    <img
                                      src={teacher.photo_url}
                                      alt={teacher.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    (teacher.name || 'U')
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')
                                      .toUpperCase()
                                  )}
                                </span>
                                {teacher.name}
                              </span>
                              <span className="instructor-details">
                                Year {teacher?.pivot?.year_level || '-'} • {teacher?.pivot?.semester || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
}

export default DepartmentCourses;