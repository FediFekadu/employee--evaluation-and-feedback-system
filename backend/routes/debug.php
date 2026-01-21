<?php

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
});