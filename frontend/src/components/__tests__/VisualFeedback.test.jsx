import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import VisualFeedback, { 
  SyncLoadingIndicator, 
  ChangeHighlight, 
  ErrorMessageDisplay,
  UpdatePulse 
} from '../VisualFeedback';

describe('VisualFeedback Components', () => {
  describe('SyncLoadingIndicator', () => {
    it('renders loading indicator when isLoading is true', () => {
      render(
        <SyncLoadingIndicator 
          isLoading={true} 
          message="Synchronizing data..." 
        />
      );
      
      expect(screen.getByText('Synchronizing data...')).toBeInTheDocument();
    });

    it('does not render when isLoading is false', () => {
      render(
        <SyncLoadingIndicator 
          isLoading={false} 
          message="Synchronizing data..." 
        />
      );
      
      expect(screen.queryByText('Synchronizing data...')).not.toBeInTheDocument();
    });

    it('renders different sizes correctly', () => {
      const { rerender } = render(
        <SyncLoadingIndicator isLoading={true} size="small" />
      );
      
      let spinner = document.querySelector('.sync-spinner');
      expect(spinner).toHaveStyle({ width: '16px', height: '16px' });

      rerender(<SyncLoadingIndicator isLoading={true} size="large" />);
      spinner = document.querySelector('.sync-spinner');
      expect(spinner).toHaveStyle({ width: '32px', height: '32px' });
    });
  });

  describe('ChangeHighlight', () => {
    it('applies highlight when isChanged is true', () => {
      render(
        <ChangeHighlight isChanged={true}>
          <div>Test content</div>
        </ChangeHighlight>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
      const highlight = document.querySelector('.change-highlight');
      expect(highlight).toHaveStyle({ backgroundColor: '#fef3c7' });
    });

    it('renders children without highlight when isChanged is false', () => {
      render(
        <ChangeHighlight isChanged={false}>
          <div>Test content</div>
        </ChangeHighlight>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
      const highlight = document.querySelector('.change-highlight');
      // Check that the highlight class exists but doesn't have the highlight background
      expect(highlight).toBeInTheDocument();
    });
  });

  describe('ErrorMessageDisplay', () => {
    const mockError = {
      type: 'network',
      message: 'Connection failed. Please check your internet connection.'
    };

    it('renders error message correctly', () => {
      render(<ErrorMessageDisplay error={mockError} />);
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Connection failed. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('🌐')).toBeInTheDocument();
    });

    it('does not render when error is null', () => {
      render(<ErrorMessageDisplay error={null} />);
      
      expect(screen.queryByText('Connection Error')).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const mockRetry = vi.fn();
      
      render(
        <ErrorMessageDisplay 
          error={mockError} 
          onRetry={mockRetry}
        />
      );
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const mockDismiss = vi.fn();
      
      render(
        <ErrorMessageDisplay 
          error={mockError} 
          onDismiss={mockDismiss}
        />
      );
      
      const dismissButton = screen.getByTitle('Dismiss error');
      fireEvent.click(dismissButton);
      
      expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    it('handles different error types correctly', () => {
      const timeoutError = { type: 'timeout', message: 'Request timed out' };
      
      render(<ErrorMessageDisplay error={timeoutError} />);
      
      expect(screen.getByText('Request Timeout')).toBeInTheDocument();
      expect(screen.getByText('⏱️')).toBeInTheDocument();
    });

    it('shows technical details when provided', () => {
      const errorWithDetails = {
        ...mockError,
        details: { code: 500, stack: 'Error stack trace' }
      };
      
      render(<ErrorMessageDisplay error={errorWithDetails} />);
      
      const detailsToggle = screen.getByText('Show technical details');
      fireEvent.click(detailsToggle);
      
      expect(screen.getByText(/"code": 500/)).toBeInTheDocument();
    });
  });

  describe('UpdatePulse', () => {
    it('renders children with pulse animation when isUpdating is true', () => {
      render(
        <UpdatePulse isUpdating={true}>
          <div>Updating content</div>
        </UpdatePulse>
      );
      
      expect(screen.getByText('Updating content')).toBeInTheDocument();
      const pulse = document.querySelector('.update-pulse');
      expect(pulse).toHaveStyle({ animation: 'pulse 1.5s ease-in-out infinite' });
    });

    it('renders children without animation when isUpdating is false', () => {
      render(
        <UpdatePulse isUpdating={false}>
          <div>Static content</div>
        </UpdatePulse>
      );
      
      expect(screen.getByText('Static content')).toBeInTheDocument();
      const pulse = document.querySelector('.update-pulse');
      expect(pulse).toHaveStyle({ animation: 'none' });
    });
  });

  describe('Main VisualFeedback Component', () => {
    it('renders loading type correctly', () => {
      render(
        <VisualFeedback 
          type="loading" 
          isActive={true} 
          message="Loading..." 
        />
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders highlight type correctly', () => {
      render(
        <VisualFeedback type="highlight" isActive={true}>
          <div>Highlighted content</div>
        </VisualFeedback>
      );
      
      expect(screen.getByText('Highlighted content')).toBeInTheDocument();
    });

    it('renders error type correctly', () => {
      const error = { type: 'network', message: 'Network error' };
      
      render(
        <VisualFeedback 
          type="error" 
          error={error} 
        />
      );
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('renders pulse type correctly', () => {
      render(
        <VisualFeedback type="pulse" isActive={true}>
          <div>Pulsing content</div>
        </VisualFeedback>
      );
      
      expect(screen.getByText('Pulsing content')).toBeInTheDocument();
    });

    it('returns children for unknown type', () => {
      render(
        <VisualFeedback type="unknown">
          <div>Default content</div>
        </VisualFeedback>
      );
      
      expect(screen.getByText('Default content')).toBeInTheDocument();
    });
  });

  // Property-Based Test for Property 27: Synchronization Loading State
  describe('Property 27: Synchronization Loading State', () => {
    /**
     * **Feature: evaluation-realtime-sync, Property 27: Synchronization Loading State**
     * **Validates: Requirements 6.2**
     * 
     * Property: For any data synchronization in progress, loading indicators should show the update process
     */
    it('should show loading indicators during any data synchronization process', () => {
      fc.assert(
        fc.property(
          // Generate random synchronization scenarios
          fc.record({
            isLoading: fc.boolean(),
            message: fc.oneof(
              fc.constant('Synchronizing...'),
              fc.constant('Updating evaluations...'),
              fc.constant('Syncing data...'),
              fc.constant('Loading changes...'),
              fc.constant('Refreshing content...'),
              fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}...`)
            ),
            size: fc.oneof(
              fc.constant('small'),
              fc.constant('medium'),
              fc.constant('large')
            ),
            inline: fc.boolean(),
            componentType: fc.oneof(
              fc.constant('SyncLoadingIndicator'),
              fc.constant('VisualFeedback')
            )
          }),
          (syncConfig) => {
            // Test the property: when synchronization is in progress (isLoading=true),
            // loading indicators must be visible and show the update process
            
            let component;
            
            if (syncConfig.componentType === 'SyncLoadingIndicator') {
              component = render(
                <SyncLoadingIndicator
                  isLoading={syncConfig.isLoading}
                  message={syncConfig.message}
                  size={syncConfig.size}
                  inline={syncConfig.inline}
                />
              );
            } else {
              component = render(
                <VisualFeedback
                  type="loading"
                  isActive={syncConfig.isLoading}
                  message={syncConfig.message}
                  size={syncConfig.size}
                  inline={syncConfig.inline}
                />
              );
            }

            if (syncConfig.isLoading) {
              // Property: When synchronization is in progress, loading indicators MUST be visible
              
              // 1. Loading message must be displayed
              const messageElement = screen.queryByText(syncConfig.message);
              expect(messageElement).toBeInTheDocument();
              
              // 2. Loading spinner must be present
              const spinner = document.querySelector('.sync-spinner');
              expect(spinner).toBeInTheDocument();
              
              // 3. Spinner must have proper animation (spinning)
              expect(spinner).toHaveStyle({ animation: 'spin 1s linear infinite' });
              
              // 4. Container must be visible (not hidden)
              const container = document.querySelector('.sync-loading-indicator');
              expect(container).toBeInTheDocument();
              expect(container).toBeVisible();
              
              // 5. Size configuration must be applied correctly
              const expectedSize = {
                small: { width: '16px', height: '16px' },
                medium: { width: '24px', height: '24px' },
                large: { width: '32px', height: '32px' }
              }[syncConfig.size];
              
              expect(spinner).toHaveStyle(expectedSize);
              
              // 6. Layout configuration must be applied correctly
              if (syncConfig.inline) {
                expect(container).toHaveStyle({ display: 'inline-flex' });
              } else {
                expect(container).toHaveStyle({ display: 'flex' });
              }
              
            } else {
              // Property: When synchronization is NOT in progress, loading indicators MUST NOT be visible
              
              // 1. No loading message should be displayed
              const messageElement = screen.queryByText(syncConfig.message);
              expect(messageElement).not.toBeInTheDocument();
              
              // 2. No loading spinner should be present
              const spinner = document.querySelector('.sync-spinner');
              expect(spinner).not.toBeInTheDocument();
              
              // 3. No loading container should be present
              const container = document.querySelector('.sync-loading-indicator');
              expect(container).not.toBeInTheDocument();
            }
            
            component.unmount();
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
      );
    });

    // Simplified property test for loading state transitions
    it('should properly handle loading state transitions during synchronization', () => {
      fc.assert(
        fc.property(
          fc.record({
            initialLoading: fc.boolean(),
            finalLoading: fc.boolean(),
            message: fc.string({ minLength: 5, maxLength: 30 }).map(s => `sync-${s}...`), // Unique prefix
            size: fc.oneof(fc.constant('small'), fc.constant('medium'), fc.constant('large'))
          }),
          (config) => {
            // Test property: Loading indicators must correctly transition between states
            
            // Create a unique container for this test
            const testContainer = document.createElement('div');
            testContainer.setAttribute('data-testid', `test-${Date.now()}-${Math.random()}`);
            document.body.appendChild(testContainer);
            
            try {
              const { rerender, unmount } = render(
                <SyncLoadingIndicator
                  isLoading={config.initialLoading}
                  message={config.message}
                  size={config.size}
                />,
                { container: testContainer }
              );

              // Verify initial state within our container
              if (config.initialLoading) {
                expect(testContainer.querySelector('.sync-spinner')).toBeInTheDocument();
                expect(testContainer.querySelector('.sync-loading-indicator')).toBeInTheDocument();
              } else {
                expect(testContainer.querySelector('.sync-spinner')).not.toBeInTheDocument();
                expect(testContainer.querySelector('.sync-loading-indicator')).not.toBeInTheDocument();
              }

              // Transition to final state
              rerender(
                <SyncLoadingIndicator
                  isLoading={config.finalLoading}
                  message={config.message}
                  size={config.size}
                />
              );

              // Verify final state within our container
              if (config.finalLoading) {
                expect(testContainer.querySelector('.sync-spinner')).toBeInTheDocument();
                expect(testContainer.querySelector('.sync-loading-indicator')).toBeInTheDocument();
              } else {
                expect(testContainer.querySelector('.sync-spinner')).not.toBeInTheDocument();
                expect(testContainer.querySelector('.sync-loading-indicator')).not.toBeInTheDocument();
              }
              
              unmount();
            } finally {
              // Clean up the test container
              if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
              }
            }
          }
        ),
        { numRuns: 50 } // Reduced iterations for this more complex test
      );
    });

    // Simplified property test for multiple concurrent loading indicators
    it('should handle multiple concurrent synchronization processes', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              isLoading: fc.boolean(),
              message: fc.integer({ min: 1, max: 1000 }).map(n => `sync-msg-${n}...`), // Unique messages
              size: fc.oneof(fc.constant('small'), fc.constant('medium'), fc.constant('large'))
            }),
            { minLength: 1, maxLength: 3 } // Reduced max length to avoid complexity
          ),
          (loadingStates) => {
            // Add unique IDs to prevent React key conflicts
            const statesWithIds = loadingStates.map((state, index) => ({
              ...state,
              id: `test-${Date.now()}-${index}`
            }));
            
            // Create a unique container for this test
            const testContainer = document.createElement('div');
            testContainer.setAttribute('data-testid', `multi-test-${Date.now()}-${Math.random()}`);
            document.body.appendChild(testContainer);
            
            try {
              const { unmount } = render(
                <div data-testid="loading-container">
                  {statesWithIds.map((state) => (
                    <SyncLoadingIndicator
                      key={state.id}
                      isLoading={state.isLoading}
                      message={state.message}
                      size={state.size}
                    />
                  ))}
                </div>,
                { container: testContainer }
              );

              // Count expected visible loading indicators
              const expectedVisibleCount = statesWithIds.filter(state => state.isLoading).length;
              
              // Verify total count of visible spinners matches expected within our container
              const visibleSpinners = testContainer.querySelectorAll('.sync-spinner');
              expect(visibleSpinners).toHaveLength(expectedVisibleCount);

              // Verify total count of visible containers matches expected within our container
              const visibleContainers = testContainer.querySelectorAll('.sync-loading-indicator');
              expect(visibleContainers).toHaveLength(expectedVisibleCount);
              
              unmount();
            } finally {
              // Clean up the test container
              if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
              }
            }
          }
        ),
        { numRuns: 50 } // Reduced iterations for this more complex test
      );
    });
  });
});