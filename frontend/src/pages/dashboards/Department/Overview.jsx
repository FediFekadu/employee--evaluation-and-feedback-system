import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

function DepartmentOverview() {
  const { id } = useParams();
  const deptId = Number(id);

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentYear = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
  }, []);
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('Semester I');

  const [evaluations, setEvaluations] = useState([]);
  const [evalLoading, setEvalLoading] = useState(false);

  useEffect(() => { setAcademicYear(currentYear); }, [currentYear]);

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

  const loadEvaluations = async () => {
    setEvalLoading(true);
    try {
      const res = await api.get('/evaluations', { params: { department_id: deptId, academic_year: academicYear, semester } });
      setEvaluations(res.data?.data || []);
    } catch (e) {
      // ignore
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => { if (deptId && academicYear && semester) loadEvaluations(); }, [deptId, academicYear, semester]);

  const evaluationStatus = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return 'Not started';
    const anyOpen = evaluations.some((ev) => ev.opened_at <= todayStr && (!ev.closed_at || ev.closed_at >= todayStr));
    const allClosed = evaluations.length > 0 && evaluations.every((ev) => ev.closed_at && ev.closed_at < todayStr);
    if (anyOpen) return 'Ongoing';
    if (allClosed) return 'Completed';
    return 'Scheduled';
  }, [evaluations, todayStr]);

  return (
    <div className="dept-card">
      <h3>Overview</h3>
      {loading && <p>Loading department…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && department && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 8 }}>
          <div className="dept-card">
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Instructors</div>
            <div style={{ fontSize: 20 }}>{department.teachers?.length ?? 0}</div>
          </div>
          <div className="dept-card">
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Students</div>
            <div style={{ fontSize: 20 }}>{department.students?.length ?? 0}</div>
          </div>
          <div className="dept-card">
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Courses</div>
            <div style={{ fontSize: 20 }}>{department.courses?.length ?? 0}</div>
          </div>
          <div className="dept-card">
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Evaluation Status</div>
            <div style={{ fontSize: 20 }}>{evaluationStatus}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentOverview;