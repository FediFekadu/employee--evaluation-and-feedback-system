<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Specific Evaluation Questions ===\n\n";

// Check the evaluation that's likely being shown to the student
// Based on our earlier analysis, evaluation 3494 or 3495 should have the most questions

$evaluationIds = [3494, 3495];

foreach ($evaluationIds as $evalId) {
    echo "=== Evaluation {$evalId} ===\n";
    
    $evaluation = \App\Models\Evaluation::with(['course', 'teacher', 'questions'])->find($evalId);
    
    if (!$evaluation) {
        echo "❌ Evaluation not found!\n\n";
        continue;
    }
    
    echo "Course: " . ($evaluation->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($evaluation->teacher->name ?? 'N/A') . "\n";
    echo "Department: " . ($evaluation->course->department->name ?? 'N/A') . "\n";
    echo "Questions: " . $evaluation->questions->count() . "\n";
    echo "Status: " . ($evaluation->closed_at ? 'Closed' : 'Open') . "\n\n";
    
    if ($evaluation->questions->count() > 0) {
        echo "All Questions:\n";
        foreach ($evaluation->questions as $index => $question) {
            echo ($index + 1) . ". [{$question->type}] " . $question->text . "\n";
        }
        echo "\n";
        
        // Check if this matches the comprehensive form
        if ($evaluation->questions->count() >= 25) {
            echo "✅ This evaluation has comprehensive questions!\n";
        } else {
            echo "⚠️ This evaluation has limited questions.\n";
        }
    } else {
        echo "❌ No questions found!\n";
    }
    
    echo "\n" . str_repeat("=", 60) . "\n\n";
}

// Also check if there are any evaluations with 29 questions
echo "=== Searching for Evaluations with 25+ Questions ===\n\n";

$comprehensiveEvals = \App\Models\Evaluation::with(['course', 'teacher', 'questions'])
    ->get()
    ->filter(function($eval) {
        return $eval->questions->count() >= 25;
    });

if ($comprehensiveEvals->count() > 0) {
    foreach ($comprehensiveEvals as $eval) {
        echo "Found comprehensive evaluation {$eval->id}: {$eval->questions->count()} questions\n";
        echo "Course: " . ($eval->course->title ?? 'N/A') . "\n";
        echo "Teacher: " . ($eval->teacher->name ?? 'N/A') . "\n\n";
    }
} else {
    echo "❌ No evaluations found with 25+ questions!\n";
    echo "💡 The comprehensive form may not have been saved properly.\n\n";
}

// Check the default sections from the department form
echo "=== Expected Comprehensive Form Structure ===\n";
echo "Section A: INSTRUCTIONAL SKILLS (14 questions)\n";
echo "Section B: PROFESSIONAL ETHICS & ATTITUDE (8 questions)\n";
echo "Section C: ASSESSMENT METHODS & FEEDBACK (7 questions)\n";
echo "Total Expected: 29 questions\n\n";

echo "💡 If no evaluation has 29 questions, the department needs to:\n";
echo "1. Go to Department > Evaluations\n";
echo "2. Select an evaluation\n";
echo "3. Use the 'Save Evaluation Form' button to save all 29 questions\n";