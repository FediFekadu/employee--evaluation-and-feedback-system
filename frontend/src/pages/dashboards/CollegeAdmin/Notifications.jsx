import React from 'react';

function CollegeAdminNotifications() {
  return (
    <section className="card">
      <h3>Notifications</h3>
      <p style={{ color: 'var(--muted)' }}>New feedback, issues, and reports.</p>
      <ul style={{ marginTop: 12 }}>
        <li>No new notifications.</li>
      </ul>
    </section>
  );
}

export default CollegeAdminNotifications;