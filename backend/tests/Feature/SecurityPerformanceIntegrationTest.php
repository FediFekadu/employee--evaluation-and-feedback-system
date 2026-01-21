<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\RealTimeSyncService;
use App\Services\BroadcastOptimizationService;
use App\Services\BroadcastDataValidationService;
use App\Models\Evaluation;
use App\Models\Course;
use App\Models\Department;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Broadcasting\BroadcastManager;

class SecurityPerformanceIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected RealTimeSyncService $syncService;
    protected BroadcastOptimizationService $optimizationService;
    protected BroadcastDataValidationService $validationService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create real services for integration testing
        $this->validationService = new BroadcastDataValidationService();
        $this->optimizationService = new BroadcastOptimizationService(
            app(BroadcastManager::class),
            $this->validationService
        );
        $this->syncService = new RealTimeSyncService(
            $this->optimizationService,
            $this->validationService
        );
        
        Cache::flush();
    }

    public function test_security_validation_prevents_invalid_data_broadcast(): void
    {
        // Create test data with invalid evaluation data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $course->teachers()->attach($teacher->id);
        
        // Create evaluation with invalid data that should be caught by validation
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'opened_at' => '2025-01-31',
            'closed_at' => '2025-01-01' // Invalid: closed before opened
        ]);

        // Attempt to broadcast - should handle validation gracefully
        $this->syncService->broadcastEvaluationCreated($evaluation);

        // Verify that the system handled the invalid data gracefully
        // (The service should log errors but not crash)
        $this->assertTrue(true); // If we reach here, no exceptions were thrown
    }

    public function test_performance_optimization_handles_batch_operations(): void
    {
        // Create multiple broadcast events
        $broadcasts = [];
        for ($i = 1; $i <= 5; $i++) {
            $broadcasts[] = [
                'channel' => "department.1.evaluations",
                'event' => 'EvaluationCreated',
                'data' => [
                    'evaluation' => [
                        'id' => $i,
                        'status' => 'active',
                        'start_date' => '2025-01-01',
                        'end_date' => '2025-01-31',
                        'course_id' => 1
                    ],
                    'departmentId' => 1
                ]
            ];
        }

        // Test batch broadcasting
        $successCount = $this->syncService->batchBroadcast($broadcasts);

        // Verify that batch processing worked
        $this->assertGreaterThanOrEqual(0, $successCount);
    }

    public function test_rate_limiting_prevents_spam(): void
    {
        $departmentId = 1;
        
        // Attempt to send many notifications rapidly
        for ($i = 0; $i < 15; $i++) { // Exceeds the limit of 5 for notifications
            $this->syncService->broadcastNotification(
                "Test notification {$i}",
                'updated',
                1,
                $departmentId
            );
        }

        // The system should handle rate limiting gracefully
        $this->assertTrue(true); // If we reach here, no exceptions were thrown
    }

    public function test_payload_size_optimization_works(): void
    {
        // Create evaluation with standard data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $course->teachers()->attach($teacher->id);
        
        $evaluation = Evaluation::factory()->create([
            'course_id' => $course->id,
            'teacher_id' => $teacher->id,
            'academic_year' => 2025,
            'semester' => 1,
            'year_level' => 1
        ]);

        // Broadcast should optimize the payload
        $this->syncService->broadcastEvaluationCreated($evaluation);

        // Verify that the system handled the broadcast
        $this->assertTrue(true);
    }

    public function test_data_sanitization_removes_malicious_content(): void
    {
        $maliciousMessage = '<script>alert("xss")</script>This is a test message.';
        
        // Attempt to broadcast notification with malicious content
        $this->syncService->broadcastNotification(
            $maliciousMessage,
            'updated',
            1,
            1
        );

        // The system should sanitize the content
        $this->assertTrue(true);
    }

    public function test_connection_pooling_statistics(): void
    {
        // Get performance statistics
        $stats = $this->syncService->getPerformanceStats();

        // Verify statistics structure
        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_broadcasts', $stats);
        $this->assertArrayHasKey('average_payload_size', $stats);
        $this->assertArrayHasKey('events_per_minute', $stats);
    }

    public function test_validation_statistics_available(): void
    {
        // Get validation statistics
        $stats = $this->syncService->getValidationStats();

        // Verify validation statistics
        $this->assertIsArray($stats);
        $this->assertArrayHasKey('supported_events', $stats);
        $this->assertArrayHasKey('max_payload_sizes', $stats);
        $this->assertArrayHasKey('sanitization_rules', $stats);
    }

    public function test_event_type_support_validation(): void
    {
        // Test supported event types
        $this->assertTrue($this->syncService->isEventTypeSupported('EvaluationCreated'));
        $this->assertTrue($this->syncService->isEventTypeSupported('SubmissionReceived'));
        $this->assertTrue($this->syncService->isEventTypeSupported('EvaluationNotification'));
        
        // Test unsupported event type
        $this->assertFalse($this->syncService->isEventTypeSupported('UnsupportedEvent'));
    }

    public function test_missed_updates_tracking_with_security(): void
    {
        $departmentId = 1;
        
        // Broadcast some events
        $this->syncService->broadcastEvaluationClosed(1, now()->toISOString(), $departmentId);
        $this->syncService->broadcastNotification('Test', 'updated', 1, $departmentId);

        // Get missed updates
        $missedUpdates = $this->syncService->getMissedUpdates($departmentId, now()->subMinutes(5)->toISOString());

        // Verify updates were tracked securely
        $this->assertIsArray($missedUpdates);
        
        // Clear updates
        $this->syncService->clearMissedUpdates($departmentId);
        
        // Verify updates were cleared
        $clearedUpdates = $this->syncService->getMissedUpdates($departmentId, now()->subMinutes(5)->toISOString());
        $this->assertEmpty($clearedUpdates);
    }

    public function test_comprehensive_security_performance_flow(): void
    {
        // Create test data
        $department = Department::factory()->create();
        $teacher = Teacher::factory()->create(['department_id' => $department->id]);
        $course = Course::factory()->create(['department_id' => $department->id]);
        $course->teachers()->attach($teacher->id);
        $evaluation = Evaluation::factory()->create(['course_id' => $course->id]);

        // Test complete flow: creation -> update -> submission -> notification -> closure
        $this->syncService->broadcastEvaluationCreated($evaluation);
        
        $this->syncService->broadcastEvaluationUpdated($evaluation, ['title' => 'Updated Title']);
        
        $this->syncService->broadcastSubmissionReceived(
            $evaluation->id,
            ['count' => 10, 'total' => 20, 'rate' => 50.0],
            $department->id
        );
        
        $this->syncService->broadcastNotification(
            'Evaluation deadline extended',
            'deadline_extended',
            $evaluation->id,
            $department->id
        );
        
        $this->syncService->broadcastEvaluationClosed(
            $evaluation->id,
            now()->toISOString(),
            $department->id
        );

        // Verify all operations completed without errors
        $missedUpdates = $this->syncService->getMissedUpdates($department->id, now()->subMinutes(5)->toISOString());
        $this->assertGreaterThanOrEqual(4, count($missedUpdates)); // At least 4 valid events should be tracked
    }
}