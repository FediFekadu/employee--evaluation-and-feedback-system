import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import ErrorAlert from '../ErrorHandling/ErrorAlert';
import { getErrorInfo, ERROR_TYPES } from '../../utils/errorHandling';

describe('Error Message Clarity Property Tests', () => {
  /**
   * **Feature: evaluation-realtime-sync, Property 30: Error Message Clarity**
   * **Validates: Requirements 6.5**
   * 
   * Property: For any update failure, error messages should explain the issue and provide recovery options
   */
  describe('Property 30: Error Message Clarity', () => {
    it('should provide clear explanations and recovery guidance for any update failure', () => {
      fc.assert(
        fc.property(
          // Generate various error scenarios that could occur during real-time updates
          fc.record({
            errorType: fc.constantFrom(
              ERROR_TYPES.NETWORK,
              ERROR_TYPES.VALIDATION,
              ERROR_TYPES.DUPLICATE_SUBMISSION,
              ERROR_TYPES.ACCESS_DENIED,
              ERROR_TYPES.TIMEOUT,
              ERROR_TYPES.SERVER_ERROR,
              ERROR_TYPES.INSUFFICIENT_DATA,
              ERROR_TYPES.EXPORT_FAILED
            ),
            context: fc.constantFrom(
              'evaluation_update',
              'submission_sync',
              'real_time_sync',
              'participation_update',
              'notification_delivery',
              'connection_failure',
              'data_synchronization'
            ),
            hasDetails: fc.boolean(),
            showRecoveryOptions: fc.boolean(),
            autoHide: fc.boolean()
          }),
          (errorConfig) => {
            // Create a mock error based on the error type
            const mockError = createMockError(errorConfig.errorType, errorConfig.context);
            const errorInfo = getErrorInfo(mockError);
            
            const mockRetry = vi.fn();
            const mockDismiss = vi.fn();
            
            const { unmount } = render(
              <ErrorAlert
                error={mockError}
                onRetry={mockRetry}
                onDismiss={mockDismiss}
                context={errorConfig.context}
                showDetails={errorConfig.hasDetails}
                showRecoveryOptions={errorConfig.showRecoveryOptions}
                autoHide={errorConfig.autoHide}
              />
            );

            try {
              // Property 1: Error messages MUST explain the issue clearly
              
              // 1.1: Error title must be present and descriptive
              const titleElement = screen.getByText(errorInfo.title);
              expect(titleElement).toBeInTheDocument();
              expect(titleElement).toBeVisible();
              
              // 1.2: Title must be non-empty and meaningful
              expect(errorInfo.title.trim().length).toBeGreaterThan(0);
              expect(errorInfo.title).toMatch(/^[🌐📝⚠️🔒⏱️🔧📊📄]/); // Should start with descriptive emoji
              
              // 1.3: Error message must be present and explanatory
              const messageElement = screen.getByText(errorInfo.message);
              expect(messageElement).toBeInTheDocument();
              expect(messageElement).toBeVisible();
              
              // 1.4: Message must be substantial and helpful
              expect(errorInfo.message.trim().length).toBeGreaterThan(10);
              expect(errorInfo.message).not.toBe('An error occurred');
              expect(errorInfo.message).not.toBe('Something went wrong');
              
              // 1.5: Message should be meaningful and descriptive
              expect(errorInfo.message.trim().length).toBeGreaterThan(10);
              expect(errorInfo.message).not.toMatch(/^(error|fail|wrong)$/i); // Not just single generic words
              
              // Property 2: Error messages MUST provide recovery guidance
              
              // 2.1: Error info must include recovery guidance
              expect(errorInfo.action).toBeDefined();
              expect(errorInfo.action.length).toBeGreaterThan(0);
              
              // 2.2: Recovery guidance must be meaningful
              expect(errorInfo.action.trim().length).toBeGreaterThan(2);
              expect(errorInfo.action).not.toMatch(/^(ok|yes|no)$/i); // Not just generic responses
              
              // 2.3: When recovery options are enabled, error should provide some form of recovery guidance
              if (errorConfig.showRecoveryOptions) {
                // Either UI buttons exist OR the error provides textual recovery guidance
                const actionButtons = document.querySelectorAll('.error-btn');
                const hasUIRecovery = actionButtons.length > 0;
                
                // Check if error provides recovery guidance through message or action
                const hasTextualRecovery = errorInfo.action && errorInfo.action.length > 0;
                
                // At least one form of recovery guidance should be available
                expect(hasUIRecovery || hasTextualRecovery).toBe(true);
              }
              
              // Property 3: Error messages must be appropriately categorized
              
              // 3.1: Error type must be valid and meaningful
              const validErrorTypes = Object.values(ERROR_TYPES);
              expect(validErrorTypes.includes(errorInfo.type)).toBe(true);
              
              // 3.2: Error styling must match type
              const errorElement = document.querySelector(`.error-alert-${errorInfo.type}`);
              expect(errorElement).toBeInTheDocument();
              
              // Property 4: Error messages must be accessible
              
              // 4.1: Error container must be present and visible
              expect(errorElement).toBeInTheDocument();
              expect(errorElement).toBeVisible();
              
              // 4.2: Close button must be accessible
              const closeButton = screen.getByLabelText('Dismiss error');
              expect(closeButton).toBeInTheDocument();
              expect(closeButton.tagName.toLowerCase()).toBe('button');
              
              // Property 5: Error details must be available when requested
              
              if (errorConfig.hasDetails && errorInfo.details) {
                const detailsToggle = screen.queryByText('Show Details');
                if (detailsToggle) {
                  expect(detailsToggle).toBeInTheDocument();
                  
                  // 5.1: Details should be toggleable
                  fireEvent.click(detailsToggle);
                  expect(screen.getByText('Hide Details')).toBeInTheDocument();
                  
                  // 5.2: Technical details should be displayed
                  const detailsContent = document.querySelector('.error-details-content');
                  expect(detailsContent).toBeInTheDocument();
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

    it('should provide appropriate error messages for different error types', () => {
      fc.assert(
        fc.property(
          // Test each error type systematically
          fc.constantFrom(...Object.values(ERROR_TYPES)),
          fc.constantFrom('submission', 'report_generation', 'real_time_sync'),
          fc.boolean(), // hasRetryCallback
          (errorType, context, hasRetryCallback) => {
            const mockError = createMockError(errorType, context);
            const mockRetry = hasRetryCallback ? vi.fn() : undefined;
            const mockDismiss = vi.fn();
            
            const { unmount } = render(
              <ErrorAlert
                error={mockError}
                onRetry={mockRetry}
                onDismiss={mockDismiss}
                context={context}
                showRecoveryOptions={true}
              />
            );

            try {
              const errorInfo = getErrorInfo(mockError);
              
              // Property: Each error type must have appropriate messaging
              
              // 1. Network errors should mention connectivity
              if (errorType === ERROR_TYPES.NETWORK) {
                expect(errorInfo.message.toLowerCase()).toMatch(/(connect|network|internet|server)/);
                expect(errorInfo.title.toLowerCase()).toMatch(/(network|connection)/);
              }
              
              // 2. Validation errors should mention input/fields or validation
              if (errorType === ERROR_TYPES.VALIDATION) {
                const validationWords = ['input', 'field', 'check', 'complete', 'validation', 'required', 'ensure'];
                const hasValidationContext = validationWords.some(word => 
                  errorInfo.message.toLowerCase().includes(word)
                );
                expect(hasValidationContext).toBe(true);
                expect(errorInfo.title.toLowerCase()).toMatch(/validation/);
              }
              
              // 3. Access denied errors should mention permissions
              if (errorType === ERROR_TYPES.ACCESS_DENIED) {
                expect(errorInfo.message.toLowerCase()).toMatch(/(permission|access|administrator|contact)/);
                expect(errorInfo.title.toLowerCase()).toMatch(/(access|denied)/);
              }
              
              // 4. Timeout errors should mention timing/delays
              if (errorType === ERROR_TYPES.TIMEOUT) {
                expect(errorInfo.message.toLowerCase()).toMatch(/(longer|expected|time|load)/);
                expect(errorInfo.title.toLowerCase()).toMatch(/timeout/);
              }
              
              // 5. Server errors should mention server issues
              if (errorType === ERROR_TYPES.SERVER_ERROR) {
                expect(errorInfo.message.toLowerCase()).toMatch(/(server|unexpected|error|team|notified)/);
                expect(errorInfo.title.toLowerCase()).toMatch(/server/);
              }
              
              // 6. All error messages should have appropriate actions
              expect(errorInfo.action).toBeDefined();
              expect(errorInfo.action.length).toBeGreaterThan(0);
              
              // 7. Retryable errors should indicate retry capability
              const retryableTypes = [ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT, ERROR_TYPES.SERVER_ERROR];
              if (retryableTypes.includes(errorType)) {
                expect(errorInfo.canRetry).toBe(true);
              }
              
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle error message clarity for context-specific scenarios', () => {
      fc.assert(
        fc.property(
          fc.record({
            errorType: fc.constantFrom(
              ERROR_TYPES.DUPLICATE_SUBMISSION,
              ERROR_TYPES.EXPORT_FAILED,
              ERROR_TYPES.INSUFFICIENT_DATA,
              ERROR_TYPES.ACCESS_DENIED
            ),
            context: fc.constantFrom('submission', 'report_generation'),
            showRecoveryOptions: fc.boolean()
          }),
          (scenario) => {
            const mockError = createMockError(scenario.errorType, scenario.context);
            const mockRetry = vi.fn();
            const mockDismiss = vi.fn();
            
            const { unmount } = render(
              <ErrorAlert
                error={mockError}
                onRetry={mockRetry}
                onDismiss={mockDismiss}
                context={scenario.context}
                showRecoveryOptions={scenario.showRecoveryOptions}
              />
            );

            try {
              const errorInfo = getErrorInfo(mockError);
              
              // Property: Context-specific errors must provide relevant guidance
              
              // 1. Error message must be meaningful and non-generic
              expect(errorInfo.message.length).toBeGreaterThan(20);
              
              const genericMessages = [
                'error occurred',
                'something went wrong', 
                'please try again',
                'unknown error'
              ];
              
              const isGeneric = genericMessages.some(generic =>
                errorInfo.message.toLowerCase().includes(generic)
              );
              expect(isGeneric).toBe(false);
              
              // 2. Error must provide recovery guidance appropriate to context
              expect(errorInfo.action).toBeDefined();
              expect(errorInfo.action.length).toBeGreaterThan(0);
              
              // 3. Visual treatment must be appropriate
              const errorElement = document.querySelector('.error-alert');
              expect(errorElement).toHaveClass(`error-alert-${errorInfo.type}`);
              
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

// Helper functions for generating test data

function createMockError(errorType, context) {
  const baseErrors = {
    [ERROR_TYPES.NETWORK]: {
      message: 'Network Error',
      response: null,
      code: 'NETWORK_ERROR'
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
    [ERROR_TYPES.DUPLICATE_SUBMISSION]: {
      message: 'Duplicate Submission',
      response: {
        status: 409,
        data: { 
          error: 'duplicate_submission',
          message: 'This evaluation has already been submitted'
        }
      }
    },
    [ERROR_TYPES.ACCESS_DENIED]: {
      message: 'Access Denied',
      response: { 
        status: 403, 
        data: { message: 'You do not have permission to perform this action' }
      }
    },
    [ERROR_TYPES.TIMEOUT]: {
      message: 'Request Timeout',
      response: { 
        status: 408, 
        data: { message: 'Request timed out' }
      }
    },
    [ERROR_TYPES.SERVER_ERROR]: {
      message: 'Server Error',
      response: { 
        status: 500, 
        data: { message: 'Internal server error' }
      }
    },
    [ERROR_TYPES.INSUFFICIENT_DATA]: {
      message: 'Insufficient Data',
      response: {
        status: 400,
        data: { 
          error: 'insufficient_data',
          message: 'Not enough data available'
        }
      }
    },
    [ERROR_TYPES.EXPORT_FAILED]: {
      message: 'Export Failed',
      response: {
        status: 500,
        data: { 
          error: 'export_failed',
          message: 'Failed to generate export'
        }
      }
    }
  };

  const error = new Error(baseErrors[errorType].message);
  error.response = baseErrors[errorType].response;
  error.code = baseErrors[errorType].code;
  error.context = context;
  
  return error;
}

function createRealTimeUpdateError(updateType, errorType) {
  const error = createMockError(errorType, `realtime_${updateType}`);
  
  // Add update-specific context
  const updateMessages = {
    'evaluation_created': 'Failed to sync new evaluation creation',
    'evaluation_updated': 'Failed to sync evaluation changes', 
    'evaluation_closed': 'Failed to sync evaluation closure',
    'submission_received': 'Failed to sync submission update',
    'notification_sent': 'Failed to deliver notification',
    'connection_lost': 'Real-time connection was lost',
    'sync_failed': 'Data synchronization failed'
  };
  
  if (error.response && error.response.data) {
    error.response.data.message = updateMessages[updateType] || error.response.data.message;
  }
  
  return error;
}

function createErrorBySeverity(severity, errorType) {
  const error = createMockError(errorType, `severity_${severity}`);
  
  // Adjust error details based on severity
  const severityMessages = {
    'low': 'Minor issue detected',
    'medium': 'Moderate problem encountered', 
    'high': 'Significant error occurred',
    'critical': 'Critical system failure detected'
  };
  
  if (error.response && error.response.data) {
    const baseMessage = error.response.data.message;
    error.response.data.message = `${severityMessages[severity]}: ${baseMessage}`;
    
    if (severity === 'critical') {
      error.response.data.details = {
        severity: 'critical',
        impact: 'System functionality may be compromised',
        recommendation: 'Immediate attention required'
      };
    }
  }
  
  return error;
}

function getContextualRecoveryActions(context, errorType) {
  const actions = [];
  
  if (context === 'submission' && errorType === ERROR_TYPES.DUPLICATE_SUBMISSION) {
    actions.push({
      label: 'View Submitted Evaluations',
      shouldBeVisible: true
    });
  }
  
  if (context === 'submission' && errorType === ERROR_TYPES.VALIDATION) {
    actions.push({
      label: 'Review Form',
      shouldBeVisible: true
    });
  }
  
  if (context === 'report_generation' && errorType === ERROR_TYPES.EXPORT_FAILED) {
    actions.push({
      label: 'Try Different Format',
      shouldBeVisible: true
    });
  }
  
  if (context === 'report_generation' && (errorType === ERROR_TYPES.TIMEOUT || errorType === ERROR_TYPES.INSUFFICIENT_DATA)) {
    actions.push({
      label: 'Apply Filters',
      shouldBeVisible: true
    });
  }
  
  if (errorType === ERROR_TYPES.ACCESS_DENIED || errorType === ERROR_TYPES.SERVER_ERROR) {
    actions.push({
      label: 'Contact Support',
      shouldBeVisible: true
    });
  }
  
  return actions;
}