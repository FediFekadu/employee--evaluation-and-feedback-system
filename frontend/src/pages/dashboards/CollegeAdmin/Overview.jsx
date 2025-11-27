import React from 'react';

function CollegeAdminOverview() {
  return (
    <section className="grid">
      <div className="card">
        <h3>Overview Stats</h3>
        <ul>
          <li>Departments: 0</li>
          <li>Instructors: 0</li>
          <li>Students: 0</li>
          <li>Active Courses: 0</li>
        </ul>
      </div>
      <div className="card">
        <h3>Feedback Summary</h3>
        <p>Average rating: —</p>
        <p>Evaluations completed: —</p>
        <p>Pending evaluations: —</p>
      </div>
      <div className="card">
        <h3>Quick Actions</h3>
        <ul>
          <li><a href="#">Create semester</a></li>
          <li><a href="#">Post department courses</a></li>
          <li><a href="#">Assign teachers to courses</a></li>
          <li><a href="#">Open evaluations</a></li>
        </ul>
      </div>
    </section>
  );
}

export default CollegeAdminOverview;