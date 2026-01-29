<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Evaluation Results Endpoint\n";
echo "===================================\n\n";

try {
    // Find an evaluation with responses
    $evaluation = \App\Models\Evaluation::with(['course', 'teacher', 'feedbacks'])
        ->whereHas('feedbacks')
        ->first();
    
    if (!$evaluation) {
        echo "❌ No evaluations with responses found\n";
        exit(1);
    }
    
    echo "✅ Found evaluation: {$evaluation->id}\n";
    echo "  Course: {$evaluation->course->title}\n";
    echo "  Teacher: {$evaluation->teacher->name}\n";
    echo "  Feedbacks: {$evaluation->feedbacks->count()}\n\n";
    
    // Test the results endpoint
    $controller = new \App\Http\Controllers\EvaluationController();
    $response = $controller->results($evaluation);
    
    $responseData = json_decode($response->getContent(), true);
    
    echo "Status Code: {$response->getStatusCode()}\n";
    
    if ($response->getStatusCode() === 200) {
        echo "✅ Evaluation results endpoint working!\n\n";
        
        echo "Response Summary:\n";
        echo "- Evaluation ID: {$responseData['evaluation_id']}\n";
        echo "- Course: {$responseData['course_information']['course']}\n";
        echo "- Instructor: {$responseData['instructor_information']['name']}\n";
        echo "- Teacher ID: " . ($responseData['instructor_information']['teacher_id'] ?? 'MISSING') . "\n";
        echo "- Total Responses: {$responseData['quick_stats']['total_responses']}\n";
        echo "- Participation Rate: {$responseData['quick_stats']['participation_rate']}%\n";
        echo "- Academic Year: {$responseData['academic_year']}\n";
        echo "- Semester: {$responseData['semester']}\n";
        
        if (isset($responseData['final_score'])) {
            echo "- Final Score: {$responseData['final_score']}%\n";
        }
        
        if (isset($responseData['score_breakdown'])) {
            echo "- Score Breakdown Available: Yes\n";
        }
        
    } else {
        echo "❌ Evaluation results endpoint failed!\n";
        echo "Response: " . $response->getContent() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTest completed.\n";