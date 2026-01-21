<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Department;
use App\Models\Course;
use App\Models\Evaluation;
use App\Models\EvaluationSubmission;
use App\Models\Feedback;
use App\Models\Question;
use App\Models\Response;
use App\Events\SubmissionReceived;
use App\Services\RealTimeSyncService;
use App\Services\EvaluationAnalyticsService;

/**
 * **Feature: evaluation-realtime-sync, Integration Test: End-to-End Submission Flow**
 * 
 * This test verifies the complete end-to-end flow of student submissions
 * with real-time broadcasting to department dashboards.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */
class EndToEndSubmissionFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $realTimeSyncService;
    protected $analyticsService;
    protected $department;
    protected $teacher;
    protected $course;
    protected $evaluation;
    protected $students;
    protected $questions;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->realTimeSyncService = app(RealTimeSyncService::class);
        $this->analyticsService = app(EvaluationAnalyticsService::class);
        
        // Create test data
        $this->department = Department::factory()->create(['name' => 'Computer Science']);
        $this->teacher = Teacher::factory()->create(['department_id' => $this->department->id]);
        $this->course = Course::factory()->create(['department_id' => $this->department->id]);
        
        $this->evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(1),
            'closed_at' => now()->addDays(7)
        ]);

        $this->questions = Question::factory()->count(5)->create();
        $this->evaluation->questions()->attach($this->questions->pluck('id'));

        $this->students = Student::factory()->count(10)->create(['department_id' => $this->department->id]);
        
        // Enroll all students in the course
        foreach ($this->students as $student) {
            $student->courses()->attach($this->course->id);
        }
    }

    /**
     * Test submission broadcasting to department dashboard
     * **Validates: Requirements 2.1**
     */
    public function test_submission_broadcasting_to_department()
    {
        Event::fake([SubmissionReceived::class]);

        $student = $this->students->first();

        // Step 1: Student submits evaluation
        $submissionData = [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $student->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => rand(3, 5),
                    'text' => 'Good teaching quality'
                ];
            })->toArray()
        ];

        $response = $this->postJson('/api/feedbacks', $submissionData);
        $response->assertStatus(201);

        // Step 2: Verify submission record was created
        $this->assertDatabaseHas('evaluation_submissions', [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $student->id
        ]);

        // Step 3: Verify event was dispatched
        Event::assertDispatched(SubmissionReceived::class, function ($event) {
            return $event->evaluationId === $this->evaluation->id &&
                   $event->departmentId === $this->department->id &&
                   isset($event->participationStats['count']) &&
                   $event->participationStats['count'] === 1;
        });

        // Step 4: Test direct service broadcasting
        $participationStats = [
            'count' => 1,
            'total' => 10,
            'rate' => 10.0,
            'lastSubmissionAt' => now()->toISOString()
        ];

        $this->realTimeSyncService->broadcastSubmissionReceived(
            $this->evaluation->id,
            $participationStats,
            $this->department->id
        );

        // Step 5: Verify department can see updated participation
        $deptResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
        $deptResponse->assertStatus(200);
        
        $analytics = $deptResponse->json('analytics');
        $this->assertGreaterThan(0, $analytics['participation']['total_submissions']);
    }

    /**
     * Test participation statistics updates in real-time
     * **Validates: Requirements 2.2, 2.3**
     */
    public function test_participation_statistics_real_time_updates()
    {
        Event::fake([SubmissionReceived::class]);

        // Step 1: Submit multiple evaluations and track statistics
        $submissionCount = 0;
        $totalStudents = count($this->students);

        foreach ($this->students->take(5) as $student) {
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question) {
                    return [
                        'question_id' => $question->id,
                        'rating' => rand(3, 5),
                        'text' => 'Test feedback'
                    ];
                })->toArray()
            ];

            $response = $this->postJson('/api/feedbacks', $submissionData);
            $response->assertStatus(201);
            
            $submissionCount++;

            // Verify event was dispatched with correct statistics
            Event::assertDispatched(SubmissionReceived::class, function ($event) use ($submissionCount, $totalStudents) {
                return $event->evaluationId === $this->evaluation->id &&
                       $event->participationStats['count'] === $submissionCount &&
                       $event->participationStats['total'] === $totalStudents &&
                       abs($event->participationStats['rate'] - ($submissionCount / $totalStudents * 100)) < 0.1;
            });
        }

        // Step 2: Verify final statistics are accurate
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        
        $this->assertEquals(5, $analytics['participation']['total_submissions']);
        $this->assertEquals(50.0, $analytics['participation']['participation_rate']);
        $this->assertEquals(25, $analytics['total_responses']); // 5 students * 5 questions

        // Step 3: Test analytics auto-refresh via API
        $analyticsResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
        $analyticsResponse->assertStatus(200);
        
        $apiAnalytics = $analyticsResponse->json('analytics');
        $this->assertEquals(5, $apiAnalytics['participation']['total_submissions']);
        $this->assertEquals(50.0, $apiAnalytics['participation']['participation_rate']);
    }

    /**
     * Test analytics refresh functionality
     * **Validates: Requirements 2.2, 2.5**
     */
    public function test_analytics_auto_refresh()
    {
        // Step 1: Get initial analytics (should be empty)
        $initialAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(0, $initialAnalytics['participation']['total_submissions']);

        // Step 2: Submit evaluations in batches and verify analytics update
        $batches = [3, 2, 4]; // Submit in 3 batches
        $totalSubmitted = 0;

        foreach ($batches as $batchSize) {
            $studentsForBatch = $this->students->skip($totalSubmitted)->take($batchSize);
            
            foreach ($studentsForBatch as $student) {
                $submissionData = [
                    'evaluation_id' => $this->evaluation->id,
                    'student_id' => $student->id,
                    'responses' => $this->questions->map(function ($question) {
                        return [
                            'question_id' => $question->id,
                            'rating' => rand(1, 5),
                            'text' => 'Batch submission test'
                        ];
                    })->toArray()
                ];

                $response = $this->postJson('/api/feedbacks', $submissionData);
                $response->assertStatus(201);
            }
            
            $totalSubmitted += $batchSize;

            // Step 3: Verify analytics are updated after each batch
            $batchAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
            $this->assertEquals($totalSubmitted, $batchAnalytics['participation']['total_submissions']);
            $this->assertEquals($totalSubmitted * 5, $batchAnalytics['total_responses']);
            
            // Verify participation rate calculation
            $expectedRate = ($totalSubmitted / count($this->students)) * 100;
            $this->assertEquals($expectedRate, $batchAnalytics['participation']['participation_rate']);
        }

        // Step 4: Test report data currency
        $reportData = app(\App\Services\ReportGenerationService::class)
            ->generateTeacherReport($this->evaluation->id);
        
        $this->assertIsArray($reportData);
        $this->assertEquals($totalSubmitted, $reportData['statistics']['total_submissions']);
    }

    /**
     * Test completion status reflection in department view
     * **Validates: Requirements 2.4**
     */
    public function test_completion_status_reflection()
    {
        Event::fake([SubmissionReceived::class]);

        // Step 1: Submit evaluation for specific student
        $testStudent = $this->students->first();
        
        $submissionData = [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $testStudent->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'Completion status test'
                ];
            })->toArray()
        ];

        $response = $this->postJson('/api/feedbacks', $submissionData);
        $response->assertStatus(201);

        // Step 2: Verify completion status is reflected immediately
        $submissionStatus = app(\App\Services\SubmissionValidationService::class)
            ->getSubmissionStatus($testStudent->id, $this->evaluation->id);
        
        $this->assertTrue($submissionStatus['has_submitted']);
        $this->assertNotNull($submissionStatus['submitted_at']);

        // Step 3: Verify department can see completion status
        $statusResponse = $this->getJson(
            "/api/evaluations/{$this->evaluation->id}/submission-status?student_id={$testStudent->id}"
        );
        $statusResponse->assertStatus(200);
        $statusResponse->assertJsonPath('submission_status.has_submitted', true);

        // Step 4: Verify event includes completion information
        Event::assertDispatched(SubmissionReceived::class, function ($event) use ($testStudent) {
            return $event->evaluationId === $this->evaluation->id &&
                   $event->participationStats['count'] === 1 &&
                   isset($event->participationStats['lastSubmissionAt']);
        });

        // Step 5: Test multiple completions
        $additionalStudents = $this->students->skip(1)->take(3);
        foreach ($additionalStudents as $student) {
            $submissionData['student_id'] = $student->id;
            $response = $this->postJson('/api/feedbacks', $submissionData);
            $response->assertStatus(201);
        }

        // Verify total completion count
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(4, $analytics['participation']['total_submissions']);
    }

    /**
     * Test concurrent submissions handling
     * **Validates: Requirements 2.1, 2.3**
     */
    public function test_concurrent_submissions_handling()
    {
        Event::fake([SubmissionReceived::class]);

        // Step 1: Simulate concurrent submissions
        $concurrentStudents = $this->students->take(5);
        $responses = [];

        foreach ($concurrentStudents as $student) {
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question) {
                    return [
                        'question_id' => $question->id,
                        'rating' => rand(1, 5),
                        'text' => 'Concurrent submission test'
                    ];
                })->toArray()
            ];

            $response = $this->postJson('/api/feedbacks', $submissionData);
            $responses[] = $response;
        }

        // Step 2: Verify all submissions were successful
        foreach ($responses as $response) {
            $response->assertStatus(201);
        }

        // Step 3: Verify all events were dispatched
        Event::assertDispatchedTimes(SubmissionReceived::class, 5);

        // Step 4: Verify final statistics are accurate
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(5, $analytics['participation']['total_submissions']);
        $this->assertEquals(25, $analytics['total_responses']);

        // Step 5: Verify no duplicate submissions
        $submissionCount = EvaluationSubmission::where('evaluation_id', $this->evaluation->id)->count();
        $this->assertEquals(5, $submissionCount);
    }

    /**
     * Test submission validation and error handling
     * **Validates: Requirements 2.1**
     */
    public function test_submission_validation_and_error_handling()
    {
        $student = $this->students->first();

        // Test 1: Invalid evaluation ID
        $invalidSubmission = [
            'evaluation_id' => 99999,
            'student_id' => $student->id,
            'responses' => []
        ];

        $response = $this->postJson('/api/feedbacks', $invalidSubmission);
        $response->assertStatus(422);

        // Test 2: Missing required fields
        $incompleteSubmission = [
            'evaluation_id' => $this->evaluation->id,
            // Missing student_id and responses
        ];

        $response = $this->postJson('/api/feedbacks', $incompleteSubmission);
        $response->assertStatus(422);

        // Test 3: Duplicate submission
        $validSubmission = [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $student->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'First submission'
                ];
            })->toArray()
        ];

        // First submission should succeed
        $firstResponse = $this->postJson('/api/feedbacks', $validSubmission);
        $firstResponse->assertStatus(201);

        // Duplicate submission should fail
        $duplicateResponse = $this->postJson('/api/feedbacks', $validSubmission);
        $duplicateResponse->assertStatus(422);

        // Test 4: Submission to closed evaluation
        $closedEvaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(10),
            'closed_at' => now()->subDays(1) // Already closed
        ]);

        $closedSubmission = [
            'evaluation_id' => $closedEvaluation->id,
            'student_id' => $this->students->get(1)->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'Late submission'
                ];
            })->toArray()
        ];

        $closedResponse = $this->postJson('/api/feedbacks', $closedSubmission);
        $closedResponse->assertStatus(422);
    }

    /**
     * Test real-time participation indicators
     * **Validates: Requirements 2.1, 2.3**
     */
    public function test_real_time_participation_indicators()
    {
        Event::fake([SubmissionReceived::class]);

        // Step 1: Create baseline - no submissions
        $initialStats = [
            'count' => 0,
            'total' => count($this->students),
            'rate' => 0.0,
            'lastSubmissionAt' => null
        ];

        // Step 2: Submit evaluations and track participation indicators
        $submissionTimes = [];
        
        foreach ($this->students->take(7) as $index => $student) {
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question) {
                    return [
                        'question_id' => $question->id,
                        'rating' => rand(3, 5),
                        'text' => 'Participation indicator test'
                    ];
                })->toArray()
            ];

            $beforeSubmission = now();
            $response = $this->postJson('/api/feedbacks', $submissionData);
            $afterSubmission = now();
            
            $response->assertStatus(201);
            $submissionTimes[] = $afterSubmission;

            // Verify participation stats in event
            Event::assertDispatched(SubmissionReceived::class, function ($event) use ($index) {
                $expectedCount = $index + 1;
                $expectedRate = ($expectedCount / 10) * 100;
                
                return $event->evaluationId === $this->evaluation->id &&
                       $event->participationStats['count'] === $expectedCount &&
                       $event->participationStats['total'] === 10 &&
                       abs($event->participationStats['rate'] - $expectedRate) < 0.1 &&
                       isset($event->participationStats['lastSubmissionAt']);
            });
        }

        // Step 3: Verify final participation indicators
        $finalAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        
        $this->assertEquals(7, $finalAnalytics['participation']['total_submissions']);
        $this->assertEquals(70.0, $finalAnalytics['participation']['participation_rate']);
        $this->assertNotNull($finalAnalytics['participation']['last_submission_at']);

        // Step 4: Test participation endpoint for department dashboard
        $participationResponse = $this->getJson(
            "/api/evaluations/participation?department_id={$this->department->id}"
        );
        $participationResponse->assertStatus(200);
        
        $participationData = $participationResponse->json('data');
        $this->assertNotEmpty($participationData);
        
        $evaluationParticipation = collect($participationData)
            ->firstWhere('evaluation_id', $this->evaluation->id);
        
        $this->assertNotNull($evaluationParticipation);
        $this->assertEquals(7, $evaluationParticipation['submission_count']);
        $this->assertEquals(70.0, $evaluationParticipation['participation_rate']);
    }

    /**
     * Test submission flow with different rating patterns
     * **Validates: Requirements 2.2, 2.5**
     */
    public function test_submission_flow_with_rating_patterns()
    {
        Event::fake([SubmissionReceived::class]);

        // Test different rating patterns and their impact on analytics
        $ratingPatterns = [
            'high_ratings' => [4, 5, 5, 4, 5],
            'mixed_ratings' => [1, 3, 5, 2, 4],
            'low_ratings' => [1, 2, 1, 2, 1]
        ];

        $patternResults = [];

        foreach ($ratingPatterns as $patternName => $ratings) {
            $student = $this->students->shift(); // Get next student
            
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question, $index) use ($ratings) {
                    return [
                        'question_id' => $question->id,
                        'rating' => $ratings[$index],
                        'text' => "Pattern: {$ratings[$index]} stars"
                    ];
                })->toArray()
            ];

            $response = $this->postJson('/api/feedbacks', $submissionData);
            $response->assertStatus(201);

            // Calculate expected average for this pattern
            $expectedAverage = array_sum($ratings) / count($ratings);
            $patternResults[$patternName] = $expectedAverage;
        }

        // Verify analytics reflect different rating patterns
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        
        $this->assertEquals(3, $analytics['participation']['total_submissions']);
        $this->assertEquals(15, $analytics['total_responses']);
        $this->assertGreaterThan(0, $analytics['average_rating']);

        // Verify events were dispatched for all patterns
        Event::assertDispatchedTimes(SubmissionReceived::class, 3);

        // Test report generation includes all patterns
        $reportData = app(\App\Services\ReportGenerationService::class)
            ->generateTeacherReport($this->evaluation->id);
        
        $this->assertEquals(3, $reportData['statistics']['total_submissions']);
        $this->assertArrayHasKey('average_rating', $reportData['statistics']);
    }
}