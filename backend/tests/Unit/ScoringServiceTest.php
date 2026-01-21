<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\ScoringService;
use App\Models\Evaluation;
use App\Models\Response;
use App\Models\Feedback;
use App\Models\Course;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\User;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Faker\Factory as Faker;

class ScoringServiceTest extends TestCase
{
    use RefreshDatabase;

    private ScoringService $scoringService;
    private Evaluation $evaluation;
    private Teacher $teacher;
    private Course $course;
    private Department $department;
    private $faker;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->scoringService = new ScoringService();
        $this->faker = Faker::create();
        
        // Create test data
        $this->department = Department::factory()->create();
        $this->course = Course::factory()->create(['department_id' => $this->department->id]);
        $this->teacher = Teacher::factory()->create();
        $this->evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'department_id' => $this->department->id
        ]);
    }

    public function test_calculate_weighted_scores_with_valid_data()
    {
        // Create student responses
        $this->createStudentResponses([4, 5, 3, 4, 5]); // Average: 4.2, Percentage: 84%

        $result = $this->scoringService->calculateWeightedScores($this->evaluation->id);

        $this->assertIsArray($result);
        $this->assertEquals($this->evaluation->id, $result['evaluation_id']);
        $this->assertArrayHasKey('student_score', $result);
        $this->assertArrayHasKey('peer_score', $result);
        $this->assertArrayHasKey('admin_score', $result);
        $this->assertArrayHasKey('weighted_score', $result);
        $this->assertArrayHasKey('breakdown', $result);
        
        // Verify student score calculation
        $this->assertEquals(84.0, $result['student_score']); // (4.2/5) * 100 = 84%
        
        // Verify breakdown structure
        $this->assertArrayHasKey('student', $result['breakdown']);
        $this->assertArrayHasKey('peer', $result['breakdown']);
        $this->assertArrayHasKey('admin', $result['breakdown']);
        
        // Verify weights
        $this->assertEquals(50, $result['breakdown']['student']['weight']);
        $this->assertEquals(30, $result['breakdown']['peer']['weight']);
        $this->assertEquals(20, $result['breakdown']['admin']['weight']);
    }

    public function test_calculate_student_evaluation_score()
    {
        // Create responses with ratings 1, 2, 3, 4, 5 (average: 3.0)
        $this->createStudentResponses([1, 2, 3, 4, 5]);

        $score = $this->scoringService->calculateStudentEvaluationScore($this->evaluation->id);

        $this->assertEquals(60.0, $score); // (3.0/5) * 100 = 60%
    }

    public function test_calculate_student_evaluation_score_with_no_responses()
    {
        $score = $this->scoringService->calculateStudentEvaluationScore($this->evaluation->id);

        $this->assertEquals(0.0, $score);
    }

    public function test_calculate_average_score_with_valid_responses()
    {
        $responses = collect([
            (object) ['rating' => 4],
            (object) ['rating' => 5],
            (object) ['rating' => 3]
        ]);

        $score = $this->scoringService->calculateAverageScore($responses);

        $this->assertEquals(80.0, $score); // (4/5) * 100 = 80%
    }

    public function test_calculate_average_score_with_empty_responses()
    {
        $responses = collect([]);

        $score = $this->scoringService->calculateAverageScore($responses);

        $this->assertEquals(0.0, $score);
    }

    public function test_calculate_average_score_filters_invalid_ratings()
    {
        $responses = collect([
            (object) ['rating' => 4],
            (object) ['rating' => null],
            (object) ['rating' => 6], // Invalid - above max
            (object) ['rating' => 0], // Invalid - below min
            (object) ['rating' => 5]
        ]);

        $score = $this->scoringService->calculateAverageScore($responses);

        $this->assertEquals(90.0, $score); // Only ratings 4 and 5 are valid: (4.5/5) * 100 = 90%
    }

    public function test_validate_response_data_with_valid_responses()
    {
        $responses = [
            ['rating' => 4],
            ['rating' => 5],
            ['rating' => 'NC'], // Should be skipped but not error
            ['rating' => 3]
        ];

        $result = $this->scoringService->validateResponseData($responses);

        $this->assertEquals(4, $result['total_responses']);
        $this->assertEquals(3, $result['valid_count']); // NC is skipped
        $this->assertEquals(0, $result['error_count']);
        $this->assertEmpty($result['errors']);
    }

    public function test_validate_response_data_with_invalid_responses()
    {
        $responses = [
            ['rating' => 4],
            ['rating' => 'invalid'],
            ['rating' => 6], // Above max
            ['rating' => 0], // Below min
            [] // Missing rating
        ];

        $result = $this->scoringService->validateResponseData($responses);

        $this->assertEquals(5, $result['total_responses']);
        $this->assertEquals(1, $result['valid_count']);
        $this->assertEquals(4, $result['error_count']);
        $this->assertCount(4, $result['errors']);
    }

    public function test_calculate_score_statistics()
    {
        $scores = [85.0, 90.0, 75.0, 95.0, 80.0];

        $stats = $this->scoringService->calculateScoreStatistics($scores);

        $this->assertEquals(5, $stats['count']);
        $this->assertEquals(85.0, $stats['mean']);
        $this->assertEquals(85.0, $stats['median']);
        $this->assertEquals(75.0, $stats['min']);
        $this->assertEquals(95.0, $stats['max']);
        $this->assertGreaterThan(0, $stats['standard_deviation']);
    }

    public function test_calculate_score_statistics_with_empty_array()
    {
        $stats = $this->scoringService->calculateScoreStatistics([]);

        $this->assertEquals(0, $stats['count']);
        $this->assertEquals(0, $stats['mean']);
        $this->assertEquals(0, $stats['median']);
        $this->assertEquals(0, $stats['min']);
        $this->assertEquals(0, $stats['max']);
        $this->assertEquals(0, $stats['standard_deviation']);
    }

    public function test_get_scoring_configuration()
    {
        $config = $this->scoringService->getScoringConfiguration();

        $this->assertArrayHasKey('weights', $config);
        $this->assertArrayHasKey('rating_scale', $config);
        $this->assertArrayHasKey('formula', $config);
        
        // Verify weights sum to 1.0
        $totalWeight = $config['weights']['student'] + $config['weights']['peer'] + $config['weights']['admin'];
        $this->assertEquals(1.0, $totalWeight);
        
        // Verify individual weights
        $this->assertEquals(0.5, $config['weights']['student']);
        $this->assertEquals(0.3, $config['weights']['peer']);
        $this->assertEquals(0.2, $config['weights']['admin']);
    }

    public function test_calculate_weighted_scores_throws_exception_for_invalid_evaluation_id()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid evaluation ID: -1');

        $this->scoringService->calculateWeightedScores(-1);
    }

    public function test_calculate_weighted_scores_throws_exception_for_nonexistent_evaluation()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Evaluation not found: 99999');

        $this->scoringService->calculateWeightedScores(99999);
    }

    /**
     * **Feature: teacher-evaluation-system, Property 1: Weighted score calculation accuracy**
     * Property-based test for weighted score calculation accuracy
     * Validates: Requirements 5.4
     * 
     * For any teacher with valid student average, peer average, and administrative score,
     * the final weighted score should equal (Student_Average × 0.5) + (Peer_Average × 0.3) + (Administrative_Score × 0.2)
     */
    public function test_weighted_score_calculation_accuracy_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random valid scores (0-100 range)
            $studentScore = $this->faker->randomFloat(2, 0, 100);
            $peerScore = $this->faker->randomFloat(2, 0, 100);
            $adminScore = $this->faker->randomFloat(2, 0, 100);
            
            // Calculate expected weighted score using the formula from requirements 5.4
            $expectedWeightedScore = ($studentScore * 0.5) + ($peerScore * 0.3) + ($adminScore * 0.2);
            
            // Create a mock ScoringService that returns our controlled scores
            $mockScoringService = $this->createPartialMock(ScoringService::class, [
                'calculateStudentEvaluationScore',
                'calculatePeerEvaluationScore', 
                'calculateAdminEvaluationScore'
            ]);
            
            $mockScoringService->method('calculateStudentEvaluationScore')
                ->willReturn($studentScore);
            $mockScoringService->method('calculatePeerEvaluationScore')
                ->willReturn($peerScore);
            $mockScoringService->method('calculateAdminEvaluationScore')
                ->willReturn($adminScore);
            
            // Calculate weighted scores using the service
            $result = $mockScoringService->calculateWeightedScores($this->evaluation->id);
            
            // Verify the weighted calculation is accurate (within floating point precision)
            $actualWeightedScore = $result['weighted_score'];
            $tolerance = 0.01; // Allow small floating point differences
            
            $this->assertEqualsWithDelta(
                round($expectedWeightedScore, 2),
                $actualWeightedScore,
                $tolerance,
                "Weighted score calculation failed for iteration {$i}. " .
                "Student: {$studentScore}, Peer: {$peerScore}, Admin: {$adminScore}. " .
                "Expected: " . round($expectedWeightedScore, 2) . ", Got: {$actualWeightedScore}"
            );
            
            // Verify breakdown components are correct
            $this->assertEqualsWithDelta(
                round($studentScore * 0.5, 2),
                $result['breakdown']['student']['weighted_value'],
                $tolerance,
                "Student weighted value incorrect for iteration {$i}"
            );
            
            $this->assertEqualsWithDelta(
                round($peerScore * 0.3, 2),
                $result['breakdown']['peer']['weighted_value'],
                $tolerance,
                "Peer weighted value incorrect for iteration {$i}"
            );
            
            $this->assertEqualsWithDelta(
                round($adminScore * 0.2, 2),
                $result['breakdown']['admin']['weighted_value'],
                $tolerance,
                "Admin weighted value incorrect for iteration {$i}"
            );
            
            // Verify weights are correctly configured
            $this->assertEquals(50, $result['breakdown']['student']['weight']);
            $this->assertEquals(30, $result['breakdown']['peer']['weight']);
            $this->assertEquals(20, $result['breakdown']['admin']['weight']);
            
            // Verify final score is within valid range (0-100)
            $this->assertGreaterThanOrEqual(0, $actualWeightedScore, "Weighted score below minimum for iteration {$i}");
            $this->assertLessThanOrEqual(100, $actualWeightedScore, "Weighted score above maximum for iteration {$i}");
        }
    }

    /**
     * Helper method to create student responses for testing
     */
    private function createStudentResponses(array $ratings): void
    {
        foreach ($ratings as $rating) {
            $student = Student::factory()->create();
            $feedback = Feedback::factory()->create([
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'anonymous' => false
            ]);
            
            Response::factory()->create([
                'feedback_id' => $feedback->id,
                'rating' => $rating
            ]);
        }
    }
}