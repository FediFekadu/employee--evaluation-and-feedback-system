<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Department;
use App\Models\Course;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Evaluation;
use App\Models\Question;
use App\Models\Feedback;
use App\Models\Response;
use App\Models\EvaluationSubmission;
use App\Models\User;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Creating test evaluation with responses...\n";

// Create or get department
$department = Department::firstOrCreate([
    'code' => 'CS',
    'name' => 'Computer Science'
]);

// Create or get course
$course = Course::firstOrCreate([
    'code' => 'CS101',
    'title' => 'Introduction to Programming',
    'department_id' => $department->id
]);

// Create or get teacher user
$teacherUser = User::firstOrCreate([
    'email' => 'teacher@test.com'
], [
    'name' => 'Test Teacher',
    'password' => bcrypt('password'),
    'role' => 'teacher'
]);

// Create or get teacher
$teacher = Teacher::firstOrCreate([
    'user_id' => $teacherUser->id
], [
    'name' => 'Test Teacher',
    'email' => 'teacher@test.com',
    'department_id' => $department->id
]);

// Create an evaluation
$evaluation = Evaluation::create([
    'course_id' => $course->id,
    'teacher_id' => $teacher->id,
    'academic_year' => '2024',
    'semester' => 1,
    'year_level' => 1,
    'opened_at' => now()->subDays(10),
    'closed_at' => now()->addDays(10),
]);

// Create some questions
$questions = [];
for ($i = 1; $i <= 3; $i++) {
    $questions[] = Question::create([
        'text' => "Test Question {$i}",
        'type' => 'rating',
        'section' => ['A', 'B', 'C'][($i - 1) % 3],
    ]);
}

// Create students and responses
for ($s = 1; $s <= 5; $s++) {
    $student = Student::create([
        'student_id' => "TEST{$s}",
        'name' => "Test Student {$s}",
        'email' => "student{$s}@test.com",
        'department_id' => $department->id,
        'year_level' => 1,
        'semester' => 1,
    ]);
    
    // Enroll student in course
    $student->courses()->attach($course->id);
    
    // Create submission
    $submission = EvaluationSubmission::create([
        'evaluation_id' => $evaluation->id,
        'student_id' => $student->id,
        'submitted_at' => now(),
        'is_anonymous' => true,
        'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
    ]);
    
    // Create feedback
    $feedback = Feedback::create([
        'evaluation_id' => $evaluation->id,
        'student_id' => $student->id,
        'anonymous' => true,
        'submission_id' => $submission->id,
        'is_locked' => true,
    ]);
    
    // Create responses for each question
    foreach ($questions as $question) {
        Response::create([
            'feedback_id' => $feedback->id,
            'question_id' => $question->id,
            'rating' => rand(3, 5), // Random rating between 3-5
            'text' => "Test response from student {$s}",
        ]);
    }
}

echo "✅ Created test evaluation with ID: {$evaluation->id}\n";
echo "✅ Created 5 students with responses\n";
echo "✅ Created 3 questions\n";
echo "✅ Ready to test weighted scoring!\n";