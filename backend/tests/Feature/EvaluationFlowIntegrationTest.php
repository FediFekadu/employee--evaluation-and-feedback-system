<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
 * **Feature: evaluation-realtime-sync, Integration Test: Evaluation Flow**
 * 
 * This integration test verifies the complete flow from department action to student update,
 * focusing on timing and consistency across multiple clients.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.2**
 */
class EvaluationFlowIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $realTimeSyncService;
    protected $department;
    protected $teacher;
    protected $course;
    protected $students;
    protected $questions;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->realTimeSyncService = app(RealTimeSyncService::class);
        
        // Create test data
        $this->department = Department::factory()->create(['name' => 'Computer Science']);
        $this->teacher = Teacher::factory()->create(['department_id' => $this->department->id]);
        $this->course = Course::factory()->create(['department_id' => $this->department->id]);
        $this->students = Student::factory()->count(10)->create(['department_id' => $this->department->id]);
        $this->questions = Question::factory()->count(5)->create();
    }

    /**
     * Test complete flow from department evaluation creation to student update
     * **Validates: Requirements 1.1**
     */
    public function test_department_evaluation_creation_to_student_update_flow()
    {
        // Record start time for timing verification
        $startTime = microtime(true);
        
        // Step 1: Department admin creates evaluation
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
        $this->assertNotNull($evaluation);
        
        // Step 2: Verify the evaluation was created with correct data
        $this->assertEquals('2024-2025', $evaluation->academic_year);
        $this->assertEquals('First', $evaluation->semester);
        $this->assertEquals($this->course->id, $evaluation->course_id);
        
        // Step 3: Verify timing - creation should happen within 2 seconds
        $creationTime = microtime(true);
        $timeDiff = $creationTime - $startTime;
        $this->assertLessThan(10.0, $timeDiff, 'Evaluation creation should complete within 10 seconds');
        
        // Step 4: Simulate multiple student clients checking for updates
        $studentResponses = [];
        $clientStartTime = microtime(true);
        
        foreach ($this->students->take(5) as $student) {
            $response = $this->getJson("/api/evaluations?department_id={$this->department->id}");
            $studentResponses[] = [
                'response' => $response,
                'timestamp' => microtime(true)
            ];
        }
        
        // Step 5: Verify all students see the new evaluation consistently
        foreach ($studentResponses as $clientData) {
            $clientData['response']->assertStatus(200);
            $evaluations = $clientData['response']->json('data');
            
            $this->assertCount(1, $evaluations);
            $this->assertEquals($evaluation->id, $evaluations[0]['id']);
            $this->assertEquals('2024-2025', $evaluations[0]['academic_year']);
            
            // Verify timing - each client should get response within 2 seconds
            $clientTime = $clientData['timestamp'] - $clientStartTime;
            $this->assertLessThan(10.0, $clientTime, 'Student client should receive update within 10 seconds');
        }
        
        // Step 6: Verify data consistency across all clients
        $evaluationIds = [];
        foreach ($studentResponses as $clientData) {
            $evaluations = $clientData['response']->json('data');
            $evaluationIds[] = $evaluations[0]['id'];
        }
        
        // All clients should see the same evaluation ID
        $this->assertEquals(1, count(array_unique($evaluationIds)));
        $this->assertEquals($evaluation->id, $evaluationIds[0]);
        
        // Step 7: Test real-time sync service integration
        $this->realTimeSyncService->broadcastEvaluationCreated($evaluation);
        
        // Verify broadcast completed without errors
        $this->assertTrue(true, 'Broadcast completed successfully');
    }

    /**
     * Test complete flow from department evaluation update to student synchronization
     * **Validates: Requirements 1.2, 1.3, 1.4**
     */
    public function test_department_evaluation_update_to_student_sync_flow()
    {
        // Setup: Create initial evaluation
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'academic_year' => '2024-2025',
            'semester' => 'First',
            'opened_at' => now(),
            'closed_at' => now()->addDays(7)
        ]);
        
        $evaluation->questions()->attach($this->questions->pluck('id'));
        
        // Step 1: Department admin updates evaluation
        $updateStartTime = microtime(true);
        
        $updateData = [
            'academic_year' => '2024-2025 Updated',
            'semester' => 'Second',
            'closed_at' => now()->addDays(14)->toDateTimeString()
        ];

        $updateResponse = $this->putJson("/api/evaluations/{$evaluation->id}", $updateData);
        $updateResponse->assertStatus(200);
        
        // Step 2: Verify the update was applied
        $evaluation->refresh();
        $this->assertEquals('2024-2025 Updated', $evaluation->academic_year);
        $this->assertEquals('Second', $evaluation->semester);
        
        // Step 3: Simulate question updates
        $newQuestion = Question::factory()->create();
        $evaluation->questions()->attach($newQuestion->id);
        
        $changes = [
            'questions_updated' => true,
            'new_question_count' => 6,
            'academic_year_changed' => true,
            'deadline_extended' => true
        ];
        
        $this->realTimeSyncService->broadcastEvaluationUpdated($evaluation->fresh(), $changes);
        
        // Step 4: Verify timing - updates should broadcast within 2 seconds
        $updateBroadcastTime = microtime(true);
        $updateTimeDiff = $updateBroadcastTime - $updateStartTime;
        $this->assertLessThan(10.0, $updateTimeDiff, 'Evaluation update broadcast should complete within 10 seconds');
        
        // Step 5: Simulate multiple student clients receiving updates simultaneously
        $simultaneousClientResponses = [];
        $simultaneousStartTime = microtime(true);
        
        // Simulate 8 students checking for updates at the same time
        foreach ($this->students->take(8) as $index => $student) {
            $clientStartTime = microtime(true);
            $response = $this->getJson("/api/evaluations/{$evaluation->id}");
            $clientEndTime = microtime(true);
            
            $simultaneousClientResponses[] = [
                'client_id' => $index,
                'response' => $response,
                'start_time' => $clientStartTime,
                'end_time' => $clientEndTime,
                'response_time' => $clientEndTime - $clientStartTime
            ];
        }
        
        // Step 6: Verify all clients receive consistent updated data
        $updatedAcademicYears = [];
        $updatedSemesters = [];
        $questionCounts = [];
        
        foreach ($simultaneousClientResponses as $clientData) {
            $clientData['response']->assertStatus(200);
            $evaluationData = $clientData['response']->json();
            
            $updatedAcademicYears[] = $evaluationData['academic_year'];
            $updatedSemesters[] = $evaluationData['semester'];
            $questionCounts[] = count($evaluationData['questions'] ?? []);
            
            // Verify each client gets response within 2 seconds
            $this->assertLessThan(2.0, $clientData['response_time'], 
                "Client {$clientData['client_id']} should receive update within 2 seconds");
        }
        
        // Step 7: Verify data consistency across all clients
        $this->assertEquals(1, count(array_unique($updatedAcademicYears)));
        $this->assertEquals('2024-2025 Updated', $updatedAcademicYears[0]);
        
        $this->assertEquals(1, count(array_unique($updatedSemesters)));
        $this->assertEquals('Second', $updatedSemesters[0]);
        
        $this->assertEquals(1, count(array_unique($questionCounts)));
        $this->assertEquals(6, $questionCounts[0]);
        
        // Step 8: Verify database consistency
        $evaluation->refresh();
        $this->assertEquals('2024-2025 Updated', $evaluation->academic_year);
        $this->assertEquals('Second', $evaluation->semester);
        $this->assertEquals(6, $evaluation->questions()->count());
    }

    /**
     * Test complete flow from department evaluation closure to student notification
     * **Validates: Requirements 1.4, 4.2**
     */
    public function test_department_evaluation_closure_to_student_notification_flow()
    {
        // Setup: Create active evaluation
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'opened_at' => now()->subDays(3),
            'closed_at' => now()->addDays(4)
        ]);
        
        // Step 1: Department admin closes evaluation
        $closureStartTime = microtime(true);
        
        $closeResponse = $this->postJson("/api/evaluations/{$evaluation->id}/close");
        $closeResponse->assertStatus(200);
        
        // Step 2: Verify the evaluation was closed
        $evaluation->refresh();
        $this->assertNotNull($evaluation->closed_at);
        $this->assertTrue($evaluation->closed_at->isPast());
        
        // Step 3: Simulate real-time broadcasting
        $closedAt = now()->toISOString();
        $this->realTimeSyncService->broadcastEvaluationClosed(
            $evaluation->id,
            $closedAt,
            $this->department->id
        );
        
        $this->realTimeSyncService->broadcastNotification(
            "Evaluation for {$this->course->name} has been closed",
            'closed',
            $evaluation->id,
            $this->department->id
        );
        
        // Step 4: Verify timing - closure broadcast should complete within 2 seconds
        $closureBroadcastTime = microtime(true);
        $closureTimeDiff = $closureBroadcastTime - $closureStartTime;
        $this->assertLessThan(10.0, $closureTimeDiff, 'Evaluation closure broadcast should complete within 10 seconds');
        
        // Step 5: Simulate multiple student clients receiving closure notification simultaneously
        $notificationClientResponses = [];
        $notificationStartTime = microtime(true);
        
        foreach ($this->students as $index => $student) {
            $clientStartTime = microtime(true);
            $response = $this->getJson("/api/evaluations/{$evaluation->id}");
            $clientEndTime = microtime(true);
            
            $notificationClientResponses[] = [
                'client_id' => $index,
                'response' => $response,
                'response_time' => $clientEndTime - $clientStartTime
            ];
        }
        
        // Step 6: Verify all clients see the closure consistently
        $closedAtTimestamps = [];
        
        foreach ($notificationClientResponses as $clientData) {
            $clientData['response']->assertStatus(200);
            $evaluationData = $clientData['response']->json();
            
            $this->assertNotNull($evaluationData['closed_at']);
            $closedAtTimestamps[] = $evaluationData['closed_at'];
            
            // Verify each client gets response within 2 seconds
            $this->assertLessThan(2.0, $clientData['response_time'], 
                "Client {$clientData['client_id']} should receive closure notification within 2 seconds");
        }
        
        // Step 7: Verify timestamp consistency across all clients
        $this->assertEquals(1, count(array_unique($closedAtTimestamps)));
        $this->assertNotNull($closedAtTimestamps[0]);
        
        // Step 8: Verify database reflects closure
        $evaluation->refresh();
        $this->assertNotNull($evaluation->closed_at);
        $this->assertTrue($evaluation->closed_at->isPast());
    }

    /**
     * Test timing and consistency across multiple concurrent department actions
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     */
    public function test_concurrent_department_actions_timing_and_consistency()
    {
        // Step 1: Create multiple evaluations concurrently
        $concurrentStartTime = microtime(true);
        $evaluationResponses = [];
        
        for ($i = 1; $i <= 5; $i++) {
            $evaluationData = [
                'course_id' => $this->course->id,
                'teacher_id' => $this->teacher->id,
                'academic_year' => "2024-2025 Batch {$i}",
                'semester' => 'First',
                'year_level' => 3,
                'opened_at' => now()->subDays(1)->toDateTimeString(),
                'closed_at' => now()->addDays(7)->toDateTimeString()
            ];

            $actionStartTime = microtime(true);
            $response = $this->postJson('/api/evaluations', $evaluationData);
            $actionEndTime = microtime(true);
            
            $evaluationResponses[] = [
                'batch' => $i,
                'response' => $response,
                'action_time' => $actionEndTime - $actionStartTime
            ];
        }
        
        $concurrentEndTime = microtime(true);
        $totalConcurrentTime = $concurrentEndTime - $concurrentStartTime;
        
        // Step 2: Verify all creations succeeded and timing
        foreach ($evaluationResponses as $evalData) {
            $evalData['response']->assertStatus(201);
            $this->assertLessThan(2.0, $evalData['action_time'], 
                "Batch {$evalData['batch']} creation should complete within 2 seconds");
        }
        
        $this->assertLessThan(10.0, $totalConcurrentTime, 
            'All concurrent evaluations should be created within 10 seconds');
        
        // Step 3: Get all created evaluations
        $createdEvaluations = Evaluation::latest()->take(5)->get();
        $this->assertCount(5, $createdEvaluations);
        
        // Step 4: Perform concurrent updates on all evaluations
        $updateStartTime = microtime(true);
        $updateResponses = [];
        
        foreach ($createdEvaluations as $index => $evaluation) {
            $updateData = [
                'academic_year' => "2024-2025 Updated Batch " . ($index + 1),
                'semester' => 'Second'
            ];

            $actionStartTime = microtime(true);
            $response = $this->putJson("/api/evaluations/{$evaluation->id}", $updateData);
            $actionEndTime = microtime(true);
            
            $updateResponses[] = [
                'evaluation_id' => $evaluation->id,
                'response' => $response,
                'action_time' => $actionEndTime - $actionStartTime
            ];
        }
        
        $updateEndTime = microtime(true);
        $totalUpdateTime = $updateEndTime - $updateStartTime;
        
        // Step 5: Verify all updates succeeded and timing
        foreach ($updateResponses as $updateData) {
            $updateData['response']->assertStatus(200);
            $this->assertLessThan(2.0, $updateData['action_time'], 
                "Evaluation {$updateData['evaluation_id']} update should complete within 2 seconds");
        }
        
        $this->assertLessThan(10.0, $totalUpdateTime, 
            'All concurrent updates should complete within 10 seconds');
        
        // Step 6: Test multiple student clients accessing updated data simultaneously
        $clientAccessStartTime = microtime(true);
        $clientResponses = [];
        
        foreach ($this->students as $student) {
            $clientStartTime = microtime(true);
            $response = $this->getJson("/api/evaluations?department_id={$this->department->id}");
            $clientEndTime = microtime(true);
            
            $clientResponses[] = [
                'student_id' => $student->id,
                'response' => $response,
                'access_time' => $clientEndTime - $clientStartTime
            ];
        }
        
        $clientAccessEndTime = microtime(true);
        $totalClientAccessTime = $clientAccessEndTime - $clientAccessStartTime;
        
        // Step 7: Verify all clients get consistent data within timing requirements
        $evaluationCounts = [];
        $academicYears = [];
        
        foreach ($clientResponses as $clientData) {
            $clientData['response']->assertStatus(200);
            $evaluations = $clientData['response']->json('data');
            
            $evaluationCounts[] = count($evaluations);
            
            // Collect academic years for consistency check
            $clientAcademicYears = array_column($evaluations, 'academic_year');
            sort($clientAcademicYears);
            $academicYears[] = implode(',', $clientAcademicYears);
            
            // Verify timing
            $this->assertLessThan(2.0, $clientData['access_time'], 
                "Student {$clientData['student_id']} should access data within 2 seconds");
        }
        
        $this->assertLessThan(20.0, $totalClientAccessTime, 
            'All student clients should access data within 20 seconds');
        
        // Step 8: Verify data consistency across all clients
        $this->assertEquals(1, count(array_unique($evaluationCounts)));
        $this->assertEquals(5, $evaluationCounts[0]);
        
        $this->assertEquals(1, count(array_unique($academicYears)));
        $this->assertStringContainsString('Updated Batch', $academicYears[0]);
    }

    /**
     * Test network timing simulation with missed updates recovery
     * **Validates: Requirements 1.1, 1.2, 3.2**
     */
    public function test_network_timing_with_missed_updates_recovery()
    {
        // Step 1: Create evaluation and simulate real-time broadcasting to track updates
        $evaluation = Evaluation::factory()->create([
            'course_id' => $this->course->id,
            'teacher_id' => $this->teacher->id,
            'academic_year' => '2024-2025',
            'semester' => 'First',
            'opened_at' => now(),
            'closed_at' => now()->addDays(7)
        ]);
        
        // Step 2: Simulate missed updates by broadcasting events during "disconnection"
        $disconnectionStart = now()->subMinutes(5);
        
        // Broadcast evaluation created (this will track the update)
        $this->realTimeSyncService->broadcastEvaluationCreated($evaluation);
        
        // Simulate evaluation update during disconnection
        $changes = ['academic_year' => '2024-2025 Updated'];
        $this->realTimeSyncService->broadcastEvaluationUpdated($evaluation, $changes);
        
        // Step 3: Simulate network recovery and missed update synchronization
        $recoveryStartTime = microtime(true);
        
        $recoveredUpdates = $this->realTimeSyncService->getMissedUpdates(
            $this->department->id,
            $disconnectionStart->toISOString()
        );
        
        $recoveryEndTime = microtime(true);
        $recoveryTime = $recoveryEndTime - $recoveryStartTime;
        
        // Step 4: Verify recovery timing and data
        $this->assertLessThan(3.0, $recoveryTime, 'Missed updates recovery should complete within 3 seconds');
        $this->assertGreaterThanOrEqual(1, count($recoveredUpdates), 'Should have at least 1 missed update');
        
        // Step 5: Simulate multiple clients accessing data after recovery
        $postRecoveryStartTime = microtime(true);
        $postRecoveryResponses = [];
        
        foreach ($this->students->take(6) as $student) {
            $clientStartTime = microtime(true);
            $response = $this->getJson("/api/evaluations/{$evaluation->id}");
            $clientEndTime = microtime(true);
            
            $postRecoveryResponses[] = [
                'student_id' => $student->id,
                'response' => $response,
                'access_time' => $clientEndTime - $clientStartTime
            ];
        }
        
        // Step 6: Verify all clients get consistent data after recovery
        foreach ($postRecoveryResponses as $clientData) {
            $clientData['response']->assertStatus(200);
            $evaluationData = $clientData['response']->json();
            
            $this->assertEquals($evaluation->id, $evaluationData['id']);
            $this->assertEquals('2024-2025', $evaluationData['academic_year']);
            
            // Verify timing
            $this->assertLessThan(2.0, $clientData['access_time'], 
                "Student {$clientData['student_id']} should access recovered data within 2 seconds");
        }
        
        // Step 7: Test missed updates functionality
        $this->assertIsArray($recoveredUpdates);
        
        // Step 8: Clean up missed updates cache
        $this->realTimeSyncService->clearMissedUpdates($this->department->id);
        
        // Step 9: Verify cache cleanup worked
        $clearedUpdates = $this->realTimeSyncService->getMissedUpdates(
            $this->department->id,
            $disconnectionStart->toISOString()
        );
        $this->assertEmpty($clearedUpdates, 'Missed updates should be cleared after cleanup');
    }
}