<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\HodEvaluationController;
use App\Http\Controllers\PeerEvaluationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Broadcasting authentication route with enhanced security
Route::middleware(['auth:sanctum', 'websocket.auth'])->post('/broadcasting/auth', function (Request $request) {
    // The actual authorization is handled by Laravel's broadcasting system
    // This route just validates the authentication token
    return response()->json(['auth' => true]);
});

// Auth routes for SPA
Route::post('/auth/login/student', [AuthController::class, 'loginStudent']);
Route::post('/auth/login/student-password', [AuthController::class, 'loginStudentPassword']);
Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Public/basic endpoints for initial scaffolding
Route::get('/courses', [CourseController::class, 'index']);
Route::post('/courses', [CourseController::class, 'store']);
Route::get('/courses/{course}', [CourseController::class, 'show']);
Route::put('/courses/{course}', [CourseController::class, 'update']);
Route::post('/courses/{id}/assign-teacher', [CourseController::class, 'assignTeacher']);

Route::get('/evaluations', [EvaluationController::class, 'index']);
Route::post('/evaluations', [EvaluationController::class, 'store']);
Route::get('/evaluations/{evaluation}', [EvaluationController::class, 'show']);
Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update']);
Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy']);
Route::post('/evaluations/{evaluation}/close', [EvaluationController::class, 'close']);
Route::get('/evaluations/{evaluation}/summary', [EvaluationController::class, 'summary']);
Route::put('/evaluations/{evaluation}/questions', [EvaluationController::class, 'setQuestions']);

// New enhanced endpoints
Route::get('/evaluations/{evaluation}/submission-status', [EvaluationController::class, 'submissionStatus']);
Route::get('/evaluations/{evaluation}/analytics', [EvaluationController::class, 'analytics']);
Route::get('/evaluations/{evaluation}/results', [EvaluationController::class, 'results']);
Route::post('/evaluations/{evaluation}/export', [EvaluationController::class, 'export']);

// Participation monitoring endpoints
Route::get('/evaluations/low-participation', [EvaluationController::class, 'lowParticipation']);
Route::get('/evaluations/participation-summary', [EvaluationController::class, 'participationSummary']);
Route::post('/evaluations/send-reminders', [EvaluationController::class, 'sendReminders']);
Route::get('/evaluations/completion-rates', [EvaluationController::class, 'completionRates']);

// Historical analysis endpoints
Route::post('/evaluations/historical-comparison', [EvaluationController::class, 'historicalComparison']);
Route::post('/evaluations/trend-analysis', [EvaluationController::class, 'trendAnalysis']);
Route::post('/evaluations/fair-teacher-comparison', [EvaluationController::class, 'fairTeacherComparison']);
Route::post('/evaluations/department-benchmarking', [EvaluationController::class, 'departmentBenchmarking']);
Route::post('/evaluations/department-aggregation', [EvaluationController::class, 'departmentAggregation']);

Route::post('/feedbacks', [FeedbackController::class, 'store']);

// Department management
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/departments/{department}', [DepartmentController::class, 'show']);
Route::get('/departments/{department}/evaluation-results', [DepartmentController::class, 'evaluationResults']);
Route::get('/departments/{department}/evaluation-results/poll', [DepartmentController::class, 'pollEvaluationResults']);
Route::get('/departments/{department}/teachers/{teacherId}/course-ratings', [DepartmentController::class, 'teacherCourseRatings']);
Route::get('/departments/{department}/analytics', [DepartmentController::class, 'analytics']);
Route::get('/departments/{department}/reports', [DepartmentController::class, 'reports'])
    ->middleware('throttle:analytics');
Route::get('/departments/{department}/teacher-rankings', [DepartmentController::class, 'teacherRankings'])
    ->middleware('throttle:analytics');
Route::get('/departments/{department}/visual-analytics', [DepartmentController::class, 'visualAnalytics'])
    ->middleware('throttle:heavy'); // Most restrictive for heavy computation
Route::get('/departments/{department}/performance-insights', [DepartmentController::class, 'performanceInsights'])
    ->middleware('throttle:analytics');
Route::post('/departments', [DepartmentController::class, 'store']);
Route::put('/departments/{department}', [DepartmentController::class, 'update']);
Route::delete('/departments/{department}', [DepartmentController::class, 'destroy']);
Route::post('/departments/{department}/assign-admin', [DepartmentController::class, 'assignAdmin']);
Route::post('/departments/{department}/export', [DepartmentController::class, 'export']);

// Department Template routes
Route::get('/departments/{department}/template', [App\Http\Controllers\DepartmentTemplateController::class, 'getTemplate']);
Route::put('/departments/{department}/template', [App\Http\Controllers\DepartmentTemplateController::class, 'updateTemplate']);
Route::get('/evaluations/{evaluation}/template-questions', [App\Http\Controllers\DepartmentTemplateController::class, 'getQuestionsForEvaluation']);

// Peer Template routes
Route::get('/departments/{department}/peer-template', [App\Http\Controllers\PeerTemplateController::class, 'getTemplate']);
Route::put('/departments/{department}/peer-template', [App\Http\Controllers\PeerTemplateController::class, 'updateTemplate']);
Route::get('/evaluations/{evaluation}/peer-template-questions', [App\Http\Controllers\PeerTemplateController::class, 'getQuestionsForEvaluation']);

// HOD Template routes
Route::get('/departments/{department}/hod-template', [App\Http\Controllers\HodTemplateController::class, 'getTemplate']);
Route::put('/departments/{department}/hod-template', [App\Http\Controllers\HodTemplateController::class, 'updateTemplate']);

// HOD Evaluations
Route::get('/departments/{department}/hod-evaluations', [HodEvaluationController::class, 'index']);
Route::post('/hod-evaluations/{hodEvaluation}/score', [HodEvaluationController::class, 'setScore'])->middleware('role:hod,department_admin');

// Peer Evaluations
Route::get('/peer-evaluations/{peerEvaluation}', [PeerEvaluationController::class, 'show']);
Route::get('/peer-evaluations/{peerEvaluation}/questions', [PeerEvaluationController::class, 'questions']);
Route::post('/peer-evaluations/{peerEvaluation}/responses', [PeerEvaluationController::class, 'submitResponses']);
// List released/assigned peer evaluations for a teacher
Route::get('/teachers/{teacher}/peer-evaluations', [PeerEvaluationController::class, 'listAssigned']);

// Department admins management
Route::get('/department-admins', [DepartmentController::class, 'listAdmins']);
Route::put('/department-admins/{user}', [DepartmentController::class, 'updateAdmin']);
Route::delete('/department-admins/{user}', [DepartmentController::class, 'deleteAdmin']);

// Teachers (Instructors)
Route::get('/teachers', [TeacherController::class, 'index']);
Route::post('/teachers', [TeacherController::class, 'store']);
Route::get('/teachers/{teacher}', [TeacherController::class, 'show']);

// Students
Route::get('/students', [StudentController::class, 'index']);
Route::post('/departments/{department}/students', [StudentController::class, 'store']);
Route::put('/students/{student}', [StudentController::class, 'update']);

// Channel authorization and monitoring - DISABLED (Real-time functionality removed)
// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/channels/permissions', [App\Http\Controllers\ChannelAuthController::class, 'getUserPermissions']);
//     Route::post('/channels/check-auth', [App\Http\Controllers\ChannelAuthController::class, 'checkChannelAuth']);
//     Route::get('/channels/auth-attempts', [App\Http\Controllers\ChannelAuthController::class, 'getAuthAttempts']);
//     Route::get('/channels/stats', [App\Http\Controllers\ChannelAuthController::class, 'getChannelStats']);
//     Route::post('/channels/test-auth', [App\Http\Controllers\ChannelAuthController::class, 'testChannelAuth']);
// });

// Broadcast performance monitoring - DISABLED (Real-time functionality removed)
// Route::middleware(['auth:sanctum', 'role:college_admin'])->group(function () {
//     Route::get('/broadcast/performance', function () {
//         return response()->json([
//             'success' => true,
//             'message' => 'Real-time broadcasting has been disabled',
//             'data' => []
//         ]);
//     });
//     
//     Route::post('/broadcast/cleanup', function () {
//         return response()->json([
//             'success' => true,
//             'message' => 'Real-time broadcasting has been disabled - no cleanup needed'
//         ]);
//     });
//     
//     Route::post('/broadcast/batch', function (Illuminate\Http\Request $request) {
//         return response()->json([
//             'success' => false,
//             'message' => 'Real-time broadcasting has been disabled',
//             'data' => [
//                 'total_events' => 0,
//                 'successful_broadcasts' => 0
//             ]
//         ]);
//     });
// });

// Health check endpoint (public - no auth required)
Route::get('/health-check', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'server_time' => microtime(true)
    ]);
});

// Debug endpoint for troubleshooting 422 errors
Route::post('/debug/validate-submission', function (Illuminate\Http\Request $request) {
    $data = $request->all();
    $errors = [];
    $warnings = [];
    
    // Check evaluation exists and is open
    $evaluation = \App\Models\Evaluation::find($data['evaluation_id'] ?? null);
    if (!$evaluation) {
        $errors[] = 'Evaluation not found';
    } else {
        $now = now();
        if ($evaluation->opened_at > $now) {
            $errors[] = 'Evaluation not yet open';
        }
        if ($evaluation->closed_at && $evaluation->closed_at < $now) {
            $errors[] = 'Evaluation is closed';
        }
    }
    
    // Check student exists
    $student = \App\Models\Student::find($data['student_id'] ?? null);
    if (!$student) {
        $errors[] = 'Student not found';
    }
    
    // Check for duplicate submission
    if ($evaluation && $student) {
        $existing = \App\Models\Feedback::where('evaluation_id', $evaluation->id)
            ->where('student_id', $student->id)
            ->exists();
        if ($existing) {
            $errors[] = 'Student has already submitted this evaluation';
        }
    }
    
    // Check responses
    $responses = $data['responses'] ?? [];
    if (empty($responses)) {
        $errors[] = 'No responses provided';
    } else {
        foreach ($responses as $index => $response) {
            $questionId = $response['question_id'] ?? null;
            if (!$questionId) {
                $errors[] = "Response {$index}: Missing question_id";
                continue;
            }
            
            $question = \App\Models\Question::find($questionId);
            if (!$question) {
                $errors[] = "Response {$index}: Question {$questionId} not found";
                continue;
            }
            
            if ($question->type === 'rating') {
                $rating = $response['rating'] ?? null;
                if ($rating !== null && ($rating < 1 || $rating > 5)) {
                    $errors[] = "Response {$index}: Invalid rating value";
                }
            }
        }
    }
    
    return response()->json([
        'valid' => empty($errors),
        'errors' => $errors,
        'warnings' => $warnings,
        'debug_info' => [
            'evaluation_id' => $data['evaluation_id'] ?? null,
            'student_id' => $data['student_id'] ?? null,
            'responses_count' => count($responses),
            'evaluation_exists' => isset($evaluation),
            'student_exists' => isset($student),
            'evaluation_open' => isset($evaluation) && $evaluation->opened_at <= now() && (!$evaluation->closed_at || $evaluation->closed_at >= now())
        ]
    ]);
});

// Polling endpoints for graceful degradation
Route::middleware('auth:sanctum')->group(function () {
    
    // Evaluation polling endpoint
    Route::get('/evaluations/poll', [EvaluationController::class, 'poll']);
    
    // Submission polling endpoint  
    Route::get('/submissions/poll', [FeedbackController::class, 'pollSubmissions']);
    
    // Notification polling endpoint
    Route::get('/notifications/poll', [EvaluationController::class, 'pollNotifications']);
    
    // Missed updates endpoint for reconnection sync
    Route::get('/missed-updates', [EvaluationController::class, 'getMissedUpdates']);
});
