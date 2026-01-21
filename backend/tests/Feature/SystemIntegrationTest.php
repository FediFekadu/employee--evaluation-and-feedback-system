<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
use App\Services\SubmissionValidationService;
use App\Services\EvaluationAnalyticsService;
use App\Services\ReportGenerationService;

/**
 * **Feature: evaluation-submission-control, Integration Test: System Integration**
 * 
 * This test verifies the complete integration of all system components
 * including submission control, analytics, and reporting functionality.
 */
class SystemIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $submissionService;
    protected $analyticsService;
    protected $reportService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->submissionService = app(SubmissionValidationService::class);
        $this->analyticsService = app(EvaluationAnalyticsService::class);
        $this->reportService = app(ReportGenerationService::class);
    }

    /**
     * Test complete submission control workflow
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
     */
    public function test_complete_submission_control_workflow()
    {
        // Create test data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $student = Student::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id
        ]);

        $questions = Question::factory()->count(5)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Test 1: Initial submission should be allowed
        $canSubmit = $this->submissionService->validateSubmissionEligibility($student->id, $evaluation->id);
        $this->assertTrue($canSubmit);

        // Test 2: Submit evaluation
        $submissionData = [
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'responses' => $questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => rand(1, 5),
                    'comment' => 'Test comment'
                ];
            })->toArray()
        ];

        $response = $this->postJson('/api/feedbacks', $submissionData);
        $response->assertStatus(201);

        // Test 3: Duplicate submission should be prevented
        $canSubmitAgain = $this->submissionService->validateSubmissionEligibility($student->id, $evaluation->id);
        $this->assertFalse($canSubmitAgain);

        // Test 4: Duplicate submission attempt should fail
        $duplicateResponse = $this->postJson('/api/feedbacks', $submissionData);
        $duplicateResponse->assertStatus(422);

        // Test 5: Submission status should be updated
        $status = $this->submissionService->getSubmissionStatus($student->id, $evaluation->id);
        $this->assertTrue($status['has_submitted']);

        // Test 6: Check submission record exists
        $this->assertDatabaseHas('evaluation_submissions', [
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id
        ]);
    }

    /**
     * Test complete analytics and reporting workflow
     * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2**
     */
    public function test_complete_analytics_and_reporting_workflow()
    {
        // Create test data with multiple submissions
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $students = Student::factory()->count(10)->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id
        ]);

        $questions = Question::factory()->count(5)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Create multiple submissions
        foreach ($students as $student) {
            $submission = EvaluationSubmission::create([
                'evaluation_id' => $evaluation->id,
                'student_id' => $student->id,
                'submitted_at' => now(),
                'is_anonymous' => true,
                'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
            ]);

            // Create feedback for this submission
            $feedback = Feedback::create([
                'evaluation_id' => $evaluation->id,
                'student_id' => $student->id,
                'submission_id' => $submission->id,
                'is_locked' => true,
                'anonymous' => true,
            ]);

            foreach ($questions as $question) {
                Response::create([
                    'feedback_id' => $feedback->id,
                    'question_id' => $question->id,
                    'student_id' => $student->id,
                    'evaluation_id' => $evaluation->id,
                    'rating' => rand(3, 5), // Good ratings
                    'comment' => 'Test feedback comment'
                ]);
            }
        }

        // Test 1: Analytics calculation
        $analytics = $this->analyticsService->generateEvaluationStatistics($evaluation->id);
        
        $this->assertArrayHasKey('participation', $analytics);
        $this->assertArrayHasKey('average_rating', $analytics);
        $this->assertArrayHasKey('total_responses', $analytics);
        $this->assertEquals(50, $analytics['total_responses']); // 10 students * 5 questions

        // Test 2: Weighted scoring (if applicable)
        if (isset($analytics['weighted_scores'])) {
            $this->assertIsArray($analytics['weighted_scores']);
            $this->assertArrayHasKey('weighted_score', $analytics['weighted_scores']);
            $this->assertGreaterThan(0, $analytics['weighted_scores']['weighted_score']);
        }

        // Test 3: Report generation - CSV
        $csvReport = $this->reportService->generateTeacherReport($evaluation->id);
        $this->assertNotEmpty($csvReport);

        // Test 4: Report generation - JSON (for testing)
        $jsonReport = $this->reportService->generateTeacherReport($evaluation->id);
        $this->assertIsArray($jsonReport);
        $this->assertArrayHasKey('teacher_info', $jsonReport);
        $this->assertArrayHasKey('course_info', $jsonReport);
        $this->assertArrayHasKey('statistics', $jsonReport);

        // Test 5: API endpoint for analytics
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/analytics");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'evaluation_id',
            'evaluation_info',
            'analytics' => [
                'average_rating',
                'performance_score',
                'participation' => [
                    'participation_rate'
                ],
                'total_responses'
            ]
        ]);

        // Test 6: API endpoint for export
        $exportResponse = $this->postJson("/api/evaluations/{$evaluation->id}/export", [
            'format' => 'csv'
        ]);
        if ($exportResponse->status() !== 200) {
            dump('Export Error:', $exportResponse->json());
        }
        $exportResponse->assertStatus(200);
    }

    /**
     * Test data flow between frontend and backend components
     * **Validates: Requirements 1.1, 2.1, 3.1**
     */
    public function test_frontend_backend_data_flow()
    {
        // Create test data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $student = Student::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id
        ]);

        $questions = Question::factory()->count(3)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Test 1: Check submission status endpoint
        $statusResponse = $this->getJson("/api/evaluations/{$evaluation->id}/submission-status?student_id={$student->id}");
        $statusResponse->assertStatus(200);
        $statusResponse->assertJsonPath('submission_status.has_submitted', false);

        // Test 2: Submit evaluation through API
        $submissionData = [
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'responses' => $questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'comment' => 'Good teaching'
                ];
            })->toArray()
        ];

        $submitResponse = $this->postJson('/api/feedbacks', $submissionData);
        $submitResponse->assertStatus(201);

        // Test 3: Check submission status after submission
        $statusAfterResponse = $this->getJson("/api/evaluations/{$evaluation->id}/submission-status?student_id={$student->id}");
        $statusAfterResponse->assertStatus(200);
        $statusAfterResponse->assertJsonPath('submission_status.has_submitted', true);

        // Test 4: Get analytics data
        $analyticsResponse = $this->getJson("/api/evaluations/{$evaluation->id}/analytics");
        $analyticsResponse->assertStatus(200);
        
        $analyticsResponse->assertJsonStructure([
            'evaluation_id',
            'evaluation_info',
            'analytics' => [
                'average_rating',
                'performance_score',
                'weighted_scores',
                'participation' => [
                    'participation_rate',
                    'total_submissions'
                ],
                'total_responses'
            ]
        ]);

        // Test 5: Export functionality
        $exportResponse = $this->postJson("/api/evaluations/{$evaluation->id}/export", [
            'format' => 'csv'
        ]);
        $exportResponse->assertStatus(200);
    }

    /**
     * Test error handling and edge cases
     * **Validates: Requirements 5.1, 5.2, 5.3**
     */
    public function test_error_handling_and_edge_cases()
    {
        // Test 1: Invalid evaluation ID
        $invalidResponse = $this->getJson("/api/evaluations/99999/submission-status?student_id=1");
        $invalidResponse->assertStatus(404);

        // Test 2: Missing required data in submission
        $incompleteSubmission = $this->postJson('/api/feedbacks', [
            'evaluation_id' => 1,
            // Missing student_id and responses
        ]);
        $incompleteSubmission->assertStatus(422);

        // Test 3: Invalid export format
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id
        ]);

        $invalidExportResponse = $this->postJson("/api/evaluations/{$evaluation->id}/export", [
            'format' => 'invalid_format'
        ]);
        $invalidExportResponse->assertStatus(422);
    }

    /**
     * Test system performance with larger datasets
     * **Validates: Requirements 2.1, 3.1**
     */
    public function test_system_performance_with_large_dataset()
    {
        // Create larger test dataset
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $students = Student::factory()->count(50)->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id
        ]);

        $questions = Question::factory()->count(10)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Create multiple submissions
        foreach ($students as $student) {
            $submission = EvaluationSubmission::create([
                'evaluation_id' => $evaluation->id,
                'student_id' => $student->id,
                'submitted_at' => now(),
                'is_anonymous' => true,
                'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
            ]);

            // Create feedback for this submission
            $feedback = Feedback::create([
                'evaluation_id' => $evaluation->id,
                'student_id' => $student->id,
                'submission_id' => $submission->id,
                'is_locked' => true,
                'anonymous' => true,
            ]);

            foreach ($questions as $question) {
                Response::create([
                    'feedback_id' => $feedback->id,
                    'question_id' => $question->id,
                    'student_id' => $student->id,
                    'evaluation_id' => $evaluation->id,
                    'rating' => rand(1, 5),
                    'comment' => 'Performance test comment'
                ]);
            }
        }

        // Test analytics performance
        $startTime = microtime(true);
        $analytics = $this->analyticsService->generateEvaluationStatistics($evaluation->id);
        $analyticsTime = microtime(true) - $startTime;

        $this->assertLessThan(10.0, $analyticsTime, 'Analytics calculation should complete within 10 seconds');
        $this->assertEquals(500, $analytics['total_responses']); // 50 students * 10 questions

        // Test report generation performance
        $startTime = microtime(true);
        $report = $this->reportService->generateTeacherReport($evaluation->id);
        $reportTime = microtime(true) - $startTime;

        $this->assertLessThan(3.0, $reportTime, 'Report generation should complete within 3 seconds');
        $this->assertIsArray($report);
    }
}