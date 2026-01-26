<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Initializing Peer Evaluation Templates ===\n\n";

// Get all departments
$departments = \App\Models\Department::all();
echo "Found " . $departments->count() . " departments\n\n";

// Define default peer review questions (focused on collegial observations and professionalism)
$peerQuestions = [
    ['text' => 'Demonstrates subject mastery during observed sessions.', 'section' => 'A'],
    ['text' => 'Uses effective instructional strategies observed in class.', 'section' => 'A'],
    ['text' => 'Engages students and facilitates active learning.', 'section' => 'A'],
    ['text' => 'Provides clear explanations and reinforces key concepts.', 'section' => 'A'],
    ['text' => 'Manages class time and activities effectively.', 'section' => 'A'],
    ['text' => 'Shares teaching materials and collaborates with colleagues.', 'section' => 'B'],
    ['text' => 'Open to feedback and demonstrates willingness to improve.', 'section' => 'B'],
    ['text' => 'Shows professionalism and respect toward students and staff.', 'section' => 'B'],
    ['text' => 'Contributes to department activities and mentoring.', 'section' => 'B'],
    ['text' => 'Meets administrative responsibilities in a timely manner.', 'section' => 'C'],
];

$formInfo = [
    'university' => 'BULE-HORA UNIVERSITY',
    'formTitle' => "Peer-to-Peer Teacher Evaluation Criteria",
    'year' => date('Y'),
    'semester' => 'First'
];

$successCount = 0;
$errorCount = 0;

foreach ($departments as $department) {
    echo "=== Processing Department: {$department->name} (ID: {$department->id}) ===\n";
    
    try {
        // Check if peer template already exists
        $existingTemplate = \App\Models\DepartmentPeerEvaluationTemplate::where('department_id', $department->id)
            ->where('is_active', true)
            ->first();
        
        if ($existingTemplate) {
            echo "⚠️ Peer template already exists, updating...\n";
            $template = $existingTemplate;
            $template->update([
                'form_info' => $formInfo,
                'description' => 'Default peer evaluation template focused on observed teaching and collegial professionalism.',
            ]);
        } else {
            // Create new peer template
            $template = \App\Models\DepartmentPeerEvaluationTemplate::create([
                'department_id' => $department->id,
                'name' => 'Default Peer Evaluation Template',
                'description' => 'Default peer evaluation template focused on observed teaching and collegial professionalism.',
                'form_info' => $formInfo,
                'is_active' => true,
            ]);
            echo "✅ Created new peer template\n";
        }
        
        // Remove existing questions
        $template->questions()->delete();
        
        // Add peer questions
        foreach ($peerQuestions as $index => $questionData) {
            \App\Models\PeerTemplateQuestion::create([
                'template_id' => $template->id,
                'text' => $questionData['text'],
                'type' => 'rating',
                'section' => $questionData['section'],
                'order' => $index + 1,
            ]);
        }
        
        echo "✅ Added " . count($peerQuestions) . " peer questions\n";
        $successCount++;
        
    } catch (\Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
        $errorCount++;
    }
    
    echo "\n";
}

echo "=== SUMMARY ===\n";
echo "✅ Successfully processed: {$successCount} departments\n";
echo "❌ Failed to process: {$errorCount} departments\n\n";

if ($successCount > 0) {
    echo "🎉 SUCCESS! Peer evaluation templates have been initialized.\n\n";
    echo "What this means:\n";
    echo "✅ Each department now has a peer-specific evaluation template\n";
    echo "✅ Future peer evaluations can use these questions\n";
    echo "✅ Departments can manage peer evaluation forms separately from student forms\n\n";
    
    echo "Next steps:\n";
    echo "1. Update frontend to fetch template with ?audience=peer\n";
    echo "2. Ensure peer evaluation flows use the peer template questions\n";
}