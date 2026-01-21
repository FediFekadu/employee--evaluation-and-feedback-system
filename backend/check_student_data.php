<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Student Data and Submissions ===\n\n";

// Get all students
$students = \App\Models\Student::all();
echo "Total students: " . $students->count() . "\n\n";

foreach ($students as $student) {
    echo "Student ID: {$student->id} - {$student->name}\n";
    
    // Check submissions for this student
    $submissions = \App\Models\Feedback::where('student_id', $student->id)
        ->with(['evaluation.course', 'evaluation.teacher'])
        ->get();
    
    echo "Submissions: " . $submissions->count() . "\n";
    
    if ($submissions->count() > 0) {
        foreach ($submissions as $submission) {
            echo "  - Evaluation {$submission->evaluation_id}: " . 
                 ($submission->evaluation->course->title ?? 'N/A') . " - " .
                 ($submission->evaluation->teacher->name ?? 'N/A') . 
                 " (Anonymous: " . ($submission->anonymous ? 'Yes' : 'No') . ")\n";
        }
    }
    echo "\n";
}

echo "\n=== Available Evaluations vs Submissions ===\n\n";

$availableEvaluations = \App\Models\Evaluation::with(['course', 'teacher', 'feedbacks'])
    ->where(function($query) {
        $query->whereNull('opened_at')
              ->orWhere('opened_at', '<=', now()->toDateString());
    })
    ->where(function($query) {
        $query->whereNull('closed_at')
              ->orWhere('closed_at', '>', now()->toDateString());
    })
    ->get();

foreach ($availableEvaluations as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "Course: " . ($eval->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($eval->teacher->name ?? 'N/A') . "\n";
    echo "Total submissions: " . $eval->feedbacks->count() . "\n";
    
    if ($eval->feedbacks->count() > 0) {
        echo "Submitted by students: ";
        foreach ($eval->feedbacks as $feedback) {
            echo $feedback->student_id . " ";
        }
        echo "\n";
    }
    echo "\n";
}