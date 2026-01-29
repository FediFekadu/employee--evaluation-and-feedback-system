<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Response;
use App\Models\Feedback;
use App\Models\EvaluationSubmission;
use App\Models\PeerEvaluation;
use App\Models\PeerEvaluationResponse;
use App\Models\HodEvaluation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * ScoringService - Weighted scoring calculation engine
 * 
 * Implements the weighted scoring algorithm as specified in requirements:
 * - Student Evaluation: 50% weight
 * - Peer Evaluation: 30% weight  
 * - Administrative Evaluation: 20% weight
 * 
 * Formula: Final Score = (Student × 0.5) + (Peer × 0.3) + (Admin × 0.2)
 */
class ScoringService
{
    /**
     * Weighted scoring percentages as defined in requirements 5.1-5.5
     */
    private const STUDENT_WEIGHT = 0.5;  // 50%
    private const PEER_WEIGHT = 0.3;     // 30%
    private const ADMIN_WEIGHT = 0.2;    // 20%

    /**
     * Valid rating range for evaluation responses
     */
    private const MIN_RATING = 1;
    private const MAX_RATING = 5;

    /**
     * Calculate weighted evaluation scores for a teacher
     * 
     * @param int $evaluationId
     * @return array
     * @throws InvalidArgumentException
     */
    public function calculateWeightedScores(int $evaluationId): array
    {
        $this->validateEvaluationId($evaluationId);

        $evaluation = Evaluation::with(['course', 'teacher'])->findOrFail($evaluationId);
        
        // Calculate each evaluation component
        $studentScore = $this->calculateStudentEvaluationScore($evaluationId);
        $peerScore = $this->calculatePeerEvaluationScore($evaluationId);
        $adminScore = $this->calculateAdminEvaluationScore($evaluationId);
        
        // Calculate final weighted score using the specified formula
        $weightedScore = ($studentScore * self::STUDENT_WEIGHT) + 
                        ($peerScore * self::PEER_WEIGHT) + 
                        ($adminScore * self::ADMIN_WEIGHT);

        // Validate the calculated score is within expected range
        $this->validateCalculatedScore($weightedScore);

        return [
            'evaluation_id' => $evaluationId,
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
            'calculated_at' => now()->toISOString()
        ];
    }

    /**
     * Calculate Student Evaluation Score (0-100%)
     * Requirements 5.1: Student evaluations averaged as percentages
     * 
     * @param int $evaluationId
     * @return float
     */
    public function calculateStudentEvaluationScore(int $evaluationId): float
    {
        // Get all student responses for this evaluation
        $responses = Response::whereHas('feedback', function ($query) use ($evaluationId) {
            $query->where('evaluation_id', $evaluationId)
                  ->whereNotNull('student_id'); // Only student responses
        })->whereNotNull('rating')
          ->whereBetween('rating', [self::MIN_RATING, self::MAX_RATING])
          ->get();

        if ($responses->isEmpty()) {
            Log::info("No student responses found for evaluation {$evaluationId}");
            return 0.0;
        }

        // Calculate average rating and convert to percentage
        $averageRating = $responses->avg('rating');
        $percentageScore = ($averageRating / self::MAX_RATING) * 100;

        $this->validateScoreRange($percentageScore, 'student');
        
        return $percentageScore;
    }

    /**
     * Calculate Peer Evaluation Score (0-100%)
     * Requirements 5.2: Peer evaluations averaged as percentages
     * 
     * @param int $evaluationId
     * @return float
     */
    public function calculatePeerEvaluationScore(int $evaluationId): float
    {
        $evaluation = Evaluation::findOrFail($evaluationId);

        // Locate peer evaluation for this teacher and semester
        $peerEval = PeerEvaluation::where('department_id', $evaluation->department_id ?? $evaluation->course?->department_id)
            ->where('teacher_id', $evaluation->teacher_id)
            ->where('academic_year', $evaluation->academic_year)
            ->where('semester', $evaluation->semester)
            ->first();

        if (!$peerEval) {
            Log::info("No peer evaluation initialized for evaluation {$evaluationId}");
            return 0.0;
        }

        // Aggregate peer responses scores for this peer evaluation
        $submittedResponses = PeerEvaluationResponse::where('peer_evaluation_id', $peerEval->id)
            ->whereNotNull('score')
            ->get(['score']);

        if ($submittedResponses->isEmpty()) {
            Log::info("No peer responses submitted for peer evaluation {$peerEval->id}");
            return 0.0;
        }

        // Average of percentage scores (0-100) recorded per peer evaluator
        $peerScore = (float) $submittedResponses->avg('score');
        $this->validateScoreRange($peerScore, 'peer');
        return $peerScore;
    }

    /**
     * Calculate Administrative Evaluation Score (0-100%)
     * Requirements 5.3: Administrative evaluations recorded as percentages
     * 
     * @param int $evaluationId
     * @return float
     */
    public function calculateAdminEvaluationScore(int $evaluationId): float
    {
        $evaluation = Evaluation::findOrFail($evaluationId);

        // Find HOD evaluation record for the teacher/semester
        $hodEval = HodEvaluation::where('department_id', $evaluation->department_id ?? $evaluation->course?->department_id)
            ->where('teacher_id', $evaluation->teacher_id)
            ->where('academic_year', $evaluation->academic_year)
            ->where('semester', $evaluation->semester)
            ->first();

        if (!$hodEval || $hodEval->score === null) {
            Log::info("No HOD score for evaluation {$evaluationId}");
            return 0.0;
        }

        $adminScore = max(0, min(100, (float) $hodEval->score));
        $this->validateScoreRange($adminScore, 'admin');
        return $adminScore;
    }

    /**
     * Calculate average score for a collection of responses
     * 
     * @param \Illuminate\Support\Collection $responses
     * @return float
     */
    public function calculateAverageScore($responses): float
    {
        if ($responses->isEmpty()) {
            return 0.0;
        }

        // Filter valid ratings
        $validResponses = $responses->filter(function ($response) {
            return $response->rating !== null && 
                   $response->rating >= self::MIN_RATING && 
                   $response->rating <= self::MAX_RATING;
        });

        if ($validResponses->isEmpty()) {
            return 0.0;
        }

        $average = $validResponses->avg('rating');
        return ($average / self::MAX_RATING) * 100;
    }

    /**
     * Validate evaluation ID exists
     * 
     * @param int $evaluationId
     * @throws InvalidArgumentException
     */
    private function validateEvaluationId(int $evaluationId): void
    {
        if ($evaluationId <= 0) {
            throw new InvalidArgumentException("Invalid evaluation ID: {$evaluationId}");
        }

        if (!Evaluation::where('id', $evaluationId)->exists()) {
            throw new InvalidArgumentException("Evaluation not found: {$evaluationId}");
        }
    }

    /**
     * Validate score is within expected range (0-100)
     * 
     * @param float $score
     * @param string $type
     * @throws InvalidArgumentException
     */
    private function validateScoreRange(float $score, string $type): void
    {
        if ($score < 0 || $score > 100) {
            throw new InvalidArgumentException("Invalid {$type} score: {$score}. Must be between 0 and 100.");
        }
    }

    /**
     * Validate the final calculated weighted score
     * 
     * @param float $score
     * @throws InvalidArgumentException
     */
    private function validateCalculatedScore(float $score): void
    {
        if ($score < 0 || $score > 100) {
            throw new InvalidArgumentException("Invalid weighted score: {$score}. Must be between 0 and 100.");
        }

        // Additional validation: ensure weights sum to 1.0
        $totalWeight = self::STUDENT_WEIGHT + self::PEER_WEIGHT + self::ADMIN_WEIGHT;
        if (abs($totalWeight - 1.0) > 0.001) {
            throw new InvalidArgumentException("Invalid weight configuration. Weights must sum to 1.0, got: {$totalWeight}");
        }
    }

    /**
     * Get scoring configuration
     * 
     * @return array
     */
    public function getScoringConfiguration(): array
    {
        return [
            'weights' => [
                'student' => self::STUDENT_WEIGHT,
                'peer' => self::PEER_WEIGHT,
                'admin' => self::ADMIN_WEIGHT
            ],
            'rating_scale' => [
                'min' => self::MIN_RATING,
                'max' => self::MAX_RATING
            ],
            'formula' => 'Final Score = (Student × ' . self::STUDENT_WEIGHT . ') + (Peer × ' . self::PEER_WEIGHT . ') + (Admin × ' . self::ADMIN_WEIGHT . ')'
        ];
    }

    /**
     * Validate response data before processing
     * 
     * @param array $responses
     * @return array
     */
    public function validateResponseData(array $responses): array
    {
        $validResponses = [];
        $errors = [];

        foreach ($responses as $index => $response) {
            if (!isset($response['rating'])) {
                $errors[] = "Response {$index}: Missing rating";
                continue;
            }

            $rating = $response['rating'];
            
            // Allow 'NC' (Not Applicable) as valid response
            if ($rating === 'NC') {
                continue; // Skip NC responses in calculations
            }

            if (!is_numeric($rating)) {
                $errors[] = "Response {$index}: Rating must be numeric or 'NC'";
                continue;
            }

            $rating = (float) $rating;
            if ($rating < self::MIN_RATING || $rating > self::MAX_RATING) {
                $errors[] = "Response {$index}: Rating must be between " . self::MIN_RATING . " and " . self::MAX_RATING;
                continue;
            }

            $validResponses[] = $response;
        }

        return [
            'valid_responses' => $validResponses,
            'errors' => $errors,
            'total_responses' => count($responses),
            'valid_count' => count($validResponses),
            'error_count' => count($errors)
        ];
    }

    /**
     * Calculate score statistics for analysis
     * 
     * @param array $scores
     * @return array
     */
    public function calculateScoreStatistics(array $scores): array
    {
        if (empty($scores)) {
            return [
                'count' => 0,
                'mean' => 0,
                'median' => 0,
                'min' => 0,
                'max' => 0,
                'standard_deviation' => 0
            ];
        }

        sort($scores);
        $count = count($scores);
        $mean = array_sum($scores) / $count;
        
        // Calculate median
        $median = $count % 2 === 0 
            ? ($scores[$count / 2 - 1] + $scores[$count / 2]) / 2
            : $scores[floor($count / 2)];

        // Calculate standard deviation
        $variance = array_sum(array_map(function($score) use ($mean) {
            return pow($score - $mean, 2);
        }, $scores)) / $count;
        
        $standardDeviation = sqrt($variance);

        return [
            'count' => $count,
            'mean' => round($mean, 2),
            'median' => round($median, 2),
            'min' => round(min($scores), 2),
            'max' => round(max($scores), 2),
            'standard_deviation' => round($standardDeviation, 2)
        ];
    }
}