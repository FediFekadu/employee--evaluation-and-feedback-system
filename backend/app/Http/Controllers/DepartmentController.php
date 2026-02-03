<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return Department::orderBy('name')->get();
    }

    public function show(Department $department)
    {
        // Eager-load nested relations so the frontend can see which instructors
        // are assigned to each course without making additional requests.
        // This powers the confirmation step that lists an instructor's courses.
        return $department->load(['courses.teachers', 'teachers', 'students']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
        ]);
        $dept = Department::create($data);
        return response()->json($dept, 201);
    }

    // Assign or create a department admin for a department
    public function assignAdmin(Request $request, Department $department)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);

        // Find existing user by email or create minimal user record
        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            $user = User::create([
                'name' => $data['name'] ?? $data['email'],
                'email' => $data['email'],
                // Hashing here would require Hash facade; to keep minimal, set a placeholder.
                // In production, enforce password set/reset flow.
                'password' => bcrypt($data['password'] ?? uniqid('dept_admin_', true)),
                'role' => 'department_admin',
                'department_id' => $department->id,
            ]);
        } else {
            $user->role = 'department_admin';
            $user->department_id = $department->id;
            $user->save();
        }

        return response()->json(['message' => 'Department admin assigned', 'user' => $user->only(['id','name','email','role','department_id'])]);
    }

    // List all department admins with their assigned department
    public function listAdmins()
    {
        $admins = User::where('role', 'department_admin')
            ->with('department')
            ->orderBy('name')
            ->get();

        return response()->json($admins);
    }

    // Update department admin details or reassign to another department
    public function updateAdmin(Request $request, User $user)
    {
        if ($user->role !== 'department_admin') {
            return response()->json(['message' => 'User is not a department admin'], 422);
        }

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }
        if (array_key_exists('password', $data) && $data['password']) {
            $user->password = bcrypt($data['password']);
        }
        if (array_key_exists('department_id', $data)) {
            $user->department_id = $data['department_id'];
        }

        $user->save();

        return response()->json($user->only(['id','name','email','role','department_id']));
    }

    // Delete a department admin
    public function deleteAdmin(User $user)
    {
        if ($user->role !== 'department_admin') {
            return response()->json(['message' => 'User is not a department admin'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'Department admin deleted']);
    }

    /**
     * Get evaluation results summary for a department
     */
    public function evaluationResults(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|string|in:opened_at,course,instructor,year,status,participation',
                'sort_direction' => 'nullable|in:asc,desc',
                'filters' => 'nullable|array'
            ]);

            // Get evaluations for this department
            $evaluationsQuery = $department->evaluations()
                ->with(['course', 'teacher', 'feedbacks', 'analytics']);

            // Apply filters if provided
            if (!empty($data['filters'])) {
                $filters = $data['filters'];
                
                if (!empty($filters['course'])) {
                    $evaluationsQuery->whereHas('course', function($q) use ($filters) {
                        $q->where('title', 'like', '%' . $filters['course'] . '%');
                    });
                }
                
                if (!empty($filters['instructor'])) {
                    $evaluationsQuery->whereHas('teacher', function($q) use ($filters) {
                        $q->where('name', 'like', '%' . $filters['instructor'] . '%');
                    });
                }
                
                if (!empty($filters['status'])) {
                    $evaluationsQuery->where('status', $filters['status']);
                }
                
                if (!empty($filters['yearLevel'])) {
                    $evaluationsQuery->whereHas('course', function($q) use ($filters) {
                        $q->where('year_level', $filters['yearLevel']);
                    });
                }
            }

            // Apply sorting
            $sortBy = $data['sort_by'] ?? 'opened_at';
            $sortDirection = $data['sort_direction'] ?? 'desc';
            
            switch ($sortBy) {
                case 'course':
                    $evaluationsQuery->join('courses', 'evaluations.course_id', '=', 'courses.id')
                        ->orderBy('courses.title', $sortDirection);
                    break;
                case 'instructor':
                    $evaluationsQuery->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                        ->orderBy('teachers.name', $sortDirection);
                    break;
                default:
                    $evaluationsQuery->orderBy($sortBy, $sortDirection);
                    break;
            }

            // Get paginated results
            $perPage = $data['per_page'] ?? 20;
            $evaluations = $evaluationsQuery->paginate($perPage);

            // Enhance evaluations with participation metrics and weighted scores
            $evaluations->getCollection()->transform(function ($evaluation) {
                // Count responses from all evaluation types (student, peer, HOD)
                $studentResponses = $evaluation->feedbacks->count();
                
                // Count peer evaluation responses for this teacher/semester
                $peerResponses = \App\Models\PeerEvaluationResponse::whereHas('peerEvaluation', function($query) use ($evaluation) {
                    $query->where('department_id', $evaluation->department_id ?? $evaluation->course?->department_id)
                          ->where('teacher_id', $evaluation->teacher_id)
                          ->where('academic_year', $evaluation->academic_year)
                          ->where('semester', $evaluation->semester);
                })->count();
                
                // Count HOD evaluation responses for this teacher/semester
                $hodResponses = \App\Models\HodEvaluation::where('department_id', $evaluation->department_id ?? $evaluation->course?->department_id)
                    ->where('teacher_id', $evaluation->teacher_id)
                    ->where('academic_year', $evaluation->academic_year)
                    ->where('semester', $evaluation->semester)
                    ->whereNotNull('score')
                    ->count();
                
                // Total responses across all actors (students, peers, HOD)
                $totalResponses = $studentResponses + $peerResponses + $hodResponses;
                
                $expectedResponses = $evaluation->course->enrolled_students ?? 0;
                $participationRate = $expectedResponses > 0 ? ($studentResponses / $expectedResponses) * 100 : 0;
                
                // Determine data quality
                $dataQuality = 'Limited';
                if ($participationRate >= 80) {
                    $dataQuality = 'Excellent';
                } elseif ($participationRate >= 60) {
                    $dataQuality = 'Good';
                }
                
                $evaluation->participation = [
                    'total_responses' => $totalResponses,
                    'expected_responses' => $expectedResponses,
                    'participation_rate' => round($participationRate, 1),
                    'data_quality' => $dataQuality,
                ];
                
                // Add weighted scores if there are responses
                if ($totalResponses > 0) {
                    try {
                        $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);
                        $weightedScores = $analyticsService->calculateWeightedScores($evaluation->id);
                        $evaluation->weighted_scores = $weightedScores;
                    } catch (\Exception $e) {
                        // If weighted scores calculation fails, continue without them
                        \Log::warning('Failed to calculate weighted scores for evaluation', [
                            'evaluation_id' => $evaluation->id,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                return $evaluation;
            });

            return response()->json($evaluations);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Invalid request parameters.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Failed to load department evaluation results', [
                'department_id' => $department->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to load evaluation results for this department.',
                'error' => 'department_results_load_failed'
            ], 500);
        }
    }

    /**
     * Export department evaluation results in various formats
     */
    public function export(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'format' => 'required|in:csv,pdf,excel',
                'evaluations' => 'nullable|array',
                'evaluations.*' => 'exists:evaluations,id',
                'filters' => 'nullable|array',
                'sort_by' => 'nullable|string',
                'sort_direction' => 'nullable|in:asc,desc'
            ], [
                'format.required' => 'Export format is required.',
                'format.in' => 'Export format must be one of: CSV, PDF, or Excel.',
            ]);

            // Get evaluations for this department
            $evaluationsQuery = $department->evaluations()
                ->with(['course', 'teacher', 'feedbacks', 'analytics']);

            // Apply evaluation ID filter if provided
            if (!empty($data['evaluations'])) {
                $evaluationsQuery->whereIn('id', $data['evaluations']);
            }

            // Apply filters if provided
            if (!empty($data['filters'])) {
                $filters = $data['filters'];
                
                if (!empty($filters['course'])) {
                    $evaluationsQuery->whereHas('course', function($q) use ($filters) {
                        $q->where('title', 'like', '%' . $filters['course'] . '%');
                    });
                }
                
                if (!empty($filters['instructor'])) {
                    $evaluationsQuery->whereHas('teacher', function($q) use ($filters) {
                        $q->where('name', 'like', '%' . $filters['instructor'] . '%');
                    });
                }
                
                if (!empty($filters['status'])) {
                    $evaluationsQuery->where('status', $filters['status']);
                }
                
                if (!empty($filters['yearLevel'])) {
                    $evaluationsQuery->whereHas('course', function($q) use ($filters) {
                        $q->where('year_level', $filters['yearLevel']);
                    });
                }
            }

            // Apply sorting
            $sortBy = $data['sort_by'] ?? 'opened_at';
            $sortDirection = $data['sort_direction'] ?? 'desc';
            
            switch ($sortBy) {
                case 'course':
                    $evaluationsQuery->join('courses', 'evaluations.course_id', '=', 'courses.id')
                        ->orderBy('courses.title', $sortDirection);
                    break;
                case 'instructor':
                    $evaluationsQuery->join('teachers', 'evaluations.teacher_id', '=', 'teachers.id')
                        ->orderBy('teachers.name', $sortDirection);
                    break;
                default:
                    $evaluationsQuery->orderBy($sortBy, $sortDirection);
                    break;
            }

            $evaluations = $evaluationsQuery->get();

            if ($evaluations->count() === 0) {
                return response()->json([
                    'message' => 'No evaluations found for export with the current filters.',
                    'error' => 'no_data',
                    'help_text' => 'Try adjusting your filters or ensure evaluations exist for this department.'
                ], 404);
            }

            // Use the ReportGenerationService to generate the export
            $reportGenerationService = app(\App\Services\ReportGenerationService::class);
            
            // Prepare report data for department export
            $reportData = [
                'report_type' => 'department_summary',
                'department' => $department,
                'evaluations' => $evaluations,
                'summary' => [
                    'total_evaluations' => $evaluations->count(),
                    'active_evaluations' => $evaluations->where('status', 'Active')->count(),
                    'closed_evaluations' => $evaluations->where('status', 'Closed')->count(),
                    'total_responses' => $evaluations->sum(function($eval) {
                        return $eval->feedbacks->count();
                    }),
                    'average_participation' => $evaluations->avg(function($eval) {
                        return $eval->analytics ? $eval->analytics->participation_rate : 0;
                    }),
                ],
                'export_timestamp' => now(),
                'filters_applied' => $data['filters'] ?? [],
                'sort_applied' => [
                    'field' => $sortBy,
                    'direction' => $sortDirection
                ],
                'privacy_preserved' => false
            ];

            // Generate export file
            $filePath = match($data['format']) {
                'csv' => $reportGenerationService->exportDepartmentToCSV($reportData),
                'pdf' => $reportGenerationService->exportDepartmentToPDF($reportData),
                'excel' => $reportGenerationService->exportDepartmentToExcel($reportData),
            };

            // Verify file was created successfully
            if (!$filePath || !file_exists(storage_path('app/' . $filePath))) {
                throw new \Exception('Export file was not created successfully');
            }

            // Return file download response
            return response()->download(
                storage_path('app/' . $filePath),
                basename($filePath),
                [
                    'Content-Type' => $this->getContentType($data['format']),
                    'Content-Disposition' => 'attachment; filename="' . basename($filePath) . '"'
                ]
            )->deleteFileAfterSend(true);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Please check your export parameters and try again.',
                'error' => 'validation_failed',
                'errors' => $e->errors(),
                'help_text' => 'Ensure you have selected a valid export format.'
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Department export failed', [
                'department_id' => $department->id,
                'format' => $data['format'] ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'An error occurred while generating the department export. Please try again.',
                'error' => 'export_failed',
                'help_text' => 'If this problem continues, try a different export format or contact support.',
                'technical_details' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get analytics data for a department
     */
    public function analytics(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'cache' => 'nullable|boolean',
                'period' => 'nullable|string|in:week,month,quarter,year',
            ]);

            $period = $data['period'] ?? 'month';
            $useCache = $data['cache'] ?? true;

            // Get evaluations for this department
            $evaluations = $department->evaluations()
                ->with(['course', 'teacher', 'feedbacks', 'analytics'])
                ->get();

            // Calculate analytics
            $totalEvaluations = $evaluations->count();
            $activeEvaluations = $evaluations->whereNull('closed_at')->count();
            $closedEvaluations = $evaluations->whereNotNull('closed_at')->count();
            
            $totalResponses = $evaluations->sum(function($eval) {
                // Count responses from all evaluation types (student, peer, HOD)
                $studentResponses = $eval->feedbacks->count();
                
                // Count peer evaluation responses for this teacher/semester
                $peerResponses = \App\Models\PeerEvaluationResponse::whereHas('peerEvaluation', function($query) use ($eval) {
                    $query->where('department_id', $eval->department_id ?? $eval->course?->department_id)
                          ->where('teacher_id', $eval->teacher_id)
                          ->where('academic_year', $eval->academic_year)
                          ->where('semester', $eval->semester);
                })->count();
                
                // Count HOD evaluation responses for this teacher/semester
                $hodResponses = \App\Models\HodEvaluation::where('department_id', $eval->department_id ?? $eval->course?->department_id)
                    ->where('teacher_id', $eval->teacher_id)
                    ->where('academic_year', $eval->academic_year)
                    ->where('semester', $eval->semester)
                    ->whereNotNull('score')
                    ->count();
                
                return $studentResponses + $peerResponses + $hodResponses;
            });
            
            $averageParticipation = $evaluations->avg(function($eval) {
                $totalResponses = $eval->feedbacks->count();
                $expectedResponses = $eval->course->enrolled_students ?? 0;
                return $expectedResponses > 0 ? ($totalResponses / $expectedResponses) * 100 : 0;
            });

            // Get participation trends
            $participationTrends = $evaluations->groupBy(function($eval) {
                return $eval->created_at->format('Y-m');
            })->map(function($monthEvals) {
                $monthlyResponses = $monthEvals->sum(function($eval) {
                    // Count responses from all evaluation types (student, peer, HOD)
                    $studentResponses = $eval->feedbacks->count();
                    
                    // Count peer evaluation responses for this teacher/semester
                    $peerResponses = \App\Models\PeerEvaluationResponse::whereHas('peerEvaluation', function($query) use ($eval) {
                        $query->where('department_id', $eval->department_id ?? $eval->course?->department_id)
                              ->where('teacher_id', $eval->teacher_id)
                              ->where('academic_year', $eval->academic_year)
                              ->where('semester', $eval->semester);
                    })->count();
                    
                    // Count HOD evaluation responses for this teacher/semester
                    $hodResponses = \App\Models\HodEvaluation::where('department_id', $eval->department_id ?? $eval->course?->department_id)
                        ->where('teacher_id', $eval->teacher_id)
                        ->where('academic_year', $eval->academic_year)
                        ->where('semester', $eval->semester)
                        ->whereNotNull('score')
                        ->count();
                    
                    return $studentResponses + $peerResponses + $hodResponses;
                });
                $monthlyExpected = $monthEvals->sum(function($eval) {
                    return $eval->course->enrolled_students ?? 0;
                });
                
                return [
                    'responses' => $monthlyResponses,
                    'expected' => $monthlyExpected,
                    'rate' => $monthlyExpected > 0 ? ($monthlyResponses / $monthlyExpected) * 100 : 0,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_evaluations' => $totalEvaluations,
                        'active_evaluations' => $activeEvaluations,
                        'closed_evaluations' => $closedEvaluations,
                        'total_responses' => $totalResponses,
                        'average_participation' => round($averageParticipation, 1),
                    ],
                    'trends' => $participationTrends,
                    'period' => $period,
                    'generated_at' => now()->toISOString(),
                ],
                'cached' => $useCache,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to load department analytics', [
                'department_id' => $department->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load analytics data.',
                'error' => 'analytics_load_failed'
            ], 500);
        }
    }

    /**
     * Get reports data for a department
     */
    public function reports(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'optimize' => 'nullable|boolean',
                'summary_only' => 'nullable|boolean',
                'period' => 'nullable|string|in:week,month,quarter,year',
                'cache' => 'nullable|boolean',
            ]);

            $summaryOnly = $data['summary_only'] ?? false;
            $optimize = $data['optimize'] ?? true;
            $period = $data['period'] ?? 'month';
            $useCache = $data['cache'] ?? true;

            // Get evaluations for this department
            $evaluationsQuery = $department->evaluations()
                ->with(['course', 'teacher', 'feedbacks']);

            if ($optimize) {
                // Only get recent evaluations for optimization
                $evaluationsQuery->where('created_at', '>=', now()->subMonths(3));
            }

            $evaluations = $evaluationsQuery->get();

            // Build professional KPIs and structured schema
            $cacheKey = "dept_reports_{$department->id}_{$period}_" . ($optimize ? 'opt' : 'full');
            $reportData = \Illuminate\Support\Facades\Cache::remember($cacheKey, 10, function () use ($evaluations, $period, $summaryOnly) {
                $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);

                $totalResponses = 0;
                $avgPerformanceScores = [];
                $avgParticipationRates = [];
                $teacherSemesterWeightedScores = [];
                $breakdownAccumulator = [
                    'student' => ['raw' => 0, 'weighted' => 0, 'count' => 0, 'weight' => 50],
                    'peer'    => ['raw' => 0, 'weighted' => 0, 'count' => 0, 'weight' => 30],
                    'admin'   => ['raw' => 0, 'weighted' => 0, 'count' => 0, 'weight' => 20],
                ];
                $ratingDistribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];

                $evaluationSummaries = [];

                foreach ($evaluations as $eval) {
                    $stats = $analyticsService->generateEvaluationStatistics($eval->id);

                    $avgPerformanceScores[] = $stats['performance_score'] ?? 0;
                    $avgParticipationRates[] = $stats['participation']['participation_rate'] ?? 0;
                    $totalResponses += $stats['total_responses'] ?? 0;
                    // Note: final department score will be computed per teacher per semester below

                    // Accumulate rating distribution
                    if (!empty($stats['rating_distribution']) && is_array($stats['rating_distribution'])) {
                        foreach ($stats['rating_distribution'] as $rating => $count) {
                            $rating = (int) $rating;
                            if (isset($ratingDistribution[$rating])) {
                                $ratingDistribution[$rating] += (int) $count;
                            }
                        }
                    }

                    // Accumulate breakdown
                    if (!empty($stats['weighted_scores']['breakdown'])) {
                        $bd = $stats['weighted_scores']['breakdown'];
                        foreach (['student', 'peer', 'admin'] as $key) {
                            if (isset($bd[$key])) {
                                $breakdownAccumulator[$key]['raw'] += (float) ($bd[$key]['raw_score'] ?? 0);
                                $breakdownAccumulator[$key]['weighted'] += (float) ($bd[$key]['weighted_value'] ?? 0);
                                $breakdownAccumulator[$key]['count'] += 1;
                                if (isset($bd[$key]['weight'])) {
                                    $breakdownAccumulator[$key]['weight'] = (float) $bd[$key]['weight'];
                                }
                            }
                        }
                    }

                    // Collect recent evaluation summaries for the table
                    if (!$summaryOnly) {
                        $evaluationSummaries[] = [
                            'id' => $eval->id,
                            'course_code' => $eval->course->code ?? null,
                            'course' => $eval->course->title ?? 'Unknown Course',
                            'instructor' => $eval->teacher->name ?? 'Unknown Instructor',
                            'status' => $eval->status,
                            'responses' => $stats['total_responses'] ?? $eval->feedbacks->count(),
                            'participation_rate' => $stats['participation']['participation_rate'] ?? 0,
                            'weighted_score' => $stats['weighted_scores']['weighted_score'] ?? 0,
                            'created_at' => optional($eval->created_at)->toISOString(),
                        ];
                    }
                }

                $avgPerformance = count($avgPerformanceScores) > 0 ? round(array_sum($avgPerformanceScores) / count($avgPerformanceScores), 2) : 0;
                $avgParticipation = count($avgParticipationRates) > 0 ? round(array_sum($avgParticipationRates) / count($avgParticipationRates), 2) : 0;

                // Compute per-teacher-per-semester weighted scores according to evaluation.md
                $teacherSemesterGroups = [];
                foreach ($evaluations as $eval) {
                    $key = $eval->teacher_id . '|' . $eval->academic_year . '|' . $eval->semester;
                    if (!isset($teacherSemesterGroups[$key])) {
                        $teacherSemesterGroups[$key] = [
                            'teacher_id' => $eval->teacher_id,
                            'academic_year' => $eval->academic_year,
                            'semester' => $eval->semester,
                        ];
                    }
                }

                $teacherSemesterResults = [];
                foreach ($teacherSemesterGroups as $group) {
                    $ts = $analyticsService->calculateTeacherSemesterScores(
                        $group['teacher_id'],
                        $group['academic_year'],
                        $group['semester']
                    );
                    $teacherSemesterResults[] = $ts;
                    $teacherSemesterWeightedScores[] = $ts['weighted_score'];
                }

                $avgWeightedScore = count($teacherSemesterWeightedScores) > 0 ? round(array_sum($teacherSemesterWeightedScores) / count($teacherSemesterWeightedScores), 2) : 0;

                // Build aggregated breakdown
                $aggregatedBreakdown = [];
                foreach (['student','peer','admin'] as $key) {
                    $count = max(1, $breakdownAccumulator[$key]['count']);
                    $aggregatedBreakdown[$key] = [
                        'raw_score' => round($breakdownAccumulator[$key]['raw'] / $count, 2),
                        'weight' => $breakdownAccumulator[$key]['weight'],
                        'weighted_value' => round($breakdownAccumulator[$key]['weighted'] / $count, 2),
                    ];
                }

                // Compose final schema (aligned with per-teacher-per-semester model)
                $data = [
                    'summary' => [
                        'department_id' => $evaluations->first()?->course?->department_id ?? null,
                        'total_evaluations' => $evaluations->count(),
                        'active_evaluations' => $evaluations->whereNull('closed_at')->count(),
                        'closed_evaluations' => $evaluations->whereNotNull('closed_at')->count(),
                        'total_responses' => $totalResponses,
                        'period' => $period,
                        'generated_at' => now()->toISOString(),
                    ],
                    'kpis' => [
                        'average_performance_score' => $avgPerformance,
                        'average_participation_rate' => $avgParticipation,
                        'average_weighted_score' => $avgWeightedScore,
                        'data_quality' => $avgParticipation >= 70 ? 'good' : ($avgParticipation >= 50 ? 'moderate' : 'low'),
                    ],
                    'score_breakdown' => [
                        'final_weighted_score' => $avgWeightedScore,
                        'breakdown' => $aggregatedBreakdown,
                    ],
                    'rating_distribution' => $ratingDistribution,
                    'teacher_semester_results' => $teacherSemesterResults,
                ];

                if (!$summaryOnly) {
                    // Sort by created_at desc
                    usort($evaluationSummaries, function ($a, $b) {
                        return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
                    });
                    $data['evaluations'] = $evaluationSummaries;
                }

                return $data;
            });

            return response()->json([
                'success' => true,
                'data' => $reportData,
                'optimized' => $optimize,
                'cached' => $useCache,
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to load department reports', [
                'department_id' => $department->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load reports data.',
                'error' => 'reports_load_failed'
            ], 500);
        }
    }



    /**
     * Get course-wise rating distribution for a teacher
     */
    public function teacherCourseRatings(Request $request, Department $department, $teacherId)
    {
        try {
            $data = $request->validate([
                'academic_year' => 'nullable|string',
                'semester' => 'nullable|string',
            ]);

            // Get all evaluations for this teacher in the department
            $evaluationsQuery = \App\Models\Evaluation::whereHas('course', function($query) use ($department) {
                $query->where('department_id', $department->id);
            })->where('teacher_id', $teacherId)
              ->with(['course', 'teacher', 'feedbacks.responses']);

            // Apply filters if provided
            if (!empty($data['academic_year'])) {
                $evaluationsQuery->where('academic_year', $data['academic_year']);
            }
            
            if (!empty($data['semester'])) {
                $evaluationsQuery->where('semester', $data['semester']);
            }

            $evaluations = $evaluationsQuery->get();

            if ($evaluations->isEmpty()) {
                return response()->json([
                    'message' => 'No evaluations found for this teacher.',
                    'data' => []
                ], 404);
            }

            $courseRatings = [];
            
            foreach ($evaluations as $evaluation) {
                $courseKey = $evaluation->course->id;
                
                if (!isset($courseRatings[$courseKey])) {
                    $courseRatings[$courseKey] = [
                        'course_id' => $evaluation->course->id,
                        'course_title' => $evaluation->course->title,
                        'course_code' => $evaluation->course->code,
                        'academic_year' => $evaluation->academic_year,
                        'semester' => $evaluation->semester,
                        'year_level' => $evaluation->year_level,
                        'rating_distribution' => [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0],
                        'total_responses' => 0,
                        'average_rating' => 0,
                        'final_score' => 0
                    ];
                }

                // Get all responses for this evaluation
                $responses = \App\Models\Response::whereHas('feedback', function ($query) use ($evaluation) {
                    $query->where('evaluation_id', $evaluation->id);
                })->whereNotNull('rating')
                  ->whereBetween('rating', [1, 5])
                  ->get();

                // Count rating distribution
                foreach ($responses as $response) {
                    $rating = (int) $response->rating;
                    $courseRatings[$courseKey]['rating_distribution'][$rating]++;
                    $courseRatings[$courseKey]['total_responses']++;
                }

                // Calculate average rating for this course
                if ($courseRatings[$courseKey]['total_responses'] > 0) {
                    $totalRatingSum = 0;
                    foreach ($courseRatings[$courseKey]['rating_distribution'] as $rating => $count) {
                        $totalRatingSum += $rating * $count;
                    }
                    $courseRatings[$courseKey]['average_rating'] = round($totalRatingSum / $courseRatings[$courseKey]['total_responses'], 2);
                    $courseRatings[$courseKey]['final_score'] = round(($courseRatings[$courseKey]['average_rating'] / 5) * 100, 1);
                }

                // Convert counts to percentages
                $total = $courseRatings[$courseKey]['total_responses'];
                if ($total > 0) {
                    foreach ($courseRatings[$courseKey]['rating_distribution'] as $rating => $count) {
                        $courseRatings[$courseKey]['rating_distribution'][$rating] = [
                            'count' => $count,
                            'percentage' => round(($count / $total) * 100, 1)
                        ];
                    }
                }
            }

            // Get teacher information
            $teacher = \App\Models\Teacher::find($teacherId);

            return response()->json([
                'success' => true,
                'data' => [
                    'teacher' => [
                        'id' => $teacher->id,
                        'name' => $teacher->name,
                        'email' => $teacher->email ?? null,
                        // Provide photo URL for frontend avatar display; include alias for compatibility
                        'photo_url' => $teacher->photo_url ?? null,
                        'profile_photo_url' => $teacher->photo_url ?? null,
                    ],
                    'department' => [
                        'id' => $department->id,
                        'name' => $department->name,
                    ],
                    'filters' => [
                        'academic_year' => $data['academic_year'] ?? 'All',
                        'semester' => $data['semester'] ?? 'All',
                    ],
                    'courses' => array_values($courseRatings),
                    'total_courses' => count($courseRatings),
                    'generated_at' => now()->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to load teacher course ratings', [
                'department_id' => $department->id,
                'teacher_id' => $teacherId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load course ratings for this teacher.',
                'error' => 'teacher_course_ratings_failed'
            ], 500);
        }
    }

    /**
     * Aggregate student comments across all courses taught by a teacher in a department.
     */
    public function teacherComments(Request $request, Department $department, $teacherId)
    {
        try {
            $data = $request->validate([
                'academic_year' => 'nullable|string',
                'semester' => 'nullable|string',
            ]);
            
            $academicYear = $data['academic_year'] ?? null;
            $semester = $data['semester'] ?? null;
            
            $query = \App\Models\Feedback::with([
                    'student:id,name',
                    'evaluation:id,course_id,teacher_id,academic_year,semester',
                    'evaluation.course:id,title,code,department_id',
                    'evaluation.teacher:id,name'
                ])
                ->whereHas('evaluation', function ($q) use ($department, $teacherId, $academicYear, $semester) {
                    $q->where('teacher_id', $teacherId)
                      ->whereHas('course', function ($qc) use ($department) {
                          $qc->where('department_id', $department->id);
                      });
                    if ($academicYear) {
                        $q->where('academic_year', $academicYear);
                    }
                    if ($semester) {
                        $q->where('semester', $semester);
                    }
                })
                ->whereNotNull('comments')
                ->orderByDesc('created_at');
            
            $comments = $query->get()->map(function ($f) {
                return [
                    'id' => $f->id,
                    'comments' => $f->comments,
                    'anonymous' => (bool) $f->anonymous,
                    'created_at' => $f->created_at,
                    'student' => $f->anonymous ? null : [
                        'id' => $f->student?->id,
                        'name' => $f->student?->name,
                    ],
                    'evaluation' => [
                        'id' => $f->evaluation->id,
                        'academic_year' => $f->evaluation->academic_year,
                        'semester' => $f->evaluation->semester,
                        'course' => [
                            'id' => $f->evaluation->course->id,
                            'title' => $f->evaluation->course->title,
                            'code' => $f->evaluation->course->code,
                        ],
                        'teacher' => [
                            'id' => $f->evaluation->teacher->id,
                            'name' => $f->evaluation->teacher->name,
                        ],
                    ],
                ];
            });
            
            return response()->json([
                'success' => true,
                'department_id' => $department->id,
                'teacher_id' => (int) $teacherId,
                'filters' => [
                    'academic_year' => $academicYear ?? 'All',
                    'semester' => $semester ?? 'All',
                ],
                'count' => $comments->count(),
                'comments' => $comments,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to aggregate teacher comments', [
                'department_id' => $department->id,
                'teacher_id' => $teacherId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load comments for this teacher.',
                'error' => 'teacher_comments_failed'
            ], 500);
        }
    }
 
    /**
     * Get content type for export format
     */
    private function getContentType($format)
    {
        return match($format) {
            'csv' => 'text/csv',
            'pdf' => 'application/pdf',
            'excel' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            default => 'application/octet-stream'
        };
    }

    /**
     * Get department-wide teacher rankings and performance comparison.
     * 
     * @param Request $request
     * @param Department $department
     * @return \Illuminate\Http\JsonResponse
     */
    public function teacherRankings(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'period' => 'nullable|string|regex:/^\d{4}-[12]$/', // Format: YYYY-S
                'sort_by' => 'nullable|in:performance,participation,responses',
                'sort_direction' => 'nullable|in:asc,desc',
                'limit' => 'nullable|integer|min:1|max:100',
            ]);

            $period = $data['period'] ?? date('Y') . '-' . (ceil(date('n') / 6));
            $sortBy = $data['sort_by'] ?? 'performance';
            $sortDirection = $data['sort_direction'] ?? 'desc';
            $limit = $data['limit'] ?? 50;

            $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);
            
            // Get department aggregation data
            $aggregation = $analyticsService->generateDepartmentAggregation($department->id, $period);
            
            // Extract and format teacher rankings
            $rankings = collect($aggregation['teacher_rankings'])->take($limit);
            
            // Apply additional sorting if requested
            if ($sortBy !== 'performance') {
                $rankings = $rankings->sortBy(function ($teacher) use ($sortBy) {
                    return match($sortBy) {
                        'participation' => $teacher['average_participation_rate'],
                        'responses' => $teacher['total_responses'],
                        default => $teacher['average_performance_score']
                    };
                }, SORT_REGULAR, $sortDirection === 'desc');
                
                // Re-assign ranks after sorting
                $rankings = $rankings->values()->map(function ($teacher, $index) {
                    $teacher['rank'] = $index + 1;
                    return $teacher;
                });
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'rankings' => $rankings,
                    'department_statistics' => $aggregation['department_statistics'],
                    'performance_distribution' => $aggregation['performance_distribution'],
                    'comparative_analysis' => $aggregation['comparative_analysis'],
                    'period' => $period,
                    'sort_criteria' => [
                        'sort_by' => $sortBy,
                        'sort_direction' => $sortDirection,
                        'limit' => $limit,
                    ],
                ],
                'generated_at' => $aggregation['generated_at'],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Invalid request parameters.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Failed to load teacher rankings', [
                'department_id' => $department->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to load teacher rankings.',
                'error' => 'teacher_rankings_load_failed'
            ], 500);
        }
    }

    /**
     * Get visual analytics data for charts and graphs.
     * 
     * @param Request $request
     * @param Department $department
     * @return \Illuminate\Http\JsonResponse
     */
    public function visualAnalytics(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'chart_types' => 'nullable|array',
                'chart_types.*' => 'in:performance_distribution,participation_trends,teacher_comparison,rating_breakdown',
                'period' => 'nullable|string|regex:/^\d{4}-[12]$/',
                'time_range' => 'nullable|in:6months,1year,2years',
            ]);

            $chartTypes = $data['chart_types'] ?? ['performance_distribution', 'participation_trends'];
            $period = $data['period'] ?? date('Y') . '-' . (ceil(date('n') / 6));
            $timeRange = $data['time_range'] ?? '1year';

            $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);
            $visualData = [];

            // Performance Distribution Chart
            if (in_array('performance_distribution', $chartTypes)) {
                $aggregation = $analyticsService->generateDepartmentAggregation($department->id, $period);
                $visualData['performance_distribution'] = [
                    'type' => 'pie',
                    'title' => 'Performance Distribution',
                    'data' => $aggregation['performance_distribution']['distribution'],
                    'colors' => [
                        'excellent' => '#28a745',
                        'good' => '#17a2b8',
                        'satisfactory' => '#ffc107',
                        'needs_improvement' => '#dc3545'
                    ]
                ];
            }

            // Participation Trends Chart
            if (in_array('participation_trends', $chartTypes)) {
                $participationSummary = $analyticsService->generateParticipationSummary($department->id, 'current_semester');
                $visualData['participation_trends'] = [
                    'type' => 'line',
                    'title' => 'Participation Trends Over Time',
                    'data' => collect($participationSummary['evaluation_details'])->groupBy('closed_at')->map(function ($group, $date) {
                        return [
                            'date' => $date,
                            'participation_rate' => $group->avg('participation_rate'),
                            'total_responses' => $group->sum('total_submissions'),
                        ];
                    })->values(),
                    'x_axis' => 'date',
                    'y_axis' => 'participation_rate'
                ];
            }

            // Teacher Comparison Chart
            if (in_array('teacher_comparison', $chartTypes)) {
                $aggregation = $analyticsService->generateDepartmentAggregation($department->id, $period);
                $topTeachers = collect($aggregation['teacher_rankings'])->take(10);
                
                $visualData['teacher_comparison'] = [
                    'type' => 'bar',
                    'title' => 'Top 10 Teacher Performance Comparison',
                    'data' => $topTeachers->map(function ($teacher) {
                        return [
                            'teacher' => $teacher['teacher_name'],
                            'performance_score' => $teacher['average_performance_score'],
                            'participation_rate' => $teacher['average_participation_rate'],
                        ];
                    }),
                    'x_axis' => 'teacher',
                    'y_axes' => ['performance_score', 'participation_rate']
                ];
            }

            // Rating Breakdown Chart
            if (in_array('rating_breakdown', $chartTypes)) {
                // Get recent evaluations for rating analysis
                $evaluations = $department->evaluations()
                    ->with(['feedbacks.responses'])
                    ->where('created_at', '>=', now()->subMonths(6))
                    ->get();

                $ratingCounts = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
                
                foreach ($evaluations as $evaluation) {
                    foreach ($evaluation->feedbacks as $feedback) {
                        foreach ($feedback->responses as $response) {
                            if ($response->rating && $response->rating >= 1 && $response->rating <= 5) {
                                $ratingCounts[$response->rating]++;
                            }
                        }
                    }
                }

                $visualData['rating_breakdown'] = [
                    'type' => 'bar',
                    'title' => 'Rating Distribution (1-5 Scale)',
                    'data' => collect($ratingCounts)->map(function ($count, $rating) {
                        return [
                            'rating' => "Rating {$rating}",
                            'count' => $count,
                        ];
                    })->values(),
                    'x_axis' => 'rating',
                    'y_axis' => 'count',
                    'colors' => ['#dc3545', '#fd7e14', '#ffc107', '#17a2b8', '#28a745']
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'charts' => $visualData,
                    'metadata' => [
                        'department_id' => $department->id,
                        'department_name' => $department->name,
                        'period' => $period,
                        'time_range' => $timeRange,
                        'chart_types' => $chartTypes,
                    ],
                ],
                'generated_at' => now()->toISOString(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Invalid request parameters.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Failed to load visual analytics', [
                'department_id' => $department->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to load visual analytics data.',
                'error' => 'visual_analytics_load_failed'
            ], 500);
        }
    }

    /**
     * Get comprehensive department performance insights.
     * 
     * @param Request $request
     * @param Department $department
     * @return \Illuminate\Http\JsonResponse
     */
    public function performanceInsights(Request $request, Department $department)
    {
        try {
            $data = $request->validate([
                'periods' => 'nullable|array|min:2',
                'periods.*' => 'string|regex:/^\d{4}-[12]$/',
                'include_trends' => 'nullable|boolean',
                'include_benchmarking' => 'nullable|boolean',
            ]);

            $periods = $data['periods'] ?? [
                date('Y') . '-' . (ceil(date('n') / 6)), // Current period
                (ceil(date('n') / 6) === 1) ? (date('Y') - 1) . '-2' : date('Y') . '-1' // Previous period
            ];
            $includeTrends = $data['include_trends'] ?? true;
            $includeBenchmarking = $data['include_benchmarking'] ?? true;

            $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);
            $insights = [];

            // Get current period insights
            $currentPeriod = $periods[0];
            $currentAggregation = $analyticsService->generateDepartmentAggregation($department->id, $currentPeriod);
            
            $insights['current_performance'] = [
                'period' => $currentPeriod,
                'statistics' => $currentAggregation['department_statistics'],
                'performance_distribution' => $currentAggregation['performance_distribution'],
                'top_performers' => array_slice($currentAggregation['teacher_rankings'], 0, 5),
                'improvement_needed' => $currentAggregation['comparative_analysis']['improvement_needed'],
                'recommendations' => $currentAggregation['comparative_analysis']['recommendations'],
            ];

            // Include trend analysis if requested
            if ($includeTrends && count($periods) >= 2) {
                $trendData = [];
                foreach ($periods as $period) {
                    $aggregation = $analyticsService->generateDepartmentAggregation($department->id, $period);
                    $trendData[] = [
                        'period' => $period,
                        'average_performance' => $aggregation['department_statistics']['average_performance_score'],
                        'average_participation' => $aggregation['department_statistics']['average_participation_rate'],
                        'total_evaluations' => $aggregation['department_statistics']['total_evaluations'],
                        'total_responses' => $aggregation['department_statistics']['total_responses'],
                    ];
                }

                // Calculate period-over-period changes
                $periodChanges = [];
                for ($i = 1; $i < count($trendData); $i++) {
                    $current = $trendData[$i];
                    $previous = $trendData[$i - 1];
                    
                    $periodChanges[] = [
                        'from_period' => $previous['period'],
                        'to_period' => $current['period'],
                        'performance_change' => round($current['average_performance'] - $previous['average_performance'], 2),
                        'participation_change' => round($current['average_participation'] - $previous['average_participation'], 2),
                        'evaluation_change' => $current['total_evaluations'] - $previous['total_evaluations'],
                    ];
                }

                $insights['trends'] = [
                    'data' => $trendData,
                    'changes' => $periodChanges,
                    'overall_trend' => $this->calculateOverallTrend($trendData),
                ];
            }

            // Include benchmarking if requested
            if ($includeBenchmarking && count($periods) >= 2) {
                $benchmarking = $analyticsService->generateDepartmentBenchmarking($department->id, $periods);
                $insights['benchmarking'] = [
                    'benchmark_data' => $benchmarking['benchmark_data'],
                    'period_changes' => $benchmarking['period_changes'],
                    'overall_trend' => $benchmarking['overall_trend'],
                ];
            }

            // Generate actionable insights
            $insights['actionable_insights'] = $this->generateActionableInsights($currentAggregation, $insights['trends'] ?? null);

            return response()->json([
                'success' => true,
                'data' => $insights,
                'metadata' => [
                    'department_id' => $department->id,
                    'department_name' => $department->name,
                    'periods_analyzed' => $periods,
                    'analysis_scope' => [
                        'trends_included' => $includeTrends,
                        'benchmarking_included' => $includeBenchmarking,
                    ],
                ],
                'generated_at' => now()->toISOString(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Invalid request parameters.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Failed to load performance insights', [
                'department_id' => $department->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Failed to load performance insights.',
                'error' => 'performance_insights_load_failed'
            ], 500);
        }
    }

    /**
     * Calculate overall trend from trend data.
     * 
     * @param array $trendData
     * @return array
     */
    private function calculateOverallTrend(array $trendData): array
    {
        if (count($trendData) < 2) {
            return [
                'direction' => 'insufficient_data',
                'strength' => 0,
                'confidence' => 0,
            ];
        }

        $performanceScores = array_column($trendData, 'average_performance');
        $participationRates = array_column($trendData, 'average_participation');

        // Simple linear trend calculation
        $performanceChange = end($performanceScores) - reset($performanceScores);
        $participationChange = end($participationRates) - reset($participationRates);

        $overallChange = ($performanceChange + $participationChange) / 2;

        $direction = match(true) {
            $overallChange > 2 => 'improving',
            $overallChange < -2 => 'declining',
            default => 'stable',
        };

        return [
            'direction' => $direction,
            'performance_change' => round($performanceChange, 2),
            'participation_change' => round($participationChange, 2),
            'overall_change' => round($overallChange, 2),
            'strength' => min(100, abs($overallChange) * 10), // Scale to 0-100
        ];
    }

    /**
     * Generate actionable insights based on performance data.
     * 
     * @param array $currentAggregation
     * @param array|null $trends
     * @return array
     */
    private function generateActionableInsights(array $currentAggregation, ?array $trends): array
    {
        $insights = [];
        $stats = $currentAggregation['department_statistics'];
        $distribution = $currentAggregation['performance_distribution'];

        // Performance insights
        if ($stats['average_performance_score'] >= 85) {
            $insights[] = [
                'type' => 'positive',
                'category' => 'performance',
                'title' => 'Excellent Department Performance',
                'description' => 'Your department is performing exceptionally well with an average score of ' . $stats['average_performance_score'] . '%.',
                'action' => 'Continue current practices and consider sharing best practices with other departments.',
            ];
        } elseif ($stats['average_performance_score'] < 70) {
            $insights[] = [
                'type' => 'warning',
                'category' => 'performance',
                'title' => 'Performance Improvement Needed',
                'description' => 'Department performance is below expectations at ' . $stats['average_performance_score'] . '%.',
                'action' => 'Consider implementing teacher training programs and performance improvement initiatives.',
            ];
        }

        // Participation insights
        if ($stats['average_participation_rate'] < 60) {
            $insights[] = [
                'type' => 'warning',
                'category' => 'participation',
                'title' => 'Low Student Participation',
                'description' => 'Student participation rate is ' . round($stats['average_participation_rate'], 1) . '%, which may affect data reliability.',
                'action' => 'Implement strategies to increase student engagement in evaluations.',
            ];
        }

        // Distribution insights
        if (isset($distribution['distribution']['needs_improvement']) && 
            $distribution['distribution']['needs_improvement']['percentage'] > 25) {
            $insights[] = [
                'type' => 'alert',
                'category' => 'distribution',
                'title' => 'High Number of Underperforming Teachers',
                'description' => $distribution['distribution']['needs_improvement']['percentage'] . '% of teachers need improvement.',
                'action' => 'Focus on targeted support and mentoring for underperforming teachers.',
            ];
        }

        // Trend insights
        if ($trends && isset($trends['changes'])) {
            $latestChange = end($trends['changes']);
            if ($latestChange['performance_change'] < -5) {
                $insights[] = [
                    'type' => 'alert',
                    'category' => 'trend',
                    'title' => 'Declining Performance Trend',
                    'description' => 'Performance has declined by ' . abs($latestChange['performance_change']) . '% from the previous period.',
                    'action' => 'Investigate causes of performance decline and implement corrective measures.',
                ];
            } elseif ($latestChange['performance_change'] > 5) {
                $insights[] = [
                    'type' => 'positive',
                    'category' => 'trend',
                    'title' => 'Improving Performance Trend',
                    'description' => 'Performance has improved by ' . $latestChange['performance_change'] . '% from the previous period.',
                    'action' => 'Continue current improvement strategies and document successful practices.',
                ];
            }
        }

        return $insights;
    }
}
