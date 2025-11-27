import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function StudentLayout() {
  return (
    <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 16 }}>
      <aside className="card" style={{ padding: 12 }}>
        <h3>Student</h3>
        <nav style={{ display: 'grid', gap: 6 }}>
          <NavLink className="link" to="/dashboard">Home</NavLink>
          <NavLink className="link" to="/dashboard/evaluations">Evaluations</NavLink>
          <NavLink className="link" to="/dashboard/profile">Profile</NavLink>
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}

export default StudentLayout;