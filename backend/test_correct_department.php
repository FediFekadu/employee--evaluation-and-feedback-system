<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing with Correct Department ===\n\n";

// Test with department 2215 (Software Engineering) which has evaluations
$departmentId = 2215;
$studentId = 39192; // Leta Tsegaye - has no submissions

echo "Testing for Student ID: {$studentId}\n";
echo "Department ID: {$departmentId} (Software Engineering)\n\n";

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
    } else {
        echo "  ✅ Student can submit this evaluation\n";
    }
    
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

// Test submission for the first available evaluation
if ($evaluations->count() > 0) {
    $testEval = $evaluations->first();
    echo "=== Testing Submission for Evaluation {$testEval->id} ===\n\n";
    
    // Check if evaluation has questions
    $detailedEval = \App\Models\Evaluation::with(['questions'])->find($testEval->id);
    if ($detailedEval->questions->count() === 0) {
        echo "❌ This evaluation has no questions - would cause 422 error!\n";
    } else {
        echo "✅ Evaluation has {$detailedEval->questions->count()} questions\n";
        
        // Show sample questions
        foreach ($detailedEval->questions->take(3) as $q) {
            echo "  - Q{$q->id} ({$q->type}): " . substr($q->text, 0, 50) . "...\n";
        }
        
        // Test if student can submit
        $submissionValidationService = app(\App\Services\SubmissionValidationService::class);
        $canSubmit = $submissionValidationService->validateSubmissionEligibility($studentId, $testEval->id);
        
        echo "\nCan student submit: " . ($canSubmit ? 'YES ✅' : 'NO ❌') . "\n";
        
        if ($canSubmit) {
            echo "✅ Student {$studentId} can submit evaluation {$testEval->id}\n";
            echo "This should work without 422 error!\n";
        }
    }
}