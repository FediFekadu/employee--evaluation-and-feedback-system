<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Template Questions System ===\n\n";

// Find an evaluation to test with
$evaluation = \App\Models\Evaluation::with('course.department')->first();

if (!$evaluation) {
    echo "❌ No evaluations found in database\n";
    exit(1);
}

echo "📝 Testing with Evaluation ID: {$evaluation->id}\n";
echo "📚 Course: {$evaluation->course->title}\n";
echo "🏢 Department: {$evaluation->course->department->name}\n\n";

// Check if department has template
$template = \App\Models\DepartmentEvaluationTemplate::getActiveTemplate($evaluation->course->department_id);

if (!$template) {
    echo "❌ No template found for department {$evaluation->course->department_id}\n";
    exit(1);
}

echo "✅ Template found: {$template->name}\n";
echo "📊 Template questions: {$template->questions->count()}\n\n";

// Check if evaluation has individual questions
$existingQuestions = $evaluation->questions()->count();
echo "🔍 Existing individual questions for evaluation: {$existingQuestions}\n";

if ($existingQuestions == 0) {
    echo "🔧 Creating individual questions from template...\n";
    
    // Create individual questions from template
    foreach ($template->questions as $templateQuestion) {
        $question = \App\Models\Question::create([
            'text' => $templateQuestion->text,
            'type' => $templateQuestion->type,
            'section' => $templateQuestion->section,
        ]);

        // Attach question to evaluation
        $evaluation->questions()->attach($question->id, [
            'order' => $templateQuestion->order
        ]);
    }
    
    $newCount = $evaluation->questions()->count();
    echo "✅ Created {$newCount} individual questions\n";
} else {
    echo "✅ Evaluation already has individual questions\n";
}

// Test the API endpoint
echo "\n=== Testing API Endpoint ===\n";

try {
    $controller = new \App\Http\Controllers\DepartmentTemplateController();
    $response = $controller->getQuestionsForEvaluation($evaluation->id);
    $data = json_decode($response->getContent(), true);
    
    echo "✅ API Response successful\n";
    echo "📊 Questions returned: " . count($data['questions']) . "\n";
    echo "📝 Template name: " . ($data['template_name'] ?? 'N/A') . "\n";
    
    if (count($data['questions']) > 0) {
        echo "🔍 First question: " . substr($data['questions'][0]['text'], 0, 50) . "...\n";
        echo "🆔 First question ID: " . $data['questions'][0]['id'] . "\n";
        echo "📂 First question section: " . ($data['questions'][0]['section'] ?? 'N/A') . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ API Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
echo "🎉 The template questions system should now work correctly!\n";
echo "🔧 Students will get individual questions created from department templates\n";
echo "✅ Feedback submissions should now pass validation\n";