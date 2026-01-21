import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { retryManager, ERROR_TYPES, getErrorInfo } from '../../utils/errorHandling';

describe('API Retry Mechanism Property Tests', () => {
  let originalConsoleError;
  let originalConsoleLog;
  let originalConsoleWarn;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods to reduce noise in tests
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    console.error = vi.fn();
    console.log = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    vi.restoreAllMocks();
  });

  /**
   * **Feature: ui-enhancement-evaluation-dashboard, Property 2: API Retry Mechanism Consistency**
   * **Validates: Requirements 1.2**
   * 
   * Property: For any failed API call, the system should implement exponential backoff retry 
   * with proper timing intervals
   */
  describe('Property 2: API Retry Mechanism Consistency', () => {
    it('should implement exponential backoff retry with proper timing intervals for any failed API call', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various retry scenarios
          fc.record({
            errorType: fc.constantFrom(
              ERROR_TYPES.NETWORK,
              ERROR_TYPES.SERVER_ERROR,
              ERROR_TYPES.TIMEOUT
            ),
            maxRetries: fc.integer({ min: 1, max: 4 }),
            baseDelay: fc.integer({ min: 100, max: 1000 }),
            backoffMultiplier: fc.float({ min: Math.fround(1.5), max: Math.fround(2.5) }),
            failureCount: fc.integer({ min: 1, max: 5 }),
            context: fc.constantFrom(
              'dashboard_load',
              'analytics_fetch',
              'teacher_rankings',
              'evaluation_data'
            )
          }),
          async (scenario) => {
            // Track retry attempts and timing
            const timingMeasurements = [];
            
            // Create mock error based on scenario
            const mockError = createMockError(scenario.errorType, scenario.context);
            
            // Create a mock operation that fails the specified number of times
            let attemptCount = 0;
            const mockOperation = vi.fn().mockImplementation(() => {
              attemptCount++;
              if (attemptCount <= scenario.failureCount) {
                throw mockError;
              }
              return Promise.resolve({ success: true, attempt: attemptCount });
            });

            // Mock onRetry callback to capture timing without actual delays
            const onRetryCallback = vi.fn().mockImplementation((error, attempt, delay) => {
              timingMeasurements.push({
                attempt,
                delay,
                errorType: scenario.errorType,
                timestamp: Date.now()
              });
            });

            // Mock setTimeout to avoid actual delays
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
              // Store the delay for verification but execute immediately
              callback();
              return 1; // Mock timer ID
            });

            try {
              // Execute with retry logic
              const result = await retryManager.executeWithRetry(
                mockOperation,
                scenario.context,
                {
                  maxRetries: scenario.maxRetries,
                  baseDelay: scenario.baseDelay,
                  backoffMultiplier: scenario.backoffMultiplier,
                  onRetry: onRetryCallback
                }
              );

              // Property 1: Should succeed if failure count is within retry limit
              if (scenario.failureCount <= scenario.maxRetries) {
                expect(result).toBeDefined();
                expect(result.success).toBe(true);
                expect(mockOperation).toHaveBeenCalledTimes(scenario.failureCount + 1);
              }

              // Property 2: Timing measurements should follow exponential backoff
              for (let i = 0; i < timingMeasurements.length; i++) {
                const measurement = timingMeasurements[i];
                const expectedBaseDelay = scenario.baseDelay * Math.pow(scenario.backoffMultiplier, i);
                
                // Allow for jitter - delay should be within reasonable range of expected
                const tolerance = expectedBaseDelay * 0.3; // 30% tolerance for jitter
                expect(measurement.delay).toBeGreaterThanOrEqual(expectedBaseDelay - tolerance);
                expect(measurement.delay).toBeLessThanOrEqual(expectedBaseDelay + tolerance);
              }

              // Property 3: Number of retries should not exceed maxRetries
              expect(timingMeasurements.length).toBeLessThanOrEqual(scenario.maxRetries);

            } catch (error) {
              // Property 4: Should fail if failure count exceeds retry limit
              if (scenario.failureCount > scenario.maxRetries) {
                expect(error).toBeDefined();
                expect(mockOperation).toHaveBeenCalledTimes(scenario.maxRetries + 1);
                
                // Should have attempted all retries
                expect(timingMeasurements.length).toBe(scenario.maxRetries);
              } else {
                // If we're here and failure count is within limit, it might be a non-retryable error
                const isRetryable = retryManager.isRetryable(error);
                if (!isRetryable) {
                  expect(timingMeasurements.length).toBe(0);
                } else {
                  throw error; // Unexpected failure
                }
              }
            } finally {
              // Restore setTimeout
              global.setTimeout = originalSetTimeout;
            }
          }
        ),
        { numRuns: 50 } // Reduced for faster execution
      );
    }, 10000); // 10 second timeout

    it('should handle retry timing consistency across different error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Test retry timing for different error types
          fc.record({
            baseDelay: fc.integer({ min: 200, max: 800 }),
            maxRetries: fc.integer({ min: 2, max: 3 }),
            backoffMultiplier: fc.constantFrom(2.0) // Fixed multiplier for consistency
          }),
          async (scenario) => {
            const timingResults = [];
            const errorTypes = [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER_ERROR, ERROR_TYPES.TIMEOUT];
            
            // Mock setTimeout to avoid actual delays
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
              callback();
              return 1;
            });

            try {
              for (const errorType of errorTypes) {
                const mockError = createMockError(errorType, 'timing_test');
                const retryTimings = [];
                
                // Create operation that always fails to test full retry sequence
                const mockOperation = vi.fn().mockRejectedValue(mockError);
                
                const onRetryCallback = vi.fn().mockImplementation((error, attempt, delay) => {
                  retryTimings.push({
                    attempt,
                    delay,
                    errorType,
                    timestamp: Date.now()
                  });
                });

                try {
                  await retryManager.executeWithRetry(
                    mockOperation,
                    'timing_test',
                    {
                      maxRetries: scenario.maxRetries,
                      baseDelay: scenario.baseDelay,
                      backoffMultiplier: scenario.backoffMultiplier,
                      onRetry: onRetryCallback
                    }
                  );
                } catch (error) {
                  // Expected to fail after all retries
                }
                
                timingResults.push({
                  errorType,
                  timings: retryTimings
                });
              }

              // Property 1: Timing should be consistent across error types
              if (timingResults.length > 1) {
                const firstResult = timingResults[0];
                
                for (let i = 1; i < timingResults.length; i++) {
                  const currentResult = timingResults[i];
                  
                  // Should have same number of retry attempts
                  expect(currentResult.timings.length).toBe(firstResult.timings.length);
                  
                  // Delay progression should be similar regardless of error type (allowing for jitter)
                  for (let j = 0; j < firstResult.timings.length; j++) {
                    const expectedDelay = scenario.baseDelay * Math.pow(scenario.backoffMultiplier, j);
                    const tolerance = expectedDelay * 0.3;
                    
                    expect(currentResult.timings[j].delay).toBeGreaterThanOrEqual(expectedDelay - tolerance);
                    expect(currentResult.timings[j].delay).toBeLessThanOrEqual(expectedDelay + tolerance);
                    expect(currentResult.timings[j].attempt).toBe(firstResult.timings[j].attempt);
                  }
                }
              }

              // Property 2: Each timing sequence should follow exponential backoff pattern
              for (const result of timingResults) {
                for (let i = 0; i < result.timings.length; i++) {
                  const expectedDelay = scenario.baseDelay * Math.pow(scenario.backoffMultiplier, i);
                  const tolerance = expectedDelay * 0.3;
                  
                  expect(result.timings[i].delay).toBeGreaterThanOrEqual(expectedDelay - tolerance);
                  expect(result.timings[i].delay).toBeLessThanOrEqual(expectedDelay + tolerance);
                }
              }
            } finally {
              // Restore setTimeout
              global.setTimeout = originalSetTimeout;
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 10000); // 10 second timeout

    it('should respect maximum delay limits in exponential backoff', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            baseDelay: fc.integer({ min: 500, max: 2000 }),
            maxRetries: fc.integer({ min: 3, max: 5 }),
            maxDelay: fc.integer({ min: 5000, max: 15000 })
          }),
          async (scenario) => {
            const delays = [];
            const mockError = createMockError(ERROR_TYPES.NETWORK, 'max_delay_test');
            
            // Create operation that always fails
            const mockOperation = vi.fn().mockRejectedValue(mockError);
            
            const onRetryCallback = vi.fn().mockImplementation((error, attempt, delay) => {
              const calculatedDelay = scenario.baseDelay * Math.pow(2, attempt);
              delays.push({
                attempt,
                calculatedDelay,
                actualDelay: delay,
                cappedByMax: calculatedDelay > scenario.maxDelay
              });
            });

            // Mock setTimeout to avoid actual delays
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
              callback();
              return 1;
            });

            try {
              await retryManager.executeWithRetry(
                mockOperation,
                'max_delay_test',
                {
                  maxRetries: scenario.maxRetries,
                  baseDelay: scenario.baseDelay,
                  maxDelay: scenario.maxDelay,
                  onRetry: onRetryCallback
                }
              );
            } catch (error) {
              // Expected to fail after all retries
            } finally {
              // Restore setTimeout
              global.setTimeout = originalSetTimeout;
            }

            // Property 1: No delay should exceed the maximum (accounting for jitter)
            for (const delayInfo of delays) {
              // The actual delay might include jitter, so we need to be more lenient
              const maxAllowedDelay = scenario.maxDelay * 1.1; // Allow 10% over for jitter
              expect(delayInfo.actualDelay).toBeLessThanOrEqual(maxAllowedDelay);
            }

            // Property 2: Delays should be capped when they would exceed maximum
            for (const delayInfo of delays) {
              if (delayInfo.calculatedDelay > scenario.maxDelay) {
                // The delay should be close to max delay, allowing for jitter
                const tolerance = scenario.maxDelay * 0.1; // 10% tolerance
                expect(delayInfo.actualDelay).toBeGreaterThanOrEqual(scenario.maxDelay - tolerance);
              }
            }

            // Property 3: Should have attempted all retries
            expect(delays.length).toBe(scenario.maxRetries);
          }
        ),
        { numRuns: 15 }
      );
    }, 10000); // 10 second timeout

    it('should only retry retryable error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorType: fc.constantFrom(
              ERROR_TYPES.NETWORK,
              ERROR_TYPES.SERVER_ERROR,
              ERROR_TYPES.TIMEOUT,
              ERROR_TYPES.VALIDATION,
              ERROR_TYPES.ACCESS_DENIED
            ),
            maxRetries: fc.integer({ min: 2, max: 4 }),
            baseDelay: fc.integer({ min: 100, max: 500 })
          }),
          async (scenario) => {
            const mockError = createMockError(scenario.errorType, 'retryable_test');
            const retryAttempts = [];
            
            // Create operation that always fails
            const mockOperation = vi.fn().mockRejectedValue(mockError);
            
            const onRetryCallback = vi.fn().mockImplementation((error, attempt, delay) => {
              retryAttempts.push({ attempt, delay, errorType: scenario.errorType });
            });

            // Mock setTimeout to avoid actual delays
            const originalSetTimeout = global.setTimeout;
            global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
              callback();
              return 1;
            });

            try {
              await retryManager.executeWithRetry(
                mockOperation,
                'retryable_test',
                {
                  maxRetries: scenario.maxRetries,
                  baseDelay: scenario.baseDelay,
                  onRetry: onRetryCallback
                }
              );
            } catch (error) {
              // Expected to fail
            } finally {
              // Restore setTimeout
              global.setTimeout = originalSetTimeout;
            }

            // Property: Only retryable errors should trigger retries
            const isRetryable = retryManager.isRetryable(mockError);
            
            if (isRetryable) {
              // Should have attempted retries
              expect(retryAttempts.length).toBe(scenario.maxRetries);
              expect(mockOperation).toHaveBeenCalledTimes(scenario.maxRetries + 1);
            } else {
              // Should not have attempted retries
              expect(retryAttempts.length).toBe(0);
              expect(mockOperation).toHaveBeenCalledTimes(1);
            }
          }
        ),
        { numRuns: 30 }
      );
    }, 10000); // 10 second timeout
  });
});

// Helper function to create mock errors
function createMockError(errorType, context) {
  const baseErrors = {
    [ERROR_TYPES.NETWORK]: {
      message: 'Network Error',
      response: null,
      code: 'NETWORK_ERROR'
    },
    [ERROR_TYPES.SERVER_ERROR]: {
      message: 'Server Error',
      response: { 
        status: 500, 
        data: { message: 'Internal server error' }
      }
    },
    [ERROR_TYPES.TIMEOUT]: {
      message: 'Request Timeout',
      response: { 
        status: 408, 
        data: { message: 'Request timed out' }
      }
    },
    [ERROR_TYPES.VALIDATION]: {
      message: 'Validation Error',
      response: { 
        status: 422, 
        data: { 
          message: 'Validation failed',
          errors: { field: ['Field is required'] }
        }
      }
    },
    [ERROR_TYPES.ACCESS_DENIED]: {
      message: 'Access Denied',
      response: { 
        status: 403, 
        data: { message: 'You do not have permission to perform this action' }
      }
    }
  };

  const errorConfig = baseErrors[errorType] || baseErrors[ERROR_TYPES.SERVER_ERROR];
  const error = new Error(errorConfig.message);
  error.response = errorConfig.response;
  error.code = errorConfig.code;
  error.context = context;
  
  return error;
}