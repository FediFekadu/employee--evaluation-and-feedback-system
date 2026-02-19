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

  // Delete course function
  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/courses/${courseId}`);
      setDepartment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: prev.courses.filter(c => c.id !== courseId)
        };
      });
      alert('Course deleted successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to delete course');
    }
  };

  // Delete instructor function
  const deleteInstructor = async (instructorId) => {
    if (!window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/teachers/${instructorId}`);
      setDepartment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          teachers: prev.teachers.filter(t => t.id !== instructorId)
        };
      });
      alert('Instructor deleted successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to delete instructor');
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
                        <button 
                          onClick={() => {
                            setAssignForm(prev => ({ ...prev, course_id: String(course.id) }));
                            setActiveTab('assign');
                          }}
                          style={{ 
                            fontSize: '11px', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-medium)', 
                            background: 'white', 
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          Assign
                        </button>
                        <button 
                          onClick={() => {
                            if ((course.teachers || []).length > 0) {
                              setRemoveForm(prev => ({ ...prev, course_id: String(course.id) }));
                              setActiveTab('remove');
                            } else {
                              alert('No instructors assigned to this course.');
                            }
                          }}
                          title="Remove instructor from course"
                          style={{ 
                            fontSize: '11px', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-medium)', 
                            background: 'white', 
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          Unassign
                        </button>
                        <button 
                          onClick={() => deleteCourse(course.id)}
                          title="Delete Course"
                          style={{ 
                            background: '#fee2e2', 
                            border: '1px solid #fecaca', 
                            color: '#dc2626', 
                            cursor: 'pointer', 
                            width: 26,
                            height: 26,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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

          {/* Instructors List */}
          <div className="courses-list-container">
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
              <div className="courses-list compact-rows">
                {filteredInstructors.map((instructor) => {
                  const details = detailsById[instructor.id];
                  const coursesCount = details?.courses?.length ?? instructor.courses?.length ?? '—';
                  const evaluationsCount = details?.evaluations?.length ?? instructor.evaluations?.length ?? '—';

                  return (
                    <div key={instructor.id} style={{ marginBottom: 8 }}>
                      <div 
                        className="course-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          border: '1px solid var(--neutral-200)',
                          borderRadius: 8,
                          background: 'var(--neutral-50)',
                          cursor: 'default',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Avatar */}
                        <div className="instructor-avatar" style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--neutral-200)', flexShrink: 0 }}>
                          <img 
                            src={instructor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=0D8ABC&color=fff&size=128&bold=true`}
                            alt={instructor.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=0D8ABC&color=fff&size=128&bold=true`;
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Main Info */}
                        <div className="course-main-compact" style={{ minWidth: 0 }}>
                          <div className="title-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 className="course-title" style={{ fontSize: 14, margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{instructor.name}</h3>
                            {instructor.title && (
                              <span className="course-code-badge" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', whiteSpace: 'nowrap' }}>
                                {instructor.title}
                              </span>
                            )}
                          </div>
                          
                          <div className="meta-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                             <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                               {instructor.email || '—'}
                             </span>
                             <span style={{ width: 1, height: 12, background: 'var(--neutral-300)' }}></span>
                             <span style={{ display: 'flex', gap: 8 }}>
                               <span><strong>{coursesCount}</strong> Courses</span>
                               <span><strong>{evaluationsCount}</strong> Evals</span>
                             </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="course-actions compact" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                           <button 
                             onClick={() => toggleExpand(instructor.id)}
                             style={{ 
                               fontSize: '11px', 
                               padding: '4px 10px', 
                               borderRadius: '6px', 
                               border: '1px solid var(--border-medium)', 
                               background: 'white', 
                               color: 'var(--text-primary)',
                               cursor: 'pointer',
                               fontWeight: 500,
                               whiteSpace: 'nowrap'
                             }}
                           >
                             {expandedId === instructor.id ? 'Close' : 'Details'}
                           </button>
                           <button 
                             onClick={() => setActiveTab('courses')}
                             style={{ 
                               fontSize: '11px', 
                               padding: '4px 10px', 
                               borderRadius: '6px', 
                               border: '1px solid var(--border-medium)', 
                               background: 'white', 
                               color: 'var(--text-primary)',
                               cursor: 'pointer',
                               fontWeight: 500
                             }}
                           >
                             Courses
                           </button>
                           <button 
                              onClick={() => deleteInstructor(instructor.id)}
                              title="Delete Instructor"
                              style={{ 
                                background: '#fee2e2', 
                                border: '1px solid #fecaca', 
                                color: '#dc2626', 
                                cursor: 'pointer', 
                                width: 26,
                                height: 26,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                      </div>

                      {/* Details Panel */}
                      {expandedId === instructor.id && (
                         <div className="card-details" style={{ 
                           marginTop: -4, 
                           marginLeft: 10, 
                           marginRight: 10, 
                           border: '1px solid var(--border-soft)', 
                           borderTop: 'none', 
                           borderBottomLeftRadius: 8, 
                           borderBottomRightRadius: 8, 
                           background: 'white', 
                           padding: 16 
                         }}>
                           {loadingDetailsId === instructor.id && !details && (
                             <div className="loading-inline">
                               <span className="loading-spinner small"></span>
                               Loading details...
                             </div>
                           )}

                           {details && (
                             <>
                               <div className="courses-list">
                                 <div className="section-title" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Courses</div>
                                 {details.courses?.length ? (
                                   <div className="course-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                     {details.courses.map((course) => (
                                       <div key={course.id} className="course-list-item" style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border-soft)' }}>
                                         <span style={{ fontWeight: 600, marginRight: 6 }}>{course.code}</span>
                                         <span style={{ color: 'var(--text-secondary)' }}>{course.title}</span>
                                       </div>
                                     ))}
                                   </div>
                                 ) : (
                                   <div className="empty-inline" style={{ fontSize: 13, color: 'var(--text-muted)' }}>No courses assigned</div>
                                 )}
                               </div>

                               <div className="evaluations-summary" style={{ marginTop: 16 }}>
                                 <div className="section-title" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluations</div>
                                 <div className="summary-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                   <div style={{ display: 'flex', gap: 8 }}>
                                     {(() => {
                                       const evals = details.evaluations || [];
                                       const today = new Date();
                                       const openCount = evals.filter(e => {
                                         const opened = e.opened_at ? new Date(e.opened_at) : null;
                                         const closed = e.closed_at ? new Date(e.closed_at) : null;
                                         return opened && opened <= today && (!closed || closed >= today);
                                       }).length;
                                       return (
                                         <>
                                           <div className="summary-chip" style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)' }}>Total <strong>{evals.length}</strong></div>
                                           <div className="summary-chip" style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Open <strong>{openCount}</strong></div>
                                         </>
                                       );
                                     })()}
                                   </div>
                                   <a className="summary-link" href={`/department/${deptId}/results`} style={{ fontSize: '12px', fontWeight: 500, color: '#3b82f6', textDecoration: 'none' }}>
                                     View Results →
                                   </a>
                                  </div>
                               </div>
                             </>
                           )}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                >
                  <option value="">Select instructor</option>
                  {availableTeachers.map((t) => (
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
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-primary" 
                onClick={assignInstructor} 
                disabled={assignSubmitting}
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
              <p>Unassign an instructor from a specific course offering</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Course *</label>
                <select 
                  className="form-select" 
                  value={removeForm.course_id} 
                  onChange={(e) => setRemoveForm((f) => ({ ...f, course_id: e.target.value, teacher_id: '' }))}
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
                  value={removeForm.semester} 
                  onChange={(e) => setRemoveForm((f) => ({ ...f, semester: e.target.value, teacher_id: '' }))}
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
                  disabled={!removeForm.course_id}
                >
                  <option value="">Select instructor</option>
                  {getAssignedInstructors().map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} (Year {t.year_level})
                    </option>
                  ))}
                </select>
                {removeForm.course_id && getAssignedInstructors().length === 0 && (
                  <small className="form-hint error">No instructors assigned to this course for {removeForm.semester}</small>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="dept-btn dept-btn-danger" 
                onClick={removeInstructor} 
                disabled={removeSubmitting}
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
