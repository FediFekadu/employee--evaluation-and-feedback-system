import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useDepartmentAdminAccess } from '../../../hooks/useAccessControl';

function DepartmentComments() {
  const { id } = useParams();
  const paramDeptId = Number(id);
  const storedDeptId = typeof window !== 'undefined' ? Number(localStorage.getItem('department_id')) : null;
  const departmentId = storedDeptId || paramDeptId;
  const navigate = useNavigate();
  const access = useDepartmentAdminAccess(String(departmentId), { redirectOnDenied: true, redirectPath: '/login' });

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/departments/${departmentId}/comments`, {
        params: {}
      });
      setComments(res.data?.comments || []);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load comments';
      setError(msg);
      // Fallback: if 404 and storedDeptId differs from param, retry and navigate
      const status = e?.response?.status;
      if (status === 404 && storedDeptId && storedDeptId !== paramDeptId) {
        try {
          const res2 = await api.get(`/departments/${storedDeptId}/comments`, { params: {} });
          setComments(res2.data?.comments || []);
          navigate(`/department/${storedDeptId}/comments`, { replace: true });
          setError(null);
        } catch {
          // keep original error
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access?.hasAccess && departmentId) loadComments();
  }, [departmentId, access?.hasAccess]);

  // Moderation actions removed per requirement; view-only list

  const semesterLabel = (sem) => {
    if (!sem) return 'Unknown';
    return sem;
  };

  return (
    <div className="department-dashboard">
      <div className="dashboard-section">
        <h2>Department Comments</h2>
        <p>Anonymous student comments with visible Year and Semester to identify problem areas.</p>
        {/* Filters removed per requirement */}

        {(!access || access.isLoading) ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Validating access...</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading comments...</p>
          </div>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : comments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>No Comments</h3>
            <p>There are no comments matching the selected filters.</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((c) => (
              <div 
                key={c.id} 
                className="comment-item" 
                style={{ 
                  border: '1px solid var(--border-soft)', 
                  borderRadius: 8, 
                  padding: 12, 
                  marginBottom: 12,
                  background: 'var(--panel)',
                  color: 'var(--text)'
                }}
              >
                <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                  <div>
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'var(--hover-bg)', 
                        color: 'var(--text)', 
                        border: '1px solid var(--border-soft)', 
                        borderRadius: 8, 
                        padding: '2px 8px' 
                      }}
                    >
                      {c.target_type === 'general' ? 'General' : c.target_type === 'teacher' ? `Instructor: ${c.teacher?.name || 'Unknown'}` : `Course: ${c.course?.title || 'Unknown'}`}
                    </span>
                    <span 
                      className="badge" 
                      style={{ 
                        marginLeft: 8,
                        background: 'var(--hover-bg)', 
                        color: 'var(--text)', 
                        border: '1px solid var(--border-soft)', 
                        borderRadius: 8, 
                        padding: '2px 8px' 
                      }}
                    >
                      {semesterLabel(c.semester)}
                    </span>
                    <span 
                      className="badge" 
                      style={{ 
                        marginLeft: 8,
                        background: 'var(--hover-bg)', 
                        color: 'var(--text)', 
                        border: '1px solid var(--border-soft)', 
                        borderRadius: 8, 
                        padding: '2px 8px' 
                      }}
                    >
                      {c.year_level ? `Year ${c.year_level}` : 'Year Unknown'}
                    </span>
                    {c.course && (
                      <span 
                        className="badge" 
                        style={{ 
                          marginLeft: 8,
                          background: 'var(--hover-bg)', 
                          color: 'var(--text)', 
                          border: '1px solid var(--border-soft)', 
                          borderRadius: 8, 
                          padding: '2px 8px' 
                        }}
                      >
                        Course: {c.course.title} {c.course.code ? `(${c.course.code})` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="comment-body" style={{ marginTop: 8, color: 'var(--text)' }}>
                  <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{c.text}</p>
                </div>
                <DepartmentReply comment={c} departmentId={departmentId} onReplied={loadComments} />
                {/* Moderation actions removed */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentReply({ comment, departmentId, onReplied }) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/departments/${departmentId}/comments/${comment.id}/reply`, { reply: replyText.trim() });
      setReplyText('');
      onReplied();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to send reply';
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {comment.department_reply ? (
        <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 8 }}>
          <strong style={{ color: 'var(--text)' }}>Department Reply:</strong>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{comment.department_reply}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="dept-input"
            placeholder="Reply to student..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="dept-btn dept-btn-primary" onClick={sendReply} disabled={sending}>
            {sending ? 'Sending...' : 'Reply'}
          </button>
        </div>
      )}
    </div>
  );
}

export default DepartmentComments;
