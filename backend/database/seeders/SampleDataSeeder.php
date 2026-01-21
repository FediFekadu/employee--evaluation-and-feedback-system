<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Student;
use App\Models\Evaluation;

class SampleDataSeeder extends Seeder
{
    public function run()
    {
        // Create a department
        $dept = Department::create(['name' => 'Computer Science']);

        // Create a teacher
        $teacher = Teacher::create([
            'name' => 'Dr. John Smith',
            'email' => 'john.smith@university.edu',
            'department_id' => $dept->id
        ]);

        // Create a course
        $course = Course::create([
            'title' => 'Introduction to Programming',
            'code' => 'CS101',
            'department_id' => $dept->id
        ]);

        // Create some students
        $student1 = Student::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@students.edu',
            'student_id' => 'ST001',
            'department_id' => $dept->id,
            'year_level' => 1,
            'semester' => 1
        ]);

        $student2 = Student::create([
            'name' => 'Bob Wilson',
            'email' => 'bob@students.edu',
            'student_id' => 'ST002',
            'department_id' => $dept->id,
            'year_level' => 1,
            'semester' => 1
        ]);

        // Create an evaluation
        $evaluation = Evaluation::create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'academic_year' => '2024/25',
            'semester' => '1',
            'year_level' => 1,
            'opened_at' => now(),
            'closed_at' => now()->addDays(7)
        ]);

        $this->command->info('Sample data created successfully!');
    }
}