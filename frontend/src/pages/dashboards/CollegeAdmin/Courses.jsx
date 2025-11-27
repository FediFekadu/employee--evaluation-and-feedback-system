import React from 'react';

function CollegeAdminCourses() {
  return (
    <section className="card">
      <h3>Courses</h3>
      <p style={{ color: 'var(--muted)' }}>Add courses, filter, and assign instructors.</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <select className="btn btn-ghost" aria-label="Department filter">
          <option>All Departments</option>
          <option>Software Engineering</option>
          <option>Information Systems</option>
          <option>Computer Science</option>
          <option>Information Technology</option>
        </select>
        <select className="btn btn-ghost" aria-label="Year filter">
          <option>All Years</option>
          <option>Year 1</option>
          <option>Year 2</option>
          <option>Year 3</option>
          <option>Year 4</option>
        </select>
        <select className="btn btn-ghost" aria-label="Semester filter">
          <option>All Semesters</option>
          <option>Semester I</option>
          <option>Semester II</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary">Add Course</button>
        <button className="btn btn-ghost">Assign Instructor</button>
        <button className="btn btn-ghost">Edit Course</button>
        <button className="btn btn-ghost">Archive</button>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <p style={{ color: 'var(--muted)' }}>Course list appears here…</p>
      </div>
    </section>
  );
}

export default CollegeAdminCourses;