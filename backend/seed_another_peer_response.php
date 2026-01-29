<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Evaluation;
use App\Models\PeerEvaluation;
use App\Models\PeerEvaluationResponse;
use App\Models\Teacher;
use Illuminate\Support\Facades\Cache;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

echo "=== Seeding Additional Peer Response for First Evaluation with Feedbacks ===\n\n";

// Find the first evaluation that has student feedbacks
$evaluation = Evaluation::with(['course', 'teacher'])
    ->whereHas('feedbacks')
    ->first();

if (!$evaluation) {
    echo "❌ No evaluations with student feedbacks found.\n";
    exit(1);
}

$deptId = $evaluation->department_id ?? ($evaluation->course->department_id ?? null);
if (!$deptId) {
    echo "❌ Evaluation has no department context.\n";
    exit(1);
}

// Ensure peer evaluation exists for the teacher/semester
$peerEval = PeerEvaluation::firstOrCreate([
    'department_id' => $deptId,
    'teacher_id' => $evaluation->teacher_id,
    'academic_year' => $evaluation->academic_year,
    'semester' => $evaluation->semester,
], [
    'status' => 'open',
    'opened_at' => now(),
]);

// Seed an additional peer response with a different score (e.g., 60%)
$responses = [
    ['question_id' => 1, 'rating' => 3, 'text' => 'Satisfactory instruction'],
    ['question_id' => 2, 'rating' => 3, 'text' => 'Moderate engagement with students'],
    ['question_id' => 3, 'rating' => 3, 'text' => 'Assessment methods are acceptable'],
];

$score = 60.0; // average 3/5 => 60%

// Choose a different evaluator teacher in the same department to avoid unique constraint
$alternateEvaluator = Teacher::where('department_id', $deptId)
    ->where('id', '!=', $evaluation->teacher_id)
    ->first();

if (!$alternateEvaluator) {
    echo "ℹ️ No alternate evaluator teacher found in department {$deptId}. Updating existing peer response instead...\n";

    $existing = PeerEvaluationResponse::where('peer_evaluation_id', $peerEval->id)
        ->orderByDesc('submitted_at')
        ->first();

    if (!$existing) {
        // If none exists, create one with the current teacher as evaluator
        $existing = PeerEvaluationResponse::create([
            'peer_evaluation_id' => $peerEval->id,
            'evaluator_teacher_id' => $evaluation->teacher_id,
            'responses' => $responses,
            'score' => $score,
            'submitted_at' => now(),
        ]);
        echo "✅ Created new peer response (ID: {$existing->id}) with score {$score}% using evaluator teacher {$evaluation->teacher->name}.\n";
    } else {
        $existing->update([
            'responses' => $responses,
            'score' => $score,
            'submitted_at' => now(),
        ]);
        echo "✅ Updated existing peer response (ID: {$existing->id}) to score {$score}%.\n";
    }

    $record = $existing;
} else {
    $record = PeerEvaluationResponse::create([
        'peer_evaluation_id' => $peerEval->id,
        'evaluator_teacher_id' => $alternateEvaluator->id,
        'responses' => $responses,
        'score' => $score,
        'submitted_at' => now(),
    ]);

    echo "✅ Seeded additional peer response (ID: {$record->id}) with score {$score}% by evaluator teacher {$alternateEvaluator->name}.\n";
}

// Invalidate cached weighted/comprehensive results for all evaluations of this teacher in the same period
$affectedEvaluationIds = \App\Models\Evaluation::where('teacher_id', $peerEval->teacher_id)
    ->where('academic_year', $peerEval->academic_year)
    ->where('semester', $peerEval->semester)
    ->pluck('id');

foreach ($affectedEvaluationIds as $eid) {
    Cache::forget("weighted_scores_{$eid}");
    Cache::forget("comprehensive_results_{$eid}");
}

echo "🔄 Cleared cached results for affected evaluations: " . implode(', ', $affectedEvaluationIds->toArray()) . "\n";

echo "\n=== Done ===\n";