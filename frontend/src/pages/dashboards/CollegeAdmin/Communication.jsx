import React from 'react';

function CollegeAdminCommunication() {
  return (
    <section className="card">
      <h3>Communication Tools</h3>
      <p style={{ color: 'var(--muted)' }}>Announcements and messages to departments and instructors.</p>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <input className="btn btn-ghost" placeholder="Announcement title" />
        <textarea className="btn btn-ghost" placeholder="Announcement message" rows={4} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary">Send to All Departments</button>
          <button className="btn btn-ghost">Message Admins</button>
          <button className="btn btn-ghost">Message Instructors</button>
        </div>
      </div>
    </section>
  );
}

export default CollegeAdminCommunication;