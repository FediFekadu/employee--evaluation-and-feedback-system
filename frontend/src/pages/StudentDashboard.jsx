import React, { useEffect, useState } from 'react';
import api from '../services/api';

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api
      .get('/courses')
      .then((res) => {
        if (!mounted) return;
        setCourses(res.data?.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError('Failed to load courses');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2>Student Dashboard</h2>
      {loading && <p>Loading courses...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <ul>
          {courses.map((c) => (
            <li key={c.id}>{c.title} ({c.code})</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StudentDashboard;