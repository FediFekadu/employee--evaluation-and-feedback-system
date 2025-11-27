import React from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';

function DepartmentLayout() {
  const { id } = useParams();
  return (
    <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 16 }}>
      <aside className="dept-card" style={{ padding: 12 }}>
        <h3>Department</h3>
        <nav style={{ display: 'grid', gap: 6 }}>
          <NavLink className="dept-link" to={`/department/${id}`}>Overview</NavLink>
          <NavLink className="dept-link" to={`/department/${id}/courses`}>Courses</NavLink>
          <NavLink className="dept-link" to={`/department/${id}/instructors`}>Instructors</NavLink>
          <NavLink className="dept-link" to={`/department/${id}/students`}>Students</NavLink>
          <NavLink className="dept-link" to={`/department/${id}/evaluations`}>Evaluations</NavLink>
          <NavLink className="dept-link" to={`/department/${id}/reports`}>Reports</NavLink>
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}

export default DepartmentLayout;