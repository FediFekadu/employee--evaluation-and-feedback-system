<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Debugging Filters\n";
echo "=================\n\n";

$departmentId = 41;
$teacherId = 15;
$academicYear = '2024-2025';
$semester = 'First';

$department = \App\Models\Department::find($departmentId);

// Test without filters
$evaluationsQuery = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
    $query->where('department_id', $department->id);
})->where('teacher_id', $teacherId);

echo "Without filters: " . $evaluationsQuery->count() . " evaluations\n";

// Test with academic year filter
$evaluationsQuery = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
    $query->where('department_id', $department->id);
})->where('teacher_id', $teacherId)
  ->where('academic_year', $academicYear);

echo "With academic year '{$academicYear}': " . $evaluationsQuery->count() . " evaluations\n";

// Test with semester filter
$evaluationsQuery = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
    $query->where('department_id', $department->id);
})->where('teacher_id', $teacherId)
  ->where('semester', $semester);

echo "With semester '{$semester}': " . $evaluationsQuery->count() . " evaluations\n";

// Test with both filters
$evaluationsQuery = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
    $query->where('department_id', $department->id);
})->where('teacher_id', $teacherId)
  ->where('academic_year', $academicYear)
  ->where('semester', $semester);

echo "With both filters: " . $evaluationsQuery->count() . " evaluations\n";

// Check what academic years and semesters actually exist
echo "\nActual academic years and semesters for this teacher:\n";
$evaluations = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
    $query->where('department_id', $department->id);
})->where('teacher_id', $teacherId)->get();

foreach ($evaluations as $eval) {
    echo "  Academic Year: '{$eval->academic_year}', Semester: '{$eval->semester}'\n";
}