<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Evaluation;
use App\Models\PeerEvaluation;
use App\Models\PeerEvaluationResponse;
use App\Services\EvaluationAnalyticsService;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

echo "=== Seeding Peer Response for First Evaluation with Feedbacks ===\n\n";

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

// Seed a peer response with an 80% score
$responses = [
    ['question_id' => 1, 'rating' => 4, 'text' => 'Good instruction'],
    ['question_id' => 2, 'rating' => 4, 'text' => 'Engaged with students'],
    ['question_id' => 3, 'rating' => 4, 'text' => 'Clear assessment methods'],
];

$score = 80.0; // average 4/5 => 80%

$record = PeerEvaluationResponse::create([
    'peer_evaluation_id' => $peerEval->id,
    'evaluator_teacher_id' => $evaluation->teacher_id, // For seeding, reuse teacher ID
    'responses' => $responses,
    'score' => $score,
    'submitted_at' => now(),
]);

echo "✅ Seeded peer response (ID: {$record->id}) with score {$score}% for teacher {$evaluation->teacher->name}.\n";

// Show weighted scores now that peer response exists
$analyticsService = app(EvaluationAnalyticsService::class);
$weightedScores = $analyticsService->calculateWeightedScores($evaluation->id);

echo "\n🔢 Weighted Scores After Seeding:\n";
echo "  Student Score: {$weightedScores['student_score']}%\n";
echo "  Peer Score: {$weightedScores['peer_score']}%\n";
echo "  Admin Score: {$weightedScores['admin_score']}%\n";
echo "  Final Weighted Score: {$weightedScores['weighted_score']}%\n";
echo "  Performance Level: {$weightedScores['performance_level']}\n";

echo "\n=== Done ===\n";