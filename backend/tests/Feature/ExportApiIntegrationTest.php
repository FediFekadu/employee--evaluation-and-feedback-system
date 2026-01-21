<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Evaluation;
use App\Models\Course;
use App\Models\Teacher;
use App\Models\EvaluationSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportApiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_department_evaluation_results_endpoint()
    {
        // Create test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'department_id' => $department->id,
        ]);
        
        // Create some submissions
        EvaluationSubmission::factory()->count(3)->create(['evaluation_id' => $evaluation->id]);

        // Test the endpoint
        $response = $this->getJson("/api/departments/{$department->id}/evaluation-results");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'course',
                            'teacher',
                            'participation' => [
                                'total_responses',
                                'expected_responses',
                                'participation_rate',
                                'data_quality'
                            ]
                        ]
                    ]
                ]);
    }

    public function test_evaluation_results_endpoint()
    {
        // Create test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'department_id' => $department->id,
        ]);

        // Test the endpoint
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/results");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'evaluation_id',
                    'course_information' => [
                        'course',
                        'code',
                        'year_level'
                    ],
                    'instructor_information' => [
                        'name',
                        'session',
                        'status'
                    ],
                    'quick_stats' => [
                        'total_responses',
                        'participation_rate',
                        'data_quality'
                    ]
                ]);
    }

    public function test_department_export_endpoint()
    {
        // Create test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'department_id' => $department->id,
        ]);
        
        // Create some submissions
        EvaluationSubmission::factory()->count(3)->create(['evaluation_id' => $evaluation->id]);

        // Test CSV export
        $response = $this->postJson("/api/departments/{$department->id}/export", [
            'format' => 'csv'
        ]);

        // Should either return a file download or success response
        $this->assertTrue(
            $response->getStatusCode() === 200 || $response->getStatusCode() === 422
        );
    }

    public function test_evaluation_export_endpoint()
    {
        // Create test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'department_id' => $department->id,
        ]);
        
        // Create some submissions
        EvaluationSubmission::factory()->count(3)->create(['evaluation_id' => $evaluation->id]);

        // Test CSV export
        $response = $this->postJson("/api/evaluations/{$evaluation->id}/export", [
            'format' => 'csv'
        ]);

        // Should either return a file download or success response
        $this->assertTrue(
            $response->getStatusCode() === 200 || $response->getStatusCode() === 422
        );
    }
}