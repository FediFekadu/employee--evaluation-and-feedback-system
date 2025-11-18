import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function DepartmentDashboard() {
  const { id } = useParams();
  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/departments/${id}`);
        if (!cancelled) setDept(res.data);
      } catch (e) {
        if (!cancelled) setError('Failed to load department');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div>Loading department…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!dept) return <div>No department found.</div>;

  return (
    <div>
      <h1>Department: {dept.name} ({dept.code})</h1>
      <section className="grid">
        <div className="card">
          <h3>Teachers</h3>
          <p>{dept.teachers?.length || 0} total</p>
        </div>
        <div className="card">
          <h3>Courses</h3>
          <p>{dept.courses?.length || 0} total</p>
        </div>
        <div className="card">
          <h3>Students</h3>
          <p>{dept.students?.length || 0} total</p>
        </div>
      </section>
      <section>
        <h2>Quick Actions</h2>
        <div className="cta">
          <button className="btn btn-primary" disabled>Open evaluations</button>
          <button className="btn btn-ghost" disabled>Assign teachers to courses</button>
          <button className="btn btn-ghost" disabled>View feedback reports</button>
        </div>
      </section>
    </div>
  );
}

export default DepartmentDashboard;