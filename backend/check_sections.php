<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Section Data ===\n\n";

// Check template questions
$templateQuestion = \App\Models\TemplateQuestion::first();
if ($templateQuestion) {
    echo "Template Question ID: {$templateQuestion->id}\n";
    echo "Template Question Section: " . ($templateQuestion->section ?? 'NULL') . "\n";
    echo "Template Question Text: " . substr($templateQuestion->text, 0, 50) . "...\n\n";
}

// Check individual questions
$question = \App\Models\Question::first();
if ($question) {
    echo "Individual Question ID: {$question->id}\n";
    echo "Individual Question Section: " . ($question->section ?? 'NULL') . "\n";
    echo "Individual Question Text: " . substr($question->text, 0, 50) . "...\n\n";
}

// Check if sections are being copied correctly
$evaluation = \App\Models\Evaluation::first();
if ($evaluation) {
    $questions = $evaluation->questions()->get();
    echo "Evaluation {$evaluation->id} has " . $questions->count() . " questions\n";
    
    if ($questions->count() > 0) {
        $firstQuestion = $questions->first();
        echo "First question section: " . ($firstQuestion->section ?? 'NULL') . "\n";
    }
}