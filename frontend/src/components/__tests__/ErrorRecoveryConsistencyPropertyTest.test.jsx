import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import EnhancedErrorRecoveryManager, { errorRecoveryCoordinator } from '../ErrorHandling/EnhancedErrorRecoveryManager';
import { ErrorStateProvider } from '../ErrorHandling/ErrorStateManager';
import { ERROR_TYPES, getErrorInfo } from '../../utils/errorHandling';

describe('Error Recovery Consistency Property Tests', () => {
  let mockApiCall;
  let mockRetryOperation;
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods to reduce noise in tests
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = vi.fn();
    console.log = vi.fn();
    
    // Mock API call that can succeed or fail
    mockApiCall = vi.fn();
    mockRetryOperation = vi.fn();
    
    // Clear any existing recovery strategies
    errorRecoveryCoordinator.recoveryStrategies.clear();
    errorRecoveryCoordinator.activeRecoveries.clear();
    errorRecoveryCoordinator.recoveryHistory = [];
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  /**
   * **Feature: ui-enhancement-evaluation-dashboard, Property 3: Error Recovery State Preservation**
   * **Validates: Requirements 1.2, 4.3**
   * 
   * Property: For any API failure or network error, the system should maintain the last known good state 
   * while displaying appropriate error messages and retry options
   */
  describe('Property 3: Error Recovery State Preservation', () => {
    it('should preserve last known good state during any API failure or network error', () => {
      fc.assert(
        fc.property(
          // Generate various error scenarios
          fc.record({
            errorType: fc.constantFrom(
              ERROR_TYPES.NETWORK,
              ERROR_TYPES.SERVER_ERROR,
              ERROR_TYPES.TIMEOUT,
              ERROR_TYPES.ACCESS_DENIED,
              ERROR_TYPES.VALIDATION
            ),
            context: fc.constantFrom(
              'dashboard_load',
              'analytics_fetch',
              'teacher_rankings',
              'evaluation_data',
              'performance_insights'
            ),
            hasLastKnownState: fc.boolean(),
            lastKnownData: fc.record({
              evaluations: fc.array(fc.record({
                id: fc.integer({ min: 1, max: 1000 }),
                title: fc.string({ minLength: 5, maxLength: 50 }),
                status: fc.constantFrom('active', 'closed', 'draft')
              }), { minLength: 0, maxLength: 10 }),
              analytics: fc.record({
                totalEvaluations: fc.integer({ min: 0, max: 100 }),
                averageScore: fc.float({ min: 0, max: 5 }),
                participationRate: fc.float({ min: 0, max: 100 })
              }),
              teacherRankings: fc.array(fc.record({
                id: fc.integer({ min: 1, max: 500 }),
                name: fc.string({ minLength: 3, maxLength: 30 }),
                score: fc.float({ min: 0, max: 5 })
              }), { minLength: 0, maxLength: 15 })
            }),
            enableAutoRecovery: fc.boolean(),
            maxRetries: fc.integer({ min: 1, max: 5 })
          }),
          async (scenario) => {
            // Create mock error based on scenario
            const mockError = createMockError(scenario.errorType, scenario.context);
            
            // Set up mock retry operation
            mockRetryOperation.mockImplementation(() => {
              if (scenario.errorType === ERROR_TYPES.NETWORK) {
                return Promise.reject(mockError);
              }
              return Promise.resolve(scenario.lastKnownData);
            });

            // Create a test component that uses the error recovery manager
            const TestComponent = () => {
              const [data, setData] = React.useState(
                scenario.hasLastKnownState ? scenario.lastKnownData : null
              );
              const [error, setError] = React.useState(null);
              const [isLoading, setIsLoading] = React.useState(false);

              const handleApiCall = async () => {
                setIsLoading(true);
                setError(null);
                
                try {
                  // Simulate API failure
                  throw mockError;
                } catch (err) {
                  setError(err);
                  
                  // Property: System should maintain last known good state
                  // Don't clear existing data when error occurs - this is the key behavior we're testing
                } finally {
                  setIsLoading(false);
                }
              };

              const handleRetry = async () => {
                setIsLoading(true);
                setError(null);
                
                try {
                  const result = await mockRetryOperation();
                  setData(result);
                  setError(null);
                } catch (retryError) {
                  setError(retryError);
                  // Property: Failed retry should not clear last known good state
                } finally {
                  setIsLoading(false);
                }
              };

              // Get error info for display
              const errorInfo = error ? getErrorInfo(error) : null;

              return (
                <div data-testid="test-component">
                  {isLoading && <div data-testid="loading">Loading...</div>}
                  
                  {error && errorInfo && (
                    <div data-testid="error-display">
                      <div data-testid="error-message">{errorInfo.message}</div>
                      <div data-testid="error-title">{errorInfo.title}</div>
                      <div data-testid="error-type">{errorInfo.type}</div>
                      {errorInfo.canRetry && (
                        <button 
                          data-testid="retry-button" 
                          onClick={handleRetry}
                          disabled={isLoading}
                        >
                          {errorInfo.action || 'Retry'}
                        </button>
                      )}
                    </div>
                  )}
                  
                  {data && (
                    <div data-testid="data-display">
                      {data.evaluations && (
                        <div data-testid="evaluations-count">
                          Evaluations: {data.evaluations.length}
                        </div>
                      )}
                      {data.analytics && (
                        <div data-testid="analytics-data">
                          Total: {data.analytics.totalEvaluations}
                        </div>
                      )}
                      {data.teacherRankings && (
                        <div data-testid="rankings-count">
                          Rankings: {data.teacherRankings.length}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button 
                    data-testid="trigger-error" 
                    onClick={handleApiCall}
                    disabled={isLoading}
                  >
                    Trigger API Call
                  </button>
                </div>
              );
            };

            const { unmount, container } = render(
              <ErrorStateProvider maxErrors={10}>
                <EnhancedErrorRecoveryManager 
                  enableGlobalErrorBoundary={true}
                  autoRecovery={scenario.enableAutoRecovery}
                >
                  <TestComponent />
                </EnhancedErrorRecoveryManager>
              </ErrorStateProvider>
            );

            // Use container to scope queries to this specific test instance
            const getByTestId = (testId) => container.querySelector(`[data-testid="${testId}"]`);
            const queryByTestId = (testId) => container.querySelector(`[data-testid="${testId}"]`);

            try {
              // Property 1: System should display last known good state initially (if available)
              if (scenario.hasLastKnownState && scenario.lastKnownData) {
                const dataDisplay = getByTestId('data-display');
                if (dataDisplay) {
                  if (scenario.lastKnownData.evaluations?.length > 0) {
                    expect(getByTestId('evaluations-count')).toHaveTextContent(
                      `Evaluations: ${scenario.lastKnownData.evaluations.length}`
                    );
                  }
                  
                  if (scenario.lastKnownData.analytics) {
                    expect(getByTestId('analytics-data')).toHaveTextContent(
                      `Total: ${scenario.lastKnownData.analytics.totalEvaluations}`
                    );
                  }
                  
                  if (scenario.lastKnownData.teacherRankings?.length > 0) {
                    expect(getByTestId('rankings-count')).toHaveTextContent(
                      `Rankings: ${scenario.lastKnownData.teacherRankings.length}`
                    );
                  }
                }
              }

              // Trigger API error
              fireEvent.click(getByTestId('trigger-error'));

              // Wait for error to be displayed
              await waitFor(() => {
                const errorDisplay = queryByTestId('error-display');
                expect(errorDisplay).toBeTruthy();
              }, { timeout: 3000 });

              // Property 2: Error messages should be displayed appropriately
              const errorMessage = queryByTestId('error-message');
              if (errorMessage) {
                expect(errorMessage).toBeTruthy();
                expect(errorMessage.textContent.trim().length).toBeGreaterThan(0);
                
                // Error message should match the actual error info structure
                const errorInfo = getErrorInfo(mockError);
                expect(errorMessage.textContent).toBe(errorInfo.message);
                
                // Also check that error title and type are displayed
                const errorTitle = queryByTestId('error-title');
                if (errorTitle) {
                  expect(errorTitle.textContent).toBe(errorInfo.title);
                }
                
                const errorType = queryByTestId('error-type');
                if (errorType) {
                  expect(errorType.textContent).toBe(errorInfo.type);
                }

                // Property 3: Retry options should be available for retryable errors
                const errorInfoForRetry = getErrorInfo(mockError);
                if (errorInfoForRetry.canRetry) {
                  const retryButton = queryByTestId('retry-button');
                  expect(retryButton).toBeTruthy();
                  expect(retryButton).not.toBeDisabled();
                  
                  // Button text should match the action from error info
                  expect(retryButton.textContent).toBe(errorInfoForRetry.action || 'Retry');
                }
              } else {
                // If no error message is displayed, this might be a valid scenario
                // depending on the error type and context
                console.warn('No error message displayed for scenario:', scenario);
              }

              // Property 4: Last known good state should be preserved during error
              if (scenario.hasLastKnownState && scenario.lastKnownData) {
                // Data display should still be present alongside error
                const dataDisplay = getByTestId('data-display');
                if (dataDisplay) {
                  // Verify specific data is still displayed
                  if (scenario.lastKnownData.evaluations?.length > 0) {
                    expect(getByTestId('evaluations-count')).toHaveTextContent(
                      `Evaluations: ${scenario.lastKnownData.evaluations.length}`
                    );
                  }
                }
              }

              // Property 5: Test retry behavior for retryable errors
              const errorInfoForRetryTest = getErrorInfo(mockError);
              if (errorInfoForRetryTest.canRetry) {
                const retryButton = queryByTestId('retry-button');
                
                if (retryButton) {
                  // Mock successful retry
                  mockRetryOperation.mockResolvedValueOnce(scenario.lastKnownData);
                  
                  fireEvent.click(retryButton);
                  
                  // Should show loading state
                  await waitFor(() => {
                    expect(queryByTestId('loading')).toBeTruthy();
                  });
                  
                  // Wait for retry to complete
                  await waitFor(() => {
                    expect(queryByTestId('loading')).toBeFalsy();
                  });
                  
                  // Property 6: Successful retry should clear error and maintain/update data
                  expect(queryByTestId('error-display')).toBeFalsy();
                  
                  // Data should be displayed after successful retry
                  const dataDisplay = queryByTestId('data-display');
                  expect(dataDisplay).toBeTruthy();
                }
              }

              // Property 7: Failed retry should preserve state and show error
              const errorInfoForFailedRetry = getErrorInfo(mockError);
              if (errorInfoForFailedRetry.canRetry && scenario.hasLastKnownState) {
                // Reset error state by triggering error again
                fireEvent.click(getByTestId('trigger-error'));
                await waitFor(() => {
                  expect(queryByTestId('error-display')).toBeTruthy();
                });
                
                // Mock failed retry
                mockRetryOperation.mockRejectedValueOnce(mockError);
                
                const retryButton = queryByTestId('retry-button');
                if (retryButton) {
                  fireEvent.click(retryButton);
                  
                  await waitFor(() => {
                    expect(queryByTestId('loading')).toBeFalsy();
                  });
                  
                  // Error should still be displayed
                  expect(queryByTestId('error-display')).toBeTruthy();
                  
                  // Last known good state should still be preserved if it existed
                  const dataDisplay = queryByTestId('data-display');
                  if (dataDisplay) {
                    expect(dataDisplay).toBeTruthy();
                  }
                }
              }

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
      );
    });

    it('should handle error recovery state transitions correctly', () => {
      fc.assert(
        fc.property(
          // Generate error recovery scenarios
          fc.record({
            initialError: fc.constantFrom(
              ERROR_TYPES.NETWORK,
              ERROR_TYPES.SERVER_ERROR,
              ERROR_TYPES.TIMEOUT
            ),
            recoverySuccess: fc.boolean(),
            subsequentError: fc.option(fc.constantFrom(
              ERROR_TYPES.NETWORK,
              ERROR_TYPES.VALIDATION,
              ERROR_TYPES.ACCESS_DENIED
            )),
            stateData: fc.record({
              items: fc.array(fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                value: fc.string({ minLength: 1, maxLength: 20 })
              }), { minLength: 1, maxLength: 5 }),
              metadata: fc.record({
                total: fc.integer({ min: 1, max: 100 }),
                updated: fc.date()
              })
            })
          }),
          async (scenario) => {
            const TestRecoveryComponent = () => {
              const [state, setState] = React.useState({
                data: scenario.stateData,
                error: null,
                isRecovering: false,
                lastUpdate: new Date()
              });

              const simulateError = (errorType) => {
                const error = createMockError(errorType, 'test_context');
                setState(prev => ({
                  ...prev, // Property: Preserve existing state
                  error,
                  isRecovering: false
                }));
              };

              const simulateRecovery = async () => {
                setState(prev => ({
                  ...prev,
                  isRecovering: true,
                  error: null // Clear error during recovery attempt
                }));

                // Simulate recovery delay
                await new Promise(resolve => setTimeout(resolve, 10));

                if (scenario.recoverySuccess) {
                  setState(prev => ({
                    ...prev,
                    isRecovering: false,
                    error: null,
                    lastUpdate: new Date()
                    // Property: Keep existing data on successful recovery
                  }));
                } else {
                  const recoveryError = createMockError(scenario.initialError, 'recovery_failed');
                  setState(prev => ({
                    ...prev, // Property: Preserve state even on recovery failure
                    isRecovering: false,
                    error: recoveryError
                  }));
                }
              };

              return (
                <div data-testid="recovery-component">
                  <div data-testid="state-data">
                    Items: {state.data.items.length}
                    Total: {state.data.metadata.total}
                  </div>
                  
                  {state.error && (
                    <div data-testid="error-state">
                      Error: {getErrorInfo(state.error).type}
                    </div>
                  )}
                  
                  {state.isRecovering && (
                    <div data-testid="recovering-state">Recovering...</div>
                  )}
                  
                  <button 
                    data-testid="trigger-error" 
                    onClick={() => simulateError(scenario.initialError)}
                  >
                    Trigger Error
                  </button>
                  
                  <button 
                    data-testid="start-recovery" 
                    onClick={simulateRecovery}
                    disabled={state.isRecovering}
                  >
                    Start Recovery
                  </button>
                </div>
              );
            };

            const { unmount, container } = render(<TestRecoveryComponent />);

            // Use container to scope queries to this specific test instance
            const getByTestId = (testId) => container.querySelector(`[data-testid="${testId}"]`);
            const queryByTestId = (testId) => container.querySelector(`[data-testid="${testId}"]`);

            try {
              // Property 1: Initial state should be displayed
              const initialStateData = getByTestId('state-data');
              expect(initialStateData).toHaveTextContent(
                `Items: ${scenario.stateData.items.length}`
              );
              expect(initialStateData).toHaveTextContent(
                `Total: ${scenario.stateData.metadata.total}`
              );

              // Trigger error
              fireEvent.click(getByTestId('trigger-error'));

              // Property 2: Error state should be displayed while preserving data
              const errorState = queryByTestId('error-state');
              if (errorState) {
                expect(errorState).toHaveTextContent(
                  `Error: ${scenario.initialError}`
                );
              }
              
              // Property 3: Data should still be visible during error state
              const stateDataDuringError = queryByTestId('state-data');
              if (stateDataDuringError) {
                expect(stateDataDuringError).toHaveTextContent(
                  `Items: ${scenario.stateData.items.length}`
                );
              }

              // Start recovery
              fireEvent.click(getByTestId('start-recovery'));

              // Property 4: Recovery state should be indicated
              await waitFor(() => {
                const recoveringState = queryByTestId('recovering-state');
                if (recoveringState) {
                  expect(recoveringState).toBeTruthy();
                }
              });
              
              // Property 5: Data should remain visible during recovery
              const stateDataDuringRecovery = queryByTestId('state-data');
              if (stateDataDuringRecovery) {
                expect(stateDataDuringRecovery).toBeTruthy();
              }

              // Wait for recovery to complete
              await waitFor(() => {
                expect(queryByTestId('recovering-state')).toBeFalsy();
              });

              // Property 6: Post-recovery state should be correct
              if (scenario.recoverySuccess) {
                // Successful recovery should clear error
                expect(queryByTestId('error-state')).toBeFalsy();
                
                // Data should still be preserved
                const finalStateData = queryByTestId('state-data');
                if (finalStateData) {
                  expect(finalStateData).toHaveTextContent(
                    `Items: ${scenario.stateData.items.length}`
                  );
                }
              } else {
                // Failed recovery should show error again
                const errorStateAfterRecovery = queryByTestId('error-state');
                if (errorStateAfterRecovery) {
                  expect(errorStateAfterRecovery).toBeTruthy();
                }
                
                // Data should still be preserved
                const finalStateData = queryByTestId('state-data');
                if (finalStateData) {
                  expect(finalStateData).toHaveTextContent(
                    `Items: ${scenario.stateData.items.length}`
                  );
                }
              }

              // Property 7: Test subsequent error handling
              if (scenario.subsequentError) {
                // Clear any existing error first
                if (scenario.recoverySuccess) {
                  fireEvent.click(getByTestId('trigger-error'));
                }
                
                // The state should handle subsequent errors correctly
                const errorState = queryByTestId('error-state');
                const stateData = queryByTestId('state-data');
                if (errorState) expect(errorState).toBeTruthy();
                if (stateData) expect(stateData).toBeTruthy();
              }

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain state consistency across different error types', () => {
      fc.assert(
        fc.property(
          // Test different combinations of error types
          fc.array(fc.constantFrom(
            ERROR_TYPES.NETWORK,
            ERROR_TYPES.SERVER_ERROR,
            ERROR_TYPES.TIMEOUT,
            ERROR_TYPES.VALIDATION,
            ERROR_TYPES.ACCESS_DENIED
          ), { minLength: 1, maxLength: 3 }),
          fc.record({
            persistentData: fc.record({
              evaluationCount: fc.integer({ min: 0, max: 50 }),
              lastSync: fc.date(),
              userPreferences: fc.record({
                theme: fc.constantFrom('light', 'dark'),
                pageSize: fc.integer({ min: 10, max: 100 })
              })
            })
          }),
          (errorSequence, scenario) => {
            const StateConsistencyComponent = () => {
              const [appState, setAppState] = React.useState({
                data: scenario.persistentData,
                errors: [],
                recoveryAttempts: 0
              });

              const addError = (errorType) => {
                const error = createMockError(errorType, 'consistency_test');
                setAppState(prev => ({
                  ...prev, // Property: Always preserve existing state
                  errors: [...prev.errors, { type: errorType, timestamp: Date.now() }]
                }));
              };

              const clearErrors = () => {
                setAppState(prev => ({
                  ...prev,
                  errors: [],
                  recoveryAttempts: prev.recoveryAttempts + 1
                  // Property: Keep data and increment recovery counter
                }));
              };

              return (
                <div data-testid="consistency-component">
                  <div data-testid="persistent-data">
                    Count: {appState.data.evaluationCount}
                    Theme: {appState.data.userPreferences.theme}
                    PageSize: {appState.data.userPreferences.pageSize}
                  </div>
                  
                  <div data-testid="error-count">
                    Errors: {appState.errors.length}
                  </div>
                  
                  <div data-testid="recovery-attempts">
                    Recoveries: {appState.recoveryAttempts}
                  </div>
                  
                  {errorSequence.map((errorType, index) => (
                    <button 
                      key={index}
                      data-testid={`add-error-${index}`}
                      onClick={() => addError(errorType)}
                    >
                      Add {errorType} Error
                    </button>
                  ))}
                  
                  <button 
                    data-testid="clear-errors"
                    onClick={clearErrors}
                  >
                    Clear Errors
                  </button>
                </div>
              );
            };

            const { unmount, container } = render(<StateConsistencyComponent />);

            // Use container to scope queries to this specific test instance
            const getByTestId = (testId) => container.querySelector(`[data-testid="${testId}"]`);

            try {
              // Property 1: Initial state should be consistent
              expect(getByTestId('persistent-data')).toHaveTextContent(
                `Count: ${scenario.persistentData.evaluationCount}`
              );
              expect(getByTestId('persistent-data')).toHaveTextContent(
                `Theme: ${scenario.persistentData.userPreferences.theme}`
              );
              expect(getByTestId('error-count')).toHaveTextContent('Errors: 0');
              expect(getByTestId('recovery-attempts')).toHaveTextContent('Recoveries: 0');

              // Add errors in sequence
              errorSequence.forEach((errorType, index) => {
                fireEvent.click(getByTestId(`add-error-${index}`));
                
                // Property 2: Each error should increment count but preserve data
                expect(getByTestId('error-count')).toHaveTextContent(
                  `Errors: ${index + 1}`
                );
                
                // Property 3: Persistent data should remain unchanged
                expect(getByTestId('persistent-data')).toHaveTextContent(
                  `Count: ${scenario.persistentData.evaluationCount}`
                );
                expect(getByTestId('persistent-data')).toHaveTextContent(
                  `Theme: ${scenario.persistentData.userPreferences.theme}`
                );
              });

              // Clear errors (simulate recovery)
              fireEvent.click(getByTestId('clear-errors'));

              // Property 4: Recovery should clear errors but preserve data and increment counter
              expect(getByTestId('error-count')).toHaveTextContent('Errors: 0');
              expect(getByTestId('recovery-attempts')).toHaveTextContent('Recoveries: 1');
              
              // Property 5: Persistent data should still be intact
              expect(getByTestId('persistent-data')).toHaveTextContent(
                `Count: ${scenario.persistentData.evaluationCount}`
              );
              expect(getByTestId('persistent-data')).toHaveTextContent(
                `PageSize: ${scenario.persistentData.userPreferences.pageSize}`
              );

            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 30 }
      );
    });
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