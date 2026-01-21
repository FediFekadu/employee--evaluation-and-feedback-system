<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use App\Http\Controllers\FeedbackController;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Question;
use App\Models\Feedback;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Frontend Submission Flow ===\n\n";

// Get a fresh evaluation that hasn't been submitted to
$evaluation = Evaluation::with(['questions', 'course.department', 'teacher'])
    ->whereHas('questions')
    ->where('opened_at', '<=', now())
    ->where(function($q) {
        $q->whereNull('closed_at')->orWhere('closed_at', '>=', now());
    })
    ->first();

if (!$evaluation) {
    echo "❌ No available evaluations found\n";
    exit(1);
}

echo "📝 Using Evaluation ID: {$evaluation->id}\n";
echo "📚 Course: {$evaluation->course->title}\n";
echo "👨‍🏫 Teacher: {$evaluation->teacher->name}\n";
echo "❓ Questions: " . $evaluation->questions->count() . "\n\n";

// Find a student who hasn't submitted yet
$student = Student::whereNotIn('id', function($query) use ($evaluation) {
    $query->select('student_id')
          ->from('feedbacks')
          ->where('evaluation_id', $evaluation->id);
})->first();

if (!$student) {
    echo "❌ No students available (all have submitted)\n";
    exit(1);
}

echo "👤 Using Student ID: {$student->id} - {$student->name}\n\n";

// Simulate the frontend submission data
$responses = [];
foreach ($evaluation->questions as $question) {
    if ($question->type === 'rating') {
        $responses[] = [
            'question_id' => $question->id,
            'rating' => 4, // Good rating
            'text' => null
        ];
    } else {
        $responses[] = [
            'question_id' => $question->id,
            'rating' => null,
            'text' => 'This is a sample text response'
        ];
    }
}

$submissionData = [
    'evaluation_id' => $evaluation->id,
    'student_id' => $student->id,
    'anonymous' => true,
    'responses' => $responses
];

echo "📤 Submission Data:\n";
echo "- Evaluation ID: {$submissionData['evaluation_id']}\n";
echo "- Student ID: {$submissionData['student_id']}\n";
echo "- Anonymous: " . ($submissionData['anonymous'] ? 'Yes' : 'No') . "\n";
echo "- Responses: " . count($submissionData['responses']) . "\n\n";

// Test the submission
try {
    // Create a mock request
    $request = Request::create('/api/feedbacks', 'POST', $submissionData);
    
    // Create controller instance with dependencies
    $submissionValidationService = app(\App\Services\SubmissionValidationService::class);
    $auditLogService = app(\App\Services\AuditLogService::class);
    $evaluationAnalyticsService = app(\App\Services\EvaluationAnalyticsService::class);
    
    $controller = new FeedbackController(
        $submissionValidationService,
        $auditLogService,
        $evaluationAnalyticsService
    );
    
    echo "🔄 Attempting submission...\n";
    $response = $controller->store($request);
    
    $statusCode = $response->getStatusCode();
    $responseData = json_decode($response->getContent(), true);
    
    echo "✅ Submission successful!\n";
    echo "📊 Status Code: {$statusCode}\n";
    echo "💬 Message: " . ($responseData['message'] ?? 'No message') . "\n";
    
    if (isset($responseData['feedback'])) {
        echo "🆔 Feedback ID: " . $responseData['feedback']['id'] . "\n";
    }
    
    if (isset($responseData['statistics'])) {
        echo "📈 Statistics:\n";
        echo "  - Total responses: " . $responseData['statistics']['total_responses'] . "\n";
        echo "  - Valid responses: " . $responseData['statistics']['valid_responses'] . "\n";
        echo "  - Completion rate: " . $responseData['statistics']['completion_rate'] . "%\n";
    }
    
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "❌ Validation Error (422):\n";
    echo "💬 Message: " . $e->getMessage() . "\n";
    echo "🔍 Errors:\n";
    foreach ($e->errors() as $field => $messages) {
        echo "  - {$field}: " . implode(', ', $messages) . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Submission Error:\n";
    echo "💬 Message: " . $e->getMessage() . "\n";
    echo "🔍 Type: " . get_class($e) . "\n";
    
    if (method_exists($e, 'getResponse')) {
        $response = $e->getResponse();
        if ($response) {
            echo "📊 Status Code: " . $response->getStatusCode() . "\n";
            echo "📄 Response: " . $response->getContent() . "\n";
        }
    }
}

echo "\n=== Test Complete ===\n";