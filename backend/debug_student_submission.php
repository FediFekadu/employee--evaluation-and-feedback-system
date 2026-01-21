<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Debugging Student Submission Issue ===\n\n";

// Check open evaluations that students can see
$openEvaluations = \App\Models\Evaluation::with(['course', 'teacher', 'questions'])
    ->whereNull('closed_at')
    ->orWhere('closed_at', '>', now())
    ->get();

echo "Open evaluations available to students: " . $openEvaluations->count() . "\n\n";

foreach ($openEvaluations as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "Course: " . ($eval->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($eval->teacher->name ?? 'N/A') . "\n";
    echo "Questions: " . $eval->questions->count() . "\n";
    echo "Opened: " . ($eval->opened_at ?? 'N/A') . "\n";
    echo "Closes: " . ($eval->closed_at ?? 'Never') . "\n";
    
    if ($eval->questions->count() > 0) {
        echo "Questions:\n";
        foreach ($eval->questions as $q) {
            echo "  - Q{$q->id} ({$q->type}): " . substr($q->text, 0, 60) . "...\n";
        }
    } else {
        echo "  ⚠️  NO QUESTIONS - This will cause 422 error!\n";
    }
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

// Check students table
$studentsCount = \App\Models\Student::count();
echo "Total students in database: {$studentsCount}\n";

if ($studentsCount > 0) {
    $sampleStudent = \App\Models\Student::first();
    echo "Sample student ID: {$sampleStudent->id} - {$sampleStudent->name}\n";
}