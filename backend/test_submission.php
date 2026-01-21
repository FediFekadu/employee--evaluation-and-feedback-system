<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Student Submission ===\n\n";

// Get an available evaluation
$evaluation = \App\Models\Evaluation::with(['questions'])
    ->where(function($query) {
        $query->whereNull('opened_at')
              ->orWhere('opened_at', '<=', now()->toDateString());
    })
    ->where(function($query) {
        $query->whereNull('closed_at')
              ->orWhere('closed_at', '>', now()->toDateString());
    })
    ->whereHas('questions')
    ->first();

if (!$evaluation) {
    echo "❌ No available evaluation with questions found!\n";
    exit;
}

echo "Using evaluation ID: {$evaluation->id}\n";
echo "Course: " . ($evaluation->course->title ?? 'N/A') . "\n";
echo "Questions: " . $evaluation->questions->count() . "\n\n";

// Get a student
$student = \App\Models\Student::first();
if (!$student) {
    echo "❌ No student found!\n";
    exit;
}

echo "Using student ID: {$student->id} - {$student->name}\n\n";

// Build sample responses like the frontend would
$responses = [];
foreach ($evaluation->questions as $question) {
    if ($question->type === 'rating') {
        $responses[] = [
            'question_id' => $question->id,
            'rating' => 4, // Sample rating
            'text' => null
        ];
    } else {
        $responses[] = [
            'question_id' => $question->id,
            'rating' => null,
            'text' => 'Sample text response'
        ];
    }
}

echo "Sample submission data:\n";
$submissionData = [
    'evaluation_id' => $evaluation->id,
    'student_id' => $student->id,
    'anonymous' => true,
    'responses' => $responses
];

echo json_encode($submissionData, JSON_PRETTY_PRINT) . "\n\n";

// Test the validation manually
echo "=== Testing Validation ===\n";

// Check if evaluation exists
$evalExists = \App\Models\Evaluation::where('id', $evaluation->id)->exists();
echo "Evaluation exists: " . ($evalExists ? 'YES' : 'NO') . "\n";

// Check if student exists
$studentExists = \App\Models\Student::where('id', $student->id)->exists();
echo "Student exists: " . ($studentExists ? 'YES' : 'NO') . "\n";

// Check if questions exist
foreach ($responses as $response) {
    $questionExists = \App\Models\Question::where('id', $response['question_id'])->exists();
    echo "Question {$response['question_id']} exists: " . ($questionExists ? 'YES' : 'NO') . "\n";
}

// Check for existing submission
$existingSubmission = \App\Models\Feedback::where('evaluation_id', $evaluation->id)
    ->where('student_id', $student->id)
    ->exists();
echo "Existing submission: " . ($existingSubmission ? 'YES - would cause duplicate error' : 'NO') . "\n";

echo "\n=== Validation Rules Check ===\n";
echo "evaluation_id: required|exists:evaluations,id - " . ($evalExists ? '✅' : '❌') . "\n";
echo "student_id: required|exists:students,id - " . ($studentExists ? '✅' : '❌') . "\n";
echo "responses: required|array|min:1 - " . (count($responses) > 0 ? '✅' : '❌') . "\n";

foreach ($responses as $i => $response) {
    echo "responses.{$i}.question_id: required|exists:questions,id - ";
    $qExists = \App\Models\Question::where('id', $response['question_id'])->exists();
    echo ($qExists ? '✅' : '❌') . "\n";
    
    if ($response['rating'] !== null) {
        echo "responses.{$i}.rating: integer|min:1|max:5 - ";
        echo (is_int($response['rating']) && $response['rating'] >= 1 && $response['rating'] <= 5 ? '✅' : '❌') . "\n";
    }
    
    if ($response['text'] !== null) {
        echo "responses.{$i}.text: string|max:1000|regex - ";
        $textValid = is_string($response['text']) && 
                    strlen($response['text']) <= 1000 && 
                    !preg_match('/[<>\'";]/', $response['text']);
        echo ($textValid ? '✅' : '❌') . "\n";
    }
}