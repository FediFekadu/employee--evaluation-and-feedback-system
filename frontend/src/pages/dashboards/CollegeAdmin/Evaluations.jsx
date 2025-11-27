import React from 'react';

function CollegeAdminEvaluations() {
  return (
    <section className="card">
      <h3>Feedback & Evaluation Control</h3>
      <p style={{ color: 'var(--muted)' }}>Open/close evaluations, view summaries, flag low performance, send alerts.</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary">Open Evaluations</button>
        <button className="btn btn-ghost">Close Evaluations</button>
        <button className="btn btn-ghost">View Department Results</button>
        <button className="btn btn-ghost">Flag Instructors</button>
        <button className="btn btn-ghost">Send Alerts</button>
      </div>
    </section>
  );
}

export default CollegeAdminEvaluations;