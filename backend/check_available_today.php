<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Evaluations Available TODAY ===\n\n";
echo "Current date: " . now()->toDateString() . "\n";
echo "Current datetime: " . now() . "\n\n";

// Check evaluations available today
$availableToday = \App\Models\Evaluation::with(['course', 'teacher', 'questions'])
    ->where(function($query) {
        $query->whereNull('opened_at')
              ->orWhere('opened_at', '<=', now()->toDateString());
    })
    ->where(function($query) {
        $query->whereNull('closed_at')
              ->orWhere('closed_at', '>', now()->toDateString());
    })
    ->get();

echo "Evaluations available today: " . $availableToday->count() . "\n\n";

foreach ($availableToday as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "Course: " . ($eval->course->title ?? 'N/A') . "\n";
    echo "Teacher: " . ($eval->teacher->name ?? 'N/A') . "\n";
    echo "Questions: " . $eval->questions->count() . "\n";
    echo "Opened: " . ($eval->opened_at ?? 'N/A') . "\n";
    echo "Closes: " . ($eval->closed_at ?? 'Never') . "\n";
    
    // Check if it's actually available
    $today = now()->toDateString();
    $isOpen = !$eval->opened_at || $eval->opened_at->toDateString() <= $today;
    $isClosed = $eval->closed_at && $eval->closed_at->toDateString() < $today;
    
    echo "Status: ";
    if (!$isOpen) {
        echo "NOT YET OPEN\n";
    } elseif ($isClosed) {
        echo "CLOSED\n";
    } else {
        echo "AVAILABLE ✅\n";
    }
    
    if ($eval->questions->count() > 0) {
        echo "Sample questions:\n";
        foreach ($eval->questions->take(2) as $q) {
            echo "  - Q{$q->id} ({$q->type}): " . substr($q->text, 0, 50) . "...\n";
        }
    } else {
        echo "  ⚠️  NO QUESTIONS!\n";
    }
    echo "\n" . str_repeat("-", 50) . "\n\n";
}