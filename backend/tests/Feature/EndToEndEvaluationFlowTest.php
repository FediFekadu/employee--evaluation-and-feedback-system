<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use App\Models\User;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Department;
use App\Models\Course;
use App\Models\Evaluation;
use App\Models\Question;
use App\Events\EvaluationCreated;
use App\Events\EvaluationUpdated;
use App\Events\EvaluationClosed;
use App\Events\EvaluationNotification;
use App\Services\RealTimeSyncService;

/**
 * **Feature: evaluation-realtime-sync, Integration Test: End-to-End Evaluation Flow**
 * 
 * This test verifies the complete end-to-end flow of evaluation creation,
 * updates, and closure with real-time broadcasting to students.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.2**
 */
class EndToEndEvaluationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected $realTimeSyncService;
    protected $department;
    protected $teacher;
    protected $course;
    protected $student;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->realTimeSyncService = app(RealTimeSyncService::class);
        
        // Create test data
        $this->department = Department::factory()->create(['name' => 'Computer Science']);
        $this->teacher = Teacher::factory()->create(['department_id' => $this->department->id]);
        $this->course = Course::factory()->create(['department_id' => $this->department->id]);
        $this->student = Student::factory()->create(['department_id' => $this->department->id]);
    }

    /**
     * Test complete evaluation creation to student notification flow
     * **Validates: Requirements 1.1**
     */
    public function test_evaluation_creation_broadcasting_flow()
    {
        // Fake events to capture broadcasts
        Event::fake([EvaluationCreated::class]);

        // Step 1: Department admin creates evaluation via API
        $evaluationData = [
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'academic_year' => '2024-2025',
            'semester' => 'First',
            'year_level' => 3,
            'opened_at' => now()->subDays(1)->toDateTimeString(),
            'closed_at' => now()->addDays(7)->toDateTimeString()
        ];

        $response = $this->postJson('/api/evaluations', $evaluationData);
        $response->assertStatus(201);

        $evaluation = Evaluation::latest()->first();
        $this->assertNotNull($evaluation);

        // Step 2: Verify event was dispatched with correct data
        Event::assertDispatched(EvaluationCreated::class, function ($event) use ($evaluation) {
            return $event->evaluation->id === $evaluation->id &&
                   $event->departmentId === $this->department->id;
        });

        // Step 3: Test direct service broadcasting
        $this->realTimeSyncService->broadcastEvaluationCreated($evaluation);

        // Step 4: Verify student can see the evaluation via API
        $studentResponse = $this->getJson("/api/evaluations?department_id={$this->department->id}");
        $studentResponse->assertStatus(200);
        
        $evaluations = $studentResponse->json('data');
        $this->assertCount(1, $evaluations);
        $this->assertEquals($evaluation->id, $evaluations[0]['id']);

        // Step 5: Verify evaluation appears in student's evaluation list
        $this->assertDatabaseHas('evaluations', [
            'id' => $evaluation->id,
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => $evaluation->opened_at
        ]);
    }

    /**
     * Test evaluation update propagation flow
     * **Validates: Requirements 1.2, 1.3**
     */
    public function test_evaluation_update_propagation_flow()
    {
        // Create initial evaluation
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now(),
            'closed_at' => now()->addDays(7)
        ]);

        // Add questions to evaluation
        $questions = Question::factory()->count(3)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        Event::fake([EvaluationUpdated::class]);

        // Step 1: Update evaluation details
        $updateData = [
            'academic_year' => '2024-2025 Updated',
            'semester' => 'Second',
            'closed_at' => now()->addDays(14)->toDateTimeString()
        ];

        $response = $this->putJson("/api/evaluations/{$evaluation->id}", $updateData);
        $response->assertStatus(200);

        // Step 2: Verify event was dispatched
        Event::assertDispatched(EvaluationUpdated::class, function ($event) use ($evaluation) {
            return $event->evaluation->id === $evaluation->id &&
                   $event->departmentId === $this->department->id;
        });

        // Step 3: Test question updates
        $newQuestion = Question::factory()->create();
        $evaluation->questions()->attach($newQuestion->id);

        // Simulate question update broadcast
        $changes = ['questions_updated' => true, 'new_question_count' => 4];
        $this->realTimeSyncService->broadcastEvaluationUpdated($evaluation->fresh(), $changes);

        // Step 4: Verify updated data is available to students
        $studentResponse = $this->getJson("/api/evaluations/{$evaluation->id}");
        $studentResponse->assertStatus(200);
        
        $evaluationData = $studentResponse->json();
        $this->assertEquals('2024-2025 Updated', $evaluationData['academic_year']);
        $this->assertEquals('Second', $evaluationData['semester']);
        $this->assertEquals(4, count($evaluationData['questions'] ?? []));

        // Step 5: Verify database reflects changes
        $this->assertDatabaseHas('evaluations', [
            'id' => $evaluation->id,
            'academic_year' => '2024-2025 Updated',
            'semester' => 'Second'
        ]);
    }

    /**
     * Test evaluation closure notification flow
     * **Validates: Requirements 1.4, 4.2**
     */
    public function test_evaluation_closure_notification_flow()
    {
        // Create active evaluation
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(3),
            'closed_at' => now()->addDays(4)
        ]);

        Event::fake([EvaluationClosed::class, EvaluationNotification::class]);

        // Step 1: Close evaluation via API
        $response = $this->postJson("/api/evaluations/{$evaluation->id}/close");
        $response->assertStatus(200);

        // Step 2: Verify closure event was dispatched
        Event::assertDispatched(EvaluationClosed::class, function ($event) use ($evaluation) {
            return $event->evaluationId === $evaluation->id &&
                   $event->departmentId === $this->department->id;
        });

        // Step 3: Verify notification event was dispatched
        Event::assertDispatched(EvaluationNotification::class, function ($event) use ($evaluation) {
            return $event->evaluationId === $evaluation->id &&
                   $event->type === 'closed' &&
                   $event->departmentId === $this->department->id;
        });

        // Step 4: Test direct service broadcasting
        $closedAt = now()->toISOString();
        $this->realTimeSyncService->broadcastEvaluationClosed(
            $evaluation->id, 
            $closedAt, 
            $this->department->id
        );

        // Step 5: Broadcast closure notification
        $this->realTimeSyncService->broadcastNotification(
            "Evaluation for {$this->course->name} has been closed",
            'closed',
            $evaluation->id,
            $this->department->id
        );

        // Step 6: Verify evaluation status is updated
        $evaluation->refresh();
        $this->assertNotNull($evaluation->closed_at);
        $this->assertTrue($evaluation->closed_at->isPast());

        // Step 7: Verify students can see the closure
        $studentResponse = $this->getJson("/api/evaluations/{$evaluation->id}");
        $studentResponse->assertStatus(200);
        
        $evaluationData = $studentResponse->json();
        $this->assertNotNull($evaluationData['closed_at']);
        $this->assertTrue(strtotime($evaluationData['closed_at']) <= time());
    }

    /**
     * Test multi-step evaluation lifecycle with real-time updates
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     */
    public function test_complete_evaluation_lifecycle_flow()
    {
        Event::fake();

        // Step 1: Create evaluation
        $evaluationData = [
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'academic_year' => '2024-2025',
            'semester' => 'First',
            'year_level' => 3,
            'opened_at' => now()->subDays(1)->toDateTimeString(),
            'closed_at' => now()->addDays(7)->toDateTimeString()
        ];

        $createResponse = $this->postJson('/api/evaluations', $evaluationData);
        $createResponse->assertStatus(201);
        $evaluation = Evaluation::latest()->first();

        // Verify creation event
        Event::assertDispatched(EvaluationCreated::class);

        // Step 2: Add questions
        $questions = Question::factory()->count(5)->create();
        $evaluation->questions()->attach($questions->pluck('id'));

        // Broadcast question addition
        $changes = ['questions_added' => true, 'question_count' => 5];
        $this->realTimeSyncService->broadcastEvaluationUpdated($evaluation, $changes);

        // Step 3: Update evaluation details
        $updateData = [
            'academic_year' => '2024-2025 Updated',
            'closed_at' => now()->addDays(10)->toDateTimeString()
        ];

        $updateResponse = $this->putJson("/api/evaluations/{$evaluation->id}", $updateData);
        $updateResponse->assertStatus(200);

        // Verify update event
        Event::assertDispatched(EvaluationUpdated::class);

        // Step 4: Extend deadline (simulate urgent update)
        $extendData = [
            'closed_at' => now()->addDays(14)->toDateTimeString()
        ];

        $extendResponse = $this->putJson("/api/evaluations/{$evaluation->id}", $extendData);
        $extendResponse->assertStatus(200);

        // Broadcast deadline extension notification
        $this->realTimeSyncService->broadcastNotification(
            "Deadline extended for {$this->course->name} evaluation",
            'deadline_extended',
            $evaluation->id,
            $this->department->id
        );

        // Step 5: Close evaluation
        $closeResponse = $this->postJson("/api/evaluations/{$evaluation->id}/close");
        $closeResponse->assertStatus(200);

        // Verify closure events
        Event::assertDispatched(EvaluationClosed::class);
        Event::assertDispatched(EvaluationNotification::class);

        // Step 6: Verify final state
        $evaluation->refresh();
        $this->assertEquals('2024-2025 Updated', $evaluation->academic_year);
        $this->assertNotNull($evaluation->closed_at);
        $this->assertEquals(5, $evaluation->questions()->count());

        // Step 7: Verify student can see complete lifecycle
        $finalResponse = $this->getJson("/api/evaluations/{$evaluation->id}");
        $finalResponse->assertStatus(200);
        
        $finalData = $finalResponse->json();
        $this->assertEquals('2024-2025 Updated', $finalData['academic_year']);
        $this->assertNotNull($finalData['closed_at']);
        $this->assertEquals(5, count($finalData['questions'] ?? []));
    }

    /**
     * Test concurrent evaluation operations
     * **Validates: Requirements 1.1, 1.2**
     */
    public function test_concurrent_evaluation_operations()
    {
        Event::fake();

        // Create multiple evaluations simultaneously
        $evaluations = [];
        for ($i = 1; $i <= 3; $i++) {
            $evaluationData = [
                'course_id' => $this->course->id,
                'teacher_id' => $this->teacher->id,
                'academic_year' => "2024-2025 Batch {$i}",
                'semester' => 'First',
                'year_level' => 3,
                'opened_at' => now()->subDays(1)->toDateTimeString(),
                'closed_at' => now()->addDays(7)->toDateTimeString()
            ];

            $response = $this->postJson('/api/evaluations', $evaluationData);
            $response->assertStatus(201);
            $evaluations[] = Evaluation::latest()->first();
        }

        // Verify all creation events were dispatched
        Event::assertDispatchedTimes(EvaluationCreated::class, 3);

        // Update all evaluations concurrently
        foreach ($evaluations as $index => $evaluation) {
            $updateData = [
                'academic_year' => "2024-2025 Updated Batch " . ($index + 1),
                'semester' => 'Second'
            ];

            $response = $this->putJson("/api/evaluations/{$evaluation->id}", $updateData);
            $response->assertStatus(200);
        }

        // Verify all update events were dispatched
        Event::assertDispatchedTimes(EvaluationUpdated::class, 3);

        // Verify all evaluations are accessible to students
        $studentResponse = $this->getJson("/api/evaluations?department_id={$this->department->id}");
        $studentResponse->assertStatus(200);
        
        $evaluationList = $studentResponse->json('data');
        $this->assertCount(3, $evaluationList);

        // Verify each evaluation has correct updated data
        foreach ($evaluationList as $evalData) {
            $this->assertStringContainsString('Updated Batch', $evalData['academic_year']);
            $this->assertEquals('Second', $evalData['semester']);
        }
    }

    /**
     * Test error handling in evaluation flow
     * **Validates: Requirements 1.1, 1.2**
     */
    public function test_evaluation_flow_error_handling()
    {
        // Test invalid evaluation creation
        $invalidData = [
            'course_id' => 99999, // Non-existent course
            'teacher_id' => $this->teacher->id,
            'academic_year' => '2024-2025',
            'semester' => 'First'
        ];

        $response = $this->postJson('/api/evaluations', $invalidData);
        $response->assertStatus(422);

        // Test updating non-existent evaluation
        $updateResponse = $this->putJson('/api/evaluations/99999', [
            'academic_year' => '2024-2025 Updated'
        ]);
        $updateResponse->assertStatus(404);

        // Test closing non-existent evaluation
        $closeResponse = $this->postJson('/api/evaluations/99999/close');
        $closeResponse->assertStatus(404);

        // Create valid evaluation for further error tests
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now(),
            'closed_at' => now()->addDays(7)
        ]);

        // Test invalid update data
        $invalidUpdateResponse = $this->putJson("/api/evaluations/{$evaluation->id}", [
            'course_id' => 99999 // Cannot change to non-existent course
        ]);
        $invalidUpdateResponse->assertStatus(422);

        // Verify evaluation remains unchanged after errors
        $evaluation->refresh();
        $this->assertEquals($this->course->id, $evaluation->course_id);
    }

    /**
     * Test real-time sync service integration
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     */
    public function test_real_time_sync_service_integration()
    {
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now(),
            'closed_at' => now()->addDays(7)
        ]);

        // Test service methods directly
        
        // Test broadcast evaluation created
        $this->realTimeSyncService->broadcastEvaluationCreated($evaluation);
        $this->assertTrue(true); // No exception thrown

        // Test broadcast evaluation updated
        $changes = ['academic_year' => 'Updated', 'questions_modified' => true];
        $this->realTimeSyncService->broadcastEvaluationUpdated($evaluation, $changes);
        $this->assertTrue(true); // No exception thrown

        // Test broadcast evaluation closed
        $closedAt = now()->toISOString();
        $this->realTimeSyncService->broadcastEvaluationClosed(
            $evaluation->id,
            $closedAt,
            $this->department->id
        );
        $this->assertTrue(true); // No exception thrown

        // Test broadcast notification
        $this->realTimeSyncService->broadcastNotification(
            'Test notification message',
            'updated',
            $evaluation->id,
            $this->department->id
        );
        $this->assertTrue(true); // No exception thrown

        // Test service statistics
        $stats = $this->realTimeSyncService->getPerformanceStats();
        $this->assertIsArray($stats);
    }
}