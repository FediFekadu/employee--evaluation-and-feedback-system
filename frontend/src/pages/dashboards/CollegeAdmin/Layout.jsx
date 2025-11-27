import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function CollegeAdminLayout() {
  return (
    <div className="grid" style={{ gridTemplateColumns: '240px 1fr', gap: 16 }}>
      <aside className="card" style={{ padding: 12 }}>
        <h3>College Admin</h3>
        <nav style={{ display: 'grid', gap: 6 }}>
          <NavLink className="link" to="/admin">Overview</NavLink>
          <NavLink className="link" to="/admin/departments">Departments</NavLink>
          <NavLink className="link" to="/admin/admins">Department Admins</NavLink>
          <NavLink className="link" to="/admin/instructors">Instructors</NavLink>
          <NavLink className="link" to="/admin/students">Students</NavLink>
          <NavLink className="link" to="/admin/courses">Courses</NavLink>
          <NavLink className="link" to="/admin/evaluations">Evaluations</NavLink>
          <NavLink className="link" to="/admin/reports">Reports & Analytics</NavLink>
          <NavLink className="link" to="/admin/settings">System Settings</NavLink>
          <NavLink className="link" to="/admin/communication">Communication</NavLink>
          <NavLink className="link" to="/admin/notifications">Notifications</NavLink>
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}

export default CollegeAdminLayout;