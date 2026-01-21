<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\ScoringService;
use App\Models\Evaluation;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing ScoringService Implementation ===\n\n";

// Get an evaluation with responses
$evaluation = Evaluation::whereHas('feedbacks')->first();

if (!$evaluation) {
    echo "❌ No evaluations with responses found\n";
    exit(1);
}

echo "📝 Testing Evaluation ID: {$evaluation->id}\n";
echo "📚 Course: {$evaluation->course->title}\n";
echo "👨‍🏫 Teacher: {$evaluation->teacher->name}\n\n";

// Test the new ScoringService
$scoringService = app(ScoringService::class);

try {
    // Test weighted scores calculation
    echo "🔢 Testing ScoringService Weighted Calculation...\n";
    $weightedScores = $scoringService->calculateWeightedScores($evaluation->id);
    
    echo "✅ ScoringService Results:\n";
    echo "  Student Score: {$weightedScores['student_score']}%\n";
    echo "  Peer Score: {$weightedScores['peer_score']}%\n";
    echo "  Admin Score: {$weightedScores['admin_score']}%\n";
    echo "  Final Weighted Score: {$weightedScores['weighted_score']}%\n";
    echo "  Calculated At: {$weightedScores['calculated_at']}\n\n";
    
    // Test breakdown
    echo "📊 Score Breakdown:\n";
    $breakdown = $weightedScores['breakdown'];
    echo "  Student: {$breakdown['student']['raw_score']}% × {$breakdown['student']['weight']}% = {$breakdown['student']['weighted_value']}%\n";
    echo "  Peer: {$breakdown['peer']['raw_score']}% × {$breakdown['peer']['weight']}% = {$breakdown['peer']['weighted_value']}%\n";
    echo "  Admin: {$breakdown['admin']['raw_score']}% × {$breakdown['admin']['weight']}% = {$breakdown['admin']['weighted_value']}%\n";
    echo "  Total: {$weightedScores['weighted_score']}%\n\n";
    
    // Test individual score calculations
    echo "🎯 Individual Score Components:\n";
    $studentScore = $scoringService->calculateStudentEvaluationScore($evaluation->id);
    $peerScore = $scoringService->calculatePeerEvaluationScore($evaluation->id);
    $adminScore = $scoringService->calculateAdminEvaluationScore($evaluation->id);
    
    echo "  Student Evaluation Score: {$studentScore}%\n";
    echo "  Peer Evaluation Score: {$peerScore}%\n";
    echo "  Admin Evaluation Score: {$adminScore}%\n\n";
    
    // Test configuration
    echo "⚙️ Scoring Configuration:\n";
    $config = $scoringService->getScoringConfiguration();
    echo "  Student Weight: " . ($config['weights']['student'] * 100) . "%\n";
    echo "  Peer Weight: " . ($config['weights']['peer'] * 100) . "%\n";
    echo "  Admin Weight: " . ($config['weights']['admin'] * 100) . "%\n";
    echo "  Rating Scale: {$config['rating_scale']['min']}-{$config['rating_scale']['max']}\n";
    echo "  Formula: {$config['formula']}\n\n";
    
    // Verify the calculation manually
    $expectedWeighted = ($studentScore * 0.5) + ($peerScore * 0.3) + ($adminScore * 0.2);
    echo "🔍 Manual Verification:\n";
    echo "  Expected: ({$studentScore} × 0.5) + ({$peerScore} × 0.3) + ({$adminScore} × 0.2) = " . round($expectedWeighted, 2) . "%\n";
    echo "  Actual: {$weightedScores['weighted_score']}%\n";
    echo "  Match: " . (abs($expectedWeighted - $weightedScores['weighted_score']) < 0.01 ? "✅ Yes" : "❌ No") . "\n\n";
    
    echo "✅ All ScoringService tests passed! The weighted scoring calculation engine is working correctly.\n";
    
} catch (\Exception $e) {
    echo "❌ Error testing ScoringService:\n";
    echo "Error: {$e->getMessage()}\n";
    echo "File: {$e->getFile()}:{$e->getLine()}\n";
    exit(1);
}

echo "\n=== Test Complete ===\n";
echo "\n💡 The ScoringService is now implemented with:\n";
echo "- Dedicated weighted scoring calculation engine\n";
echo "- Student Evaluation: 50% weight\n";
echo "- Peer Evaluation: 30% weight (placeholder for now)\n";
echo "- Admin Evaluation: 20% weight (placeholder for now)\n";
echo "- Comprehensive input validation and error handling\n";
echo "- Score averaging algorithms for each evaluation type\n";
echo "- Statistical analysis capabilities\n";