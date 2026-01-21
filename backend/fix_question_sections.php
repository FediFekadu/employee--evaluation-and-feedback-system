<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing Question Sections ===\n\n";

// Get all evaluations that have questions without sections
$evaluations = \App\Models\Evaluation::with(['questions', 'course.department'])->get();

$fixedCount = 0;
$skippedCount = 0;

foreach ($evaluations as $evaluation) {
    echo "Processing Evaluation {$evaluation->id} - {$evaluation->course->title}\n";
    
    // Check if questions need fixing (have null sections)
    $questionsNeedingFix = $evaluation->questions()->whereNull('section')->count();
    
    if ($questionsNeedingFix == 0) {
        echo "  ✅ Questions already have sections\n";
        $skippedCount++;
        continue;
    }
    
    echo "  🔧 {$questionsNeedingFix} questions need section data\n";
    
    // Get department template
    $template = \App\Models\DepartmentEvaluationTemplate::getActiveTemplate($evaluation->course->department_id);
    
    if (!$template) {
        echo "  ❌ No template found for department\n";
        continue;
    }
    
    // Clear existing questions and recreate from template
    echo "  🗑️ Removing old questions without sections\n";
    $evaluation->questions()->detach();
    
    // Delete orphaned questions (questions not attached to any evaluation)
    $orphanedQuestions = \App\Models\Question::whereDoesntHave('evaluations')->get();
    foreach ($orphanedQuestions as $orphan) {
        $orphan->delete();
    }
    
    echo "  ✨ Creating new questions from template\n";
    
    // Create new questions from template
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
    echo "  ✅ Created {$newCount} questions with sections\n";
    $fixedCount++;
}

echo "\n=== Summary ===\n";
echo "✅ Fixed: {$fixedCount} evaluations\n";
echo "⏭️ Skipped: {$skippedCount} evaluations (already had sections)\n";
echo "🎉 All questions now have proper section data!\n";