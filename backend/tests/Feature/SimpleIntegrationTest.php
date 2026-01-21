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

/**
 * Simple integration test to verify basic system functionality
 */
class SimpleIntegrationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test basic system integration
     */
    public function test_basic_system_integration()
    {
        // Create basic test data
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

        $questions = Question::factory()->count(3)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Create a submission and feedback for the export test
        $submission = EvaluationSubmission::create([
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'submitted_at' => now(),
            'is_anonymous' => true,
            'submission_hash' => hash('sha256', $student->id . $evaluation->id . time()),
        ]);

        Feedback::create([
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'submission_id' => $submission->id,
            'is_locked' => true,
            'anonymous' => true,
        ]);

        // Test 1: Basic API endpoints exist
        $response = $this->getJson('/api/evaluations');
        $response->assertStatus(200);

        // Test 2: Evaluation details can be retrieved
        $response = $this->getJson("/api/evaluations/{$evaluation->id}");
        $response->assertStatus(200);

        // Test 3: Submission status endpoint works
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/submission-status?student_id={$student->id}");
        if ($response->status() !== 200) {
            dump($response->json()); // Debug the response
        }
        $response->assertStatus(200);
        $response->assertJsonStructure(['submission_status', 'evaluation_id', 'student_id']);

        // Test 4: Analytics endpoint works
        $response = $this->getJson("/api/evaluations/{$evaluation->id}/analytics");
        $response->assertStatus(200);

        // Test 5: Export endpoint works
        $response = $this->postJson("/api/evaluations/{$evaluation->id}/export", ['format' => 'csv']);
        $response->assertStatus(200);

        $this->assertTrue(true, 'Basic integration test passed');
    }

    /**
     * Test submission workflow
     */
    public function test_submission_workflow()
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

        // Test submission
        $submissionData = [
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id,
            'responses' => $questions->map(function ($question) {
                return [
                    'question_id' => $question->id,
                    'rating' => 4,
                    'comment' => 'Good'
                ];
            })->toArray()
        ];

        $response = $this->postJson('/api/feedbacks', $submissionData);
        $response->assertStatus(201);

        // Verify submission was recorded
        $this->assertDatabaseHas('evaluation_submissions', [
            'evaluation_id' => $evaluation->id,
            'student_id' => $student->id
        ]);

        $this->assertTrue(true, 'Submission workflow test passed');
    }
}