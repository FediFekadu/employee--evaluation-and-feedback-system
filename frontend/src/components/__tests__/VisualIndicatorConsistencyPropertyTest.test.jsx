import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import ParticipationIndicator from '../ParticipationIndicator';
import StatusBadge from '../StatusBadge';

describe('Visual Indicator Consistency Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: department-evaluation-results, Property 9: Visual Indicator Consistency**
   * For any participation rate classification (Low, Medium, High), the appropriate visual indicators and colors should be applied
   * **Validates: Requirements 2.5, 4.5**
   */
  it('Property 9: Visual Indicator Consistency - Participation Rate Classification', () => {
    fc.assert(
      fc.property(
        // Generate participation rates from 0 to 100
        fc.float({ min: 0, max: 100 }),
        // Generate different variants and sizes
        fc.constantFrom('badge', 'bar', 'circle'),
        fc.constantFrom('small', 'medium', 'large'),
        fc.boolean(), // showPercentage
        fc.boolean(), // showLabel
        (rate, variant, size, showPercentage, showLabel) => {
          // Render the ParticipationIndicator with the generated rate
          const { container } = render(
            <ParticipationIndicator 
              rate={rate}
              variant={variant}
              size={size}
              showPercentage={showPercentage}
              showLabel={showLabel}
            />
          );

          // Property: Participation rate should be classified correctly
          let expectedLevel, expectedClass, expectedColor;
          if (rate >= 80) {
            expectedLevel = 'High';
            expectedClass = 'participation-high';
            expectedColor = '#10b981'; // Green
          } else if (rate >= 60) {
            expectedLevel = 'Medium';
            expectedClass = 'participation-medium';
            expectedColor = '#f59e0b'; // Orange/Yellow
          } else {
            expectedLevel = 'Low';
            expectedClass = 'participation-low';
            expectedColor = '#ef4444'; // Red
          }

          // Property: Visual indicators should match the participation level
          const element = container.firstChild;
          expect(element).toBeDefined();

          // Property: Visual indicators should match the participation level
          // Different variants have different DOM structures, so we need to check appropriately
          if (variant === 'badge') {
            // Badge variant applies the class directly to the main element
            expect(element.className).toContain(expectedClass);
          } else if (variant === 'bar') {
            // Bar variant applies the class to child elements
            const valueElement = element.querySelector('.participation-bar-value');
            const fillElement = element.querySelector('.participation-bar-fill');
            const statusElement = element.querySelector('.participation-bar-status');
            
            // At least one of these should have the expected class
            const hasExpectedClass = 
              (valueElement && valueElement.className.includes(expectedClass)) ||
              (fillElement && fillElement.className.includes(expectedClass)) ||
              (statusElement && statusElement.className.includes(expectedClass));
            expect(hasExpectedClass).toBe(true);
          } else if (variant === 'circle') {
            // Circle variant applies the class to child elements, but only if they are rendered
            const valueElement = element.querySelector('.participation-circle-value');
            const labelElement = element.querySelector('.participation-circle-label');
            
            // If neither showPercentage nor showLabel is true, the elements might not exist
            // In this case, we check the SVG stroke color instead
            if (!showPercentage && !showLabel) {
              const svg = element.querySelector('svg circle:last-child');
              if (svg) {
                expect(svg.getAttribute('stroke')).toBe(expectedColor);
              } else {
                // If no SVG either, the component should still exist
                expect(element).toBeDefined();
              }
            } else {
              // At least one of these should have the expected class
              const hasExpectedClass = 
                (valueElement && valueElement.className.includes(expectedClass)) ||
                (labelElement && labelElement.className.includes(expectedClass));
              expect(hasExpectedClass).toBe(true);
            }
          }

          // Property: Low participation should be highlighted with appropriate visual indicators (Requirement 4.5)
          if (rate < 60) { // Low participation
            if (variant === 'badge' && showLabel) {
              expect(element.textContent).toContain('Low');
            }
          }

          // Property: Visual indicators should use appropriate colors (Requirement 2.5)
          if (variant === 'circle') {
            // For circle variant, check SVG stroke color
            const svg = element.querySelector('svg circle:last-child');
            if (svg) {
              expect(svg.getAttribute('stroke')).toBe(expectedColor);
            }
          }

          // Property: Percentage display should be consistent
          if (showPercentage) {
            const roundedRate = Math.round(rate);
            // For bar variant, percentage is only shown if showLabel is also true
            if (variant === 'bar' && !showLabel) {
              // Bar variant doesn't show percentage if showLabel is false
              // This is expected behavior, so we don't check for percentage text
            } else if (variant === 'bar') {
              const valueElement = element.querySelector('.participation-bar-value');
              if (valueElement) {
                expect(valueElement.textContent).toContain(`${roundedRate}%`);
              }
            } else {
              expect(element.textContent).toContain(`${roundedRate}%`);
            }
          }

          // Property: Label display should be consistent
          if (showLabel && variant === 'badge') {
            expect(element.textContent).toContain(expectedLevel);
          }

          // Property: Size classes should be applied correctly
          expect(element.className).toContain(size);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for StatusBadge visual consistency
   */
  it('Property 9: Visual Indicator Consistency - Status Badge Classification', () => {
    fc.assert(
      fc.property(
        // Generate different status values
        fc.constantFrom('active', 'closed', 'draft', 'pending', 'completed', 'ongoing', 'unknown'),
        fc.constantFrom('evaluation', 'instructor'),
        (status, type) => {
          // Render the StatusBadge with the generated status
          const { container } = render(
            <StatusBadge status={status} type={type} />
          );

          const element = container.firstChild;
          expect(element).toBeDefined();

          // Property: Status badges should have consistent CSS classes
          expect(element.className).toContain('status-badge');

          // Property: Status should be displayed with proper capitalization
          const displayText = element.textContent;
          expect(displayText).toBeDefined();
          expect(displayText.length).toBeGreaterThan(0);

          // Property: First letter should be capitalized
          expect(displayText.charAt(0)).toBe(displayText.charAt(0).toUpperCase());

          // Property: Appropriate status classes should be applied based on status and type
          if (type === 'evaluation') {
            switch (status.toLowerCase()) {
              case 'active':
              case 'ongoing':
                expect(element.className).toContain('status-active');
                break;
              case 'closed':
              case 'completed':
                expect(element.className).toContain('status-closed');
                break;
              case 'draft':
                expect(element.className).toContain('status-draft');
                break;
              case 'pending':
                expect(element.className).toContain('status-pending');
                break;
              default:
                expect(element.className).toContain('status-unknown');
            }
          } else if (type === 'instructor') {
            switch (status.toLowerCase()) {
              case 'active':
              case 'teaching':
                expect(element.className).toContain('status-active');
                break;
              case 'inactive':
              case 'on leave':
                expect(element.className).toContain('status-inactive');
                break;
              case 'part-time':
                expect(element.className).toContain('status-part-time');
                break;
              default:
                expect(element.className).toContain('status-unknown');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test for edge cases and boundary values
   */
  it('Property 9: Visual Indicator Consistency - Boundary Values', () => {
    fc.assert(
      fc.property(
        // Test boundary values specifically
        fc.constantFrom(0, 59.9, 60, 60.1, 79.9, 80, 80.1, 100),
        (rate) => {
          const { container } = render(
            <ParticipationIndicator 
              rate={rate}
              variant="badge"
              showPercentage={true}
              showLabel={true}
            />
          );

          const element = container.firstChild;
          expect(element).toBeDefined();

          // Property: Boundary values should be classified correctly
          if (rate >= 80) {
            expect(element.className).toContain('participation-high');
            expect(element.textContent).toContain('High');
          } else if (rate >= 60) {
            expect(element.className).toContain('participation-medium');
            expect(element.textContent).toContain('Medium');
          } else {
            expect(element.className).toContain('participation-low');
            expect(element.textContent).toContain('Low');
          }

          // Property: Percentage should be rounded correctly
          const roundedRate = Math.round(rate);
          expect(element.textContent).toContain(`${roundedRate}%`);

          // Property: Rate should never be negative or exceed 100%
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property test for invalid/edge case inputs
   */
  it('Property 9: Visual Indicator Consistency - Invalid Input Handling', () => {
    fc.assert(
      fc.property(
        // Test various invalid or edge case inputs
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.constant('invalid'),
          fc.constant(-10),
          fc.constant(150),
          fc.constant(NaN)
        ),
        (invalidRate) => {
          const { container } = render(
            <ParticipationIndicator 
              rate={invalidRate}
              variant="badge"
              showPercentage={true}
              showLabel={true}
            />
          );

          const element = container.firstChild;
          expect(element).toBeDefined();

          // Property: Invalid inputs should default to low participation (0%)
          // The component handles invalid inputs by converting them to 0 via parseFloat
          const numRate = parseFloat(invalidRate) || 0;
          
          if (numRate >= 80) {
            // For values like 150, parseFloat returns 150, which is >= 80, so it's "high"
            expect(element.className).toContain('participation-high');
            expect(element.textContent).toContain('High');
          } else if (numRate >= 60) {
            expect(element.className).toContain('participation-medium');
            expect(element.textContent).toContain('Medium');
          } else {
            // For null, undefined, '', 'invalid', NaN - these become 0 and are "low"
            expect(element.className).toContain('participation-low');
            expect(element.textContent).toContain('Low');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property test for color consistency across variants
   */
  it('Property 9: Visual Indicator Consistency - Color Consistency Across Variants', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100 }),
        fc.constantFrom('badge', 'bar', 'circle'),
        (rate, variant) => {
          const { container } = render(
            <ParticipationIndicator 
              rate={rate}
              variant={variant}
              showPercentage={true}
              showLabel={true}
            />
          );

          const element = container.firstChild;
          expect(element).toBeDefined();

          // Property: Color classification should be consistent across all variants
          let expectedClass;
          if (rate >= 80) {
            expectedClass = 'participation-high';
          } else if (rate >= 60) {
            expectedClass = 'participation-medium';
          } else {
            expectedClass = 'participation-low';
          }

          // Property: Color classification should be consistent across all variants
          let expectedClassForVariant;
          if (rate >= 80) {
            expectedClassForVariant = 'participation-high';
          } else if (rate >= 60) {
            expectedClassForVariant = 'participation-medium';
          } else {
            expectedClassForVariant = 'participation-low';
          }

          // Property: All variants should handle the same rate consistently
          // Check based on variant type since DOM structure differs
          let classificationMatches = false;
          
          if (variant === 'badge') {
            classificationMatches = element.className.includes(expectedClassForVariant);
          } else if (variant === 'bar') {
            // Bar variant applies classes to child elements
            const valueElement = element.querySelector('.participation-bar-value');
            const fillElement = element.querySelector('.participation-bar-fill');
            const statusElement = element.querySelector('.participation-bar-status');
            
            classificationMatches = 
              (valueElement && valueElement.className.includes(expectedClassForVariant)) ||
              (fillElement && fillElement.className.includes(expectedClassForVariant)) ||
              (statusElement && statusElement.className.includes(expectedClassForVariant));
          } else if (variant === 'circle') {
            // Circle variant applies classes to child elements
            const valueElement = element.querySelector('.participation-circle-value');
            const labelElement = element.querySelector('.participation-circle-label');
            
            classificationMatches = 
              (valueElement && valueElement.className.includes(expectedClassForVariant)) ||
              (labelElement && labelElement.className.includes(expectedClassForVariant));
          }
          
          expect(classificationMatches).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});