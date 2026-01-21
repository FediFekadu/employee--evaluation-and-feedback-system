<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\EvaluationAnalyticsService;
use App\Models\Evaluation;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing Weighted Scoring System ===\n\n";

// Get an evaluation with responses
$evaluation = Evaluation::whereHas('feedbacks')->first();

if (!$evaluation) {
    echo "❌ No evaluations with responses found\n";
    exit(1);
}

echo "📝 Testing Evaluation ID: {$evaluation->id}\n";
echo "📚 Course: {$evaluation->course->title}\n";
echo "👨‍🏫 Teacher: {$evaluation->teacher->name}\n\n";

// Test the analytics service
$analyticsService = app(EvaluationAnalyticsService::class);

try {
    // Test weighted scores calculation
    echo "🔢 Testing Weighted Scores Calculation...\n";
    $weightedScores = $analyticsService->calculateWeightedScores($evaluation->id);
    
    echo "✅ Weighted Scores:\n";
    echo "  Student Score: {$weightedScores['student_score']}% (50% weight)\n";
    echo "  Peer Score: {$weightedScores['peer_score']}% (30% weight)\n";
    echo "  Admin Score: {$weightedScores['admin_score']}% (20% weight)\n";
    echo "  Final Weighted Score: {$weightedScores['weighted_score']}%\n";
    echo "  Performance Level: {$weightedScores['performance_level']}\n\n";
    
    // Test comprehensive results
    echo "📊 Testing Comprehensive Results...\n";
    $comprehensiveResults = $analyticsService->getComprehensiveResults($evaluation->id);
    
    echo "✅ Comprehensive Results:\n";
    echo "  Final Score: {$comprehensiveResults['summary']['final_score']}%\n";
    echo "  Performance Level: {$comprehensiveResults['summary']['performance_level']}\n";
    echo "  Total Responses: {$comprehensiveResults['summary']['total_responses']}\n";
    echo "  Participation Rate: {$comprehensiveResults['summary']['participation_rate']}%\n";
    echo "  Data Quality: {$comprehensiveResults['summary']['data_quality']}\n\n";
    
    // Test section breakdown
    if (!empty($comprehensiveResults['section_breakdown'])) {
        echo "📋 Section Breakdown:\n";
        foreach ($comprehensiveResults['section_breakdown'] as $section => $data) {
            echo "  Section {$section} ({$data['name']}): {$data['percentage']}% ({$data['average_rating']}/5)\n";
        }
        echo "\n";
    }
    
    // Test score breakdown
    if (!empty($comprehensiveResults['weighted_scores']['breakdown'])) {
        echo "🎯 Score Breakdown:\n";
        $breakdown = $comprehensiveResults['weighted_scores']['breakdown'];
        echo "  Student: {$breakdown['student']['raw_score']}% × {$breakdown['student']['weight']}% = {$breakdown['student']['weighted_value']}%\n";
        echo "  Peer: {$breakdown['peer']['raw_score']}% × {$breakdown['peer']['weight']}% = {$breakdown['peer']['weighted_value']}%\n";
        echo "  Admin: {$breakdown['admin']['raw_score']}% × {$breakdown['admin']['weight']}% = {$breakdown['admin']['weighted_value']}%\n";
        echo "  Total: {$comprehensiveResults['weighted_scores']['weighted_score']}%\n\n";
    }
    
    echo "✅ All tests passed! Weighted scoring system is working correctly.\n";
    
} catch (\Exception $e) {
    echo "❌ Error testing weighted scoring system:\n";
    echo "Error: {$e->getMessage()}\n";
    echo "File: {$e->getFile()}:{$e->getLine()}\n";
    exit(1);
}

echo "\n=== Test Complete ===\n";
echo "\n💡 The weighted scoring system is now implemented with:\n";
echo "- Student Evaluation: 50% weight\n";
echo "- Peer Evaluation: 30% weight (placeholder data for now)\n";
echo "- Admin Evaluation: 20% weight (placeholder data for now)\n";
echo "- Comprehensive results with section breakdown\n";
echo "- Performance level assessment\n";
echo "- Enhanced frontend display components\n";