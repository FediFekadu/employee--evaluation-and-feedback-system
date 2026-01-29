<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Department;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking Departments for Testing\n";
echo "===============================\n\n";

$departments = Department::with(['courses', 'teachers'])->get();

foreach ($departments as $dept) {
    echo "Department: {$dept->name} (ID: {$dept->id})\n";
    echo "  Courses: " . $dept->courses->count() . "\n";
    echo "  Teachers: " . $dept->teachers->count() . "\n";
    
    if ($dept->courses->count() > 0 && $dept->teachers->count() > 0) {
        echo "  ✓ Can be used for testing\n";
        
        // Show first few courses and teachers
        echo "  Sample Courses:\n";
        foreach ($dept->courses->take(3) as $course) {
            echo "    - {$course->title} ({$course->code})\n";
        }
        
        echo "  Sample Teachers:\n";
        foreach ($dept->teachers->take(3) as $teacher) {
            echo "    - {$teacher->name}\n";
        }
        break;
    }
    echo "\n";
}