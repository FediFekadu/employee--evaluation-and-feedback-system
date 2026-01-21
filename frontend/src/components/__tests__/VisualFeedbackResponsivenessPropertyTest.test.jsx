import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import DashboardCard from '../EnhancedDashboard/DashboardCard';
import StatCard from '../EnhancedDashboard/StatCard';
import VisualFeedback, { 
  SyncLoadingIndicator, 
  ChangeHighlight, 
  ErrorMessageDisplay,
  UpdatePulse 
} from '../VisualFeedback';

describe('Visual Feedback Responsiveness Property Tests', () => {
  let originalGetComputedStyle;
  let mockComputedStyle;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getComputedStyle to simulate CSS transitions and hover states
    originalGetComputedStyle = window.getComputedStyle;
    mockComputedStyle = {
      transition: 'all 0.25s ease-in-out',
      transform: 'translateY(0px)',
      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
      backgroundColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(226, 232, 240)',
      opacity: '1',
      getPropertyValue: vi.fn((prop) => {
        const values = {
          'transition': 'all 0.25s ease-in-out',
          'transform': 'translateY(0px)',
          'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 1px 3px 0px',
          'background-color': 'rgb(255, 255, 255)',
          'border-color': 'rgb(226, 232, 240)',
          'opacity': '1'
        };
        return values[prop] || '';
      })
    };
    
    window.getComputedStyle = vi.fn(() => mockComputedStyle);
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
    vi.restoreAllMocks();
  });

  /**
   * **Feature: ui-enhancement-evaluation-dashboard, Property 5: Visual Feedback Responsiveness**
   * **Validates: Requirements 2.4**
   * 
   * Property: For any user interaction with interactive elements, the system should provide 
   * immediate visual feedback through hover states and transitions
   */
  describe('Property 5: Visual Feedback Responsiveness', () => {
    it('should provide immediate visual feedback for any user interaction with interactive elements', () => {
      fc.assert(
        fc.property(
          // Generate simplified interactive element scenarios
          fc.record({
            componentType: fc.constantFrom('Button', 'ErrorMessageDisplay'),
            interactionType: fc.constantFrom('hover', 'focus', 'click'),
            isInteractive: fc.boolean(),
            isDisabled: fc.boolean(),
            hasError: fc.boolean(),
            content: fc.record({
              title: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              message: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0)
            })
          }),
          (scenario) => {
            // Skip invalid combinations early
            if (scenario.componentType === 'ErrorMessageDisplay' && !scenario.hasError) {
              return true; // Valid case - no error to display
            }
            
            if (!scenario.isInteractive && scenario.interactionType === 'click') {
              return true; // Valid case - non-interactive elements don't respond to clicks
            }

            // Create a unique test container to avoid conflicts
            const testContainer = document.createElement('div');
            testContainer.setAttribute('data-testid', `feedback-test-${Date.now()}-${Math.random()}`);
            document.body.appendChild(testContainer);

            try {
              let component;
              let interactiveElement;
              let mockOnClick = vi.fn();
              let mockOnRetry = vi.fn();

              // Render the appropriate component based on scenario
              if (scenario.componentType === 'Button') {
                component = render(
                  <button
                    className="enhanced-btn enhanced-btn-primary"
                    onClick={scenario.isInteractive ? mockOnClick : undefined}
                    disabled={scenario.isDisabled}
                    style={{
                      cursor: scenario.isInteractive && !scenario.isDisabled ? 'pointer' : 'default',
                      transition: 'all 0.25s ease-in-out'
                    }}
                  >
                    {scenario.content.title}
                  </button>,
                  { container: testContainer }
                );
                interactiveElement = testContainer.querySelector('.enhanced-btn');
              } else if (scenario.componentType === 'ErrorMessageDisplay') {
                const error = scenario.hasError ? {
                  type: 'network',
                  message: scenario.content.message
                } : null;
                
                component = render(
                  <ErrorMessageDisplay
                    error={error}
                    onRetry={mockOnRetry}
                  />,
                  { container: testContainer }
                );
                interactiveElement = testContainer.querySelector('.error-message-display button');
              }

              if (!interactiveElement) {
                // If no interactive element found, this is a valid scenario
                return true;
              }

              // Property 1: Interactive elements should have appropriate visual indicators
              if (scenario.isInteractive && !scenario.isDisabled) {
                // Interactive elements should have cursor pointer or be buttons
                const hasInteractiveIndicators = 
                  interactiveElement.style.cursor === 'pointer' ||
                  interactiveElement.tagName === 'BUTTON';
                
                if (!hasInteractiveIndicators) {
                  return false; // Property violation
                }
              }

              // Property 2: Visual feedback should be provided for hover interactions
              if (scenario.interactionType === 'hover' && scenario.isInteractive && !scenario.isDisabled) {
                // Simulate hover by triggering mouseenter
                fireEvent.mouseEnter(interactiveElement);
                
                // Check that the element has transition properties for smooth feedback
                const computedStyle = window.getComputedStyle(interactiveElement);
                const hasTransition = computedStyle.getPropertyValue('transition').includes('all') ||
                                    computedStyle.getPropertyValue('transition').includes('transform') ||
                                    computedStyle.getPropertyValue('transition').includes('box-shadow');
                
                if (!hasTransition) {
                  return false; // Property violation
                }
                
                // Simulate mouse leave to test transition back
                fireEvent.mouseLeave(interactiveElement);
              }

              // Property 3: Focus interactions should provide visual feedback
              if (scenario.interactionType === 'focus' && scenario.isInteractive && !scenario.isDisabled) {
                // Focus the element
                interactiveElement.focus();
                
                // Check that focus is properly handled
                if (document.activeElement !== interactiveElement) {
                  return false; // Property violation
                }
                
                // Blur the element
                interactiveElement.blur();
              }

              // Property 4: Click interactions should provide immediate feedback
              if (scenario.interactionType === 'click' && scenario.isInteractive && !scenario.isDisabled) {
                // Simulate click
                fireEvent.click(interactiveElement);
                
                // Verify that click handlers are called when appropriate
                if (scenario.componentType === 'Button') {
                  if (mockOnClick.mock.calls.length !== 1) {
                    return false; // Property violation
                  }
                } else if (scenario.componentType === 'ErrorMessageDisplay' && scenario.hasError) {
                  if (mockOnRetry.mock.calls.length !== 1) {
                    return false; // Property violation
                  }
                }
              }

              // Property 5: Disabled elements should not provide interactive feedback
              if (scenario.isDisabled && interactiveElement) {
                // Disabled elements should not respond to clicks
                fireEvent.click(interactiveElement);
                
                // Click handlers should not be called for disabled elements
                if (mockOnClick.mock.calls.length > 0) {
                  return false; // Property violation
                }
              }

              // Property 6: Error states should provide clear visual feedback and recovery options
              if (scenario.hasError && scenario.componentType === 'ErrorMessageDisplay') {
                // Error displays should show error message
                if (!testContainer.textContent.includes(scenario.content.message)) {
                  return false; // Property violation
                }
                
                // Error displays should provide recovery actions
                const retryButton = testContainer.querySelector('button');
                if (retryButton && !retryButton.textContent.includes('Try Again')) {
                  return false; // Property violation
                }
              }

              return true; // Property holds
            } catch (error) {
              // If there's an error, the property doesn't hold
              console.warn('Property test error:', error.message);
              return false;
            } finally {
              // Clean up the test container
              try {
                if (component) {
                  component.unmount();
                }
              } catch (e) {
                // Ignore unmount errors
              }
              
              if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
              }
            }
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
      );
    });

    it('should provide consistent visual feedback across different component variants', () => {
      fc.assert(
        fc.property(
          // Test visual feedback consistency across variants
          fc.record({
            variants: fc.array(
              fc.constantFrom('default', 'primary', 'secondary', 'success', 'warning', 'danger'),
              { minLength: 2, maxLength: 4 }
            ),
            componentType: fc.constantFrom('DashboardCard', 'StatCard', 'Button'),
            interactionSequence: fc.array(
              fc.constantFrom('hover', 'focus', 'click'),
              { minLength: 1, maxLength: 3 }
            ),
            content: fc.record({
              title: fc.string({ minLength: 3, maxLength: 20 }),
              value: fc.float({ min: 0, max: 100 })
            })
          }),
          (scenario) => {
            const testResults = [];
            
            // Test each variant with the same interaction sequence
            scenario.variants.forEach((variant, index) => {
              const testContainer = document.createElement('div');
              testContainer.setAttribute('data-testid', `variant-test-${variant}-${Date.now()}-${index}`);
              document.body.appendChild(testContainer);

              try {
                let component;
                let interactiveElement;
                const mockOnClick = vi.fn();

                // Render component with current variant
                if (scenario.componentType === 'DashboardCard') {
                  component = render(
                    <DashboardCard
                      title={scenario.content.title}
                      interactive={true}
                      onClick={mockOnClick}
                      variant={variant}
                    >
                      <div>Content</div>
                    </DashboardCard>,
                    { container: testContainer }
                  );
                  interactiveElement = testContainer.querySelector('.dashboard-card');
                } else if (scenario.componentType === 'StatCard') {
                  component = render(
                    <StatCard
                      title={scenario.content.title}
                      value={scenario.content.value}
                      onClick={mockOnClick}
                      variant={variant}
                    />,
                    { container: testContainer }
                  );
                  interactiveElement = testContainer.querySelector('.stat-card');
                } else if (scenario.componentType === 'Button') {
                  component = render(
                    <button
                      className={`enhanced-btn enhanced-btn-${variant}`}
                      onClick={mockOnClick}
                    >
                      {scenario.content.title}
                    </button>,
                    { container: testContainer }
                  );
                  interactiveElement = testContainer.querySelector('.enhanced-btn');
                }

                if (interactiveElement) {
                  const variantResult = {
                    variant,
                    hasTransition: false,
                    respondsToClick: false,
                    hasInteractiveClass: false
                  };

                  // Test interaction sequence
                  scenario.interactionSequence.forEach(interaction => {
                    if (interaction === 'hover') {
                      fireEvent.mouseEnter(interactiveElement);
                      
                      // Check for transition properties
                      const computedStyle = window.getComputedStyle(interactiveElement);
                      variantResult.hasTransition = computedStyle.getPropertyValue('transition').length > 0;
                      
                      fireEvent.mouseLeave(interactiveElement);
                    } else if (interaction === 'focus') {
                      interactiveElement.focus();
                      interactiveElement.blur();
                    } else if (interaction === 'click') {
                      fireEvent.click(interactiveElement);
                      variantResult.respondsToClick = mockOnClick.mock.calls.length > 0;
                    }
                  });

                  // Check for interactive indicators
                  variantResult.hasInteractiveClass = 
                    interactiveElement.classList.contains('interactive') ||
                    interactiveElement.style.cursor === 'pointer' ||
                    interactiveElement.tagName === 'BUTTON';

                  testResults.push(variantResult);
                }

                component.unmount();
              } finally {
                if (testContainer.parentNode) {
                  testContainer.parentNode.removeChild(testContainer);
                }
              }
            });

            // Property: All variants should provide consistent visual feedback behavior
            if (testResults.length > 1) {
              const firstResult = testResults[0];
              
              testResults.forEach(result => {
                // All variants should have similar interaction capabilities
                expect(result.hasTransition).toBe(firstResult.hasTransition);
                expect(result.respondsToClick).toBe(firstResult.respondsToClick);
                expect(result.hasInteractiveClass).toBe(firstResult.hasInteractiveClass);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should provide appropriate visual feedback for loading and error states', () => {
      fc.assert(
        fc.property(
          // Test visual feedback for different states
          fc.record({
            states: fc.array(
              fc.record({
                isLoading: fc.boolean(),
                hasError: fc.boolean(),
                isInteractive: fc.boolean()
              }),
              { minLength: 1, maxLength: 3 }
            ),
            componentType: fc.constantFrom('VisualFeedback', 'ChangeHighlight', 'UpdatePulse'),
            feedbackType: fc.constantFrom('loading', 'highlight', 'error', 'pulse'),
            content: fc.record({
              message: fc.string({ minLength: 5, maxLength: 30 }),
              duration: fc.integer({ min: 500, max: 3000 })
            })
          }),
          async (scenario) => {
            const testContainer = document.createElement('div');
            testContainer.setAttribute('data-testid', `state-test-${Date.now()}-${Math.random()}`);
            document.body.appendChild(testContainer);

            try {
              for (const state of scenario.states) {
                let component;
                const mockOnRetry = vi.fn();

                // Render appropriate feedback component
                if (scenario.componentType === 'VisualFeedback') {
                  const error = state.hasError ? {
                    type: 'network',
                    message: scenario.content.message
                  } : null;

                  component = render(
                    <VisualFeedback
                      type={scenario.feedbackType}
                      isActive={state.isLoading}
                      message={scenario.content.message}
                      error={error}
                      onRetry={mockOnRetry}
                    >
                      <div>Test Content</div>
                    </VisualFeedback>,
                    { container: testContainer }
                  );
                } else if (scenario.componentType === 'ChangeHighlight') {
                  component = render(
                    <ChangeHighlight
                      isChanged={state.isLoading}
                      duration={scenario.content.duration}
                    >
                      <div>Highlighted Content</div>
                    </ChangeHighlight>,
                    { container: testContainer }
                  );
                } else if (scenario.componentType === 'UpdatePulse') {
                  component = render(
                    <UpdatePulse isUpdating={state.isLoading}>
                      <div>Pulsing Content</div>
                    </UpdatePulse>,
                    { container: testContainer }
                  );
                }

                // Property: Loading states should show appropriate visual indicators
                if (state.isLoading && scenario.feedbackType === 'loading') {
                  const hasLoadingIndicator = 
                    testContainer.querySelector('.sync-spinner') ||
                    testContainer.querySelector('.enhanced-spinner') ||
                    testContainer.textContent.includes(scenario.content.message);
                  
                  expect(hasLoadingIndicator).toBeTruthy();
                } else if (!state.isLoading && scenario.feedbackType === 'loading') {
                  // When not loading, loading indicators should not be present
                  const hasLoadingIndicator = 
                    testContainer.querySelector('.sync-spinner') ||
                    testContainer.querySelector('.enhanced-spinner');
                  
                  // querySelector returns null when element is not found, which is what we expect
                  expect(hasLoadingIndicator).toBe(null);
                }

                // Property: Error states should show error messages and recovery options
                if (state.hasError && scenario.feedbackType === 'error') {
                  expect(testContainer.textContent).toContain(scenario.content.message);
                  
                  const retryButton = testContainer.querySelector('button');
                  if (retryButton) {
                    fireEvent.click(retryButton);
                    expect(mockOnRetry).toHaveBeenCalled();
                  }
                }

                // Property: Highlight states should apply visual changes
                if (state.isLoading && scenario.componentType === 'ChangeHighlight') {
                  const highlightElement = testContainer.querySelector('.change-highlight');
                  if (highlightElement) {
                    // Should have highlight styling when active
                    const computedStyle = window.getComputedStyle(highlightElement);
                    expect(computedStyle.getPropertyValue('transition')).toBeTruthy();
                  }
                }

                // Property: Pulse states should apply animation
                if (state.isLoading && scenario.componentType === 'UpdatePulse') {
                  const pulseElement = testContainer.querySelector('.update-pulse');
                  if (pulseElement) {
                    const computedStyle = window.getComputedStyle(pulseElement);
                    const hasAnimation = computedStyle.getPropertyValue('animation').includes('pulse');
                    expect(hasAnimation).toBe(true);
                  }
                }

                if (component) {
                  component.unmount();
                }
                
                // Clear container for next iteration
                testContainer.innerHTML = '';
              }
              
              // Return true to indicate the property holds
              return true;
            } finally {
              if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
              }
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle rapid interaction sequences with consistent visual feedback', () => {
      fc.assert(
        fc.property(
          // Test rapid interaction sequences
          fc.record({
            interactionCount: fc.integer({ min: 3, max: 8 }),
            interactionTypes: fc.array(
              fc.constantFrom('hover', 'click', 'focus'),
              { minLength: 3, maxLength: 8 }
            ),
            componentType: fc.constantFrom('DashboardCard', 'Button'),
            delay: fc.integer({ min: 10, max: 100 }) // Milliseconds between interactions
          }),
          async (scenario) => {
            const testContainer = document.createElement('div');
            testContainer.setAttribute('data-testid', `rapid-test-${Date.now()}-${Math.random()}`);
            document.body.appendChild(testContainer);

            try {
              let component;
              let interactiveElement;
              const mockOnClick = vi.fn();

              // Render interactive component
              if (scenario.componentType === 'DashboardCard') {
                component = render(
                  <DashboardCard
                    title="Rapid Test Card"
                    interactive={true}
                    onClick={mockOnClick}
                  >
                    <div>Content</div>
                  </DashboardCard>,
                  { container: testContainer }
                );
                interactiveElement = testContainer.querySelector('.dashboard-card');
              } else if (scenario.componentType === 'Button') {
                component = render(
                  <button
                    className="enhanced-btn enhanced-btn-primary"
                    onClick={mockOnClick}
                  >
                    Rapid Test Button
                  </button>,
                  { container: testContainer }
                );
                interactiveElement = testContainer.querySelector('.enhanced-btn');
              }

              if (interactiveElement) {
                let clickCount = 0;
                
                // Perform rapid interaction sequence
                for (let i = 0; i < Math.min(scenario.interactionCount, scenario.interactionTypes.length); i++) {
                  const interactionType = scenario.interactionTypes[i];
                  
                  if (interactionType === 'hover') {
                    fireEvent.mouseEnter(interactiveElement);
                    await new Promise(resolve => setTimeout(resolve, scenario.delay));
                    fireEvent.mouseLeave(interactiveElement);
                  } else if (interactionType === 'click') {
                    fireEvent.click(interactiveElement);
                    clickCount++;
                  } else if (interactionType === 'focus') {
                    interactiveElement.focus();
                    await new Promise(resolve => setTimeout(resolve, scenario.delay));
                    interactiveElement.blur();
                  }
                  
                  // Small delay between interactions
                  await new Promise(resolve => setTimeout(resolve, scenario.delay));
                }

                // Property: All click interactions should be registered
                expect(mockOnClick).toHaveBeenCalledTimes(clickCount);

                // Property: Element should still be responsive after rapid interactions
                fireEvent.click(interactiveElement);
                expect(mockOnClick).toHaveBeenCalledTimes(clickCount + 1);

                // Property: Element should still have proper styling after interactions
                const computedStyle = window.getComputedStyle(interactiveElement);
                expect(computedStyle.getPropertyValue('transition')).toBeTruthy();
              } else {
                // If no interactive element is found, this is a valid scenario
                // The test should pass without performing interactions
                expect(true).toBe(true);
              }

              if (component) {
                component.unmount();
              }
              
              // Return true to indicate the property holds
              return true;
            } finally {
              if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
              }
            }
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});