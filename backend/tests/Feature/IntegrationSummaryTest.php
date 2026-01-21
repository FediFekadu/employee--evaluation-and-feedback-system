<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Department;
use App\Models\Course;
use App\Models\Evaluation;
use App\Models\Question;
use App\Models\EvaluationSubmission;
use App\Models\Response;

/**
 * Integration summary test to verify all major system components work together
 * **Feature: evaluation-submission-control, Integration Summary**
 */
class IntegrationSummaryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test complete system integration
     * **Validates: All Requirements**
     */
    public function test_complete_system_integration()
    {
        // 1. COMPONENT INTEGRATION TEST
        $this->assertTrue($this->testComponentIntegration(), 'All components are properly integrated');

        // 2. DATA FLOW TEST
        $this->assertTrue($this->testDataFlow(), 'Data flows correctly between components');

        // 3. API INTEGRATION TEST
        $this->assertTrue($this->testApiIntegration(), 'API endpoints are properly integrated');

        // 4. SERVICE INTEGRATION TEST
        $this->assertTrue($this->testServiceIntegration(), 'Services work together correctly');

        // 5. DATABASE INTEGRATION TEST
        $this->assertTrue($this->testDatabaseIntegration(), 'Database relationships work correctly');
    }

    private function testComponentIntegration(): bool
    {
        // Test that all major components can be instantiated
        $services = [
            \App\Services\SubmissionValidationService::class,
            \App\Services\EvaluationAnalyticsService::class,
            \App\Services\ReportGenerationService::class,
            \App\Services\AuditLogService::class,
            \App\Services\NotificationService::class,
        ];

        foreach ($services as $serviceClass) {
            $service = app($serviceClass);
            if (!is_object($service)) {
                return false;
            }
        }

        return true;
    }

    private function testDataFlow(): bool
    {
        // Create test data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $student = Student::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'opened_at' => now()->subDays(5),
            'closed_at' => now()->addDays(10)
        ]);

        $questions = Question::factory()->count(2)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Test data relationships
        return $evaluation->course->id === $course->id &&
               $evaluation->teacher->id === $teacher->id &&
               $evaluation->questions()->count() === 2;
    }

    private function testApiIntegration(): bool
    {
        // Create test data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'opened_at' => now()->subDays(5),
            'closed_at' => now()->addDays(10)
        ]);

        // Test API endpoints
        $response = $this->getJson('/api/evaluations');
        if ($response->status() !== 200) {
            return false;
        }

        $response = $this->getJson("/api/evaluations/{$evaluation->id}");
        if ($response->status() !== 200) {
            return false;
        }

        return true;
    }

    private function testServiceIntegration(): bool
    {
        // Create test data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $student = Student::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'opened_at' => now()->subDays(5),
            'closed_at' => now()->addDays(10)
        ]);

        // Test services work together
        $submissionService = app(\App\Services\SubmissionValidationService::class);
        $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);

        try {
            $canSubmit = $submissionService->validateSubmissionEligibility($student->id, $evaluation->id);
            $analytics = $analyticsService->generateEvaluationStatistics($evaluation->id);
            
            return is_bool($canSubmit) && is_array($analytics);
        } catch (\Exception $e) {
            return false;
        }
    }

    private function testDatabaseIntegration(): bool
    {
        // Create test data with relationships
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $student = Student::factory()->create(['department_id' => $department->id]);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'opened_at' => now()->subDays(5),
            'closed_at' => now()->addDays(10)
        ]);

        $questions = Question::factory()->count(2)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Create submission
        $submission = EvaluationSubmission::create([
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'submitted_at' => now(),
            'is_anonymous' => true,
            'submission_hash' => hash('sha256', $evaluation->id . $student->id . now()->timestamp)
        ]);

        // Create feedback first
        $feedback = \App\Models\Feedback::create([
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'anonymous' => true
        ]);

        // Create responses
        foreach ($questions as $question) {
            \App\Models\Response::create([
                'feedback_id' => $feedback->id,
                'question_id' => $question->id,
                'rating' => 4,
                'text' => 'Test response'
            ]);
        }

        // Test all relationships work
        return $evaluation->submissions()->count() === 1 &&
               $evaluation->course->department->id === $department->id &&
               $evaluation->teacher->department->id === $department->id &&
               $evaluation->feedbacks()->count() === 1;
    }
}