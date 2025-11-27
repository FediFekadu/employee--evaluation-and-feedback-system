import React from 'react';

function CollegeAdminInstructors() {
  return (
    <section className="card">
      <h3>Instructors</h3>
      <p style={{ color: 'var(--muted)' }}>Add, assign to departments, update info, activate/deactivate.</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary">Add Instructor</button>
        <button className="btn btn-ghost">Assign to Department</button>
        <button className="btn btn-ghost">Update Info</button>
        <button className="btn btn-ghost">Activate/Deactivate</button>
      </div>
    </section>
  );
}

export default CollegeAdminInstructors;