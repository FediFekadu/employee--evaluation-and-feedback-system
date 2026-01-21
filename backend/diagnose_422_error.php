<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Question;
use App\Models\Feedback;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Diagnosing 422 Error ===\n\n";

// Check what evaluations are available for students
$availableEvaluations = Evaluation::with(['questions', 'course', 'teacher'])
    ->where('opened_at', '<=', now())
    ->where(function($q) {
        $q->whereNull('closed_at')->orWhere('closed_at', '>=', now());
    })
    ->get();

echo "📊 Available evaluations for students: " . $availableEvaluations->count() . "\n\n";

foreach ($availableEvaluations as $evaluation) {
    echo "📝 Evaluation ID: {$evaluation->id}\n";
    echo "📚 Course: {$evaluation->course->title}\n";
    echo "👨‍🏫 Teacher: {$evaluation->teacher->name}\n";
    echo "❓ Questions: " . $evaluation->questions->count() . "\n";
    
    // Check if questions exist
    $questionIds = $evaluation->questions->pluck('id')->toArray();
    $existingQuestions = Question::whereIn('id', $questionIds)->count();
    echo "✅ Valid questions: {$existingQuestions}/{$evaluation->questions->count()}\n";
    
    // Check submissions
    $submissionCount = Feedback::where('evaluation_id', $evaluation->id)->count();
    echo "📤 Submissions: {$submissionCount}\n";
    
    // Check students who haven't submitted
    $totalStudents = Student::count();
    $submittedStudents = Feedback::where('evaluation_id', $evaluation->id)
        ->distinct('student_id')
        ->count();
    $availableStudents = $totalStudents - $submittedStudents;
    echo "👥 Students available to submit: {$availableStudents}/{$totalStudents}\n";
    
    echo "---\n";
}

// Common 422 error causes
echo "\n🔍 Common 422 Error Causes:\n\n";

echo "1. **Duplicate Submission Check**\n";
echo "   - Student has already submitted this evaluation\n";
echo "   - Check: SELECT * FROM feedbacks WHERE evaluation_id = X AND student_id = Y\n\n";

echo "2. **Invalid Question IDs**\n";
echo "   - Frontend sending question IDs that don't exist\n";
echo "   - Check: Questions loaded from template vs actual question IDs\n\n";

echo "3. **Validation Failures**\n";
echo "   - Missing required fields (evaluation_id, student_id, responses)\n";
echo "   - Invalid rating values (not 1-5)\n";
echo "   - Invalid text content (contains forbidden characters)\n\n";

echo "4. **Evaluation Status Issues**\n";
echo "   - Evaluation is closed or not yet open\n";
echo "   - Check: opened_at <= now() AND (closed_at IS NULL OR closed_at >= now())\n\n";

// Test a specific scenario
echo "🧪 Testing Specific Scenario:\n\n";

$testEvaluation = $availableEvaluations->first();
if ($testEvaluation) {
    echo "Using evaluation: {$testEvaluation->id}\n";
    
    // Find a student who hasn't submitted
    $availableStudent = Student::whereNotIn('id', function($query) use ($testEvaluation) {
        $query->select('student_id')
              ->from('feedbacks')
              ->where('evaluation_id', $testEvaluation->id);
    })->first();
    
    if ($availableStudent) {
        echo "Using student: {$availableStudent->id} - {$availableStudent->name}\n";
        
        // Check if this combination would cause a 422
        $existingSubmission = Feedback::where('evaluation_id', $testEvaluation->id)
            ->where('student_id', $availableStudent->id)
            ->exists();
        
        if ($existingSubmission) {
            echo "❌ Would cause 422: Duplicate submission exists\n";
        } else {
            echo "✅ Should work: No duplicate submission\n";
        }
        
        // Check question validity
        $questionIds = $testEvaluation->questions->pluck('id')->toArray();
        $validQuestions = Question::whereIn('id', $questionIds)->count();
        
        if ($validQuestions === $testEvaluation->questions->count()) {
            echo "✅ All questions are valid\n";
        } else {
            echo "❌ Some questions are invalid\n";
        }
        
    } else {
        echo "❌ No available students (all have submitted)\n";
    }
} else {
    echo "❌ No available evaluations\n";
}

echo "\n=== Diagnosis Complete ===\n";
echo "\n💡 To fix 422 errors:\n";
echo "1. Check browser console for exact error details\n";
echo "2. Verify student hasn't already submitted\n";
echo "3. Ensure evaluation is open and has valid questions\n";
echo "4. Check Laravel logs: storage/logs/laravel.log\n";