<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Question;
use App\Services\SubmissionValidationService;
use App\Services\EvaluationAnalyticsService;
use App\Services\ReportGenerationService;
use App\Services\NotificationService;
use App\Services\PeerHodEvaluationService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EvaluationController extends Controller
{
    public function __construct()
    {
        // Constructor no longer needs RealTimeSyncService
    }
    public function index()
    {
        $query = Evaluation::with('course', 'teacher');
        // Optional filters: department_id, academic_year, semester, open_only
        if (request()->has('department_id')) {
            $deptId = (int) request()->get('department_id');
            $query->whereHas('course', function ($q) use ($deptId) {
                $q->where('department_id', $deptId);
            });
        }
        if (request()->has('academic_year')) {
            $query->where('academic_year', request()->get('academic_year'));
        }
        if (request()->has('semester')) {
            $query->where('semester', request()->get('semester'));
        }
        if (request()->has('year_level')) {
            $query->where('year_level', (int) request()->get('year_level'));
        }
        if (request()->boolean('open_only')) {
            $today = now()->toDateString();
            $query->whereDate('opened_at', '<=', $today)
                  ->where(function ($q) use ($today) {
                      $q->whereNull('closed_at')->orWhereDate('closed_at', '>=', $today);
                  });
        }

        return $query->orderByDesc('opened_at')->paginate(20);
    }

    /**
     * Poll missed updates for a department since a timestamp.
     * Note: Real-time functionality has been removed. This endpoint now returns empty updates.
     */
    public function poll(Request $request)
    {
        try {
            $data = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'since' => 'required|date',
            ]);

            // Return empty updates since real-time functionality has been removed
            return response()->json([
                'department_id' => (int) $data['department_id'],
                'since' => (string) $data['since'],
                'count' => 0,
                'updates' => [],
                'message' => 'Real-time updates have been disabled. Please refresh manually.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error polling updates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'teacher_id' => 'required|exists:teachers,id',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'year_level' => 'required|integer|min:1|max:6',
            'opened_at' => 'required|date',
            'closed_at' => 'nullable|date',
        ]);
        
        // Get course and teacher and validate assignment
        $course = \App\Models\Course::with('teachers')->find($data['course_id']);
        $teacher = \App\Models\Teacher::find($data['teacher_id']);

        if (!$course || !$teacher) {
            return response()->json([
                'message' => 'Selected course or instructor not found',
            ], 404);
        }

        // Ensure instructor is in the same department as the course
        if ($teacher->department_id !== $course->department_id) {
            return response()->json([
                'message' => 'Instructor must belong to the same department as the course',
                'error' => 'department_mismatch',
            ], 422);
        }

        // Ensure instructor is assigned to the selected course
        $isAssigned = $course->teachers->contains(function ($t) use ($teacher) {
            return (int) $t->id === (int) $teacher->id;
        });
        if (!$isAssigned) {
            return response()->json([
                'message' => 'Instructor is not assigned to the selected course. Assign the instructor to the course first.',
                'error' => 'instructor_not_assigned_to_course',
            ], 422);
        }

        // Enforce: one evaluation per instructor per course per semester/year
        $existing = Evaluation::where('teacher_id', $teacher->id)
            ->where('course_id', $course->id)
            ->where('academic_year', $data['academic_year'])
            ->where('semester', $data['semester'])
            ->exists();
        if ($existing) {
            return response()->json([
                'message' => 'An evaluation for this instructor, course, academic year, and semester already exists.',
                'error' => 'duplicate_evaluation_for_semester',
                'details' => [
                    'teacher_id' => $teacher->id,
                    'course_id' => $course->id,
                    'academic_year' => $data['academic_year'],
                    'semester' => $data['semester'],
                ],
            ], 422);
        }

        $data['department_id'] = $course->department_id;
        
        $evaluation = Evaluation::create($data);
        
        // Load the course relationship
        $evaluation->load('course');
        
        // Initialize peer & HOD evaluations for this teacher/semester
        try {
            app(PeerHodEvaluationService::class)->initializeForEvaluation($evaluation->load('course'));
        } catch (\Throwable $e) {
            // Don't block creation; log and move on
            \Log::warning('Peer/HOD initialization failed', [
                'evaluation_id' => $evaluation->id,
                'error' => $e->getMessage()
            ]);
        }

        // Note: Real-time broadcasting has been removed
        
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $studentIds = \App\Models\Student::where('department_id', $course->department_id)->pluck('id')->all();
            foreach ($studentIds as $sid) {
                $notificationService->createNotification(
                    'student',
                    (int) $sid,
                    'opened',
                    'Evaluation Opened',
                    'A new evaluation has been opened',
                    [
                        'evaluation_id' => $evaluation->id,
                        'course_id' => $course->id,
                        'teacher_id' => $teacher->id,
                        'academic_year' => $evaluation->academic_year,
                        'semester' => $evaluation->semester,
                        'year_level' => $evaluation->year_level,
                    ],
                    'info'
                );
            }
            $notificationService->createNotification(
                'teacher',
                (int) $teacher->id,
                'opened',
                'Evaluation Opened',
                'Your evaluation is now open',
                [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $course->id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'year_level' => $evaluation->year_level,
                ],
                'info'
            );
            $notificationService->createNotification(
                'department',
                (int) $course->department_id,
                'opened',
                'Evaluation Opened',
                'An evaluation has been opened in your department',
                [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $course->id,
                    'teacher_id' => $teacher->id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'year_level' => $evaluation->year_level,
                ],
                'info'
            );
        } catch (\Throwable $e) {
        }
        
        return response()->json($evaluation, 201);
    }

    public function show(Evaluation $evaluation)
    {
        return $evaluation->load('course', 'teacher', 'department', 'questions', 'feedbacks');
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        // Allow updating academic_year, semester, and open/close dates
        $data = $request->validate([
            'academic_year' => 'sometimes|required|string',
            'semester' => 'sometimes|required|string',
            'year_level' => 'nullable|integer|min:1|max:6',
            'opened_at' => 'sometimes|required|date',
            'closed_at' => 'nullable|date',
        ]);
        
        // Track what fields are being changed for logging
        $originalAttributes = $evaluation->getOriginal();
        $changes = [];
        
        foreach ($data as $key => $value) {
            if ($originalAttributes[$key] !== $value) {
                $changes[$key] = [
                    'old' => $originalAttributes[$key],
                    'new' => $value
                ];
            }
        }

        // If academic_year/semester are being changed, ensure uniqueness per instructor/course/semester/year
        $newAcademicYear = $data['academic_year'] ?? $evaluation->academic_year;
        $newSemester = $data['semester'] ?? $evaluation->semester;
        $duplicateExists = Evaluation::where('id', '<>', $evaluation->id)
            ->where('teacher_id', $evaluation->teacher_id)
            ->where('course_id', $evaluation->course_id)
            ->where('academic_year', $newAcademicYear)
            ->where('semester', $newSemester)
            ->exists();
        if ($duplicateExists) {
            return response()->json([
                'message' => 'Another evaluation for this instructor, course, academic year, and semester already exists.',
                'error' => 'duplicate_evaluation_for_semester',
                'details' => [
                    'teacher_id' => $evaluation->teacher_id,
                    'course_id' => $evaluation->course_id,
                    'academic_year' => $newAcademicYear,
                    'semester' => $newSemester,
                ],
            ], 422);
        }

        $evaluation->update($data);

        // If opened_at present, ensure peer/HOD evaluations are initialized/kept in sync
        try {
            app(PeerHodEvaluationService::class)->initializeForEvaluation($evaluation->load('course'));
        } catch (\Throwable $e) {
            \Log::warning('Peer/HOD initialization on update failed', [
                'evaluation_id' => $evaluation->id,
                'error' => $e->getMessage()
            ]);
        }
        
        // Note: Real-time broadcasting has been removed
        
        return response()->json($evaluation);
    }

    /**
     * Delete an evaluation and cascade related data.
     */
    public function destroy(Evaluation $evaluation)
    {
        try {
            // Deleting the evaluation will cascade to pivot and feedback tables per migrations
            $evaluation->delete();
            return response()->json(['message' => 'Evaluation deleted'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete evaluation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Replace evaluation form questions.
     */
    public function setQuestions(Request $request, Evaluation $evaluation)
    {
        $payload = $request->validate([
            'questions' => 'required|array|min:1',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:rating,text',
        ]);

        // Detach existing questions
        $evaluation->questions()->detach();

        // Create and attach new questions
        $questionIds = [];
        foreach ($payload['questions'] as $q) {
            $question = Question::create([
                'text' => $q['text'],
                'type' => $q['type'],
            ]);
            $questionIds[] = $question->id;
        }
        $evaluation->questions()->attach($questionIds);

        // Load the course relationship
        $evaluation->load('course');
        
        // Note: Real-time broadcasting has been removed

        $response = [
            'evaluation_id' => $evaluation->id,
            'questions' => $evaluation->questions()->get(),
        ];
        try {
            $studentIds = \App\Models\Student::where('department_id', $course->department_id)->pluck('id')->all();
            $notificationService = app(\App\Services\NotificationService::class);
            foreach ($studentIds as $sid) {
                $notificationService->createNotification(
                    'student',
                    (int) $sid,
                    'opened',
                    'Evaluation Opened',
                    'A new evaluation has been opened',
                    [
                        'evaluation_id' => $evaluation->id,
                        'course_id' => $course->id,
                        'teacher_id' => $teacher->id,
                        'academic_year' => $evaluation->academic_year,
                        'semester' => $evaluation->semester,
                        'year_level' => $evaluation->year_level,
                    ],
                    'info'
                );
            }
            $notificationService->createNotification(
                'teacher',
                (int) $teacher->id,
                'opened',
                'Evaluation Opened',
                'Your evaluation is now open',
                [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $course->id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'year_level' => $evaluation->year_level,
                ],
                'info'
            );
            $notificationService->createNotification(
                'department',
                (int) $course->department_id,
                'opened',
                'Evaluation Opened',
                'An evaluation has been opened in your department',
                [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $course->id,
                    'teacher_id' => $teacher->id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'year_level' => $evaluation->year_level,
                ],
                'info'
            );
        } catch (\Throwable $e) {
        }
        return response()->json($response);
    }

    /**
     * Close an evaluation manually.
     */
    public function close(Request $request, Evaluation $evaluation)
    {
        // Validate that the evaluation is not already closed
        if ($evaluation->closed_at && $evaluation->closed_at <= now()) {
            return response()->json([
                'message' => 'Evaluation is already closed',
                'error' => 'evaluation_already_closed'
            ], 422);
        }

        // Close the evaluation
        $closedAt = now();
        $evaluation->update(['closed_at' => $closedAt]);

        // Load the course relationship
        $evaluation->load('course');
        
        // Note: Real-time broadcasting has been removed

        $response = [
            'message' => 'Evaluation closed successfully',
            'evaluation' => $evaluation,
            'closed_at' => $closedAt->toISOString()
        ];
        try {
            $studentIds = \App\Models\Student::where('department_id', $evaluation->course->department_id)->pluck('id')->all();
            $notificationService = app(\App\Services\NotificationService::class);
            foreach ($studentIds as $sid) {
                $notificationService->createNotification(
                    'student',
                    (int) $sid,
                    'closed',
                    'Evaluation Closed',
                    'The evaluation has been closed',
                    [
                        'evaluation_id' => $evaluation->id,
                        'course_id' => $evaluation->course->id,
                        'teacher_id' => $evaluation->teacher->id,
                        'academic_year' => $evaluation->academic_year,
                        'semester' => $evaluation->semester,
                        'closed_at' => $closedAt->toISOString(),
                    ],
                    'warning'
                );
            }
            $notificationService->createNotification(
                'teacher',
                (int) $evaluation->teacher->id,
                'closed',
                'Evaluation Closed',
                'Your evaluation has been closed',
                [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $evaluation->course->id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'closed_at' => $closedAt->toISOString(),
                ],
                'warning'
            );
            $notificationService->createNotification(
                'department',
                (int) $evaluation->course->department_id,
                'closed',
                'Evaluation Closed',
                'An evaluation in your department has been closed',
                [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $evaluation->course->id,
                    'teacher_id' => $evaluation->teacher->id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'closed_at' => $closedAt->toISOString(),
                ],
                'warning'
            );
        } catch (\Throwable $e) {
        }
        return response()->json($response);
    }

    public function summary(Evaluation $evaluation)
    {
        // Aggregate ratings per question and overall counts
        $evaluation->load('feedbacks.responses');
        $feedbacks = $evaluation->feedbacks;

        $totalFeedbacks = $feedbacks->count();
        $responseAgg = [];
        foreach ($feedbacks as $fb) {
            foreach ($fb->responses as $resp) {
                $qid = $resp->question_id;
                if (!isset($responseAgg[$qid])) {
                    $responseAgg[$qid] = ['count' => 0, 'sum' => 0, 'texts' => []];
                }
                if (!is_null($resp->rating)) {
                    $responseAgg[$qid]['count'] += 1;
                    $responseAgg[$qid]['sum'] += (int) $resp->rating;
                }
                if (!empty($resp->text)) {
                    // Keep up to 5 sample comments per question
                    if (count($responseAgg[$qid]['texts']) < 5) {
                        $responseAgg[$qid]['texts'][] = $resp->text;
                    }
                }
            }
        }

        $questionSummaries = [];
        foreach ($responseAgg as $qid => $agg) {
            $avg = $agg['count'] > 0 ? round($agg['sum'] / $agg['count'], 2) : null;
            $questionSummaries[] = [
                'question_id' => $qid,
                'average_rating' => $avg,
                'responses_count' => $agg['count'],
                'sample_comments' => $agg['texts'],
            ];
        }

        return response()->json([
            'evaluation_id' => $evaluation->id,
            'course' => $evaluation->course,
            'teacher' => $evaluation->teacher,
            'academic_year' => $evaluation->academic_year,
            'semester' => $evaluation->semester,
            'opened_at' => $evaluation->opened_at,
            'closed_at' => $evaluation->closed_at,
            'total_feedbacks' => $totalFeedbacks,
            'questions' => $questionSummaries,
        ]);
    }

    /**
     * Get submission status for a specific student and evaluation.
     * 
     * @param Request $request
     * @param Evaluation $evaluation
     * @return \Illuminate\Http\JsonResponse
     */
    public function submissionStatus(Request $request, Evaluation $evaluation)
    {
        try {
            $request->validate([
                'student_id' => 'required|exists:students,id',
            ]);

            $submissionValidationService = app(SubmissionValidationService::class);
            $auditLogService = app(AuditLogService::class);
            
            $status = $submissionValidationService->getSubmissionStatus(
                $request->input('student_id'), 
                $evaluation->id
            );

            // Log the submission status check
            $auditLogService->logSubmissionStatusCheck(
                $evaluation->id, 
                $request->input('student_id'), 
                $request
            );

            return response()->json([
                'evaluation_id' => $evaluation->id,
                'student_id' => $request->input('student_id'),
                'submission_status' => $status,
                'evaluation_info' => [
                    'course' => $evaluation->course->title,
                    'teacher' => $evaluation->teacher->name,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'is_open' => $evaluation->closed_at === null || $evaluation->closed_at > now(),
                ]
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving submission status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get comprehensive analytics for an evaluation.
     * 
     * @param Evaluation $evaluation
     * @return \Illuminate\Http\JsonResponse
     */
    public function analytics(Evaluation $evaluation)
    {
        try {
            $analyticsService = app(EvaluationAnalyticsService::class);
            $auditLogService = app(AuditLogService::class);
            
            $analytics = $analyticsService->generateEvaluationStatistics($evaluation->id);

            // Log analytics access
            $auditLogService->logAnalyticsAccess(
                $evaluation->id, 
                null, // User ID would come from authentication
                'admin', // User type would come from authentication
                request()
            );

            return response()->json([
                'evaluation_id' => $evaluation->id,
                'evaluation_info' => [
                    'course' => $evaluation->course->title,
                    'course_code' => $evaluation->course->code,
                    'teacher' => $evaluation->teacher->name,
                    'department' => $evaluation->course->department->name,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'year_level' => $evaluation->year_level,
                ],
                'analytics' => $analytics,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed results for a specific evaluation.
     * 
     * @param Evaluation $evaluation
     * @return \Illuminate\Http\JsonResponse
     */
    public function results(Evaluation $evaluation)
    {
        try {
            // Use the enhanced analytics service to get comprehensive results
            $analyticsService = app(EvaluationAnalyticsService::class);
            $comprehensiveResults = $analyticsService->getComprehensiveResults($evaluation->id);
            
            // Format the response to match the frontend expectations
            $resultsData = [
                'evaluation_id' => $evaluation->id,
                'course_information' => [
                    'course' => $comprehensiveResults['evaluation_info']['course'],
                    'code' => $comprehensiveResults['evaluation_info']['course_code'],
                    'year_level' => $comprehensiveResults['evaluation_info']['year_level'],
                ],
                'instructor_information' => [
                    'name' => $comprehensiveResults['evaluation_info']['instructor'],
                    'teacher_id' => $evaluation->teacher_id,
                    'session' => $comprehensiveResults['evaluation_info']['academic_year'] . ' - ' . $comprehensiveResults['evaluation_info']['semester'],
                    'status' => $comprehensiveResults['evaluation_info']['status'],
                ],
                'quick_stats' => [
                    'total_responses' => $comprehensiveResults['summary']['total_responses'],
                    'expected_responses' => $comprehensiveResults['participation']['total_eligible_students'] ?? 0,
                    'participation_rate' => $comprehensiveResults['summary']['participation_rate'],
                    'data_quality' => $comprehensiveResults['summary']['data_quality'],
                ],
                'weighted_scores' => $comprehensiveResults['weighted_scores'],
                'section_breakdown' => $comprehensiveResults['section_breakdown'],
                'response_statistics' => $comprehensiveResults['response_statistics'],
                'participation_analysis' => [
                    'overview' => [
                        'participation_rate' => $comprehensiveResults['summary']['participation_rate'],
                        'total_responses' => $comprehensiveResults['summary']['total_responses'],
                        'data_quality' => $comprehensiveResults['summary']['data_quality'],
                    ],
                    'breakdown' => $comprehensiveResults['section_breakdown'],
                    'rating_distribution' => $comprehensiveResults['response_statistics']['rating_distribution'] ?? [],
                ],
                'academic_year' => $comprehensiveResults['evaluation_info']['academic_year'],
                'semester' => $comprehensiveResults['evaluation_info']['semester'],
                'status' => $comprehensiveResults['evaluation_info']['status'],
                'opened_at' => $comprehensiveResults['evaluation_info']['opened_at'],
                'closed_at' => $comprehensiveResults['evaluation_info']['closed_at'],
                'last_updated' => $comprehensiveResults['generated_at'],
                
                // Enhanced results with weighted scoring
                'final_score' => $comprehensiveResults['summary']['final_score'],
                'performance_level' => $comprehensiveResults['summary']['performance_level'],
                'score_breakdown' => $comprehensiveResults['weighted_scores']['breakdown'],
            ];
            
            return response()->json($resultsData);
            
        } catch (\Exception $e) {
            \Log::error('Failed to load comprehensive evaluation results', [
                'evaluation_id' => $evaluation->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to load evaluation results. Please try again.',
                'error' => 'results_load_failed',
                'help_text' => 'If this problem persists, please contact support.'
            ], 500);
        }
    }

    /**
     * Export evaluation data in various formats with enhanced error handling.
     * 
     * @param Request $request
     * @param Evaluation $evaluation
     * @return \Illuminate\Http\JsonResponse
     */
    public function export(Request $request, Evaluation $evaluation)
    {
        try {
            // Enhanced validation with detailed error messages
            $data = $request->validate([
                'format' => 'required|in:csv,pdf,excel',
                'preserve_privacy' => 'boolean',
                'report_type' => 'in:teacher,department',
            ], [
                'format.required' => 'Export format is required.',
                'format.in' => 'Export format must be one of: CSV, PDF, or Excel.',
                'report_type.in' => 'Report type must be either teacher or department.',
            ]);

            $reportGenerationService = app(ReportGenerationService::class);
            $auditLogService = app(AuditLogService::class);
            
            $preservePrivacy = $data['preserve_privacy'] ?? true;
            $reportType = $data['report_type'] ?? 'teacher';

            // Check if evaluation has sufficient data for export
            $evaluation->load(['feedbacks', 'course', 'teacher']);
            if ($evaluation->feedbacks->count() === 0) {
                return response()->json([
                    'message' => 'Cannot export report: No student responses available for this evaluation.',
                    'error' => 'insufficient_data',
                    'help_text' => 'Wait for students to submit evaluations before generating reports.',
                    'statistics' => [
                        'total_responses' => 0,
                        'minimum_required' => 1
                    ]
                ], 422);
            }

            // Check for minimum response threshold for meaningful reports
            $minimumResponses = 3; // Configurable threshold
            if ($evaluation->feedbacks->count() < $minimumResponses) {
                return response()->json([
                    'message' => 'Limited data warning: This evaluation has fewer than the recommended minimum responses.',
                    'error' => 'limited_data',
                    'warning' => true,
                    'help_text' => 'Reports with fewer responses may not be statistically meaningful.',
                    'statistics' => [
                        'total_responses' => $evaluation->feedbacks->count(),
                        'minimum_recommended' => $minimumResponses
                    ],
                    'continue_anyway' => true
                ], 200); // Still allow export but with warning
            }

            // Set timeout for large datasets
            $responseCount = $evaluation->feedbacks->count();
            if ($responseCount > 500) {
                set_time_limit(300); // 5 minutes for large exports
            }

            // Generate report data with progress tracking
            try {
                if ($reportType === 'teacher') {
                    $reportData = $reportGenerationService->generateTeacherReport($evaluation->id);
                } else {
                    $departmentId = $evaluation->course->department_id;
                    $reportData = $reportGenerationService->generateDepartmentReport(
                        $departmentId,
                        $evaluation->academic_year,
                        $evaluation->semester
                    );
                }
            } catch (\Exception $e) {
                \Log::error('Report data generation failed', [
                    'evaluation_id' => $evaluation->id,
                    'report_type' => $reportType,
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'message' => 'Failed to generate report data. This may be due to data processing issues.',
                    'error' => 'report_generation_failed',
                    'help_text' => 'Please try again. If the problem persists, contact technical support.',
                    'technical_details' => app()->environment('local') ? $e->getMessage() : null
                ], 500);
            }

            // Validate report completeness
            if (!$reportGenerationService->validateReportCompleteness($reportData)) {
                return response()->json([
                    'message' => 'Report data validation failed. Some required information is missing.',
                    'error' => 'incomplete_report_data',
                    'help_text' => 'This may indicate missing evaluation responses or system data. Please verify the evaluation has complete information.',
                    'missing_components' => $reportGenerationService->getMissingComponents($reportData)
                ], 422);
            }

            // Check export size limitations
            $estimatedSize = $this->estimateExportSize($reportData, $data['format']);
            $maxSize = 50 * 1024 * 1024; // 50MB limit
            
            if ($estimatedSize > $maxSize) {
                return response()->json([
                    'message' => 'Export size exceeds maximum limit. Please try filtering the data or use a different format.',
                    'error' => 'export_too_large',
                    'help_text' => 'Consider exporting smaller date ranges or using CSV format for large datasets.',
                    'size_info' => [
                        'estimated_size_mb' => round($estimatedSize / (1024 * 1024), 2),
                        'maximum_size_mb' => round($maxSize / (1024 * 1024), 2)
                    ]
                ], 422);
            }

            // Export in requested format with enhanced error handling
            try {
                $filePath = match($data['format']) {
                    'csv' => $reportGenerationService->exportToCSV($reportData, $preservePrivacy),
                    'pdf' => $reportGenerationService->exportToPDF($reportData, $preservePrivacy),
                    'excel' => $reportGenerationService->exportToExcel($reportData, $preservePrivacy),
                };

                // Verify file was created successfully
                if (!$filePath || !file_exists(storage_path('app/' . $filePath))) {
                    throw new \Exception('Export file was not created successfully');
                }

                // Get file size for response
                $fileSize = filesize(storage_path('app/' . $filePath));

            } catch (\Exception $e) {
                \Log::error('Export file generation failed', [
                    'evaluation_id' => $evaluation->id,
                    'format' => $data['format'],
                    'error' => $e->getMessage()
                ]);

                return response()->json([
                    'message' => "Failed to generate {$data['format']} export. This may be due to formatting issues or system limitations.",
                    'error' => 'export_generation_failed',
                    'help_text' => 'Try using a different export format or contact support if the problem continues.',
                    'suggested_alternatives' => $this->getSuggestedExportAlternatives($data['format'])
                ], 500);
            }

            // Log successful export
            $auditLogService->logExportAction(
                $evaluation->id, 
                $data['format'], 
                null, // User ID would come from authentication
                'admin', // User type would come from authentication
                $request
            );

            return response()->json([
                'message' => 'Report generated successfully!',
                'success' => true,
                'file_path' => $filePath,
                'format' => $data['format'],
                'privacy_preserved' => $preservePrivacy,
                'report_type' => $reportType,
                'generated_at' => now(),
                'download_url' => url('storage/' . $filePath),
                'file_info' => [
                    'size_bytes' => $fileSize,
                    'size_mb' => round($fileSize / (1024 * 1024), 2),
                    'expires_at' => now()->addHours(24) // Files expire after 24 hours
                ],
                'statistics' => [
                    'total_responses' => $responseCount,
                    'privacy_preserved' => $preservePrivacy,
                    'generation_time_ms' => round((microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000, 2)
                ]
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Please check your export parameters and try again.',
                'error' => 'validation_failed',
                'errors' => $e->errors(),
                'help_text' => 'Ensure you have selected a valid export format and report type.'
            ], 422);
            
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error during export', [
                'evaluation_id' => $evaluation->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'A database error occurred while preparing the export. Please try again.',
                'error' => 'database_error',
                'help_text' => 'This may be a temporary issue. If it persists, contact technical support.'
            ], 500);
            
        } catch (\Exception $e) {
            \Log::error('Unexpected error during export', [
                'evaluation_id' => $evaluation->id,
                'format' => $data['format'] ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An unexpected error occurred while generating the export. Please try again.',
                'error' => 'export_failed',
                'help_text' => 'If this problem continues, try a different export format or contact support.',
                'technical_details' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Estimate export file size based on data and format
     */
    private function estimateExportSize($reportData, $format)
    {
        $baseSize = 0;
        
        // Rough estimation based on data structure
        if (isset($reportData['responses'])) {
            $baseSize += count($reportData['responses']) * 200; // ~200 bytes per response
        }
        
        if (isset($reportData['analytics'])) {
            $baseSize += 10000; // ~10KB for analytics data
        }
        
        // Format-specific multipliers
        $multipliers = [
            'csv' => 1.0,
            'excel' => 2.5,
            'pdf' => 4.0
        ];
        
        return $baseSize * ($multipliers[$format] ?? 1.0);
    }

    /**
     * Get suggested alternative export formats
     */
    private function getSuggestedExportAlternatives($failedFormat)
    {
        $alternatives = [
            'pdf' => ['csv', 'excel'],
            'excel' => ['csv', 'pdf'],
            'csv' => ['excel']
        ];
        
        return $alternatives[$failedFormat] ?? ['csv'];
    }

    /**
     * Detect low participation evaluations for a department.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function lowParticipation(Request $request)
    {
        try {
            $data = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'threshold' => 'numeric|min:0|max:100',
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            $threshold = $data['threshold'] ?? 50.0;
            
            $result = $analyticsService->detectLowParticipation(
                $data['department_id'], 
                $threshold
            );

            return response()->json([
                'message' => 'Low participation detection completed',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error detecting low participation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate participation summary for closed evaluations.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function participationSummary(Request $request)
    {
        try {
            $data = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'period' => 'in:current_semester,last_semester,academic_year',
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            $period = $data['period'] ?? 'current_semester';
            
            $summary = $analyticsService->generateParticipationSummary(
                $data['department_id'], 
                $period
            );

            return response()->json([
                'message' => 'Participation summary generated successfully',
                'data' => $summary,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating participation summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send reminder notifications for low participation evaluations.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendReminders(Request $request)
    {
        try {
            $data = $request->validate([
                'evaluation_ids' => 'required|array',
                'evaluation_ids.*' => 'exists:evaluations,id',
                'message' => 'string|max:500',
                'reminder_type' => 'in:email,notification,both',
            ]);

            $notificationService = app(NotificationService::class);
            $reminderType = $data['reminder_type'] ?? 'notification';
            $customMessage = $data['message'] ?? null;

            $result = $notificationService->sendEvaluationReminders(
                $data['evaluation_ids'],
                $reminderType,
                $customMessage
            );

            return response()->json([
                'message' => 'Reminder notifications processed successfully',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error sending reminders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Compare teacher performance across multiple evaluation periods.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function historicalComparison(Request $request)
    {
        try {
            $data = $request->validate([
                'teacher_id' => 'required|exists:teachers,id',
                'periods' => 'required|array|min:2',
                'periods.*' => 'string|regex:/^\d{4}-[12]$/', // Format: YYYY-S (e.g., 2023-1)
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            $auditLogService = app(AuditLogService::class);
            
            $comparison = $analyticsService->compareHistoricalPerformance(
                $data['teacher_id'], 
                $data['periods']
            );

            // Log historical comparison access
            $auditLogService->logAnalyticsAccess(
                null, // No specific evaluation ID
                null, // User ID would come from authentication
                'admin', // User type would come from authentication
                $request,
                'historical_comparison'
            );

            return response()->json([
                'message' => 'Historical comparison generated successfully',
                'data' => $comparison,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating historical comparison',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate trend analysis for performance data.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function trendAnalysis(Request $request)
    {
        try {
            $data = $request->validate([
                'teacher_id' => 'required|exists:teachers,id',
                'time_range' => 'in:6months,1year,2years',
                'significance_threshold' => 'numeric|min:0|max:50',
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            $timeRange = $data['time_range'] ?? '1year';
            $significanceThreshold = $data['significance_threshold'] ?? 5.0;
            
            // Get performance trends
            $trends = $analyticsService->generatePerformanceTrends(
                $data['teacher_id'], 
                $timeRange
            );

            // Extract performance scores for trend detection
            $performanceScores = array_column($trends['trends'], 'performance_score');
            
            // Detect significant trends
            $significantTrends = $analyticsService->detectSignificantTrends(
                $performanceScores, 
                $significanceThreshold
            );

            return response()->json([
                'message' => 'Trend analysis completed successfully',
                'teacher_id' => $data['teacher_id'],
                'time_range' => $timeRange,
                'performance_trends' => $trends,
                'significant_trends' => $significantTrends,
                'analysis_parameters' => [
                    'significance_threshold' => $significanceThreshold,
                    'periods_analyzed' => count($performanceScores),
                ],
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating trend analysis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Compare teachers fairly accounting for course differences.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function fairTeacherComparison(Request $request)
    {
        try {
            $data = $request->validate([
                'teacher_ids' => 'required|array|min:2',
                'teacher_ids.*' => 'exists:teachers,id',
                'period' => 'required|string|regex:/^\d{4}-[12]$/', // Format: YYYY-S
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            
            $comparison = $analyticsService->compareFairTeacherPerformance(
                $data['teacher_ids'], 
                $data['period']
            );

            return response()->json([
                'message' => 'Fair teacher comparison completed successfully',
                'data' => $comparison,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating fair teacher comparison',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate department benchmarking against previous periods.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function departmentBenchmarking(Request $request)
    {
        try {
            $data = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'periods' => 'required|array|min:2',
                'periods.*' => 'string|regex:/^\d{4}-[12]$/', // Format: YYYY-S
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            
            $benchmarking = $analyticsService->generateDepartmentBenchmarking(
                $data['department_id'], 
                $data['periods']
            );

            return response()->json([
                'message' => 'Department benchmarking generated successfully',
                'data' => $benchmarking,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating department benchmarking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate department-wide data aggregation with teacher rankings and performance insights.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function departmentAggregation(Request $request)
    {
        try {
            $data = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'period' => 'required|string|regex:/^\d{4}-[12]$/', // Format: YYYY-S (e.g., 2024-1)
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            $auditLogService = app(AuditLogService::class);
            
            $aggregation = $analyticsService->generateDepartmentAggregation(
                $data['department_id'], 
                $data['period']
            );

            // Log department aggregation access
            $auditLogService->logAnalyticsAccess(
                null, // No specific evaluation ID
                null, // User ID would come from authentication
                'admin', // User type would come from authentication
                $request,
                'department_aggregation'
            );

            return response()->json([
                'message' => 'Department aggregation generated successfully',
                'data' => $aggregation,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating department aggregation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate completion rates by course and year level.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function completionRates(Request $request)
    {
        try {
            $data = $request->validate([
                'department_id' => 'required|exists:departments,id',
                'academic_year' => 'string',
                'semester' => 'integer|min:1|max:2',
                'group_by' => 'in:course,year_level,both',
            ]);

            $analyticsService = app(EvaluationAnalyticsService::class);
            $groupBy = $data['group_by'] ?? 'both';
            
            // Get evaluations based on filters
            $query = Evaluation::whereHas('course', function ($q) use ($data) {
                $q->where('department_id', $data['department_id']);
            });

            if (isset($data['academic_year'])) {
                $query->where('academic_year', $data['academic_year']);
            }

            if (isset($data['semester'])) {
                $query->where('semester', $data['semester']);
            }

            $evaluations = $query->with(['course', 'teacher'])->get();

            $completionRates = [];
            $courseStats = [];
            $yearLevelStats = [];

            foreach ($evaluations as $evaluation) {
                $participationData = $analyticsService->calculateParticipationRate($evaluation->id);
                
                $completionRates[] = [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $evaluation->course_id,
                    'course_code' => $evaluation->course->code,
                    'course_name' => $evaluation->course->name,
                    'year_level' => $evaluation->year_level,
                    'teacher_name' => $evaluation->teacher->user->name ?? 'Unknown',
                    'completion_rate' => $participationData['participation_rate'],
                    'total_eligible' => $participationData['total_eligible_students'],
                    'total_submissions' => $participationData['total_submissions'],
                ];

                // Aggregate by course
                if (in_array($groupBy, ['course', 'both'])) {
                    $courseKey = $evaluation->course_id;
                    if (!isset($courseStats[$courseKey])) {
                        $courseStats[$courseKey] = [
                            'course_id' => $evaluation->course_id,
                            'course_code' => $evaluation->course->code,
                            'course_name' => $evaluation->course->name,
                            'total_eligible' => 0,
                            'total_submissions' => 0,
                            'evaluation_count' => 0,
                        ];
                    }
                    $courseStats[$courseKey]['total_eligible'] += $participationData['total_eligible_students'];
                    $courseStats[$courseKey]['total_submissions'] += $participationData['total_submissions'];
                    $courseStats[$courseKey]['evaluation_count']++;
                }

                // Aggregate by year level
                if (in_array($groupBy, ['year_level', 'both'])) {
                    $yearKey = $evaluation->year_level;
                    if (!isset($yearLevelStats[$yearKey])) {
                        $yearLevelStats[$yearKey] = [
                            'year_level' => $yearKey,
                            'total_eligible' => 0,
                            'total_submissions' => 0,
                            'evaluation_count' => 0,
                        ];
                    }
                    $yearLevelStats[$yearKey]['total_eligible'] += $participationData['total_eligible_students'];
                    $yearLevelStats[$yearKey]['total_submissions'] += $participationData['total_submissions'];
                    $yearLevelStats[$yearKey]['evaluation_count']++;
                }
            }

            // Calculate completion rates for aggregated data
            foreach ($courseStats as &$course) {
                $course['completion_rate'] = $course['total_eligible'] > 0 
                    ? round(($course['total_submissions'] / $course['total_eligible']) * 100, 2)
                    : 0;
            }

            foreach ($yearLevelStats as &$yearLevel) {
                $yearLevel['completion_rate'] = $yearLevel['total_eligible'] > 0 
                    ? round(($yearLevel['total_submissions'] / $yearLevel['total_eligible']) * 100, 2)
                    : 0;
            }

            $response = [
                'message' => 'Completion rates calculated successfully',
                'department_id' => $data['department_id'],
                'filters' => array_intersect_key($data, array_flip(['academic_year', 'semester'])),
                'group_by' => $groupBy,
                'individual_evaluations' => $completionRates,
            ];

            if (in_array($groupBy, ['course', 'both'])) {
                $response['course_statistics'] = array_values($courseStats);
            }

            if (in_array($groupBy, ['year_level', 'both'])) {
                $response['year_level_statistics'] = array_values($yearLevelStats);
            }

            return response()->json($response);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error calculating completion rates',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
