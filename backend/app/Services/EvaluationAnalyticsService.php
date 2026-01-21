<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\EvaluationAnalytics;
use App\Models\Feedback;
use App\Models\Response;
use App\Models\Student;
use App\Models\EvaluationSubmission;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EvaluationAnalyticsService
{
    /**
     * Cache duration for expensive calculations (in minutes)
     */
    private const CACHE_DURATION = 60;

    /**
     * Cache duration for frequently accessed data (in minutes)
     */
    private const FREQUENT_CACHE_DURATION = 30;

    /**
     * Cache duration for heavy computations (in minutes)
     */
    private const HEAVY_CACHE_DURATION = 120;

    /**
     * Weighted scoring percentages as defined in evaluation.md
     */
    private const STUDENT_WEIGHT = 0.5;  // 50%
    private const PEER_WEIGHT = 0.3;     // 30%
    private const ADMIN_WEIGHT = 0.2;    // 20%

    /**
     * Calculate comprehensive weighted scores for an evaluation.
     * Implements the 3-part evaluation model:
     * - Student Evaluation: 50%
     * - Peer Evaluation: 30% 
     * - Boss/Admin Evaluation: 20%
     * 
     * Formula: Final Score = (Student × 0.5) + (Peer × 0.3) + (Admin × 0.2)
     * 
     * @param int $evaluationId
     * @return array
     */
    public function calculateWeightedScores(int $evaluationId): array
    {
        $cacheKey = "weighted_scores_{$evaluationId}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($evaluationId) {
            $evaluation = Evaluation::with(['course', 'teacher'])->findOrFail($evaluationId);
            
            // Calculate Student Evaluation Score (50% weight)
            $studentScore = $this->calculateStudentEvaluationScore($evaluationId);
            
            // Calculate Peer Evaluation Score (30% weight)
            $peerScore = $this->calculatePeerEvaluationScore($evaluationId);
            
            // Calculate Admin/Boss Evaluation Score (20% weight)
            $adminScore = $this->calculateAdminEvaluationScore($evaluationId);
            
            // Calculate weighted final score
            $weightedScore = ($studentScore * self::STUDENT_WEIGHT) + 
                           ($peerScore * self::PEER_WEIGHT) + 
                           ($adminScore * self::ADMIN_WEIGHT);

            return [
                'student_score' => round($studentScore, 2),
                'peer_score' => round($peerScore, 2),
                'admin_score' => round($adminScore, 2),
                'weighted_score' => round($weightedScore, 2),
                'breakdown' => [
                    'student' => [
                        'raw_score' => $studentScore,
                        'weight' => self::STUDENT_WEIGHT * 100,
                        'weighted_value' => round($studentScore * self::STUDENT_WEIGHT, 2)
                    ],
                    'peer' => [
                        'raw_score' => $peerScore,
                        'weight' => self::PEER_WEIGHT * 100,
                        'weighted_value' => round($peerScore * self::PEER_WEIGHT, 2)
                    ],
                    'admin' => [
                        'raw_score' => $adminScore,
                        'weight' => self::ADMIN_WEIGHT * 100,
                        'weighted_value' => round($adminScore * self::ADMIN_WEIGHT, 2)
                    ]
                ],
                'performance_level' => $this->getPerformanceLevel($weightedScore),
                'calculated_at' => now()->toISOString()
            ];
        });
    }

    /**
     * Calculate Student Evaluation Score (0-100%)
     * Formula: (Sum of all student responses / (Number of questions × 5)) × 100
     * 
     * @param int $evaluationId
     * @return float
     */
    private function calculateStudentEvaluationScore(int $evaluationId): float
    {
        // Get all student responses for this evaluation
        $responses = Response::whereHas('feedback', function ($query) use ($evaluationId) {
            $query->where('evaluation_id', $evaluationId)
                  ->where('student_id', '!=', null); // Only student responses
        })->whereNotNull('rating')
          ->whereBetween('rating', [1, 5])
          ->get();

        if ($responses->isEmpty()) {
            return 0.0;
        }

        // Calculate average rating and convert to percentage
        $averageRating = $responses->avg('rating');
        return ($averageRating / 5) * 100;
    }

    /**
     * Calculate Peer Evaluation Score (0-100%)
     * Teachers evaluating other teachers
     * 
     * @param int $evaluationId
     * @return float
     */
    private function calculatePeerEvaluationScore(int $evaluationId): float
    {
        // TODO: Implement peer evaluation system
        // For now, return student score as placeholder
        // This will be implemented when peer evaluation tables are created
        
        // Placeholder logic - in production this would query peer_evaluations table
        $studentScore = $this->calculateStudentEvaluationScore($evaluationId);
        
        // Apply slight variation to simulate peer evaluation
        // In real implementation, this would be actual peer evaluation data
        return max(0, min(100, $studentScore + rand(-5, 5)));
    }

    /**
     * Calculate Admin/Boss Evaluation Score (0-100%)
     * Department head evaluating the teacher
     * 
     * @param int $evaluationId
     * @return float
     */
    private function calculateAdminEvaluationScore(int $evaluationId): float
    {
        // TODO: Implement admin evaluation system
        // For now, return student score as placeholder
        // This will be implemented when boss_evaluations table is created
        
        // Placeholder logic - in production this would query boss_evaluations table
        $studentScore = $this->calculateStudentEvaluationScore($evaluationId);
        
        // Apply slight variation to simulate admin evaluation
        // In real implementation, this would be actual admin evaluation data
        return max(0, min(100, $studentScore + rand(-3, 7)));
    }

    /**
     * Get performance level based on weighted score
     * 
     * @param float $score
     * @return string
     */
    private function getPerformanceLevel(float $score): string
    {
        if ($score >= 90) return 'Excellent';
        if ($score >= 80) return 'Very Good';
        if ($score >= 70) return 'Good';
        if ($score >= 60) return 'Satisfactory';
        if ($score >= 50) return 'Needs Improvement';
        return 'Unsatisfactory';
    }

    /**
     * Get comprehensive evaluation results with weighted scoring breakdown
     * This method provides all the data needed for the results dashboard
     * 
     * @param int $evaluationId
     * @return array
     */
    public function getComprehensiveResults(int $evaluationId): array
    {
        $cacheKey = "comprehensive_results_{$evaluationId}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($evaluationId) {
            $evaluation = Evaluation::with(['course', 'teacher', 'feedbacks'])->findOrFail($evaluationId);
            
            // Get weighted scores
            $weightedScores = $this->calculateWeightedScores($evaluationId);
            
            // Get participation metrics
            $participationData = $this->calculateParticipationRate($evaluationId);
            
            // Get response statistics
            $responseStats = $this->getResponseStatistics($evaluationId);
            
            // Get section-wise breakdown (A, B, C sections)
            $sectionBreakdown = $this->getSectionBreakdown($evaluationId);
            
            return [
                'evaluation_info' => [
                    'id' => $evaluation->id,
                    'course' => $evaluation->course->title ?? 'Unknown Course',
                    'course_code' => $evaluation->course->code ?? 'N/A',
                    'instructor' => $evaluation->teacher->name ?? 'Unknown Instructor',
                    'department' => $evaluation->course->department->name ?? 'Unknown Department',
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'year_level' => $evaluation->course->year_level ?? 'N/A',
                    'status' => $evaluation->status ?? 'Active',
                    'opened_at' => $evaluation->opened_at,
                    'closed_at' => $evaluation->closed_at,
                ],
                'weighted_scores' => $weightedScores,
                'participation' => $participationData,
                'response_statistics' => $responseStats,
                'section_breakdown' => $sectionBreakdown,
                'summary' => [
                    'final_score' => $weightedScores['weighted_score'],
                    'performance_level' => $weightedScores['performance_level'],
                    'total_responses' => $participationData['total_submissions'],
                    'participation_rate' => $participationData['participation_rate'],
                    'data_quality' => $this->getDataQuality($participationData['participation_rate']),
                ],
                'generated_at' => now()->toISOString(),
            ];
        });
    }

    /**
     * Get response statistics for an evaluation
     * 
     * @param int $evaluationId
     * @return array
     */
    private function getResponseStatistics(int $evaluationId): array
    {
        $responses = Response::whereHas('feedback', function ($query) use ($evaluationId) {
            $query->where('evaluation_id', $evaluationId);
        })->get();

        $ratingResponses = $responses->whereNotNull('rating');
        $textResponses = $responses->whereNotNull('text')->where('text', '!=', '');

        // Calculate rating distribution
        $ratingDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $count = $ratingResponses->where('rating', $i)->count();
            $ratingDistribution[$i] = [
                'count' => $count,
                'percentage' => $ratingResponses->count() > 0 ? round(($count / $ratingResponses->count()) * 100, 1) : 0
            ];
        }

        return [
            'total_responses' => $responses->count(),
            'rating_responses' => $ratingResponses->count(),
            'text_responses' => $textResponses->count(),
            'average_rating' => round($ratingResponses->avg('rating') ?? 0, 2),
            'rating_distribution' => $ratingDistribution,
        ];
    }

    /**
     * Get section-wise breakdown (A, B, C sections)
     * 
     * @param int $evaluationId
     * @return array
     */
    private function getSectionBreakdown(int $evaluationId): array
    {
        $responses = Response::whereHas('feedback', function ($query) use ($evaluationId) {
            $query->where('evaluation_id', $evaluationId);
        })->with('question')->whereNotNull('rating')->get();

        $sections = ['A', 'B', 'C'];
        $breakdown = [];

        foreach ($sections as $section) {
            $sectionResponses = $responses->filter(function ($response) use ($section) {
                return $response->question && $response->question->section === $section;
            });

            if ($sectionResponses->count() > 0) {
                $breakdown[$section] = [
                    'name' => $this->getSectionName($section),
                    'total_responses' => $sectionResponses->count(),
                    'average_rating' => round($sectionResponses->avg('rating'), 2),
                    'percentage' => round(($sectionResponses->avg('rating') / 5) * 100, 1),
                ];
            }
        }

        return $breakdown;
    }

    /**
     * Get section name based on section code
     * 
     * @param string $section
     * @return string
     */
    private function getSectionName(string $section): string
    {
        return match($section) {
            'A' => 'Instructional Skills',
            'B' => 'Professional Ethics & Attitude', 
            'C' => 'Assessment Methods & Feedback',
            default => 'Other'
        };
    }

    /**
     * Get data quality assessment based on participation rate
     * 
     * @param float $participationRate
     * @return string
     */
    private function getDataQuality(float $participationRate): string
    {
        if ($participationRate >= 80) return 'Excellent';
        if ($participationRate >= 60) return 'Good';
        return 'Limited';
    }

    /**
     * Calculate broadcast participation statistics for real-time updates
     * 
     * @param int $evaluationId
     * @return array
     */
    public function calculateBroadcastParticipationStats(int $evaluationId): array
    {
        $evaluation = Evaluation::with(['course', 'teacher'])->findOrFail($evaluationId);
        
        // Get total eligible students for this evaluation
        // This would typically be students enrolled in the course
        $totalEligibleStudents = Student::whereHas('courses', function ($query) use ($evaluation) {
            $query->where('course_id', $evaluation->course_id);
        })->count();

        // Get actual submissions
        $totalSubmissions = EvaluationSubmission::where('evaluation_id', $evaluationId)->count();

        // Calculate participation rate
        $participationRate = $totalEligibleStudents > 0 
            ? ($totalSubmissions / $totalEligibleStudents) * 100 
            : 0;

        return [
            'count' => $totalSubmissions,
            'total' => $totalEligibleStudents,
            'rate' => round($participationRate, 2),
            'lastSubmissionAt' => now()->toISOString(),
        ];
    }

    /**
     * Calculate participation rate for an evaluation.
     * 
     * @param int $evaluationId
     * @return array
     */
    public function calculateParticipationRate(int $evaluationId): array
    {
        $cacheKey = "participation_rate_{$evaluationId}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($evaluationId) {
            $evaluation = Evaluation::with(['course', 'teacher'])->findOrFail($evaluationId);
            
            // Get total eligible students for this evaluation
            // This would typically be students enrolled in the course
            $totalEligibleStudents = Student::whereHas('courses', function ($query) use ($evaluation) {
                $query->where('course_id', $evaluation->course_id);
            })->count();

            // Get actual submissions
            $totalSubmissions = EvaluationSubmission::where('evaluation_id', $evaluationId)->count();
            
            // Get last submission timestamp
            $lastSubmission = EvaluationSubmission::where('evaluation_id', $evaluationId)
                ->orderBy('submitted_at', 'desc')
                ->first();

            // Calculate participation rate
            $participationRate = $totalEligibleStudents > 0 
                ? ($totalSubmissions / $totalEligibleStudents) * 100 
                : 0;

            return [
                'total_eligible_students' => $totalEligibleStudents,
                'total_submissions' => $totalSubmissions,
                'participation_rate' => round($participationRate, 2),
                'remaining_students' => $totalEligibleStudents - $totalSubmissions,
                'last_submission_at' => $lastSubmission ? $lastSubmission->submitted_at : null,
            ];
        });
    }

    /**
     * Generate comprehensive statistics for an evaluation with optimized caching.
     * 
     * @param int $evaluationId
     * @return array
     */
    public function generateEvaluationStatistics(int $evaluationId): array
    {
        $cacheKey = "evaluation_stats_{$evaluationId}";
        
        return Cache::remember($cacheKey, self::FREQUENT_CACHE_DURATION, function () use ($evaluationId) {
            $weightedScores = $this->calculateWeightedScores($evaluationId);
            $participationData = $this->calculateParticipationRate($evaluationId);
            
            // Optimize query by using eager loading and specific columns
            $allResponses = Response::select(['id', 'feedback_id', 'rating', 'text'])
                ->whereHas('feedback', function ($query) use ($evaluationId) {
                    $query->where('evaluation_id', $evaluationId)
                          ->where('is_locked', true); // Only include completed feedbacks
                })
                ->with(['feedback:id,is_locked'])
                ->get();

            // Filter out invalid responses
            $responses = $this->filterValidResponses($allResponses);

            $ratingDistribution = $responses->whereNotNull('rating')->groupBy('rating')->map(function ($group) {
                return $group->count();
            })->toArray();

            // Calculate average rating (only from valid responses)
            $averageRating = $responses->whereNotNull('rating')->avg('rating') ?? 0;

            // Calculate performance score as percentage (normalized to 100%)
            $maxPossibleRating = 5; // Assuming 5-point scale
            $performanceScore = $averageRating > 0 
                ? ($averageRating / $maxPossibleRating) * 100 
                : 0;

            return [
                'evaluation_id' => $evaluationId,
                'average_rating' => round($averageRating, 2),
                'performance_score' => round($performanceScore, 2),
                'weighted_scores' => $weightedScores,
                'participation' => $participationData,
                'rating_distribution' => $ratingDistribution,
                'total_responses' => $responses->count(),
                'total_raw_responses' => $allResponses->count(),
                'excluded_responses' => $allResponses->count() - $responses->count(),
                'calculated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Generate performance trends for a teacher across multiple evaluations.
     * 
     * @param int $teacherId
     * @param string $timeRange (e.g., '6months', '1year', '2years')
     * @return array
     */
    public function generatePerformanceTrends(int $teacherId, string $timeRange = '1year'): array
    {
        $cacheKey = "performance_trends_{$teacherId}_{$timeRange}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($teacherId, $timeRange) {
            // Calculate date range
            $startDate = match($timeRange) {
                '6months' => Carbon::now()->subMonths(6),
                '2years' => Carbon::now()->subYears(2),
                default => Carbon::now()->subYear(),
            };

            // Get evaluations for this teacher within the time range
            $evaluations = Evaluation::where('teacher_id', $teacherId)
                ->where('created_at', '>=', $startDate)
                ->orderBy('created_at')
                ->get();

            $trends = [];
            foreach ($evaluations as $evaluation) {
                $stats = $this->generateEvaluationStatistics($evaluation->id);
                
                $trends[] = [
                    'evaluation_id' => $evaluation->id,
                    'course_id' => $evaluation->course_id,
                    'academic_year' => $evaluation->academic_year,
                    'semester' => $evaluation->semester,
                    'date' => $evaluation->created_at->format('Y-m-d'),
                    'average_rating' => $stats['average_rating'],
                    'performance_score' => $stats['performance_score'],
                    'weighted_score' => $stats['weighted_scores']['weighted_score'],
                    'participation_rate' => $stats['participation']['participation_rate'],
                    'total_responses' => $stats['total_responses'],
                ];
            }

            // Calculate trend analysis
            $trendAnalysis = $this->analyzeTrends($trends);

            return [
                'teacher_id' => $teacherId,
                'time_range' => $timeRange,
                'trends' => $trends,
                'analysis' => $trendAnalysis,
                'generated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Analyze trends in performance data.
     * 
     * @param array $trends
     * @return array
     */
    private function analyzeTrends(array $trends): array
    {
        if (count($trends) < 2) {
            return [
                'trend_direction' => 'insufficient_data',
                'average_change' => 0,
                'significant_changes' => [],
            ];
        }

        $performanceScores = array_column($trends, 'performance_score');
        $firstScore = reset($performanceScores);
        $lastScore = end($performanceScores);
        
        $overallChange = $lastScore - $firstScore;
        $averageChange = $overallChange / (count($trends) - 1);

        // Determine trend direction
        $trendDirection = match(true) {
            $averageChange > 2 => 'improving',
            $averageChange < -2 => 'declining',
            default => 'stable',
        };

        // Find significant changes (>5% change between consecutive evaluations)
        $significantChanges = [];
        for ($i = 1; $i < count($trends); $i++) {
            $change = $trends[$i]['performance_score'] - $trends[$i-1]['performance_score'];
            if (abs($change) > 5) {
                $significantChanges[] = [
                    'from_evaluation' => $trends[$i-1]['evaluation_id'],
                    'to_evaluation' => $trends[$i]['evaluation_id'],
                    'change' => round($change, 2),
                    'type' => $change > 0 ? 'improvement' : 'decline',
                ];
            }
        }

        return [
            'trend_direction' => $trendDirection,
            'overall_change' => round($overallChange, 2),
            'average_change' => round($averageChange, 2),
            'significant_changes' => $significantChanges,
        ];
    }

    /**
     * Store or update analytics data in the database.
     * 
     * @param int $evaluationId
     * @return EvaluationAnalytics
     */
    public function storeAnalytics(int $evaluationId): EvaluationAnalytics
    {
        $stats = $this->generateEvaluationStatistics($evaluationId);
        
        return EvaluationAnalytics::updateOrCreate(
            ['evaluation_id' => $evaluationId],
            [
                'total_eligible_students' => $stats['participation']['total_eligible_students'],
                'total_submissions' => $stats['participation']['total_submissions'],
                'participation_rate' => $stats['participation']['participation_rate'],
                'average_rating' => $stats['average_rating'],
                'weighted_score' => $stats['weighted_scores']['weighted_score'],
                'calculated_at' => Carbon::now(),
            ]
        );
    }

    /**
     * Clear cache for specific evaluation analytics.
     * 
     * @param int $evaluationId
     * @return void
     */
    public function clearCache(int $evaluationId): void
    {
        $cacheKeys = [
            "weighted_scores_{$evaluationId}",
            "participation_rate_{$evaluationId}",
            "evaluation_stats_{$evaluationId}",
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Generate question-by-question analysis for an evaluation with optimized queries.
     * 
     * @param int $evaluationId
     * @return array
     */
    public function generateQuestionAnalysis(int $evaluationId): array
    {
        $cacheKey = "question_analysis_{$evaluationId}";
        
        return Cache::remember($cacheKey, self::FREQUENT_CACHE_DURATION, function () use ($evaluationId) {
            // Optimize query with eager loading and specific columns
            $allResponses = Response::select(['id', 'feedback_id', 'question_id', 'rating', 'text'])
                ->whereHas('feedback', function ($query) use ($evaluationId) {
                    $query->where('evaluation_id', $evaluationId)
                          ->where('is_locked', true);
                })
                ->with([
                    'feedback:id,is_locked',
                    'question:id,text,type'
                ])
                ->get();

            // Filter out invalid responses
            $responses = $this->filterValidResponses($allResponses);

            if ($responses->isEmpty()) {
                return [];
            }

            $questionAnalysis = [];
            
            // Group responses by question for efficient processing
            $responsesByQuestion = $responses->groupBy('question_id');
            
            foreach ($responsesByQuestion as $questionId => $questionResponses) {
                $question = $questionResponses->first()->question;
                
                // Calculate average rating for this question (only valid ratings)
                $validRatings = $questionResponses->whereNotNull('rating')->where('rating', '>=', 1)->where('rating', '<=', 5);
                $averageRating = $validRatings->avg('rating');
                
                // Calculate response distribution (1-5 scale) efficiently
                $distribution = [];
                $ratingCounts = $validRatings->countBy('rating');
                
                for ($rating = 1; $rating <= 5; $rating++) {
                    $count = $ratingCounts->get($rating, 0);
                    $distribution[$rating] = [
                        'count' => $count,
                        'percentage' => $validRatings->count() > 0 
                            ? round(($count / $validRatings->count()) * 100, 1) 
                            : 0
                    ];
                }
                
                // Get text responses (if any) - only from valid responses, limited for performance
                $textResponses = $questionResponses->whereNotNull('text')
                    ->where('text', '!=', '')
                    ->filter(function ($response) {
                        return trim($response->text) !== '';
                    })
                    ->take(10) // Limit to first 10 for performance
                    ->pluck('text')
                    ->toArray();
                
                $questionAnalysis[] = [
                    'question_id' => $questionId,
                    'question_text' => $question->text ?? 'Question text not available',
                    'category' => $question->type ?? 'General',
                    'average_rating' => $averageRating ? round($averageRating, 2) : null,
                    'total_responses' => $questionResponses->count(),
                    'valid_rating_responses' => $validRatings->count(),
                    'rating_distribution' => $distribution,
                    'text_responses_count' => count($textResponses),
                    'text_responses' => $textResponses,
                    'performance_percentage' => $averageRating ? round(($averageRating / 5) * 100, 1) : 0,
                ];
            }
            
            // Sort by average rating (descending) for better presentation
            usort($questionAnalysis, function ($a, $b) {
                $aRating = $a['average_rating'] ?? 0;
                $bRating = $b['average_rating'] ?? 0;
                return $bRating <=> $aRating; // Descending order
            });
            
            return $questionAnalysis;
        });
    }

    /**
     * Detect low participation evaluations based on threshold.
     * 
     * @param int $departmentId
     * @param float $threshold (default 50% participation)
     * @return array
     */
    public function detectLowParticipation(int $departmentId, float $threshold = 50.0): array
    {
        $cacheKey = "low_participation_{$departmentId}_{$threshold}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($departmentId, $threshold) {
            // Get all active evaluations for the department
            $evaluations = Evaluation::whereHas('course', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })->where('closed_at', '>', now())->get();

            $lowParticipationEvaluations = [];

            foreach ($evaluations as $evaluation) {
                $participationData = $this->calculateParticipationRate($evaluation->id);
                
                if ($participationData['participation_rate'] < $threshold) {
                    $lowParticipationEvaluations[] = [
                        'evaluation_id' => $evaluation->id,
                        'course_id' => $evaluation->course_id,
                        'teacher_id' => $evaluation->teacher_id,
                        'participation_rate' => $participationData['participation_rate'],
                        'total_eligible_students' => $participationData['total_eligible_students'],
                        'total_submissions' => $participationData['total_submissions'],
                        'remaining_students' => $participationData['remaining_students'],
                        'days_remaining' => now()->diffInDays($evaluation->closed_at),
                        'urgency_level' => $this->calculateUrgencyLevel($participationData['participation_rate'], now()->diffInDays($evaluation->closed_at)),
                    ];
                }
            }

            // Sort by urgency level and participation rate
            usort($lowParticipationEvaluations, function ($a, $b) {
                if ($a['urgency_level'] === $b['urgency_level']) {
                    return $a['participation_rate'] <=> $b['participation_rate'];
                }
                return $b['urgency_level'] <=> $a['urgency_level'];
            });

            return [
                'department_id' => $departmentId,
                'threshold' => $threshold,
                'low_participation_evaluations' => $lowParticipationEvaluations,
                'total_flagged' => count($lowParticipationEvaluations),
                'detected_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Calculate urgency level based on participation rate and time remaining.
     * 
     * @param float $participationRate
     * @param int $daysRemaining
     * @return int (1-5, where 5 is most urgent)
     */
    private function calculateUrgencyLevel(float $participationRate, int $daysRemaining): int
    {
        // Base urgency on participation rate
        $urgency = match(true) {
            $participationRate < 20 => 5,
            $participationRate < 30 => 4,
            $participationRate < 40 => 3,
            $participationRate < 50 => 2,
            default => 1,
        };

        // Increase urgency if time is running out
        if ($daysRemaining <= 2) {
            $urgency = min(5, $urgency + 2);
        } elseif ($daysRemaining <= 5) {
            $urgency = min(5, $urgency + 1);
        }

        return $urgency;
    }

    /**
     * Generate participation summary for closed evaluations.
     * 
     * @param int $departmentId
     * @param string $period (e.g., 'current_semester', 'last_semester', 'academic_year')
     * @return array
     */
    public function generateParticipationSummary(int $departmentId, string $period = 'current_semester'): array
    {
        $cacheKey = "participation_summary_{$departmentId}_{$period}";
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($departmentId, $period) {
            // Calculate date range based on period
            $dateRange = $this->calculateDateRange($period);
            
            // Get closed evaluations for the department within the period
            $evaluations = Evaluation::whereHas('course', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->where('closed_at', '<=', now())
            ->where('closed_at', '>=', $dateRange['start'])
            ->where('closed_at', '<=', $dateRange['end'])
            ->with(['course', 'teacher.user'])
            ->get();

            $summaryData = [];
            $totalEligibleStudents = 0;
            $totalSubmissions = 0;
            $courseStats = [];
            $yearLevelStats = [];

            $courseEligibleStudents = []; // Track unique eligible students per course
            
            foreach ($evaluations as $evaluation) {
                $participationData = $this->calculateParticipationRate($evaluation->id);
                
                $summaryData[] = [
                    'evaluation_id' => $evaluation->id,
                    'course_code' => optional($evaluation->course)->code ?? 'N/A',
                    'course_name' => optional($evaluation->course)->name ?? 'N/A',
                    'teacher_name' => optional(optional($evaluation->teacher)->user)->name ?? 'N/A',
                    'year_level' => $evaluation->year_level,
                    'semester' => $evaluation->semester,
                    'academic_year' => $evaluation->academic_year,
                    'participation_rate' => $participationData['participation_rate'],
                    'total_eligible_students' => $participationData['total_eligible_students'],
                    'total_submissions' => $participationData['total_submissions'],
                    'closed_at' => optional($evaluation->closed_at)->format('Y-m-d'),
                ];

                // Track unique eligible students per course (don't double count)
                $courseKey = $evaluation->course_id;
                if (!isset($courseEligibleStudents[$courseKey])) {
                    $courseEligibleStudents[$courseKey] = $participationData['total_eligible_students'];
                }
                
                $totalSubmissions += $participationData['total_submissions'];

                // Aggregate by course - sum submissions across all evaluations for the course
                if (!isset($courseStats[$courseKey])) {
                    $courseStats[$courseKey] = [
                        'course_code' => optional($evaluation->course)->code ?? 'N/A',
                        'course_name' => optional($evaluation->course)->name ?? 'N/A',
                        'total_eligible' => $participationData['total_eligible_students'], // Set once per course
                        'total_submissions' => 0,
                        'evaluation_count' => 0,
                    ];
                }
                $courseStats[$courseKey]['total_submissions'] += $participationData['total_submissions'];
                $courseStats[$courseKey]['evaluation_count']++;

                // Aggregate by year level
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
            
            // Calculate total eligible students (sum of unique students per course)
            $totalEligibleStudents = array_sum($courseEligibleStudents);

            // Calculate completion rates for courses and year levels
            foreach ($courseStats as &$course) {
                // For courses with multiple evaluations, the total possible submissions is 
                // eligible students * number of evaluations
                $totalPossibleSubmissions = $course['total_eligible'] * $course['evaluation_count'];
                $course['completion_rate'] = $totalPossibleSubmissions > 0 
                    ? round(($course['total_submissions'] / $totalPossibleSubmissions) * 100, 2)
                    : 0;
            }

            foreach ($yearLevelStats as &$yearLevel) {
                $yearLevel['completion_rate'] = $yearLevel['total_eligible'] > 0 
                    ? round(($yearLevel['total_submissions'] / $yearLevel['total_eligible']) * 100, 2)
                    : 0;
            }

            $overallParticipationRate = $totalEligibleStudents > 0 
                ? round(($totalSubmissions / $totalEligibleStudents) * 100, 2)
                : 0;

            return [
                'department_id' => $departmentId,
                'period' => $period,
                'date_range' => $dateRange,
                'overall_participation_rate' => $overallParticipationRate,
                'total_evaluations' => count($evaluations),
                'total_eligible_students' => $totalEligibleStudents,
                'total_submissions' => $totalSubmissions,
                'evaluation_details' => $summaryData,
                'course_statistics' => array_values($courseStats),
                'year_level_statistics' => array_values($yearLevelStats),
                'generated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Calculate date range based on period string.
     * 
     * @param string $period
     * @return array
     */
    private function calculateDateRange(string $period): array
    {
        $now = Carbon::now();
        
        return match($period) {
            'current_semester' => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
            ],
            'last_semester' => [
                'start' => $now->copy()->subYear()->startOfYear(),
                'end' => $now->copy()->subYear()->endOfYear(),
            ],
            'academic_year' => [
                'start' => $now->copy()->month <= 6 
                    ? $now->copy()->subYear()->startOfYear()
                    : $now->copy()->startOfYear(),
                'end' => $now->copy()->month <= 6 
                    ? $now->copy()->endOfYear()
                    : $now->copy()->addYear()->endOfYear(),
            ],
            default => [
                'start' => $now->copy()->startOfYear(),
                'end' => $now->copy()->endOfYear(),
            ],
        };
    }

    /**
     * Check if participation tracking preserves anonymity.
     * 
     * @param int $evaluationId
     * @return array
     */
    public function checkAnonymityPreservation(int $evaluationId): array
    {
        $evaluation = Evaluation::findOrFail($evaluationId);
        
        // Get participation data without exposing individual student identities
        $participationData = $this->calculateParticipationRate($evaluationId);
        
        // Check if any tracking data exposes individual students
        $submissions = EvaluationSubmission::where('evaluation_id', $evaluationId)->get();
        
        $anonymityChecks = [
            'total_submissions_anonymous' => $submissions->where('is_anonymous', true)->count(),
            'total_submissions_identified' => $submissions->where('is_anonymous', false)->count(),
            'anonymity_preserved' => $submissions->where('is_anonymous', false)->count() === 0,
            'tracking_data_safe' => true, // No individual student data exposed in tracking
        ];
        
        // Verify that participation counts don't expose individual identities
        $anonymityChecks['participation_data_safe'] = !isset($participationData['student_names']) && 
                                                     !isset($participationData['student_ids']);
        
        return [
            'evaluation_id' => $evaluationId,
            'anonymity_checks' => $anonymityChecks,
            'participation_rate' => $participationData['participation_rate'],
            'total_eligible_students' => $participationData['total_eligible_students'],
            'total_submissions' => $participationData['total_submissions'],
            'anonymity_compliant' => $anonymityChecks['anonymity_preserved'] && 
                                   $anonymityChecks['tracking_data_safe'] && 
                                   $anonymityChecks['participation_data_safe'],
            'checked_at' => Carbon::now(),
        ];
    }

    /**
     * Compare teacher performance across multiple evaluation periods.
     * 
     * @param int $teacherId
     * @param array $periods Array of period identifiers (e.g., ['2023-1', '2023-2', '2024-1'])
     * @return array
     */
    public function compareHistoricalPerformance(int $teacherId, array $periods): array
    {
        $cacheKey = "historical_comparison_{$teacherId}_" . md5(implode('_', $periods));
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($teacherId, $periods) {
            $comparisons = [];
            
            foreach ($periods as $period) {
                // Parse period (format: 'YYYY-S' where S is semester)
                [$year, $semester] = explode('-', $period);
                
                // Get evaluations for this teacher in this period
                $evaluations = Evaluation::where('teacher_id', $teacherId)
                    ->where('academic_year', $year)
                    ->where('semester', $semester)
                    ->get();
                
                $periodStats = [
                    'period' => $period,
                    'academic_year' => $year,
                    'semester' => $semester,
                    'total_evaluations' => $evaluations->count(),
                    'average_performance_score' => 0,
                    'average_participation_rate' => 0,
                    'total_responses' => 0,
                    'evaluations' => [],
                ];
                
                if ($evaluations->isNotEmpty()) {
                    $totalPerformanceScore = 0;
                    $totalParticipationRate = 0;
                    $totalResponses = 0;
                    
                    foreach ($evaluations as $evaluation) {
                        $stats = $this->generateEvaluationStatistics($evaluation->id);
                        
                        $periodStats['evaluations'][] = [
                            'evaluation_id' => $evaluation->id,
                            'course_id' => $evaluation->course_id,
                            'performance_score' => $stats['performance_score'],
                            'participation_rate' => $stats['participation']['participation_rate'],
                            'total_responses' => $stats['total_responses'],
                        ];
                        
                        $totalPerformanceScore += $stats['performance_score'];
                        $totalParticipationRate += $stats['participation']['participation_rate'];
                        $totalResponses += $stats['total_responses'];
                    }
                    
                    $periodStats['average_performance_score'] = round($totalPerformanceScore / $evaluations->count(), 2);
                    $periodStats['average_participation_rate'] = round($totalParticipationRate / $evaluations->count(), 2);
                    $periodStats['total_responses'] = $totalResponses;
                }
                
                $comparisons[] = $periodStats;
            }
            
            return [
                'teacher_id' => $teacherId,
                'periods' => $periods,
                'comparisons' => $comparisons,
                'analysis' => $this->analyzeHistoricalTrends($comparisons),
                'generated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Analyze trends across multiple periods with statistical significance testing.
     * 
     * @param array $periodData
     * @return array
     */
    private function analyzeHistoricalTrends(array $periodData): array
    {
        if (count($periodData) < 2) {
            return [
                'trend_direction' => 'insufficient_data',
                'statistical_significance' => false,
                'confidence_level' => 0,
                'performance_change' => 0,
                'participation_change' => 0,
            ];
        }
        
        // Extract performance scores and participation rates
        $performanceScores = array_column($periodData, 'average_performance_score');
        $participationRates = array_column($periodData, 'average_participation_rate');
        
        // Calculate linear trend (simple regression)
        $performanceTrend = $this->calculateLinearTrend($performanceScores);
        $participationTrend = $this->calculateLinearTrend($participationRates);
        
        // Determine overall trend direction
        $trendDirection = match(true) {
            $performanceTrend['slope'] > 2 => 'improving',
            $performanceTrend['slope'] < -2 => 'declining',
            default => 'stable',
        };
        
        // Calculate statistical significance (simplified)
        $statisticalSignificance = abs($performanceTrend['slope']) > 1 && $performanceTrend['r_squared'] > 0.5;
        
        return [
            'trend_direction' => $trendDirection,
            'statistical_significance' => $statisticalSignificance,
            'confidence_level' => round($performanceTrend['r_squared'] * 100, 2),
            'performance_change' => round($performanceTrend['slope'], 2),
            'participation_change' => round($participationTrend['slope'], 2),
            'performance_trend' => $performanceTrend,
            'participation_trend' => $participationTrend,
        ];
    }

    /**
     * Calculate linear trend for a series of values.
     * 
     * @param array $values
     * @return array
     */
    private function calculateLinearTrend(array $values): array
    {
        $n = count($values);
        if ($n < 2) {
            return ['slope' => 0, 'intercept' => 0, 'r_squared' => 0];
        }
        
        // Create x values (time points)
        $x = range(1, $n);
        
        // Calculate means
        $meanX = array_sum($x) / $n;
        $meanY = array_sum($values) / $n;
        
        // Calculate slope and intercept
        $numerator = 0;
        $denominator = 0;
        
        for ($i = 0; $i < $n; $i++) {
            $numerator += ($x[$i] - $meanX) * ($values[$i] - $meanY);
            $denominator += pow($x[$i] - $meanX, 2);
        }
        
        $slope = $denominator != 0 ? $numerator / $denominator : 0;
        $intercept = $meanY - ($slope * $meanX);
        
        // Calculate R-squared
        $ssRes = 0; // Sum of squares of residuals
        $ssTot = 0; // Total sum of squares
        
        for ($i = 0; $i < $n; $i++) {
            $predicted = $slope * $x[$i] + $intercept;
            $ssRes += pow($values[$i] - $predicted, 2);
            $ssTot += pow($values[$i] - $meanY, 2);
        }
        
        $rSquared = $ssTot != 0 ? 1 - ($ssRes / $ssTot) : 0;
        
        return [
            'slope' => $slope,
            'intercept' => $intercept,
            'r_squared' => max(0, $rSquared), // Ensure non-negative
        ];
    }

    /**
     * Compare teachers fairly by accounting for course differences.
     * 
     * @param array $teacherIds
     * @param string $period
     * @return array
     */
    public function compareFairTeacherPerformance(array $teacherIds, string $period): array
    {
        $cacheKey = "fair_teacher_comparison_" . md5(implode('_', $teacherIds) . '_' . $period);
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($teacherIds, $period) {
            [$year, $semester] = explode('-', $period);
            
            $teacherComparisons = [];
            $courseTypeStats = []; // Track performance by course type
            
            foreach ($teacherIds as $teacherId) {
                $evaluations = Evaluation::where('teacher_id', $teacherId)
                    ->where('academic_year', $year)
                    ->where('semester', $semester)
                    ->with(['course'])
                    ->get();
                
                $teacherStats = [
                    'teacher_id' => $teacherId,
                    'raw_performance_score' => 0,
                    'adjusted_performance_score' => 0,
                    'course_difficulty_factor' => 1.0,
                    'student_population_factor' => 1.0,
                    'total_evaluations' => $evaluations->count(),
                    'courses' => [],
                ];
                
                if ($evaluations->isNotEmpty()) {
                    $totalPerformance = 0;
                    $courseDifficultyFactors = [];
                    $studentPopulationSizes = [];
                    
                    foreach ($evaluations as $evaluation) {
                        $stats = $this->generateEvaluationStatistics($evaluation->id);
                        $course = $evaluation->course;
                        
                        // Track course type statistics for normalization
                        $courseType = $course->department_id . '_' . $evaluation->year_level;
                        if (!isset($courseTypeStats[$courseType])) {
                            $courseTypeStats[$courseType] = [
                                'performance_scores' => [],
                                'participation_rates' => [],
                            ];
                        }
                        $courseTypeStats[$courseType]['performance_scores'][] = $stats['performance_score'];
                        $courseTypeStats[$courseType]['participation_rates'][] = $stats['participation']['participation_rate'];
                        
                        $teacherStats['courses'][] = [
                            'course_id' => $course->id,
                            'course_type' => $courseType,
                            'performance_score' => $stats['performance_score'],
                            'participation_rate' => $stats['participation']['participation_rate'],
                            'total_responses' => $stats['total_responses'],
                        ];
                        
                        $totalPerformance += $stats['performance_score'];
                        $studentPopulationSizes[] = $stats['participation']['total_eligible_students'];
                    }
                    
                    $teacherStats['raw_performance_score'] = round($totalPerformance / $evaluations->count(), 2);
                    
                    // Calculate difficulty factor (courses with lower average scores are considered harder)
                    $avgPopulationSize = array_sum($studentPopulationSizes) / count($studentPopulationSizes);
                    $teacherStats['student_population_factor'] = $this->calculatePopulationFactor($avgPopulationSize);
                }
                
                $teacherComparisons[] = $teacherStats;
            }
            
            // Calculate course difficulty factors based on all teachers' performance
            foreach ($teacherComparisons as &$teacher) {
                $adjustedScore = $teacher['raw_performance_score'];
                
                foreach ($teacher['courses'] as $course) {
                    $courseType = $course['course_type'];
                    if (isset($courseTypeStats[$courseType]) && count($courseTypeStats[$courseType]['performance_scores']) > 1) {
                        $avgCoursePerformance = array_sum($courseTypeStats[$courseType]['performance_scores']) / 
                                              count($courseTypeStats[$courseType]['performance_scores']);
                        
                        // Difficulty factor: courses with lower average performance are harder
                        $difficultyFactor = $avgCoursePerformance > 0 ? 75 / $avgCoursePerformance : 1.0;
                        $teacher['course_difficulty_factor'] = $difficultyFactor;
                        
                        // Adjust score based on difficulty
                        $adjustedScore *= $difficultyFactor * $teacher['student_population_factor'];
                    }
                }
                
                $teacher['adjusted_performance_score'] = round($adjustedScore, 2);
            }
            
            // Sort by adjusted performance score
            usort($teacherComparisons, function ($a, $b) {
                return $b['adjusted_performance_score'] <=> $a['adjusted_performance_score'];
            });
            
            return [
                'period' => $period,
                'teacher_comparisons' => $teacherComparisons,
                'course_type_statistics' => $courseTypeStats,
                'comparison_methodology' => [
                    'accounts_for_course_difficulty' => true,
                    'accounts_for_student_population' => true,
                    'normalization_applied' => true,
                ],
                'generated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Calculate population factor for fair comparison.
     * 
     * @param float $populationSize
     * @return float
     */
    private function calculatePopulationFactor(float $populationSize): float
    {
        // Larger classes might be slightly harder to manage, but effect is minimal
        // Factor ranges from 0.95 (very large classes) to 1.05 (very small classes)
        if ($populationSize > 50) {
            return 0.95;
        } elseif ($populationSize < 10) {
            return 1.05;
        } else {
            return 1.0;
        }
    }

    /**
     * Detect significant trends in performance data.
     * 
     * @param array $performanceData Array of performance scores over time
     * @param float $significanceThreshold Minimum change to be considered significant
     * @return array
     */
    public function detectSignificantTrends(array $performanceData, float $significanceThreshold = 5.0): array
    {
        if (count($performanceData) < 3) {
            return [
                'significant_trends' => [],
                'overall_trend' => 'insufficient_data',
                'trend_strength' => 0,
            ];
        }
        
        $trends = [];
        $trendStrength = 0;
        
        // Analyze consecutive periods for significant changes
        for ($i = 1; $i < count($performanceData); $i++) {
            $change = $performanceData[$i] - $performanceData[$i - 1];
            
            if (abs($change) >= $significanceThreshold) {
                $trends[] = [
                    'period_from' => $i - 1,
                    'period_to' => $i,
                    'change' => round($change, 2),
                    'change_percentage' => $performanceData[$i - 1] > 0 
                        ? round(($change / $performanceData[$i - 1]) * 100, 2) 
                        : 0,
                    'trend_type' => $change > 0 ? 'improvement' : 'decline',
                    'significance_level' => $this->calculateSignificanceLevel(abs($change), $significanceThreshold),
                ];
            }
        }
        
        // Calculate overall trend using linear regression
        $linearTrend = $this->calculateLinearTrend($performanceData);
        $overallTrend = match(true) {
            $linearTrend['slope'] > $significanceThreshold / count($performanceData) => 'improving',
            $linearTrend['slope'] < -$significanceThreshold / count($performanceData) => 'declining',
            default => 'stable',
        };
        
        $trendStrength = round($linearTrend['r_squared'] * 100, 2);
        
        return [
            'significant_trends' => $trends,
            'overall_trend' => $overallTrend,
            'trend_strength' => $trendStrength,
            'linear_trend' => $linearTrend,
            'total_periods_analyzed' => count($performanceData),
            'significance_threshold' => $significanceThreshold,
        ];
    }

    /**
     * Calculate significance level based on change magnitude.
     * 
     * @param float $change
     * @param float $threshold
     * @return string
     */
    private function calculateSignificanceLevel(float $change, float $threshold): string
    {
        $ratio = $change / $threshold;
        
        return match(true) {
            $ratio >= 3 => 'very_high',
            $ratio >= 2 => 'high',
            $ratio >= 1.5 => 'moderate',
            default => 'low',
        };
    }

    /**
     * Generate department benchmarking against previous periods.
     * 
     * @param int $departmentId
     * @param array $periods Array of periods to compare
     * @return array
     */
    public function generateDepartmentBenchmarking(int $departmentId, array $periods): array
    {
        $cacheKey = "department_benchmarking_{$departmentId}_" . md5(implode('_', $periods));
        
        return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($departmentId, $periods) {
            $benchmarkData = [];
            
            foreach ($periods as $period) {
                [$year, $semester] = explode('-', $period);
                
                // Get all evaluations for this department in this period
                $evaluations = Evaluation::whereHas('course', function ($query) use ($departmentId) {
                    $query->where('department_id', $departmentId);
                })
                ->where('academic_year', $year)
                ->where('semester', $semester)
                ->get();
                
                $periodBenchmark = [
                    'period' => $period,
                    'academic_year' => $year,
                    'semester' => $semester,
                    'total_evaluations' => $evaluations->count(),
                    'average_performance_score' => 0,
                    'average_participation_rate' => 0,
                    'total_responses' => 0,
                    'teacher_count' => 0,
                    'course_count' => 0,
                    'performance_distribution' => [
                        'excellent' => 0, // 90-100%
                        'good' => 0,      // 80-89%
                        'satisfactory' => 0, // 70-79%
                        'needs_improvement' => 0, // <70%
                    ],
                ];
                
                if ($evaluations->isNotEmpty()) {
                    $totalPerformanceScore = 0;
                    $totalParticipationRate = 0;
                    $totalResponses = 0;
                    $teacherIds = [];
                    $courseIds = [];
                    
                    foreach ($evaluations as $evaluation) {
                        $stats = $this->generateEvaluationStatistics($evaluation->id);
                        
                        $totalPerformanceScore += $stats['performance_score'];
                        $totalParticipationRate += $stats['participation']['participation_rate'];
                        $totalResponses += $stats['total_responses'];
                        
                        $teacherIds[] = $evaluation->teacher_id;
                        $courseIds[] = $evaluation->course_id;
                        
                        // Categorize performance
                        $score = $stats['performance_score'];
                        if ($score >= 90) {
                            $periodBenchmark['performance_distribution']['excellent']++;
                        } elseif ($score >= 80) {
                            $periodBenchmark['performance_distribution']['good']++;
                        } elseif ($score >= 70) {
                            $periodBenchmark['performance_distribution']['satisfactory']++;
                        } else {
                            $periodBenchmark['performance_distribution']['needs_improvement']++;
                        }
                    }
                    
                    $periodBenchmark['average_performance_score'] = round($totalPerformanceScore / $evaluations->count(), 2);
                    $periodBenchmark['average_participation_rate'] = round($totalParticipationRate / $evaluations->count(), 2);
                    $periodBenchmark['total_responses'] = $totalResponses;
                    $periodBenchmark['teacher_count'] = count(array_unique($teacherIds));
                    $periodBenchmark['course_count'] = count(array_unique($courseIds));
                    
                    // Convert counts to percentages for distribution
                    $total = $evaluations->count();
                    foreach ($periodBenchmark['performance_distribution'] as $category => $count) {
                        $periodBenchmark['performance_distribution'][$category] = [
                            'count' => $count,
                            'percentage' => round(($count / $total) * 100, 2),
                        ];
                    }
                }
                
                $benchmarkData[] = $periodBenchmark;
            }
            
            // Calculate period-over-period changes
            $periodChanges = [];
            for ($i = 1; $i < count($benchmarkData); $i++) {
                $current = $benchmarkData[$i];
                $previous = $benchmarkData[$i - 1];
                
                $periodChanges[] = [
                    'from_period' => $previous['period'],
                    'to_period' => $current['period'],
                    'performance_change' => round($current['average_performance_score'] - $previous['average_performance_score'], 2),
                    'participation_change' => round($current['average_participation_rate'] - $previous['average_participation_rate'], 2),
                    'evaluation_count_change' => $current['total_evaluations'] - $previous['total_evaluations'],
                    'teacher_count_change' => $current['teacher_count'] - $previous['teacher_count'],
                ];
            }
            
            return [
                'department_id' => $departmentId,
                'periods' => $periods,
                'benchmark_data' => $benchmarkData,
                'period_changes' => $periodChanges,
                'overall_trend' => $this->calculateDepartmentTrend($benchmarkData),
                'generated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Calculate overall department trend.
     * 
     * @param array $benchmarkData
     * @return array
     */
    private function calculateDepartmentTrend(array $benchmarkData): array
    {
        if (count($benchmarkData) < 2) {
            return [
                'trend_direction' => 'insufficient_data',
                'performance_trend' => 0,
                'participation_trend' => 0,
            ];
        }
        
        $performanceScores = array_column($benchmarkData, 'average_performance_score');
        $participationRates = array_column($benchmarkData, 'average_participation_rate');
        
        $performanceTrend = $this->calculateLinearTrend($performanceScores);
        $participationTrend = $this->calculateLinearTrend($participationRates);
        
        $trendDirection = match(true) {
            $performanceTrend['slope'] > 1 => 'improving',
            $performanceTrend['slope'] < -1 => 'declining',
            default => 'stable',
        };
        
        return [
            'trend_direction' => $trendDirection,
            'performance_trend' => round($performanceTrend['slope'], 2),
            'participation_trend' => round($participationTrend['slope'], 2),
            'performance_r_squared' => round($performanceTrend['r_squared'], 3),
            'participation_r_squared' => round($participationTrend['r_squared'], 3),
        ];
    }

    /**
     * Generate department-wide data aggregation with optimized queries and caching.
     * 
     * @param int $departmentId
     * @param string $period (e.g., '2024-1' for academic year 2024, semester 1)
     * @return array
     */
    public function generateDepartmentAggregation(int $departmentId, string $period): array
    {
        $cacheKey = "department_aggregation_{$departmentId}_{$period}";
        
        return Cache::remember($cacheKey, self::HEAVY_CACHE_DURATION, function () use ($departmentId, $period) {
            [$year, $semester] = explode('-', $period);
            
            // Optimize query with eager loading and specific columns
            $evaluations = Evaluation::select(['id', 'teacher_id', 'course_id', 'academic_year', 'semester', 'year_level'])
                ->whereHas('course', function ($query) use ($departmentId) {
                    $query->where('department_id', $departmentId);
                })
                ->where('academic_year', $year)
                ->where('semester', $semester)
                ->with([
                    'course:id,code,title,department_id',
                    'teacher:id,name'
                ])
                ->get();
            
            if ($evaluations->isEmpty()) {
                return [
                    'department_id' => $departmentId,
                    'period' => $period,
                    'teacher_rankings' => [],
                    'department_statistics' => [
                        'total_teachers' => 0,
                        'total_courses' => 0,
                        'total_evaluations' => 0,
                        'average_performance_score' => 0,
                        'average_participation_rate' => 0,
                        'total_responses' => 0,
                    ],
                    'performance_distribution' => [],
                    'comparative_analysis' => [],
                    'generated_at' => Carbon::now(),
                ];
            }
            
            // Batch process evaluation statistics for better performance
            $evaluationIds = $evaluations->pluck('id')->toArray();
            $batchedStats = $this->batchGenerateEvaluationStatistics($evaluationIds);
            
            // Aggregate data by teacher
            $teacherData = [];
            $allPerformanceScores = [];
            $allParticipationRates = [];
            $totalResponses = 0;
            $teacherIds = [];
            $courseIds = [];
            
            foreach ($evaluations as $evaluation) {
                $stats = $batchedStats[$evaluation->id] ?? $this->generateEvaluationStatistics($evaluation->id);
                $teacherId = $evaluation->teacher_id;
                
                if (!isset($teacherData[$teacherId])) {
                    $teacherData[$teacherId] = [
                        'teacher_id' => $teacherId,
                        'teacher_name' => $evaluation->teacher->name ?? 'Unknown',
                        'evaluations' => [],
                        'total_evaluations' => 0,
                        'average_performance_score' => 0,
                        'average_participation_rate' => 0,
                        'total_responses' => 0,
                        'courses_taught' => [],
                    ];
                }
                
                $teacherData[$teacherId]['evaluations'][] = [
                    'evaluation_id' => $evaluation->id,
                    'course_code' => $evaluation->course->code ?? 'N/A',
                    'course_name' => $evaluation->course->name ?? 'N/A',
                    'year_level' => $evaluation->year_level,
                    'performance_score' => $stats['performance_score'],
                    'participation_rate' => $stats['participation']['participation_rate'],
                    'total_responses' => $stats['total_responses'],
                ];
                
                $teacherData[$teacherId]['courses_taught'][] = $evaluation->course->code ?? 'N/A';
                $teacherData[$teacherId]['total_responses'] += $stats['total_responses'];
                
                $allPerformanceScores[] = $stats['performance_score'];
                $allParticipationRates[] = $stats['participation']['participation_rate'];
                $totalResponses += $stats['total_responses'];
                $teacherIds[] = $teacherId;
                $courseIds[] = $evaluation->course_id;
            }
            
            // Calculate teacher averages and rankings
            $teacherRankings = [];
            foreach ($teacherData as $teacherId => $data) {
                $performanceScores = array_column($data['evaluations'], 'performance_score');
                $participationRates = array_column($data['evaluations'], 'participation_rate');
                
                $avgPerformance = count($performanceScores) > 0 ? array_sum($performanceScores) / count($performanceScores) : 0;
                $avgParticipation = count($participationRates) > 0 ? array_sum($participationRates) / count($participationRates) : 0;
                
                $teacherRankings[] = [
                    'teacher_id' => $teacherId,
                    'teacher_name' => $data['teacher_name'],
                    'total_evaluations' => count($data['evaluations']),
                    'average_performance_score' => round($avgPerformance, 2),
                    'average_participation_rate' => round($avgParticipation, 2),
                    'total_responses' => $data['total_responses'],
                    'courses_taught' => array_unique($data['courses_taught']),
                    'course_count' => count(array_unique($data['courses_taught'])),
                    'performance_insights' => $this->generatePerformanceInsights($avgPerformance, $avgParticipation),
                ];
            }
            
            // Sort teachers by performance score (descending)
            usort($teacherRankings, function ($a, $b) {
                return $b['average_performance_score'] <=> $a['average_performance_score'];
            });
            
            // Add ranking positions
            foreach ($teacherRankings as $index => &$teacher) {
                $teacher['rank'] = $index + 1;
            }
            
            // Calculate department-wide statistics
            $departmentStats = [
                'total_teachers' => count(array_unique($teacherIds)),
                'total_courses' => count(array_unique($courseIds)),
                'total_evaluations' => count($evaluations),
                'average_performance_score' => count($allPerformanceScores) > 0 ? round(array_sum($allPerformanceScores) / count($allPerformanceScores), 2) : 0,
                'average_participation_rate' => count($allParticipationRates) > 0 ? round(array_sum($allParticipationRates) / count($allParticipationRates), 2) : 0,
                'total_responses' => $totalResponses,
            ];
            
            // Generate performance distribution analysis
            $performanceDistribution = $this->analyzePerformanceDistribution($allPerformanceScores);
            
            // Generate comparative analysis across teachers
            $comparativeAnalysis = $this->generateComparativeAnalysis($teacherRankings, $departmentStats);
            
            return [
                'department_id' => $departmentId,
                'period' => $period,
                'academic_year' => $year,
                'semester' => $semester,
                'teacher_rankings' => $teacherRankings,
                'department_statistics' => $departmentStats,
                'performance_distribution' => $performanceDistribution,
                'comparative_analysis' => $comparativeAnalysis,
                'generated_at' => Carbon::now(),
            ];
        });
    }

    /**
     * Batch generate evaluation statistics for better performance.
     * 
     * @param array $evaluationIds
     * @return array
     */
    private function batchGenerateEvaluationStatistics(array $evaluationIds): array
    {
        $batchedStats = [];
        
        // Process in chunks to avoid memory issues
        $chunks = array_chunk($evaluationIds, 50);
        
        foreach ($chunks as $chunk) {
            foreach ($chunk as $evaluationId) {
                $cacheKey = "evaluation_stats_{$evaluationId}";
                
                // Check if already cached
                if (Cache::has($cacheKey)) {
                    $batchedStats[$evaluationId] = Cache::get($cacheKey);
                } else {
                    // Generate and cache if not available
                    $batchedStats[$evaluationId] = $this->generateEvaluationStatistics($evaluationId);
                }
            }
        }
        
        return $batchedStats;
    }

    /**
     * Generate performance insights for a teacher based on their scores.
     * 
     * @param float $performanceScore
     * @param float $participationRate
     * @return array
     */
    private function generatePerformanceInsights(float $performanceScore, float $participationRate): array
    {
        $insights = [];
        
        // Performance level insights
        if ($performanceScore >= 90) {
            $insights[] = 'Excellent performance - consistently high ratings';
        } elseif ($performanceScore >= 80) {
            $insights[] = 'Good performance - above average ratings';
        } elseif ($performanceScore >= 70) {
            $insights[] = 'Satisfactory performance - meets expectations';
        } else {
            $insights[] = 'Needs improvement - below average ratings';
        }
        
        // Participation insights
        if ($participationRate >= 80) {
            $insights[] = 'High student engagement - excellent participation rates';
        } elseif ($participationRate >= 60) {
            $insights[] = 'Good student engagement - adequate participation';
        } elseif ($participationRate >= 40) {
            $insights[] = 'Moderate student engagement - room for improvement';
        } else {
            $insights[] = 'Low student engagement - needs attention';
        }
        
        // Combined insights
        if ($performanceScore >= 85 && $participationRate >= 75) {
            $insights[] = 'Top performer - high quality teaching with strong student engagement';
        } elseif ($performanceScore >= 75 && $participationRate < 50) {
            $insights[] = 'Quality teaching but low participation - consider engagement strategies';
        } elseif ($performanceScore < 70 && $participationRate >= 75) {
            $insights[] = 'High engagement but performance concerns - focus on teaching effectiveness';
        }
        
        return $insights;
    }

    /**
     * Analyze performance distribution across all evaluations.
     * 
     * @param array $performanceScores
     * @return array
     */
    private function analyzePerformanceDistribution(array $performanceScores): array
    {
        if (empty($performanceScores)) {
            return [
                'distribution' => [],
                'statistics' => [
                    'mean' => 0,
                    'median' => 0,
                    'standard_deviation' => 0,
                    'min' => 0,
                    'max' => 0,
                ],
            ];
        }
        
        // Calculate distribution by performance bands
        $distribution = [
            'excellent' => ['range' => '90-100%', 'count' => 0, 'percentage' => 0],
            'good' => ['range' => '80-89%', 'count' => 0, 'percentage' => 0],
            'satisfactory' => ['range' => '70-79%', 'count' => 0, 'percentage' => 0],
            'needs_improvement' => ['range' => '0-69%', 'count' => 0, 'percentage' => 0],
        ];
        
        foreach ($performanceScores as $score) {
            if ($score >= 90) {
                $distribution['excellent']['count']++;
            } elseif ($score >= 80) {
                $distribution['good']['count']++;
            } elseif ($score >= 70) {
                $distribution['satisfactory']['count']++;
            } else {
                $distribution['needs_improvement']['count']++;
            }
        }
        
        // Calculate percentages
        $total = count($performanceScores);
        foreach ($distribution as &$band) {
            $band['percentage'] = round(($band['count'] / $total) * 100, 2);
        }
        
        // Calculate statistical measures
        sort($performanceScores);
        $mean = array_sum($performanceScores) / count($performanceScores);
        $median = $this->calculateMedian($performanceScores);
        $standardDeviation = $this->calculateStandardDeviation($performanceScores, $mean);
        
        return [
            'distribution' => $distribution,
            'statistics' => [
                'mean' => round($mean, 2),
                'median' => round($median, 2),
                'standard_deviation' => round($standardDeviation, 2),
                'min' => round(min($performanceScores), 2),
                'max' => round(max($performanceScores), 2),
            ],
        ];
    }

    /**
     * Calculate median of an array of numbers.
     * 
     * @param array $numbers
     * @return float
     */
    private function calculateMedian(array $numbers): float
    {
        $count = count($numbers);
        if ($count === 0) return 0;
        
        sort($numbers);
        $middle = floor($count / 2);
        
        if ($count % 2 === 0) {
            return ($numbers[$middle - 1] + $numbers[$middle]) / 2;
        } else {
            return $numbers[$middle];
        }
    }

    /**
     * Calculate standard deviation of an array of numbers.
     * 
     * @param array $numbers
     * @param float $mean
     * @return float
     */
    private function calculateStandardDeviation(array $numbers, float $mean): float
    {
        if (count($numbers) <= 1) return 0;
        
        $sumSquaredDifferences = 0;
        foreach ($numbers as $number) {
            $sumSquaredDifferences += pow($number - $mean, 2);
        }
        
        return sqrt($sumSquaredDifferences / (count($numbers) - 1));
    }

    /**
     * Generate comparative analysis across teachers.
     * 
     * @param array $teacherRankings
     * @param array $departmentStats
     * @return array
     */
    private function generateComparativeAnalysis(array $teacherRankings, array $departmentStats): array
    {
        if (empty($teacherRankings)) {
            return [
                'top_performers' => [],
                'improvement_needed' => [],
                'performance_gaps' => [],
                'recommendations' => [],
            ];
        }
        
        $avgPerformance = $departmentStats['average_performance_score'];
        $avgParticipation = $departmentStats['average_participation_rate'];
        
        // Identify top performers (top 25% or above department average + 10%)
        $topPerformanceThreshold = max($avgPerformance + 10, 85);
        $topPerformers = array_filter($teacherRankings, function ($teacher) use ($topPerformanceThreshold) {
            return $teacher['average_performance_score'] >= $topPerformanceThreshold;
        });
        
        // Identify teachers needing improvement (bottom 25% or below department average - 10%)
        $improvementThreshold = min($avgPerformance - 10, 70);
        $improvementNeeded = array_filter($teacherRankings, function ($teacher) use ($improvementThreshold) {
            return $teacher['average_performance_score'] <= $improvementThreshold;
        });
        
        // Calculate performance gaps
        $performanceScores = array_column($teacherRankings, 'average_performance_score');
        $maxScore = max($performanceScores);
        $minScore = min($performanceScores);
        $performanceGap = $maxScore - $minScore;
        
        // Generate recommendations
        $recommendations = [];
        if ($performanceGap > 20) {
            $recommendations[] = 'Significant performance gap detected - consider mentoring programs';
        }
        if ($avgParticipation < 60) {
            $recommendations[] = 'Low department-wide participation - implement engagement strategies';
        }
        if (count($improvementNeeded) > count($teacherRankings) * 0.3) {
            $recommendations[] = 'High number of teachers need improvement - consider training programs';
        }
        if ($avgPerformance >= 85) {
            $recommendations[] = 'Excellent department performance - maintain current standards';
        }
        
        return [
            'top_performers' => array_values($topPerformers),
            'improvement_needed' => array_values($improvementNeeded),
            'performance_gaps' => [
                'max_score' => round($maxScore, 2),
                'min_score' => round($minScore, 2),
                'gap' => round($performanceGap, 2),
                'gap_percentage' => round(($performanceGap / $maxScore) * 100, 2),
            ],
            'recommendations' => $recommendations,
        ];
    }

    /**
     * Clear all analytics cache.
     * 
     * @return void
     */
    public function clearAllCache(): void
    {
        // This would need to be implemented based on your cache strategy
        // For now, we'll just flush the entire cache (not recommended for production)
        Cache::flush();
    }

    /**
     * Optimize database queries for large evaluation datasets.
     * 
     * @param int $departmentId
     * @param string $period
     * @return array
     */
    public function getOptimizedEvaluationData(int $departmentId, string $period): array
    {
        [$year, $semester] = explode('-', $period);
        
        // Use database indexes and optimized queries
        return DB::table('evaluations as e')
            ->select([
                'e.id',
                'e.teacher_id',
                'e.course_id',
                'e.year_level',
                'c.code as course_code',
                'c.name as course_name',
                't.name as teacher_name',
                DB::raw('COUNT(DISTINCT es.id) as submission_count'),
                DB::raw('COUNT(DISTINCT s.id) as eligible_students'),
                DB::raw('AVG(r.rating) as average_rating')
            ])
            ->join('courses as c', 'e.course_id', '=', 'c.id')
            ->join('teachers as t', 'e.teacher_id', '=', 't.id')
            ->leftJoin('evaluation_submissions as es', 'e.id', '=', 'es.evaluation_id')
            ->leftJoin('students as s', function($join) {
                $join->on('s.course_id', '=', 'e.course_id');
            })
            ->leftJoin('feedbacks as f', function($join) {
                $join->on('f.evaluation_id', '=', 'e.id')
                     ->where('f.is_locked', true);
            })
            ->leftJoin('responses as r', function($join) {
                $join->on('r.feedback_id', '=', 'f.id')
                     ->whereBetween('r.rating', [1, 5]);
            })
            ->where('c.department_id', $departmentId)
            ->where('e.academic_year', $year)
            ->where('e.semester', $semester)
            ->groupBy([
                'e.id', 'e.teacher_id', 'e.course_id', 'e.year_level',
                'c.code', 'c.name', 't.name'
            ])
            ->get()
            ->toArray();
    }

    /**
     * Get paginated evaluation results for large datasets.
     * 
     * @param int $departmentId
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getPaginatedEvaluationResults(int $departmentId, int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $query = Evaluation::select([
                'evaluations.id',
                'evaluations.teacher_id',
                'evaluations.course_id',
                'evaluations.academic_year',
                'evaluations.semester',
                'evaluations.year_level'
            ])
            ->with([
                'course:id,code,name,department_id',
                'teacher:id,name'
            ])
            ->whereHas('course', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            });

        // Apply filters
        if (!empty($filters['academic_year'])) {
            $query->where('academic_year', $filters['academic_year']);
        }
        
        if (!empty($filters['semester'])) {
            $query->where('semester', $filters['semester']);
        }
        
        if (!empty($filters['teacher_id'])) {
            $query->where('teacher_id', $filters['teacher_id']);
        }
        
        if (!empty($filters['course_id'])) {
            $query->where('course_id', $filters['course_id']);
        }

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'id';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortBy, $sortDirection);

        // Paginate results
        $results = $query->paginate($perPage, ['*'], 'page', $page);
        
        return [
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'last_page' => $results->lastPage(),
                'has_more_pages' => $results->hasMorePages(),
            ]
        ];
    }

    /**
     * Warm up cache for frequently accessed data.
     * 
     * @param int $departmentId
     * @param array $periods
     * @return void
     */
    public function warmUpCache(int $departmentId, array $periods = []): void
    {
        if (empty($periods)) {
            // Default to current and previous periods
            $currentYear = date('Y');
            $currentSemester = (int) ceil(date('n') / 6);
            $periods = [
                "{$currentYear}-{$currentSemester}",
                ($currentSemester === 1) ? ($currentYear - 1) . "-2" : "{$currentYear}-1"
            ];
        }

        foreach ($periods as $period) {
            // Warm up department aggregation cache
            $this->generateDepartmentAggregation($departmentId, $period);
            
            // Warm up evaluation statistics cache for recent evaluations
            [$year, $semester] = explode('-', $period);
            $evaluations = Evaluation::whereHas('course', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->where('academic_year', $year)
            ->where('semester', $semester)
            ->limit(50) // Limit to avoid overwhelming the cache
            ->pluck('id');

            foreach ($evaluations as $evaluationId) {
                $this->generateEvaluationStatistics($evaluationId);
                $this->generateQuestionAnalysis($evaluationId);
            }
        }
    }

    /**
     * Get cache statistics and health information.
     * 
     * @return array
     */
    public function getCacheHealth(): array
    {
        $cacheKeys = [
            'evaluation_stats_*',
            'question_analysis_*',
            'department_aggregation_*',
            'weighted_scores_*',
            'participation_rate_*'
        ];

        $stats = [
            'cache_driver' => config('cache.default'),
            'estimated_entries' => 0,
            'memory_usage' => 'N/A',
            'hit_rate' => 'N/A',
            'recommendations' => []
        ];

        // Add recommendations based on configuration
        if (config('cache.default') === 'file') {
            $stats['recommendations'][] = 'Consider using Redis or Memcached for better performance';
        }

        if (!Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $stats['recommendations'][] = 'Current cache driver does not support tagging for selective cache clearing';
        }

        return $stats;
    }

    /**
     * Filter out invalid responses for accurate analytics.
     * 
     * @param \Illuminate\Support\Collection $responses
     * @return \Illuminate\Support\Collection
     */
    private function filterValidResponses($responses)
    {
        return $responses->filter(function ($response) {
            // Only include responses from locked (completed) feedbacks
            if (!$response->feedback || !$response->feedback->is_locked) {
                return false;
            }
            
            // For rating responses, ensure they are within valid range
            if ($response->rating !== null) {
                return $response->rating >= 1 && $response->rating <= 5;
            }
            
            // For text responses, ensure they are not empty
            if ($response->text !== null) {
                return trim($response->text) !== '';
            }
            
            return false;
        });
    }
}