<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Course;
use App\Models\Teacher;
use App\Models\Department;
use Illuminate\Http\Request;
use App\Http\Controllers\CourseController;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Course-Teacher Assignment Validation\n";
echo "==========================================\n\n";

// Find a department with courses and teachers
$department = Department::with(['courses', 'teachers'])->find(41);

if (!$department) {
    echo "No department found. Please seed the database first.\n";
    exit(1);
}

echo "Using Department: {$department->name} (ID: {$department->id})\n";

$courses = $department->courses;
$teachers = $department->teachers;

if ($courses->isEmpty() || $teachers->isEmpty()) {
    echo "Department needs at least one course and one teacher for testing.\n";
    exit(1);
}

$course = $courses->first();
$teacher1 = $teachers->first();
$teacher2 = $teachers->count() > 1 ? $teachers->get(1) : null;

echo "Using Course: {$course->title} (ID: {$course->id})\n";
echo "Using Teacher 1: {$teacher1->name} (ID: {$teacher1->id})\n";
if ($teacher2) {
    echo "Using Teacher 2: {$teacher2->name} (ID: {$teacher2->id})\n";
}
echo "\n";

// Clear existing assignments for this course
$course->teachers()->detach();
echo "Cleared existing assignments for the course.\n\n";

$controller = new CourseController();

// Test 1: Assign first teacher to Semester I
echo "Test 1: Assigning Teacher 1 to Semester I\n";
$request = new Request([
    'teacher_id' => $teacher1->id,
    'year_level' => 1,
    'semester' => 'Semester I'
]);

try {
    $response = $controller->assignTeacher($request, $course->id);
    $data = json_decode($response->getContent(), true);
    echo "✓ Success: {$data['message']}\n";
} catch (Exception $e) {
    echo "✗ Error: {$e->getMessage()}\n";
}

// Test 2: Try to assign second teacher to same course, same semester (should fail)
if ($teacher2) {
    echo "\nTest 2: Trying to assign Teacher 2 to same course, same semester (should fail)\n";
    $request = new Request([
        'teacher_id' => $teacher2->id,
        'year_level' => 1,
        'semester' => 'Semester I'
    ]);

    try {
        $response = $controller->assignTeacher($request, $course->id);
        $data = json_decode($response->getContent(), true);
        if ($response->getStatusCode() === 422) {
            echo "✓ Validation worked: {$data['message']}\n";
        } else {
            echo "✗ Validation failed: Assignment should have been rejected\n";
        }
    } catch (Exception $e) {
        echo "✗ Error: {$e->getMessage()}\n";
    }
}

// Test 3: Assign second teacher to different semester (should succeed)
if ($teacher2) {
    echo "\nTest 3: Assigning Teacher 2 to different semester (should succeed)\n";
    $request = new Request([
        'teacher_id' => $teacher2->id,
        'year_level' => 1,
        'semester' => 'Semester II'
    ]);

    try {
        $response = $controller->assignTeacher($request, $course->id);
        $data = json_decode($response->getContent(), true);
        echo "✓ Success: {$data['message']}\n";
    } catch (Exception $e) {
        echo "✗ Error: {$e->getMessage()}\n";
    }
}

// Test 4: Try to assign same teacher to same semester again (should fail)
echo "\nTest 4: Trying to assign Teacher 1 to Semester I again (should fail)\n";
$request = new Request([
    'teacher_id' => $teacher1->id,
    'year_level' => 1,
    'semester' => 'Semester I'
]);

try {
    $response = $controller->assignTeacher($request, $course->id);
    $data = json_decode($response->getContent(), true);
    if ($response->getStatusCode() === 422) {
        echo "✓ Validation worked: {$data['message']}\n";
    } else {
        echo "✗ Validation failed: Assignment should have been rejected\n";
    }
} catch (Exception $e) {
    echo "✗ Error: {$e->getMessage()}\n";
}

// Show final assignments
echo "\nFinal Course Assignments:\n";
$course->load('teachers');
foreach ($course->teachers as $teacher) {
    $semester = $teacher->pivot->semester ?? 'No semester';
    $yearLevel = $teacher->pivot->year_level ?? 'No year';
    echo "- {$teacher->name}: {$semester}, Year {$yearLevel}\n";
}

echo "\nTest completed!\n";