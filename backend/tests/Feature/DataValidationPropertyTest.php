<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\BroadcastDataValidationService;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Faker\Factory as Faker;

class DataValidationPropertyTest extends TestCase
{
    private BroadcastDataValidationService $validationService;
    private $faker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validationService = new BroadcastDataValidationService();
        $this->faker = Faker::create();
    }

    /**
     * **Feature: evaluation-realtime-sync, Property 24: Event Data Validation**
     * **Validates: Requirements 5.4**
     * 
     * Property: For any real-time event, the system should validate all data before broadcasting to clients
     * 
     * This test generates random event data and verifies that:
     * 1. Valid data passes validation
     * 2. Invalid data is rejected with appropriate errors
     * 3. All supported event types are properly validated
     * 4. Data sanitization works correctly
     * 5. Payload size limits are enforced
     */
    public function test_event_data_validation_property()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            $this->runSingleValidationTest();
        }
    }

    private function runSingleValidationTest(): void
    {
        // Generate random event type and data
        $eventTypes = ['EvaluationCreated', 'EvaluationUpdated', 'EvaluationClosed', 'SubmissionReceived', 'EvaluationNotification'];
        $eventType = $this->faker->randomElement($eventTypes);
        
        // Test with valid data - should always pass
        $validData = $this->generateValidEventData($eventType);
        
        try {
            $result = $this->validationService->validateEventData($eventType, $validData);
            
            // Property: Valid data should always pass validation
            $this->assertIsArray($result, "Valid data for {$eventType} should pass validation");
            $this->assertNotEmpty($result, "Validated data should not be empty");
            
            // Property: Validated data should contain all required fields
            $this->assertValidatedDataIntegrity($eventType, $validData, $result);
            
        } catch (ValidationException $e) {
            $this->fail("Valid data for {$eventType} should not throw ValidationException: " . json_encode($e->errors()));
        }

        // Test with invalid data - should always fail
        $invalidData = $this->generateInvalidEventData($eventType);
        
        try {
            $this->validationService->validateEventData($eventType, $invalidData);
            $this->fail("Invalid data for {$eventType} should throw ValidationException");
        } catch (ValidationException $e) {
            // Property: Invalid data should always be rejected
            $this->assertNotEmpty($e->errors(), "Validation errors should be provided for invalid data");
        }

        // Test data sanitization property
        $dataWithMaliciousContent = $this->generateDataWithMaliciousContent($eventType);
        
        try {
            $sanitizedResult = $this->validationService->validateEventData($eventType, $dataWithMaliciousContent);
            
            // Property: Malicious content should be sanitized
            $this->assertDataIsSanitized($sanitizedResult);
            
        } catch (ValidationException $e) {
            // It's acceptable for malicious data to be rejected entirely
            $this->assertNotEmpty($e->errors());
        }

        // Test payload size limits
        $oversizedData = $this->generateOversizedEventData($eventType);
        
        try {
            $this->validationService->validateEventData($eventType, $oversizedData);
            $this->fail("Oversized data for {$eventType} should be rejected");
        } catch (ValidationException $e) {
            // Property: Oversized payloads should be rejected
            $errors = $e->errors();
            $hasPayloadSizeError = isset($errors['payload_size']) || $this->containsPayloadSizeError($errors);
            
            if (!$hasPayloadSizeError) {
                // Debug: Log the actual errors to understand what's happening
                Log::info('Payload size test debug', [
                    'event_type' => $eventType,
                    'errors' => $errors,
                    'data_size' => strlen(json_encode($oversizedData))
                ]);
            }
            
            $this->assertTrue(
                $hasPayloadSizeError,
                "Oversized data should trigger payload size error. Actual errors: " . json_encode($errors)
            );
        }
    }

    private function generateValidEventData(string $eventType): array
    {
        switch ($eventType) {
            case 'EvaluationCreated':
                return [
                    'evaluation' => [
                        'id' => $this->faker->numberBetween(1, 1000),
                        'course_id' => $this->faker->numberBetween(1, 100),
                        'teacher_id' => $this->faker->numberBetween(1, 100),
                        'academic_year' => $this->faker->numberBetween(2020, 2030),
                        'semester' => $this->faker->randomElement([1, 2]),
                        'year_level' => $this->faker->numberBetween(1, 4),
                        'opened_at' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d H:i:s'),
                        'closed_at' => $this->faker->dateTimeBetween('+1 month', '+2 months')->format('Y-m-d H:i:s')
                    ],
                    'departmentId' => $this->faker->numberBetween(1, 50)
                ];

            case 'EvaluationUpdated':
                return [
                    'evaluation' => [
                        'id' => $this->faker->numberBetween(1, 1000),
                        'course_id' => $this->faker->numberBetween(1, 100),
                        'teacher_id' => $this->faker->numberBetween(1, 100),
                        'academic_year' => $this->faker->numberBetween(2020, 2030),
                        'semester' => $this->faker->randomElement([1, 2]),
                        'year_level' => $this->faker->numberBetween(1, 4),
                        'opened_at' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d H:i:s'),
                        'closed_at' => $this->faker->dateTimeBetween('+1 month', '+2 months')->format('Y-m-d H:i:s')
                    ],
                    'changes' => [
                        $this->faker->randomElement(['title', 'description', 'closed_at']) => [
                            'from' => $this->faker->word,
                            'to' => $this->faker->word
                        ]
                    ],
                    'departmentId' => $this->faker->numberBetween(1, 50)
                ];

            case 'EvaluationClosed':
                return [
                    'evaluationId' => $this->faker->numberBetween(1, 1000),
                    'closedAt' => $this->faker->dateTimeBetween('now', '+1 day')->format('Y-m-d H:i:s'),
                    'departmentId' => $this->faker->numberBetween(1, 50)
                ];

            case 'SubmissionReceived':
                $total = $this->faker->numberBetween(10, 100);
                $count = $this->faker->numberBetween(0, $total);
                $rate = $total > 0 ? ($count / $total) * 100 : 0;
                
                return [
                    'evaluationId' => $this->faker->numberBetween(1, 1000),
                    'participationStats' => [
                        'count' => $count,
                        'total' => $total,
                        'rate' => round($rate, 2)
                    ],
                    'departmentId' => $this->faker->numberBetween(1, 50)
                ];

            case 'EvaluationNotification':
                $type = $this->faker->randomElement(['deadline_extended', 'closed', 'updated', 'maintenance']);
                $message = $this->generateMessageForType($type);
                
                return [
                    'message' => $message,
                    'type' => $type,
                    'evaluationId' => $this->faker->numberBetween(1, 1000),
                    'departmentId' => $this->faker->numberBetween(1, 50)
                ];

            default:
                return [];
        }
    }

    private function generateInvalidEventData(string $eventType): array
    {
        switch ($eventType) {
            case 'EvaluationCreated':
                return [
                    'evaluation' => [
                        'id' => $this->faker->randomElement([-1, 0, 'invalid']), // Invalid ID
                        'course_id' => $this->faker->randomElement([-1, 0]),
                        'teacher_id' => $this->faker->randomElement([-1, 0]),
                        'academic_year' => $this->faker->randomElement([1800, 2200]), // Invalid year
                        'semester' => $this->faker->randomElement([0, 3, 4]), // Invalid semester
                        'year_level' => $this->faker->randomElement([0, 5, 6]), // Invalid year level
                        'opened_at' => $this->faker->dateTimeBetween('+2 months', '+3 months')->format('Y-m-d H:i:s'),
                        'closed_at' => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d H:i:s') // Closed before opened
                    ],
                    'departmentId' => $this->faker->randomElement([-1, 0])
                ];

            case 'EvaluationUpdated':
                return [
                    'evaluation' => [
                        'id' => -1, // Invalid ID
                        'course_id' => 0,
                        'teacher_id' => 0,
                        'academic_year' => 1900,
                        'semester' => 5,
                        'year_level' => 10,
                        'opened_at' => null,
                        'closed_at' => null
                    ],
                    // Missing required 'changes' field
                    'departmentId' => -1
                ];

            case 'EvaluationClosed':
                return [
                    'evaluationId' => $this->faker->randomElement([-1, 0, 'invalid']),
                    'closedAt' => 'invalid-date',
                    'departmentId' => -1
                ];

            case 'SubmissionReceived':
                return [
                    'evaluationId' => -1,
                    'participationStats' => [
                        'count' => 150, // Count exceeds total
                        'total' => 100,
                        'rate' => 200.0 // Invalid rate
                    ],
                    'departmentId' => -1
                ];

            case 'EvaluationNotification':
                return [
                    'message' => $this->faker->randomElement(['', 'short']), // Too short
                    'type' => 'invalid_type',
                    'evaluationId' => -1,
                    'departmentId' => -1
                ];

            default:
                return ['invalid' => 'data'];
        }
    }

    private function generateDataWithMaliciousContent(string $eventType): array
    {
        $validData = $this->generateValidEventData($eventType);
        
        // Inject malicious content into string fields
        $maliciousContent = [
            '<script>alert("xss")</script>',
            '<img src="x" onerror="alert(1)">',
            '<?php echo "php injection"; ?>',
            'javascript:alert("xss")',
            '<iframe src="javascript:alert(1)"></iframe>'
        ];
        
        $maliciousString = $this->faker->randomElement($maliciousContent) . ' ' . $this->faker->sentence;
        
        // Inject into message field if it exists
        if (isset($validData['message'])) {
            $validData['message'] = $maliciousString;
        }
        
        // Inject into evaluation title if it exists
        if (isset($validData['evaluation']['title'])) {
            $validData['evaluation']['title'] = $maliciousString;
        }
        
        return $validData;
    }

    private function generateOversizedEventData(string $eventType): array
    {
        $validData = $this->generateValidEventData($eventType);
        
        // Create oversized content
        $oversizedString = str_repeat('A', 10000); // 10KB string
        
        // Add oversized content to appropriate fields
        if (isset($validData['message'])) {
            $validData['message'] = $oversizedString;
        } elseif (isset($validData['evaluation'])) {
            $validData['evaluation']['oversized_field'] = $oversizedString;
        } else {
            $validData['oversized_field'] = $oversizedString;
        }
        
        return $validData;
    }

    private function generateMessageForType(string $type): string
    {
        switch ($type) {
            case 'deadline_extended':
                return 'The evaluation deadline has been extended until ' . $this->faker->dateTimeBetween('+1 day', '+1 week')->format('Y-m-d');
            case 'closed':
                return 'The evaluation has been closed and is no longer accepting submissions.';
            case 'updated':
                return 'The evaluation has been updated with new questions and instructions.';
            case 'maintenance':
                return 'System maintenance is scheduled for tonight. Evaluations may be temporarily unavailable.';
            default:
                return $this->faker->sentence(10);
        }
    }

    private function assertValidatedDataIntegrity(string $eventType, array $originalData, array $validatedData): void
    {
        switch ($eventType) {
            case 'EvaluationCreated':
            case 'EvaluationUpdated':
                $this->assertArrayHasKey('evaluation', $validatedData);
                $this->assertArrayHasKey('departmentId', $validatedData);
                $this->assertArrayHasKey('id', $validatedData['evaluation']);
                break;
                
            case 'EvaluationClosed':
                $this->assertArrayHasKey('evaluationId', $validatedData);
                $this->assertArrayHasKey('closedAt', $validatedData);
                $this->assertArrayHasKey('departmentId', $validatedData);
                break;
                
            case 'SubmissionReceived':
                $this->assertArrayHasKey('evaluationId', $validatedData);
                $this->assertArrayHasKey('participationStats', $validatedData);
                $this->assertArrayHasKey('departmentId', $validatedData);
                
                // Verify participation stats integrity
                $stats = $validatedData['participationStats'];
                $this->assertLessThanOrEqual($stats['total'], $stats['count']);
                $this->assertGreaterThanOrEqual(0, $stats['rate']);
                $this->assertLessThanOrEqual(100, $stats['rate']);
                break;
                
            case 'EvaluationNotification':
                $this->assertArrayHasKey('message', $validatedData);
                $this->assertArrayHasKey('type', $validatedData);
                $this->assertArrayHasKey('evaluationId', $validatedData);
                $this->assertArrayHasKey('departmentId', $validatedData);
                
                // Verify message length
                $this->assertGreaterThanOrEqual(10, strlen($validatedData['message']));
                break;
        }
    }

    private function assertDataIsSanitized(array $data): void
    {
        $this->assertDataDoesNotContainMaliciousContent($data);
    }

    private function assertDataDoesNotContainMaliciousContent(array $data): void
    {
        $maliciousPatterns = [
            '<script',
            'javascript:',
            '<iframe',
            '<img.*onerror',
            '<?php'
        ];
        
        $dataString = json_encode($data);
        
        foreach ($maliciousPatterns as $pattern) {
            $this->assertThat(
                $dataString,
                $this->logicalNot($this->matchesRegularExpression('/' . preg_quote($pattern, '/') . '/i')),
                "Data should not contain malicious pattern: {$pattern}"
            );
        }
    }

    private function containsPayloadSizeError(array $errors): bool
    {
        $errorString = json_encode($errors);
        return strpos($errorString, 'payload_size') !== false || 
               strpos($errorString, 'Payload size') !== false ||
               strpos($errorString, 'exceeds maximum') !== false;
    }

    /**
     * Test that unsupported event types are properly rejected
     */
    public function test_unsupported_event_types_are_rejected()
    {
        for ($i = 0; $i < 10; $i++) {
            $unsupportedEventType = 'UnsupportedEvent' . $i;
            $randomData = ['random' => $this->faker->word];
            
            try {
                $this->validationService->validateEventData($unsupportedEventType, $randomData);
                $this->fail("Unsupported event type {$unsupportedEventType} should be rejected");
            } catch (ValidationException $e) {
                $errors = $e->errors();
                $this->assertNotEmpty($errors, "Validation errors should not be empty for unsupported event type");
                
                // Check if the error is about unsupported event type
                $errorString = json_encode($errors);
                $this->assertTrue(
                    strpos($errorString, 'Unsupported event type') !== false || 
                    strpos($errorString, 'event_type') !== false,
                    "Error should mention unsupported event type"
                );
            }
        }
    }

    /**
     * Test batch validation property
     */
    public function test_batch_validation_property()
    {
        for ($i = 0; $i < 20; $i++) {
            $batchSize = $this->faker->numberBetween(1, 5);
            $events = [];
            
            for ($j = 0; $j < $batchSize; $j++) {
                $eventType = $this->faker->randomElement(['EvaluationCreated', 'SubmissionReceived', 'EvaluationNotification']);
                $events[] = [
                    'type' => $eventType,
                    'data' => $this->generateValidEventData($eventType)
                ];
            }
            
            try {
                $result = $this->validationService->validateBatchEvents($events);
                
                // Property: Batch validation should return same number of events
                $this->assertCount($batchSize, $result);
                
                // Property: Each event in batch should be properly validated
                foreach ($result as $index => $validatedEvent) {
                    $this->assertArrayHasKey('type', $validatedEvent);
                    $this->assertArrayHasKey('data', $validatedEvent);
                    $this->assertEquals($events[$index]['type'], $validatedEvent['type']);
                }
                
            } catch (ValidationException $e) {
                $this->fail("Valid batch events should not fail validation: " . json_encode($e->errors()));
            }
        }
    }
}