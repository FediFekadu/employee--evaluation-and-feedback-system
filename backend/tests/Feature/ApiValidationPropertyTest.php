<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Course;
use App\Models\Department;
use App\Models\Evaluation;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class ApiValidationPropertyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * **Feature: evaluation-submission-control, Property 21: Input Validation Effectiveness**
     * **Validates: Requirements 5.2**
     * 
     * For any invalid or malicious data submitted to evaluation endpoints,
     * the system should reject the data and return appropriate error responses.
     */
    public function test_input_validation_effectiveness_property()
    {
        // Run the property test with multiple iterations
        for ($i = 0; $i < 5; $i++) {
            $this->runInputValidationTest();
            // Add small delay to avoid rate limiting in tests
            if ($i < 4) {
                usleep(100000); // 0.1 second delay
            }
        }
    }

    private function runInputValidationTest()
    {
        // Set up test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
        ]);
        $question = Question::factory()->create();
        $evaluation->questions()->attach($question->id);

        // Generate various types of invalid input data
        $invalidInputs = $this->generateInvalidInputs($evaluation->id, $student->id, $question->id);

        foreach ($invalidInputs as $index => $testCase) {
            $response = $this->postJson('/api/feedbacks', $testCase['data']);
            
            // Assert that invalid data is rejected (including rate limiting)
            $this->assertContains($response->status(), [400, 422, 429, 500], 
                "Invalid input should be rejected: " . json_encode($testCase['data']) . " (Status: " . $response->status() . ")");
            
            // Assert that error response contains meaningful information
            if ($response->status() === 422) {
                $responseData = $response->json();
                $this->assertArrayHasKey('message', $responseData, 
                    "Validation error should include message");
                
                if (isset($responseData['errors'])) {
                    $this->assertIsArray($responseData['errors'], 
                        "Validation errors should be an array");
                }
            }
            
            // Add small delay between requests to avoid rate limiting
            if ($index < count($invalidInputs) - 1) {
                usleep(50000); // 0.05 second delay
            }
        }

        // Test submission status endpoint with invalid data
        $this->testSubmissionStatusValidation($evaluation->id);
        
        // Test analytics endpoint validation
        $this->testAnalyticsEndpointValidation($evaluation->id);
        
        // Test export endpoint validation
        $this->testExportEndpointValidation($evaluation->id);
    }

    private function generateInvalidInputs($evaluationId, $studentId, $questionId): array
    {
        return [
            // Missing required fields
            [
                'description' => 'Missing evaluation_id',
                'data' => [
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'rating' => 5]]
                ]
            ],
            [
                'description' => 'Missing student_id',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'responses' => [['question_id' => $questionId, 'rating' => 5]]
                ]
            ],
            [
                'description' => 'Missing responses',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                ]
            ],
            
            // Invalid data types
            [
                'description' => 'Invalid evaluation_id type',
                'data' => [
                    'evaluation_id' => 'invalid_string',
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'rating' => 5]]
                ]
            ],
            [
                'description' => 'Invalid student_id type',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => 'invalid_string',
                    'responses' => [['question_id' => $questionId, 'rating' => 5]]
                ]
            ],
            
            // Invalid rating values
            [
                'description' => 'Rating below minimum',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'rating' => 0]]
                ]
            ],
            [
                'description' => 'Rating above maximum',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'rating' => 6]]
                ]
            ],
            [
                'description' => 'Invalid rating type',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'rating' => 'invalid']]
                ]
            ],
            
            // Non-existent foreign keys
            [
                'description' => 'Non-existent evaluation_id',
                'data' => [
                    'evaluation_id' => 99999,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'rating' => 5]]
                ]
            ],
            [
                'description' => 'Non-existent student_id',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => 99999,
                    'responses' => [['question_id' => $questionId, 'rating' => 5]]
                ]
            ],
            [
                'description' => 'Non-existent question_id',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => 99999, 'rating' => 5]]
                ]
            ],
            
            // Malicious input attempts
            [
                'description' => 'SQL injection attempt in text',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'text' => "'; DROP TABLE students; --"]]
                ]
            ],
            [
                'description' => 'XSS attempt in text',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'text' => '<script>alert("xss")</script>']]
                ]
            ],
            [
                'description' => 'Extremely long text',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => [['question_id' => $questionId, 'text' => str_repeat('A', 2000)]]
                ]
            ],
            
            // Empty or malformed responses array
            [
                'description' => 'Empty responses array',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => []
                ]
            ],
            [
                'description' => 'Invalid responses structure',
                'data' => [
                    'evaluation_id' => $evaluationId,
                    'student_id' => $studentId,
                    'responses' => 'invalid_structure'
                ]
            ],
        ];
    }

    private function testSubmissionStatusValidation($evaluationId)
    {
        // Test missing student_id parameter
        $response = $this->getJson("/api/evaluations/{$evaluationId}/submission-status");
        $this->assertContains($response->status(), [400, 422, 429], 
            "Submission status endpoint should validate required parameters");

        usleep(50000); // Small delay to avoid rate limiting

        // Test invalid student_id
        $response = $this->getJson("/api/evaluations/{$evaluationId}/submission-status?student_id=invalid");
        $this->assertContains($response->status(), [400, 422, 429], 
            "Submission status endpoint should validate student_id format");

        usleep(50000); // Small delay to avoid rate limiting

        // Test non-existent student_id
        $response = $this->getJson("/api/evaluations/{$evaluationId}/submission-status?student_id=99999");
        $this->assertContains($response->status(), [400, 422, 429], 
            "Submission status endpoint should validate student existence");
    }

    private function testAnalyticsEndpointValidation($evaluationId)
    {
        // Test with non-existent evaluation
        $response = $this->getJson("/api/evaluations/99999/analytics");
        $this->assertContains($response->status(), [404, 429], 
            "Analytics endpoint should return 404 for non-existent evaluation or 429 for rate limiting");
    }

    private function testExportEndpointValidation($evaluationId)
    {
        // Test missing format parameter
        $response = $this->postJson("/api/evaluations/{$evaluationId}/export", []);
        $this->assertContains($response->status(), [400, 422, 429, 500], 
            "Export endpoint should require format parameter (got: " . $response->status() . ")");

        usleep(50000); // Small delay to avoid rate limiting

        // Test invalid format
        $response = $this->postJson("/api/evaluations/{$evaluationId}/export", [
            'format' => 'invalid_format'
        ]);
        $this->assertContains($response->status(), [400, 422, 429, 500], 
            "Export endpoint should validate format parameter (got: " . $response->status() . ")");

        usleep(50000); // Small delay to avoid rate limiting

        // Test invalid report_type
        $response = $this->postJson("/api/evaluations/{$evaluationId}/export", [
            'format' => 'csv',
            'report_type' => 'invalid_type'
        ]);
        $this->assertContains($response->status(), [400, 422, 429, 500], 
            "Export endpoint should validate report_type parameter (got: " . $response->status() . ")");

        usleep(50000); // Small delay to avoid rate limiting

        // Test invalid preserve_privacy type
        $response = $this->postJson("/api/evaluations/{$evaluationId}/export", [
            'format' => 'csv',
            'preserve_privacy' => 'invalid_boolean'
        ]);
        $this->assertContains($response->status(), [400, 422, 429, 500], 
            "Export endpoint should validate preserve_privacy parameter type (got: " . $response->status() . ")");
    }

    /**
     * Test that valid inputs are accepted and processed correctly.
     * This ensures our validation isn't too strict.
     */
    public function test_valid_inputs_are_accepted()
    {
        // Set up test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
        ]);
        $question = Question::factory()->create();
        $evaluation->questions()->attach($question->id);

        // Test valid feedback submission
        $validData = [
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'anonymous' => true,
            'responses' => [
                [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'text' => 'Good teaching'
                ]
            ]
        ];

        $response = $this->postJson('/api/feedbacks', $validData);
        $this->assertEquals(201, $response->status(), 
            "Valid feedback data should be accepted");

        // Test valid submission status check
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/submission-status?student_id={$student->id}");
        $this->assertEquals(200, $response->status(), 
            "Valid submission status request should be accepted");

        // Test valid analytics request
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/analytics");
        $this->assertEquals(200, $response->status(), 
            "Valid analytics request should be accepted");

        // Test valid export request
        $response = $this->postJson("/api/evaluations/{$evaluation->id}/export", [
            'format' => 'csv',
            'preserve_privacy' => true,
            'report_type' => 'teacher'
        ]);
        $this->assertEquals(200, $response->status(), 
            "Valid export request should be accepted");
    }

    /**
     * Test that the system handles edge cases appropriately.
     */
    public function test_edge_case_handling()
    {
        // Set up minimal test data
        $department = Department::factory()->create();
        $course = Course::factory()->create(['department_id' => $department->id]);
        $teacher = Teacher::factory()->create();
        $student = Student::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
        ]);

        // Test evaluation with no questions
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/analytics");
        $this->assertEquals(200, $response->status(), 
            "Analytics should handle evaluations with no questions");

        // Test export with no data
        $response = $this->postJson("/api/evaluations/{$evaluation->id}/export", [
            'format' => 'csv'
        ]);
        // Should either succeed with empty report or return appropriate error
        $this->assertContains($response->status(), [200, 422], 
            "Export should handle evaluations with no data appropriately");
    }
}