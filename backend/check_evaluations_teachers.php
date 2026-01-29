<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking evaluations with teachers...\n";

$evaluations = \App\Models\Evaluation::with(['teacher', 'course', 'feedbacks'])
    ->whereNotNull('teacher_id')
    ->take(5)
    ->get();

foreach ($evaluations as $eval) {
    echo "Evaluation ID: {$eval->id}\n";
    echo "  Teacher: " . ($eval->teacher ? $eval->teacher->name : 'NULL') . "\n";
    echo "  Course: " . ($eval->course ? $eval->course->title : 'NULL') . "\n";
    echo "  Feedbacks: {$eval->feedbacks->count()}\n";
    echo "  Department ID: " . ($eval->course ? $eval->course->department_id : 'NULL') . "\n";
    echo "\n";
}