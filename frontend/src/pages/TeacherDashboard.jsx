import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI navigation per spec
  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'evaluations', label: 'My Evaluation Results' },
    { key: 'course_feedback', label: 'Course Feedback' },
    { key: 'peer_eval', label: 'Peer Evaluation' },
    { key: 'voting', label: 'Vote for Boss' },
    { key: 'courses', label: 'Courses' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'profile', label: 'Profile & Settings' },
  ];
  const [active, setActive] = useState('overview');

  // Peer evaluation modal state (placeholder)
  const [peerOpen, setPeerOpen] = useState(false);
  const [peerForm, setPeerForm] = useState({ professionalism: 0, teaching: 0, communication: 0, teamwork: 0, comments: '' });

  // Voting state (placeholder)
  const [vote, setVote] = useState({ admin: '', leader: '' });

  // Course feedback selection
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    const tid = typeof window !== 'undefined' ? localStorage.getItem('teacher_id') : null;
    if (!tid) {
      setError('No teacher account found. Please login as a teacher.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await api.get(`/teachers/${tid}`);
        setTeacher(res.data);
      } catch (e) {
        setError('Failed to load teacher details.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const courses = teacher?.courses || [];

  // Simple metrics derived from available data
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYearLabel = now.getFullYear();
    const coursesThisSemester = courses.filter((c) => c?.pivot?.semester != null).length;
    return {
      coursesThisSemester,
      studentsEnrolled: 'N/A', // Requires backend endpoint; placeholder
      latestEvaluationScore: 'N/A', // Requires backend aggregation; placeholder
      currentYearLabel,
    };
  }, [courses]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar navigation */}
      <aside style={{ width: 240, borderRight: '1px solid #eee', padding: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Instructor</h3>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {sections.map((s) => (
            <li key={s.key}>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', textAlign: 'left', marginBottom: 6, background: active === s.key ? '#f4f4f4' : undefined }}
                onClick={() => setActive(s.key)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>Instructor Dashboard</h2>
            <p style={{ color: 'var(--muted)' }}>Professional overview of your courses and evaluations.</p>
          </div>
          {/* Notification bell placeholder */}
          <button className="btn btn-ghost" aria-label="Notifications">🔔</button>
        </div>

        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && teacher && (
          <div>
            {/* Profile summary */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 4 }}>{teacher.name} {teacher.title ? `— ${teacher.title}` : ''}</h3>
              <p style={{ color: 'var(--muted)' }}>{teacher.email} • {teacher?.department?.name || 'Unknown Department'}</p>
            </div>

            {/* Overview section with metric cards */}
            {active === 'overview' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: 'var(--muted)' }}>Courses this semester</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{metrics.coursesThisSemester}</div>
                  </div>
                  <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: 'var(--muted)' }}>Students enrolled</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{metrics.studentsEnrolled}</div>
                  </div>
                  <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: 'var(--muted)' }}>Latest evaluation score</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{metrics.latestEvaluationScore}</div>
                  </div>
                  <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12, boxShadow: '0 1px 5px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: 'var(--muted)' }}>Academic year</div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{metrics.currentYearLabel}</div>
                  </div>
                </div>

                <h4 style={{ marginBottom: 8 }}>Notifications</h4>
                <p style={{ color: 'var(--muted)' }}>No new announcements yet.</p>
              </div>
            )}

            {/* My Evaluation Results (placeholder charts) */}
            {active === 'evaluations' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>My Evaluation Results</h4>
                <p style={{ color: 'var(--muted)' }}>Charts and averages coming soon.</p>
                <div style={{ height: 180, border: '1px dashed #ccc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Chart Placeholder
                </div>
              </div>
            )}

            {/* Course Feedback Viewer */}
            {active === 'course_feedback' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Course Feedback</h4>
                <label>Select course</label>
                <select className="btn btn-ghost" value={selectedCourseId || ''} onChange={(e) => setSelectedCourseId(Number(e.target.value) || null)}>
                  <option value="">Choose…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                  ))}
                </select>
                {!selectedCourseId && <p style={{ color: 'var(--muted)' }}>Pick a course to view feedback and participation.</p>}
                {selectedCourseId && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>Participation: N/A</div>
                      <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>Avg Score: N/A</div>
                      <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 12 }}>Comments: N/A</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Peer evaluation modal trigger */}
            {active === 'peer_eval' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Peer Evaluation</h4>
                <p style={{ color: 'var(--muted)' }}>Evaluate fellow instructors (placeholder form).</p>
                <button className="btn btn-primary" onClick={() => setPeerOpen(true)}>Open Peer Evaluation</button>
                {peerOpen && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', padding: 20, width: 520, borderRadius: 12 }}>
                      <h5>Peer Evaluation</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <label>Professionalism<input className="btn btn-ghost" type="number" min="0" max="5" value={peerForm.professionalism} onChange={(e) => setPeerForm({ ...peerForm, professionalism: Number(e.target.value) })} /></label>
                        <label>Teaching<input className="btn btn-ghost" type="number" min="0" max="5" value={peerForm.teaching} onChange={(e) => setPeerForm({ ...peerForm, teaching: Number(e.target.value) })} /></label>
                        <label>Communication<input className="btn btn-ghost" type="number" min="0" max="5" value={peerForm.communication} onChange={(e) => setPeerForm({ ...peerForm, communication: Number(e.target.value) })} /></label>
                        <label>Teamwork<input className="btn btn-ghost" type="number" min="0" max="5" value={peerForm.teamwork} onChange={(e) => setPeerForm({ ...peerForm, teamwork: Number(e.target.value) })} /></label>
                      </div>
                      <label style={{ display: 'block', marginTop: 8 }}>Comments<textarea className="btn btn-ghost" rows={3} value={peerForm.comments} onChange={(e) => setPeerForm({ ...peerForm, comments: e.target.value })} /></label>
                      <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => setPeerOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => { alert('Peer evaluation submitted (placeholder).'); setPeerOpen(false); }}>Submit</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voting section */}
            {active === 'voting' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Vote for Boss</h4>
                <p style={{ color: 'var(--muted)' }}>Cast votes (one-time, placeholder).</p>
                <div style={{ marginBottom: 8 }}>
                  <label>Best Department Admin</label>
                  <input className="btn btn-ghost" placeholder="Type a name" value={vote.admin} onChange={(e) => setVote({ ...vote, admin: e.target.value })} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label>Best Instructor Leader</label>
                  <input className="btn btn-ghost" placeholder="Type a name" value={vote.leader} onChange={(e) => setVote({ ...vote, leader: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={() => alert('Vote submitted (placeholder).')}>Submit Vote</button>
              </div>
            )}

            {/* Courses list */}
            {active === 'courses' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Assigned Courses</h4>
                {courses.length === 0 && (
                  <p style={{ color: 'var(--muted)' }}>No course assignments yet.</p>
                )}
                <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {courses.map((c) => (
                    <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{c.code}</strong> — {c.title}
                          <div style={{ color: 'var(--muted)' }}>{c?.department?.name ? `Department: ${c.department.name}` : ''}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>Year: {c.pivot?.year_level ?? 'N/A'}</div>
                          <div>Semester: {c.pivot?.semester ?? 'N/A'}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Announcements */}
            {active === 'announcements' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Announcements</h4>
                <p style={{ color: 'var(--muted)' }}>No announcements yet.</p>
              </div>
            )}

            {/* Profile & Settings */}
            {active === 'profile' && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Profile & Settings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>Name<input className="btn btn-ghost" defaultValue={teacher.name} /></label>
                  <label>Email<input className="btn btn-ghost" defaultValue={teacher.email} /></label>
                  <label>Title<input className="btn btn-ghost" defaultValue={teacher.title || ''} /></label>
                  <label>Department<input className="btn btn-ghost" defaultValue={teacher?.department?.name || ''} disabled /></label>
                  <label>New Password<input className="btn btn-ghost" type="password" placeholder="Change password" /></label>
                  <label>Notifications<select className="btn btn-ghost"><option>Enabled</option><option>Disabled</option></select></label>
                  <label>Profile Picture<input className="btn btn-ghost" type="file" accept="image/*" /></label>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={() => alert('Profile saved (placeholder).')}>Save Changes</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard;