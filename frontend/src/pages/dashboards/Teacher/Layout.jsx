import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function TeacherLayout() {
  return (
    <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 16 }}>
      <aside className="card" style={{ padding: 12 }}>
        <h3>Teacher</h3>
        <nav style={{ display: 'grid', gap: 6 }}>
          <NavLink className="link" to="/teacher">Home</NavLink>
          <NavLink className="link" to="/teacher/courses">Courses</NavLink>
          <NavLink className="link" to="/teacher/feedback">Feedback</NavLink>
          <NavLink className="link" to="/teacher/profile">Profile</NavLink>
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}

export default TeacherLayout;