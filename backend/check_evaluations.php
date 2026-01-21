<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Evaluations and Questions ===\n\n";

// Check evaluations
$evaluations = \App\Models\Evaluation::with(['course', 'teacher', 'questions'])->get();
echo "Total evaluations: " . $evaluations->count() . "\n\n";

foreach ($evaluations as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "Course: " . ($eval->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($eval->teacher->name ?? 'N/A') . "\n";
    echo "Questions: " . $eval->questions->count() . "\n";
    echo "Status: " . ($eval->closed_at ? 'Closed' : 'Open') . "\n";
    
    if ($eval->questions->count() > 0) {
        echo "Sample questions:\n";
        foreach ($eval->questions->take(3) as $q) {
            echo "  - Q{$q->id}: " . substr($q->text, 0, 60) . "...\n";
        }
    } else {
        echo "  ⚠️  NO QUESTIONS CONFIGURED!\n";
    }
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

// Check if there are any questions at all
$totalQuestions = \App\Models\Question::count();
echo "Total questions in database: {$totalQuestions}\n";

if ($totalQuestions > 0) {
    echo "\nSample questions:\n";
    $questions = \App\Models\Question::take(5)->get();
    foreach ($questions as $q) {
        echo "  - Q{$q->id}: " . substr($q->text, 0, 60) . "...\n";
    }
}