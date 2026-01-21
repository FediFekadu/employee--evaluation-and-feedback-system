import React, { useEffect, useState } from 'react';
import api from '../../../services/api';

function CollegeAdminEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvaluation, setNewEvaluation] = useState({
    course_id: '',
    teacher_id: '',
    academic_year: new Date().getFullYear().toString(),
    semester: '1',
    year_level: '1',
    opened_at: '',
    closed_at: ''
  });

  // Load evaluations and departments on component mount
  useEffect(() => {
    loadEvaluations();
    loadDepartments();
  }, [selectedDepartment, selectedStatus]);

  const loadEvaluations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') params.append('department_id', selectedDepartment);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await api.get(`/evaluations?${params.toString()}`);
      setEvaluations(response.data?.data || []);
    } catch (err) {
      setError('Failed to load evaluations');
      console.error('Error loading evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!newEvaluation.course_id || !newEvaluation.teacher_id || !newEvaluation.opened_at || !newEvaluation.closed_at) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Client-side validation: ensure instructor is assigned to course
      const courseRes = await api.get(`/courses/${newEvaluation.course_id}`);
      const course = courseRes.data;
      if (!course || !Array.isArray(course.teachers)) {
        alert('Selected course not found or has no instructors list.');
        return;
      }
      const assigned = (course.teachers || []).some(t => String(t.id) === String(newEvaluation.teacher_id));
      if (!assigned) {
        alert('Instructor is not assigned to this course. Assign first, then create evaluation.');
        return;
      }

      const response = await api.post('/evaluations', newEvaluation);
      setEvaluations(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewEvaluation({
        course_id: '',
        teacher_id: '',
        academic_year: new Date().getFullYear().toString(),
        semester: '1',
        year_level: '1',
        opened_at: '',
        closed_at: ''
      });
    } catch (err) {
      alert('Failed to create evaluation');
      console.error('Error creating evaluation:', err);
    }
  };

  const handleStatusChange = async (evaluationId, newStatus) => {
    try {
      const response = await api.put(`/evaluations/${evaluationId}`, { status: newStatus });
      setEvaluations(prev => 
        prev.map(evaluation => evaluation.id === evaluationId ? { ...evaluation, status: newStatus } : evaluation)
      );
    } catch (err) {
      alert('Failed to update evaluation status');
      console.error('Error updating evaluation:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#22c55e';
      case 'closed': return '#ef4444';
      case 'draft': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3>Feedback & Evaluation Control</h3>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Manage course evaluations, monitor progress, and analyze results.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create Evaluation
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select 
          className="btn btn-ghost" 
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        
        <select 
          className="btn btn-ghost"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        <button 
          className="btn btn-ghost"
          onClick={loadEvaluations}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: 12, 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: 6, 
          color: '#dc2626',
          marginBottom: 16 
        }}>
          {error}
        </div>
      )}

      {/* Evaluations List */}
      <div className="card" style={{ marginTop: 16 }}>
        <h4>Active Evaluations</h4>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
            Loading evaluations...
          </div>
        ) : evaluations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
            No evaluations found. Create your first evaluation to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: 12 }}>Course</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Teacher</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Period</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 12 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{evaluation.course?.title || 'Unknown Course'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                          {evaluation.course?.code || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      {evaluation.teacher?.name || 'Unassigned'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div>
                        <div>{evaluation.academic_year}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                          Semester {evaluation.semester}, Year {evaluation.year_level}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: getStatusColor(evaluation.status) + '20',
                        color: getStatusColor(evaluation.status),
                        textTransform: 'capitalize'
                      }}>
                        {evaluation.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div>Opens: {formatDate(evaluation.opened_at)}</div>
                        <div>Closes: {formatDate(evaluation.closed_at)}</div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {evaluation.status === 'draft' && (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => handleStatusChange(evaluation.id, 'open')}
                          >
                            Open
                          </button>
                        )}
                        {evaluation.status === 'open' && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => handleStatusChange(evaluation.id, 'closed')}
                          >
                            Close
                          </button>
                        )}
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View Results
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Evaluation Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: 24,
            borderRadius: 8,
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Create New Evaluation</h3>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Course ID *
                </label>
                <input
                  type="text"
                  className="btn btn-ghost"
                  style={{ width: '100%' }}
                  value={newEvaluation.course_id}
                  onChange={(e) => setNewEvaluation(prev => ({ ...prev, course_id: e.target.value }))}
                  placeholder="Enter course ID"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Teacher ID *
                </label>
                <input
                  type="text"
                  className="btn btn-ghost"
                  style={{ width: '100%' }}
                  value={newEvaluation.teacher_id}
                  onChange={(e) => setNewEvaluation(prev => ({ ...prev, teacher_id: e.target.value }))}
                  placeholder="Enter teacher ID"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Academic Year
                  </label>
                  <input
                    type="text"
                    className="btn btn-ghost"
                    style={{ width: '100%' }}
                    value={newEvaluation.academic_year}
                    onChange={(e) => setNewEvaluation(prev => ({ ...prev, academic_year: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Semester
                  </label>
                  <select
                    className="btn btn-ghost"
                    style={{ width: '100%' }}
                    value={newEvaluation.semester}
                    onChange={(e) => setNewEvaluation(prev => ({ ...prev, semester: e.target.value }))}
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Year Level
                </label>
                <select
                  className="btn btn-ghost"
                  style={{ width: '100%' }}
                  value={newEvaluation.year_level}
                  onChange={(e) => setNewEvaluation(prev => ({ ...prev, year_level: e.target.value }))}
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Opens At *
                  </label>
                  <input
                    type="datetime-local"
                    className="btn btn-ghost"
                    style={{ width: '100%' }}
                    value={newEvaluation.opened_at}
                    onChange={(e) => setNewEvaluation(prev => ({ ...prev, opened_at: e.target.value }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Closes At *
                  </label>
                  <input
                    type="datetime-local"
                    className="btn btn-ghost"
                    style={{ width: '100%' }}
                    value={newEvaluation.closed_at}
                    onChange={(e) => setNewEvaluation(prev => ({ ...prev, closed_at: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateEvaluation}
              >
                Create Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default CollegeAdminEvaluations;