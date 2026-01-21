<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Services\SubmissionValidationService;
use App\Services\AuditLogService;
use App\Services\EvaluationAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FeedbackController extends Controller
{
    private SubmissionValidationService $submissionValidationService;
    private AuditLogService $auditLogService;
    private EvaluationAnalyticsService $evaluationAnalyticsService;

    public function __construct(
        SubmissionValidationService $submissionValidationService, 
        AuditLogService $auditLogService,
        EvaluationAnalyticsService $evaluationAnalyticsService
    ) {
        $this->submissionValidationService = $submissionValidationService;
        $this->auditLogService = $auditLogService;
        $this->evaluationAnalyticsService = $evaluationAnalyticsService;
    }

    /**
     * Check if text contains potentially malicious content
     */
    private function containsMaliciousContent(string $text): bool
    {
        // Check for SQL injection patterns
        $sqlPatterns = [
            '/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|ALTER|CREATE)\s+/i',
            '/[\'";].*(--)/',
            '/\bOR\s+\d+\s*=\s*\d+/i',
            '/\bAND\s+\d+\s*=\s*\d+/i',
        ];

        // Check for XSS patterns
        $xssPatterns = [
            '/<script[^>]*>.*?<\/script>/i',
            '/<iframe[^>]*>.*?<\/iframe>/i',
            '/javascript:/i',
            '/on\w+\s*=/i',
        ];

        $allPatterns = array_merge($sqlPatterns, $xssPatterns);

        foreach ($allPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }

    public function store(Request $request)
    {
        try {
            // Enhanced input validation with detailed error messages
            $data = $request->validate([
                'evaluation_id' => 'required|exists:evaluations,id',
                'student_id' => 'required|exists:students,id',
                'anonymous' => 'boolean',
                'responses' => 'required|array|min:1',
                'responses.*.question_id' => 'required|exists:questions,id',
                'responses.*.rating' => 'nullable|integer|min:1|max:5',
                'responses.*.text' => 'nullable|string|max:1000|regex:/^[^<>\'";]*$/',
            ], [
                'evaluation_id.required' => 'Evaluation ID is required for submission.',
                'evaluation_id.exists' => 'The specified evaluation does not exist or has been removed.',
                'student_id.required' => 'Student identification is required for submission tracking.',
                'student_id.exists' => 'Invalid student credentials. Please log in again.',
                'responses.required' => 'At least one response is required to submit the evaluation.',
                'responses.min' => 'Please provide at least one response before submitting.',
                'responses.*.question_id.required' => 'Each response must be associated with a valid question.',
                'responses.*.question_id.exists' => 'One or more questions are invalid or have been removed.',
                'responses.*.rating.integer' => 'Rating values must be whole numbers.',
                'responses.*.rating.min' => 'Rating values must be between 1 and 5.',
                'responses.*.rating.max' => 'Rating values must be between 1 and 5.',
                'responses.*.text.max' => 'Text responses cannot exceed 1000 characters.',
                'responses.*.text.regex' => 'Text responses contain invalid characters. Please remove any special symbols.',
            ]);

            // Enhanced malicious content validation
            if (isset($data['responses'])) {
                foreach ($data['responses'] as $index => $response) {
                    if (isset($response['text']) && $this->containsMaliciousContent($response['text'])) {
                        return response()->json([
                            'message' => 'Security validation failed',
                            'error' => 'malicious_content',
                            'details' => "Response #{$index} contains potentially harmful content. Please review your input and remove any suspicious text."
                        ], 422);
                    }
                }
            }

            // Check evaluation availability
            $evaluation = \App\Models\Evaluation::find($data['evaluation_id']);
            if (!$evaluation) {
                return response()->json([
                    'message' => 'Evaluation not found',
                    'error' => 'evaluation_not_found'
                ], 404);
            }

            // Check if evaluation is still open
            $today = now()->toDateString();
            if ($evaluation->closed_at && $evaluation->closed_at->toDateString() < $today) {
                return response()->json([
                    'message' => 'This evaluation has been closed and no longer accepts submissions.',
                    'error' => 'evaluation_closed',
                    'closed_at' => $evaluation->closed_at
                ], 422);
            }

            if ($evaluation->opened_at && $evaluation->opened_at->toDateString() > $today) {
                return response()->json([
                    'message' => 'This evaluation is not yet open for submissions.',
                    'error' => 'evaluation_not_open',
                    'opens_at' => $evaluation->opened_at
                ], 422);
            }

            // Enhanced duplicate submission check with detailed response
            if (!$this->submissionValidationService->validateSubmissionEligibility($data['student_id'], $data['evaluation_id'])) {
                $existingSubmission = $this->submissionValidationService->getSubmissionStatus($data['student_id'], $data['evaluation_id']);
                
                return response()->json([
                    'message' => 'Duplicate submission prevented. You have already submitted this evaluation.',
                    'error' => 'duplicate_submission',
                    'submission_details' => [
                        'submitted_at' => $existingSubmission['submitted_at'],
                        'is_anonymous' => $existingSubmission['is_anonymous']
                    ],
                    'help_text' => 'Each student can only submit one evaluation per course-teacher combination. If you believe this is an error, please contact your instructor or administrator.'
                ], 422);
            }

            // Enhanced transaction with better error handling
            return DB::transaction(function () use ($data, $request, $evaluation) {
                try {
                    // Create feedback record with validation
                    $feedback = Feedback::create([
                        'evaluation_id' => $data['evaluation_id'],
                        'student_id' => $data['student_id'],
                        'anonymous' => $data['anonymous'] ?? true,
                    ]);

                    $responseCount = 0;
                    $validResponses = 0;

                    // Create response records with enhanced validation
                    foreach ($data['responses'] as $resp) {
                        $responseCount++;
                        
                        // Skip completely empty responses
                        if (empty($resp['rating']) && empty($resp['text'])) {
                            continue;
                        }
                        
                        $validResponses++;
                        $feedback->responses()->create([
                            'question_id' => $resp['question_id'],
                            'rating' => $resp['rating'] ?? null,
                            'text' => $resp['text'] ?? null,
                        ]);
                    }

                    // Ensure at least some valid responses were provided
                    if ($validResponses === 0) {
                        throw new \Exception('No valid responses provided. Please complete at least one question before submitting.');
                    }

                    // Mark submission as complete
                    $submission = $this->submissionValidationService->markSubmissionComplete(
                        $data['student_id'], 
                        $data['evaluation_id'], 
                        $data['anonymous'] ?? true
                    );

                    // Log successful submission
                    $this->auditLogService->logFeedbackSubmission(
                        $feedback->id, 
                        $data['student_id'], 
                        $data['evaluation_id'], 
                        $request
                    );
                    
                    $this->auditLogService->logEvaluationSubmission(
                        $submission->id, 
                        $data['student_id'], 
                        $data['evaluation_id'], 
                        $request
                    );

                    // Note: Real-time broadcasting has been removed
                    // Calculate participation statistics for logging
                    try {
                        $this->evaluationAnalyticsService->clearCache($data['evaluation_id']);
                        $participationStats = $this->evaluationAnalyticsService->calculateBroadcastParticipationStats($data['evaluation_id']);
                        \Log::info('Submission received', [
                            'evaluation_id' => $data['evaluation_id'],
                            'participation_stats' => $participationStats
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('Failed to calculate participation stats', [
                            'evaluation_id' => $data['evaluation_id'],
                            'error' => $e->getMessage()
                        ]);
                    }

                    return response()->json([
                        'message' => 'Evaluation submitted successfully! Thank you for your feedback.',
                        'success' => true,
                        'feedback' => $feedback->load('responses'),
                        'submission' => [
                            'id' => $submission->id,
                            'submitted_at' => $submission->submitted_at,
                            'is_anonymous' => $submission->is_anonymous,
                        ],
                        'statistics' => [
                            'total_responses' => $responseCount,
                            'valid_responses' => $validResponses,
                            'completion_rate' => $responseCount > 0 ? round(($validResponses / $responseCount) * 100, 1) : 0
                        ]
                    ], 201);

                } catch (\Exception $e) {
                    // Log transaction failure
                    \Log::error('Feedback submission transaction failed', [
                        'student_id' => $data['student_id'],
                        'evaluation_id' => $data['evaluation_id'],
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    
                    throw $e;
                }
            });

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Please check your input and correct any errors before submitting.',
                'error' => 'validation_failed',
                'errors' => $e->errors(),
                'help_text' => 'Make sure all required fields are completed and all ratings are between 1 and 5.'
            ], 422);
            
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database-specific errors
            \Log::error('Database error during feedback submission', [
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            
            return response()->json([
                'message' => 'A database error occurred while processing your submission. Please try again.',
                'error' => 'database_error',
                'help_text' => 'If this problem persists, please contact technical support.'
            ], 500);
            
        } catch (\Exception $e) {
            // Handle all other errors
            \Log::error('Unexpected error during feedback submission', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An unexpected error occurred while submitting your evaluation. Please try again.',
                'error' => 'submission_failed',
                'help_text' => 'If this problem continues, please refresh the page and try again, or contact support if the issue persists.'
            ], 500);
        }
    }

}