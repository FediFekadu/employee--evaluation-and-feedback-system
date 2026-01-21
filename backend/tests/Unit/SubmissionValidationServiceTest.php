<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\SubmissionValidationService;
use App\Models\EvaluationSubmission;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\Department;
use App\Models\Course;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Faker\Factory as Faker;

class SubmissionValidationServiceTest extends TestCase
{
    use RefreshDatabase;

    private SubmissionValidationService $service;
    private $faker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SubmissionValidationService();
        $this->faker = Faker::create();
    }

    /**
     * **Feature: evaluation-submission-control, Property 1: Duplicate Submission Prevention**
     * For any student and evaluation combination, attempting to submit an evaluation 
     * that has already been submitted should be rejected by the system
     * **Validates: Requirements 1.1, 1.4**
     */
    public function test_duplicate_submission_prevention_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique codes
            $department = Department::factory()->create([
                'code' => 'DEPT' . $i . '_' . $this->faker->unique()->randomNumber(4)
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            $student = Student::factory()->create(['department_id' => $department->id]);
            
            $evaluation = Evaluation::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher->id,
                'academic_year' => $this->faker->year(),
                'semester' => $this->faker->numberBetween(1, 2),
                'year_level' => $this->faker->numberBetween(1, 4),
                'opened_at' => now()->subDays(10),
                'closed_at' => now()->addDays(10),
            ]);

            // Property: First submission should be allowed
            $this->assertTrue(
                $this->service->validateSubmissionEligibility($student->id, $evaluation->id),
                "First submission should be eligible for student {$student->id} and evaluation {$evaluation->id}"
            );

            // Create the first submission
            $this->service->markSubmissionComplete($student->id, $evaluation->id);

            // Property: Second submission should be rejected
            $this->assertFalse(
                $this->service->validateSubmissionEligibility($student->id, $evaluation->id),
                "Duplicate submission should be rejected for student {$student->id} and evaluation {$evaluation->id}"
            );

            // Property: Attempting to mark as complete again should throw exception
            try {
                $this->service->markSubmissionComplete($student->id, $evaluation->id);
                $this->fail("Expected exception was not thrown for duplicate submission");
            } catch (\Exception $e) {
                $this->assertEquals('Duplicate submission detected: Student has already submitted for this evaluation', $e->getMessage(),
                    "Exception message should indicate duplicate submission for student {$student->id}");
            }
        }
    }

    /**
     * **Feature: evaluation-submission-control, Property 4: Immediate Status Update**
     * For any successful evaluation submission, the system should immediately 
     * update the evaluation status to prevent further submissions
     * **Validates: Requirements 1.5**
     */
    public function test_immediate_status_update_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random test data with unique codes
            $department = Department::factory()->create([
                'code' => 'DEPT' . $i . '_' . $this->faker->unique()->randomNumber(4)
            ]);
            $course = Course::factory()->create(['department_id' => $department->id]);
            $teacher = Teacher::factory()->create(['department_id' => $department->id]);
            $student = Student::factory()->create(['department_id' => $department->id]);
            
            $evaluation = Evaluation::create([
                'course_id' => $course->id,
                'teacher_id' => $teacher->id,
                'academic_year' => $this->faker->year(),
                'semester' => $this->faker->numberBetween(1, 2),
                'year_level' => $this->faker->numberBetween(1, 4),
                'opened_at' => now()->subDays(10),
                'closed_at' => now()->addDays(10),
            ]);

            // Property: Before submission, status should show not submitted
            $statusBefore = $this->service->getSubmissionStatus($student->id, $evaluation->id);
            $this->assertFalse($statusBefore['has_submitted'], 
                "Status should show not submitted before submission for student {$student->id}");

            // Mark submission as complete
            $submission = $this->service->markSubmissionComplete($student->id, $evaluation->id);

            // Property: After submission, status should immediately show submitted
            $statusAfter = $this->service->getSubmissionStatus($student->id, $evaluation->id);
            $this->assertTrue($statusAfter['has_submitted'], 
                "Status should immediately show submitted after submission for student {$student->id}");
            $this->assertEquals($submission->id, $statusAfter['submission_id'],
                "Status should include correct submission ID");
            $this->assertNotNull($statusAfter['submitted_at'],
                "Status should include submission timestamp");

            // Property: Eligibility should immediately be false after submission
            $this->assertFalse(
                $this->service->validateSubmissionEligibility($student->id, $evaluation->id),
                "Eligibility should immediately be false after submission for student {$student->id}"
            );
        }
    }
}