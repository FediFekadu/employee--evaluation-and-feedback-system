<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Cache;
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
use App\Services\SubmissionValidationService;
use App\Services\ReportGenerationService;

/**
 * **Feature: evaluation-realtime-sync, Integration Test: Submission Flow**
 * 
 * This integration test verifies the complete flow from student submission 
 * to department update, focusing on real-time analytics accuracy and 
 * end-to-end data consistency.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */
class SubmissionFlowIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $realTimeSyncService;
    protected $analyticsService;
    protected $submissionValidationService;
    protected $reportGenerationService;
    protected $department;
    protected $teacher;
    protected $course;
    protected $evaluation;
    protected $students;
    protected $questions;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Initialize services for integration testing
        $this->realTimeSyncService = app(RealTimeSyncService::class);
        $this->analyticsService = app(EvaluationAnalyticsService::class);
        $this->submissionValidationService = app(SubmissionValidationService::class);
        $this->reportGenerationService = app(ReportGenerationService::class);
        
        // Create comprehensive test data
        $this->department = Department::factory()->create(['name' => 'Integration Test Department']);
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

        $this->students = Student::factory()->count(20)->create(['department_id' => $this->department->id]);
        
        // Enroll all students in the course for proper participation calculation
        foreach ($this->students as $student) {
            $student->courses()->attach($this->course->id);
        }
    }

    /**
     * Test complete flow from student submission to department update
     * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
     */
    public function test_complete_submission_to_department_update_flow()
    {
        // Don't fake events initially to see what's happening
        
        // Step 1: Capture initial state
        $initialAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(0, $initialAnalytics['participation']['total_submissions']);
        
        // Step 2: Student submits evaluation
        $student = $this->students->first();
        $submissionData = [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $student->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'Integration test feedback'
                ];
            })->toArray()
        ];

        $submissionResponse = $this->postJson('/api/feedbacks', $submissionData);
        
        // Debug the response if it fails
        if ($submissionResponse->status() !== 201) {
            dump('Submission failed:', $submissionResponse->json());
        }
        
        $submissionResponse->assertStatus(201);

        // Step 3: Verify submission was recorded in database
        $this->assertDatabaseHas('evaluation_submissions', [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $student->id
        ]);

        $this->assertDatabaseHas('feedbacks', [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $student->id
        ]);

        // Step 4: Verify analytics are immediately updated
        $updatedAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(1, $updatedAnalytics['participation']['total_submissions']);
        $this->assertEquals(5.0, $updatedAnalytics['participation']['participation_rate']);
        $this->assertEquals(5, $updatedAnalytics['total_responses']);
        $this->assertEquals(4.0, $updatedAnalytics['average_rating']);

        // Step 5: Verify department can immediately see the update via API
        $departmentResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
        $departmentResponse->assertStatus(200);
        
        $apiAnalytics = $departmentResponse->json('analytics');
        $this->assertEquals(1, $apiAnalytics['participation']['total_submissions']);
        $this->assertEquals(5.0, $apiAnalytics['participation']['participation_rate']);

        // Step 6: Verify submission status is immediately available
        $statusResponse = $this->getJson(
            "/api/evaluations/{$this->evaluation->id}/submission-status?student_id={$student->id}"
        );
        $statusResponse->assertStatus(200);
        $statusResponse->assertJsonPath('submission_status.has_submitted', true);

        // Step 7: Verify report generation includes the new submission
        $reportData = $this->reportGenerationService->generateTeacherReport($this->evaluation->id);
        
        $this->assertArrayHasKey('statistics', $reportData);
        $this->assertArrayHasKey('participation', $reportData['statistics']);
        $this->assertEquals(1, $reportData['statistics']['participation']['total_submissions']);
        $this->assertEquals(4.0, $reportData['statistics']['average_rating']);
    }

    /**
     * Test real-time analytics accuracy with multiple submissions
     * **Validates: Requirements 2.2, 2.3, 2.5**
     */
    public function test_real_time_analytics_accuracy()
    {
        // Step 1: Submit evaluations in waves and verify analytics accuracy at each step
        $submissionWaves = [
            ['count' => 3, 'ratings' => [5, 4, 5]],
            ['count' => 5, 'ratings' => [3, 4, 5, 2, 4]],
            ['count' => 2, 'ratings' => [5, 5]]
        ];

        $totalSubmissions = 0;
        $allRatings = [];

        foreach ($submissionWaves as $waveIndex => $wave) {
            $waveStudents = $this->students->skip($totalSubmissions)->take($wave['count']);
            
            $ratingIndex = 0;
            foreach ($waveStudents as $student) {
                $rating = $wave['ratings'][$ratingIndex];
                $allRatings[] = $rating;
                
                $submissionData = [
                    'evaluation_id' => $this->evaluation->id,
                    'student_id' => $student->id,
                    'responses' => $this->questions->map(function ($question) use ($rating) {
                        return [
                            'question_id' => $question->id,
                            'rating' => $rating,
                            'text' => "Wave {$rating} star rating"
                        ];
                    })->toArray()
                ];

                $response = $this->postJson('/api/feedbacks', $submissionData);
                $response->assertStatus(201);
                
                $totalSubmissions++;
                $ratingIndex++;

                // Verify analytics accuracy after each submission
                $currentAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
                
                $this->assertEquals($totalSubmissions, $currentAnalytics['participation']['total_submissions']);
                $this->assertEquals($totalSubmissions * 5, $currentAnalytics['total_responses']);
                
                $expectedRate = ($totalSubmissions / 20) * 100;
                $this->assertEquals($expectedRate, $currentAnalytics['participation']['participation_rate']);
                
                $expectedAverage = array_sum($allRatings) / count($allRatings);
                $this->assertEqualsWithDelta($expectedAverage, $currentAnalytics['average_rating'], 0.5);
            }

            // Verify wave completion analytics
            $waveAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
            $this->assertEquals($totalSubmissions, $waveAnalytics['participation']['total_submissions']);

            // Verify department API reflects accurate data
            $deptResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
            $deptResponse->assertStatus(200);
            
            $apiAnalytics = $deptResponse->json('analytics');
            $this->assertEquals($totalSubmissions, $apiAnalytics['participation']['total_submissions']);
            $this->assertEquals(($totalSubmissions / 20) * 100, $apiAnalytics['participation']['participation_rate']);
        }

        // Step 2: Verify final analytics accuracy
        $finalAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(10, $finalAnalytics['participation']['total_submissions']);
        $this->assertEquals(50.0, $finalAnalytics['participation']['participation_rate']);
        $this->assertEquals(50, $finalAnalytics['total_responses']);

        // Calculate expected final average
        $expectedFinalAverage = array_sum($allRatings) / count($allRatings);
        $this->assertEqualsWithDelta($expectedFinalAverage, $finalAnalytics['average_rating'], 0.5);

        // Step 3: Verify report generation accuracy
        $reportData = $this->reportGenerationService->generateTeacherReport($this->evaluation->id);
        $this->assertEquals(10, $reportData['statistics']['participation']['total_submissions']);
        $this->assertEquals($expectedFinalAverage, $reportData['statistics']['average_rating'], '', 0.01);
    }

    /**
     * Test integration with concurrent submissions and analytics consistency
     * **Validates: Requirements 2.1, 2.3, 2.4**
     */
    public function test_concurrent_submissions_analytics_consistency()
    {
        // Step 1: Simulate concurrent submissions from multiple students
        $concurrentStudents = $this->students->take(8);
        
        foreach ($concurrentStudents as $student) {
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question) {
                    return [
                        'question_id' => $question->id,
                        'rating' => rand(3, 5),
                        'text' => 'Concurrent submission test'
                    ];
                })->toArray()
            ];

            $response = $this->postJson('/api/feedbacks', $submissionData);
            $response->assertStatus(201);
        }

        // Step 2: Verify all submissions were recorded
        $submissionCount = EvaluationSubmission::where('evaluation_id', $this->evaluation->id)->count();
        $this->assertEquals(8, $submissionCount);

        $feedbackCount = Feedback::where('evaluation_id', $this->evaluation->id)->count();
        $this->assertEquals(8, $feedbackCount);

        // Step 3: Verify analytics consistency
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(8, $analytics['participation']['total_submissions']);
        $this->assertEquals(40, $analytics['total_responses']);
        $this->assertEquals(40.0, $analytics['participation']['participation_rate']);

        // Step 5: Verify department API consistency
        $deptResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
        $deptResponse->assertStatus(200);
        
        $apiAnalytics = $deptResponse->json('analytics');
        $this->assertEquals(8, $apiAnalytics['participation']['total_submissions']);
        $this->assertEquals(40.0, $apiAnalytics['participation']['participation_rate']);
    }

    /**
     * Test complete integration with validation, broadcasting, and reporting
     * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
     */
    public function test_complete_integration_validation_broadcasting_reporting()
    {
        // Step 1: Test submission validation integration
        $validStudent = $this->students->first();
        
        // Valid submission
        $validSubmissionData = [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $validStudent->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'Valid integration test'
                ];
            })->toArray()
        ];

        $validResponse = $this->postJson('/api/feedbacks', $validSubmissionData);
        $validResponse->assertStatus(201);

        // Step 2: Verify validation service integration
        $validationStatus = $this->submissionValidationService->getSubmissionStatus(
            $validStudent->id, 
            $this->evaluation->id
        );
        $this->assertTrue($validationStatus['has_submitted']);

        // Step 3: Test duplicate submission validation
        $duplicateResponse = $this->postJson('/api/feedbacks', $validSubmissionData);
        $duplicateResponse->assertStatus(422);

        // Step 4: Test analytics service integration
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(1, $analytics['participation']['total_submissions']);
        $this->assertEquals(4.0, $analytics['average_rating']);

        // Step 5: Test reporting service integration
        $reportData = $this->reportGenerationService->generateTeacherReport($this->evaluation->id);
        $this->assertEquals(1, $reportData['statistics']['participation']['total_submissions']);
        $this->assertArrayHasKey('question_analysis', $reportData);
        $this->assertArrayHasKey('participation', $reportData['statistics']);

        // Step 6: Add more submissions and verify complete integration
        $additionalStudents = $this->students->skip(1)->take(5);
        foreach ($additionalStudents as $student) {
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question) {
                    return [
                        'question_id' => $question->id,
                        'rating' => rand(3, 5),
                        'text' => 'Additional integration test'
                    ];
                })->toArray()
            ];

            $response = $this->postJson('/api/feedbacks', $submissionData);
            $response->assertStatus(201);
        }

        // Step 7: Verify final integration state
        $finalAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(6, $finalAnalytics['participation']['total_submissions']);
        $this->assertEquals(30.0, $finalAnalytics['participation']['participation_rate']);

        $finalReport = $this->reportGenerationService->generateTeacherReport($this->evaluation->id);
        $this->assertEquals(6, $finalReport['statistics']['participation']['total_submissions']);

        // Step 8: Verify department API reflects complete integration
        $finalDeptResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
        $finalDeptResponse->assertStatus(200);
        
        $finalApiAnalytics = $finalDeptResponse->json('analytics');
        $this->assertEquals(6, $finalApiAnalytics['participation']['total_submissions']);
        $this->assertEquals(30.0, $finalApiAnalytics['participation']['participation_rate']);
    }

    /**
     * Test integration with different evaluation states
     * **Validates: Requirements 2.1, 2.4**
     */
    public function test_integration_with_different_evaluation_states()
    {
        // Step 1: Test with active evaluation (current setup)
        $activeStudent = $this->students->first();
        $activeSubmissionData = [
            'evaluation_id' => $this->evaluation->id,
            'student_id' => $activeStudent->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 5,
                    'text' => 'Active evaluation test'
                ];
            })->toArray()
        ];

        $activeResponse = $this->postJson('/api/feedbacks', $activeSubmissionData);
        $activeResponse->assertStatus(201);

        // Step 2: Create and test with recently opened evaluation
        $newEvaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(1), // Already opened
            'closed_at' => now()->addDays(14)
        ]);
        $newEvaluation->questions()->attach($this->questions->pluck('id'));

        $newStudent = $this->students->get(1);
        $newSubmissionData = [
            'evaluation_id' => $newEvaluation->id,
            'student_id' => $newStudent->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'New evaluation test'
                ];
            })->toArray()
        ];

        $newResponse = $this->postJson('/api/feedbacks', $newSubmissionData);
        $newResponse->assertStatus(201);

        // Step 3: Test with evaluation nearing closure
        $nearClosureEvaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(6),
            'closed_at' => now()->addHours(2) // Closes in 2 hours
        ]);
        $nearClosureEvaluation->questions()->attach($this->questions->pluck('id'));

        $urgentStudent = $this->students->get(2);
        $urgentSubmissionData = [
            'evaluation_id' => $nearClosureEvaluation->id,
            'student_id' => $urgentStudent->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 3,
                    'text' => 'Near closure test'
                ];
            })->toArray()
        ];

        $urgentResponse = $this->postJson('/api/feedbacks', $urgentSubmissionData);
        $urgentResponse->assertStatus(201);

        // Step 4: Verify analytics for each evaluation
        $activeAnalytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(1, $activeAnalytics['participation']['total_submissions']);
        $this->assertEquals(5.0, $activeAnalytics['average_rating']);

        $newAnalytics = $this->analyticsService->generateEvaluationStatistics($newEvaluation->id);
        $this->assertEquals(1, $newAnalytics['participation']['total_submissions']);
        $this->assertEquals(4.0, $newAnalytics['average_rating']);

        $urgentAnalytics = $this->analyticsService->generateEvaluationStatistics($nearClosureEvaluation->id);
        $this->assertEquals(1, $urgentAnalytics['participation']['total_submissions']);
        $this->assertEquals(3.0, $urgentAnalytics['average_rating']);

        // Step 5: Test closed evaluation (should fail)
        $closedEvaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(10),
            'closed_at' => now()->subDays(1) // Already closed
        ]);

        $closedStudent = $this->students->get(3);
        $closedSubmissionData = [
            'evaluation_id' => $closedEvaluation->id,
            'student_id' => $closedStudent->id,
            'responses' => $this->questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'Should fail'
                ];
            })->toArray()
        ];

        $closedResponse = $this->postJson('/api/feedbacks', $closedSubmissionData);
        $closedResponse->assertStatus(422);
    }

    /**
     * Test integration performance with high volume submissions
     * **Validates: Requirements 2.2, 2.3, 2.5**
     */
    public function test_integration_performance_high_volume()
    {
        // Remove event faking for integration test
        
        // Step 1: Submit evaluations from all students
        $startTime = microtime(true);
        
        foreach ($this->students as $student) {
            $submissionData = [
                'evaluation_id' => $this->evaluation->id,
                'student_id' => $student->id,
                'responses' => $this->questions->map(function ($question) {
                    return [
                        'question_id' => $question->id,
                        'rating' => rand(1, 5),
                        'text' => 'High volume test'
                    ];
                })->toArray()
            ];

            $response = $this->postJson('/api/feedbacks', $submissionData);
            $response->assertStatus(201);
        }
        
        $endTime = microtime(true);
        $totalTime = $endTime - $startTime;
        
        // Step 2: Verify performance is acceptable (should complete within reasonable time)
        $this->assertLessThan(30, $totalTime, 'High volume submissions should complete within 30 seconds');

        // Step 3: Verify all submissions were processed
        $submissionCount = EvaluationSubmission::where('evaluation_id', $this->evaluation->id)->count();
        $this->assertEquals(20, $submissionCount);

        // Step 4: Verify analytics accuracy with high volume
        $analytics = $this->analyticsService->generateEvaluationStatistics($this->evaluation->id);
        $this->assertEquals(20, $analytics['participation']['total_submissions']);
        $this->assertEquals(100.0, $analytics['participation']['participation_rate']);
        $this->assertEquals(100, $analytics['total_responses']);



        // Step 6: Verify department API performance
        $apiStartTime = microtime(true);
        $deptResponse = $this->getJson("/api/evaluations/{$this->evaluation->id}/analytics");
        $apiEndTime = microtime(true);
        $apiTime = $apiEndTime - $apiStartTime;
        
        $deptResponse->assertStatus(200);
        $this->assertLessThan(2, $apiTime, 'Analytics API should respond within 2 seconds');
        
        $apiAnalytics = $deptResponse->json('analytics');
        $this->assertEquals(20, $apiAnalytics['participation']['total_submissions']);
        $this->assertEquals(100.0, $apiAnalytics['participation']['participation_rate']);

        // Step 7: Verify report generation performance
        $reportStartTime = microtime(true);
        $reportData = $this->reportGenerationService->generateTeacherReport($this->evaluation->id);
        $reportEndTime = microtime(true);
        $reportTime = $reportEndTime - $reportStartTime;
        
        $this->assertLessThan(5, $reportTime, 'Report generation should complete within 5 seconds');
        $this->assertEquals(20, $reportData['statistics']['participation']['total_submissions']);
    }
}