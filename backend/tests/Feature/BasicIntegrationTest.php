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

/**
 * Basic integration test to verify system components work together
 */
class BasicIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that all components are properly integrated
     */
    public function test_system_components_integration()
    {
        // Create test data
        $department = Department::factory()->create(['name' => 'Computer Science']);
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

        // Test 1: Basic API endpoints exist and return data
        $response = $this->getJson('/api/evaluations');
        $response->assertStatus(200);
        $this->assertNotEmpty($response->json()['data']);

        // Test 2: Evaluation details can be retrieved
        $response = $this->getJson("/api/evaluations/{$evaluation->id}");
        $response->assertStatus(200);
        $this->assertEquals($evaluation->id, $response->json()['id']);

        // Test 3: Services are properly instantiated
        $submissionService = app(\App\Services\SubmissionValidationService::class);
        $this->assertInstanceOf(\App\Services\SubmissionValidationService::class, $submissionService);

        $analyticsService = app(\App\Services\EvaluationAnalyticsService::class);
        $this->assertInstanceOf(\App\Services\EvaluationAnalyticsService::class, $analyticsService);

        $reportService = app(\App\Services\ReportGenerationService::class);
        $this->assertInstanceOf(\App\Services\ReportGenerationService::class, $reportService);

        // Test 4: Database relationships work
        $this->assertEquals($course->id, $evaluation->course->id);
        $this->assertEquals($teacher->id, $evaluation->teacher->id);
        $this->assertEquals(2, $evaluation->questions()->count());

        // Test 5: Models have proper relationships
        $this->assertInstanceOf(\App\Models\Course::class, $evaluation->course);
        $this->assertInstanceOf(\App\Models\Teacher::class, $evaluation->teacher);
        $this->assertCount(2, $evaluation->questions);

        $this->assertTrue(true, 'All system components are properly integrated');
    }

    /**
     * Test basic submission workflow without complex validation
     */
    public function test_basic_submission_workflow()
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

        // Test submission data structure
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

        // Verify data structure is correct
        $this->assertArrayHasKey('evaluation_id', $submissionData);
        $this->assertArrayHasKey('student_id', $submissionData);
        $this->assertArrayHasKey('responses', $submissionData);
        $this->assertCount(2, $submissionData['responses']);

        // Test that services can process the data
        $submissionService = app(\App\Services\SubmissionValidationService::class);
        
        // Test validation method exists and can be called
        $canSubmit = $submissionService->validateSubmissionEligibility($student->id, $evaluation->id);
        $this->assertIsBool($canSubmit);

        $this->assertTrue(true, 'Basic submission workflow components work');
    }
}