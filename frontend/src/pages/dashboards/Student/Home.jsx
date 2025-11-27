import React from 'react';

function StudentHome() {
  const yearLevel = typeof window !== 'undefined' ? localStorage.getItem('year_level') : null;
  const semesterNum = typeof window !== 'undefined' ? Number(localStorage.getItem('semester')) : null;
  const semesterStr = semesterNum === 2 ? 'Semester II' : 'Semester I';
  return (
    <div className="card">
      <h3>Welcome</h3>
      <p style={{ color: 'var(--muted)' }}>
        You are logged in as a student. Use the sidebar to open evaluations or change your password.
      </p>
      {(yearLevel || semesterNum) && (
        <p>Target: Year {yearLevel || '—'}, {semesterStr}</p>
      )}
    </div>
  );
}

export default StudentHome;