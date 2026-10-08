<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Feedback;
use App\Models\Response;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\EvaluationSubmission;
use App\Models\Question;
use Illuminate\Support\Facades\DB;

try {
    DB::beginTransaction();

    $eval = Evaluation::first();
    if (!$eval) {
        echo "No evaluation found. Run seeders first.\n";
        exit(1);
    }
    
    $student = Student::first();
    if (!$student) {
        echo "No student found.\n";
        exit(1);
    }

    $submission = EvaluationSubmission::create([
        'evaluation_id' => $eval->id,
        'student_id' => $student->id,
        'submitted_at' => now(),
        'is_anonymous' => true,
        'submission_hash' => md5(uniqid()),
    ]);
    
    echo "Submission created: " . $submission->id . "\n";

    $feedback = Feedback::create([
        'evaluation_id' => $eval->id,
        'student_id' => $student->id,
        'submission_id' => $submission->id,
        'anonymous' => true,
        'is_locked' => true,
        'comments' => 'Test feedback',
    ]);

    echo "Feedback created: " . $feedback->id . "\n";

    // Check if feedback exists in DB
    $exists = DB::table('feedbacks')->where('id', $feedback->id)->exists();
    echo "Feedback exists in DB: " . ($exists ? 'Yes' : 'No') . "\n";

    $question = Question::first();
    if (!$question) {
        echo "No question found.\n";
        exit(1);
    }

    $response = Response::create([
        'feedback_id' => $feedback->id,
        'question_id' => $question->id,
        'rating' => 5,
        'text' => null,
    ]);

    echo "Response created: " . $response->id . "\n";

    DB::commit();
    echo "Success!\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
