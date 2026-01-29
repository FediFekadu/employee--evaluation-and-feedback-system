<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Debugging Course Ratings Query\n";
echo "==============================\n\n";

$departmentId = 41;
$teacherId = 15;

echo "Department ID: {$departmentId}\n";
echo "Teacher ID: {$teacherId}\n\n";

// Check the department
$department = \App\Models\Department::find($departmentId);
echo "Department: {$department->name}\n\n";

// Check the teacher
$teacher = \App\Models\Teacher::find($teacherId);
echo "Teacher: {$teacher->name}\n\n";

// Check evaluations using the same query as the API
$evaluationsQuery = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
    $query->where('department_id', $department->id);
})->where('teacher_id', $teacherId)
  ->with(['course', 'teacher', 'feedbacks.responses']);

echo "SQL Query: " . $evaluationsQuery->toSql() . "\n";
echo "Query Bindings: " . json_encode($evaluationsQuery->getBindings()) . "\n\n";

$evaluations = $evaluationsQuery->get();
echo "Found {$evaluations->count()} evaluations\n\n";

foreach ($evaluations as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "  Course: {$eval->course->title} (Dept ID: {$eval->course->department_id})\n";
    echo "  Teacher: {$eval->teacher->name}\n";
    echo "  Academic Year: {$eval->academic_year}\n";
    echo "  Semester: {$eval->semester}\n";
    echo "  Feedbacks: {$eval->feedbacks->count()}\n";
    echo "\n";
}

// Also check what evaluations exist for this teacher regardless of department
echo "All evaluations for teacher {$teacherId}:\n";
$allEvals = \App\Models\Evaluation::where('teacher_id', $teacherId)->with(['course'])->get();
foreach ($allEvals as $eval) {
    echo "  Eval ID: {$eval->id}, Course: {$eval->course->title}, Dept: {$eval->course->department_id}\n";
}