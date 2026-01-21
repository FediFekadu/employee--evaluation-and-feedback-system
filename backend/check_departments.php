<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Departments and Evaluations ===\n\n";

// Check departments
$departments = \App\Models\Department::all();
echo "Total departments: " . $departments->count() . "\n\n";

foreach ($departments as $dept) {
    echo "Department ID: {$dept->id} - {$dept->name}\n";
    
    // Check courses in this department
    $courses = \App\Models\Course::where('department_id', $dept->id)->get();
    echo "Courses: " . $courses->count() . "\n";
    
    // Check evaluations for this department
    $evaluations = \App\Models\Evaluation::whereHas('course', function ($q) use ($dept) {
        $q->where('department_id', $dept->id);
    })->get();
    
    echo "Evaluations: " . $evaluations->count() . "\n";
    
    if ($evaluations->count() > 0) {
        foreach ($evaluations as $eval) {
            echo "  - Eval {$eval->id}: " . ($eval->course->title ?? 'N/A') . " - " . ($eval->teacher->name ?? 'N/A') . "\n";
        }
    }
    
    echo "\n";
}

// Check which department has the most evaluations
echo "=== Available Evaluations by Department ===\n\n";

$availableEvaluations = \App\Models\Evaluation::with(['course.department', 'teacher'])
    ->where(function($query) {
        $today = now()->toDateString();
        $query->whereDate('opened_at', '<=', $today)
              ->where(function ($q) use ($today) {
                  $q->whereNull('closed_at')->orWhereDate('closed_at', '>=', $today);
              });
    })
    ->get();

$evalsByDept = [];
foreach ($availableEvaluations as $eval) {
    $deptId = $eval->course->department_id;
    $deptName = $eval->course->department->name ?? 'Unknown';
    
    if (!isset($evalsByDept[$deptId])) {
        $evalsByDept[$deptId] = [
            'name' => $deptName,
            'count' => 0,
            'evaluations' => []
        ];
    }
    
    $evalsByDept[$deptId]['count']++;
    $evalsByDept[$deptId]['evaluations'][] = [
        'id' => $eval->id,
        'course' => $eval->course->title,
        'teacher' => $eval->teacher->name
    ];
}

foreach ($evalsByDept as $deptId => $data) {
    echo "Department {$deptId} ({$data['name']}): {$data['count']} available evaluations\n";
    foreach ($data['evaluations'] as $eval) {
        echo "  - Eval {$eval['id']}: {$eval['course']} - {$eval['teacher']}\n";
    }
    echo "\n";
}