<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Feedback;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing 422 Submission Issues ===\n\n";

// 1. Clean up any orphaned or duplicate submissions
echo "🧹 Cleaning up duplicate submissions...\n";

$duplicates = Feedback::select('evaluation_id', 'student_id')
    ->groupBy('evaluation_id', 'student_id')
    ->havingRaw('COUNT(*) > 1')
    ->get();

$cleanedCount = 0;
foreach ($duplicates as $duplicate) {
    // Keep the first submission, remove others
    $feedbacks = Feedback::where('evaluation_id', $duplicate->evaluation_id)
        ->where('student_id', $duplicate->student_id)
        ->orderBy('created_at')
        ->get();
    
    $toDelete = $feedbacks->skip(1);
    foreach ($toDelete as $feedback) {
        echo "🗑️ Removing duplicate feedback ID: {$feedback->id}\n";
        $feedback->responses()->delete();
        $feedback->delete();
        $cleanedCount++;
    }
}

echo "✅ Cleaned up {$cleanedCount} duplicate submissions\n\n";

// 2. Verify all evaluations have proper questions
echo "🔍 Verifying evaluation questions...\n";

$evaluations = Evaluation::with('questions')->get();
$fixedCount = 0;

foreach ($evaluations as $evaluation) {
    if ($evaluation->questions->count() === 0) {
        echo "⚠️ Evaluation {$evaluation->id} has no questions\n";
        
        // Try to get questions from department template
        $department = $evaluation->course->department ?? null;
        if ($department) {
            $template = \App\Models\DepartmentEvaluationTemplate::getActiveTemplate($department->id);
            if ($template && $template->questions->count() > 0) {
                echo "🔧 Adding questions from department template...\n";
                
                foreach ($template->questions as $templateQuestion) {
                    $question = \App\Models\Question::create([
                        'text' => $templateQuestion->text,
                        'type' => $templateQuestion->type,
                        'section' => $templateQuestion->section,
                    ]);
                    
                    $evaluation->questions()->attach($question->id, [
                        'order' => $templateQuestion->order
                    ]);
                }
                
                $fixedCount++;
                echo "✅ Added " . $template->questions->count() . " questions to evaluation {$evaluation->id}\n";
            }
        }
    }
}

echo "✅ Fixed {$fixedCount} evaluations with missing questions\n\n";

// 3. Create a test endpoint to help debug 422 errors
echo "🔧 Creating debug endpoint...\n";

$debugContent = '<?php

use Illuminate\Http\Request;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Question;
use App\Models\Feedback;

Route::post("/debug/validate-submission", function (Request $request) {
    $data = $request->all();
    $errors = [];
    $warnings = [];
    
    // Check evaluation exists and is open
    $evaluation = Evaluation::find($data["evaluation_id"] ?? null);
    if (!$evaluation) {
        $errors[] = "Evaluation not found";
    } else {
        $now = now();
        if ($evaluation->opened_at > $now) {
            $errors[] = "Evaluation not yet open";
        }
        if ($evaluation->closed_at && $evaluation->closed_at < $now) {
            $errors[] = "Evaluation is closed";
        }
    }
    
    // Check student exists
    $student = Student::find($data["student_id"] ?? null);
    if (!$student) {
        $errors[] = "Student not found";
    }
    
    // Check for duplicate submission
    if ($evaluation && $student) {
        $existing = Feedback::where("evaluation_id", $evaluation->id)
            ->where("student_id", $student->id)
            ->exists();
        if ($existing) {
            $errors[] = "Student has already submitted this evaluation";
        }
    }
    
    // Check responses
    $responses = $data["responses"] ?? [];
    if (empty($responses)) {
        $errors[] = "No responses provided";
    } else {
        foreach ($responses as $index => $response) {
            $questionId = $response["question_id"] ?? null;
            if (!$questionId) {
                $errors[] = "Response {$index}: Missing question_id";
                continue;
            }
            
            $question = Question::find($questionId);
            if (!$question) {
                $errors[] = "Response {$index}: Question {$questionId} not found";
                continue;
            }
            
            if ($question->type === "rating") {
                $rating = $response["rating"] ?? null;
                if ($rating !== null && ($rating < 1 || $rating > 5)) {
                    $errors[] = "Response {$index}: Invalid rating value";
                }
            }
        }
    }
    
    return response()->json([
        "valid" => empty($errors),
        "errors" => $errors,
        "warnings" => $warnings,
        "debug_info" => [
            "evaluation_id" => $data["evaluation_id"] ?? null,
            "student_id" => $data["student_id"] ?? null,
            "responses_count" => count($responses),
            "evaluation_exists" => isset($evaluation),
            "student_exists" => isset($student),
            "evaluation_open" => isset($evaluation) && $evaluation->opened_at <= now() && (!$evaluation->closed_at || $evaluation->closed_at >= now())
        ]
    ]);
});';

file_put_contents(__DIR__ . '/routes/debug.php', $debugContent);
echo "✅ Created debug endpoint at /api/debug/validate-submission\n\n";

// 4. Show current system status
echo "📊 Current System Status:\n\n";

$totalEvaluations = Evaluation::count();
$openEvaluations = Evaluation::where('opened_at', '<=', now())
    ->where(function($q) {
        $q->whereNull('closed_at')->orWhere('closed_at', '>=', now());
    })->count();

$totalStudents = Student::count();
$totalSubmissions = Feedback::count();

echo "📝 Total evaluations: {$totalEvaluations}\n";
echo "🟢 Open evaluations: {$openEvaluations}\n";
echo "👥 Total students: {$totalStudents}\n";
echo "📤 Total submissions: {$totalSubmissions}\n\n";

// Show evaluations with submission counts
echo "📊 Evaluation Submission Status:\n";
$evaluations = Evaluation::with(['course', 'teacher'])->get();
foreach ($evaluations as $evaluation) {
    $submissionCount = Feedback::where('evaluation_id', $evaluation->id)->count();
    $isOpen = $evaluation->opened_at <= now() && (!$evaluation->closed_at || $evaluation->closed_at >= now());
    $status = $isOpen ? '🟢 OPEN' : '🔴 CLOSED';
    
    echo "  {$status} Evaluation {$evaluation->id}: {$submissionCount} submissions\n";
    echo "    Course: {$evaluation->course->title}\n";
    echo "    Teacher: {$evaluation->teacher->name}\n";
    echo "    Questions: " . $evaluation->questions()->count() . "\n";
    echo "\n";
}

echo "=== Fix Complete ===\n\n";

echo "💡 To prevent 422 errors:\n";
echo "1. Always check if student has already submitted before showing evaluation form\n";
echo "2. Validate evaluation is open before allowing submission\n";
echo "3. Ensure all question IDs exist in the database\n";
echo "4. Use the debug endpoint to troubleshoot specific issues\n";
echo "5. Check Laravel logs for detailed error information\n";