import React from 'react';

function CollegeAdminSettings() {
  return (
    <section className="card">
      <h3>System Settings</h3>
      <p style={{ color: 'var(--muted)' }}>Set evaluation schedule, defaults, and college profile.</p>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <label>
          Start Date
          <input type="date" className="btn btn-ghost" />
        </label>
        <label>
          End Date
          <input type="date" className="btn btn-ghost" />
        </label>
        <label>
          Academic Year
          <input type="text" className="btn btn-ghost" placeholder="2025/26" />
        </label>
        <label>
          Default Semester
          <select className="btn btn-ghost">
            <option>Semester I</option>
            <option>Semester II</option>
          </select>
        </label>
      </div>
    </section>
  );
}

export default CollegeAdminSettings;