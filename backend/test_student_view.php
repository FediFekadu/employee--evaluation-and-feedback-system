<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Student View ===\n\n";

// Simulate what the frontend does
$departmentId = 1790; // Updated to a department with evaluations
$studentId = 39192; // Leta Tsegaye - has no submissions

echo "Testing for Student ID: {$studentId}\n";
echo "Department ID: {$departmentId}\n\n";

// Get evaluations like the frontend does
$evaluations = \App\Models\Evaluation::with(['course', 'teacher'])
    ->whereHas('course', function ($q) use ($departmentId) {
        $q->where('department_id', $departmentId);
    })
    ->where(function($query) {
        $today = now()->toDateString();
        $query->whereDate('opened_at', '<=', $today)
              ->where(function ($q) use ($today) {
                  $q->whereNull('closed_at')->orWhereDate('closed_at', '>=', $today);
              });
    })
    ->orderByDesc('opened_at')
    ->get();

echo "Available evaluations for this student: " . $evaluations->count() . "\n\n";

foreach ($evaluations as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "Course: " . ($eval->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($eval->teacher->name ?? 'N/A') . "\n";
    
    // Load detailed data like the frontend does
    $detailedEval = \App\Models\Evaluation::with(['course', 'teacher', 'questions', 'feedbacks'])
        ->find($eval->id);
    
    echo "Questions: " . $detailedEval->questions->count() . "\n";
    echo "Total feedbacks: " . $detailedEval->feedbacks->count() . "\n";
    
    // Check if this student has submitted
    $studentSubmission = $detailedEval->feedbacks->where('student_id', $studentId)->first();
    echo "Student submitted: " . ($studentSubmission ? 'YES' : 'NO') . "\n";
    
    if ($studentSubmission) {
        echo "  Submitted at: " . $studentSubmission->created_at . "\n";
        echo "  Anonymous: " . ($studentSubmission->anonymous ? 'Yes' : 'No') . "\n";
    }
    
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

// Test the submission status endpoint
echo "=== Testing Submission Status Endpoint ===\n\n";

if ($evaluations->count() > 0) {
    $testEval = $evaluations->first();
    echo "Testing submission status for evaluation {$testEval->id}\n";
    
    $submissionValidationService = app(\App\Services\SubmissionValidationService::class);
    $status = $submissionValidationService->getSubmissionStatus($studentId, $testEval->id);
    
    echo "Submission status: " . json_encode($status, JSON_PRETTY_PRINT) . "\n";
}