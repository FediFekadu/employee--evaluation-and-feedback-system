import React from 'react';

function CollegeAdminReports() {
  return (
    <section className="card">
      <h3>Reports & Analytics</h3>
      <p style={{ color: 'var(--muted)' }}>Generate department and instructor analytics, trends, participation, and export.</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <select className="btn btn-ghost" aria-label="Department filter">
          <option>All Departments</option>
          <option>Software Engineering</option>
          <option>Information Systems</option>
          <option>Computer Science</option>
          <option>Information Technology</option>
        </select>
        <select className="btn btn-ghost" aria-label="Semester filter">
          <option>All Semesters</option>
          <option>Semester I</option>
          <option>Semester II</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary">Generate Report (PDF)</button>
        <button className="btn btn-ghost">Export (CSV)</button>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <p style={{ color: 'var(--muted)' }}>Analytics widgets appear here…</p>
      </div>
    </section>
  );
}

export default CollegeAdminReports;