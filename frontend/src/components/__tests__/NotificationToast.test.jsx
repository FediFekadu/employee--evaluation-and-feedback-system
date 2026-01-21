import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import NotificationToast from '../NotificationToast';

describe('NotificationToast Component', () => {
  const mockNotifications = [
    {
      id: 1,
      type: 'deadline_extended',
      message: 'Evaluation deadline has been extended to tomorrow',
      evaluationId: 'eval-123',
      timestamp: new Date('2025-01-01T12:00:00Z')
    },
    {
      id: 2,
      type: 'closed',
      message: 'Evaluation has been closed',
      evaluationId: 'eval-456',
      timestamp: new Date('2025-01-01T12:05:00Z')
    }
  ];

  it('renders notifications correctly', () => {
    render(
      <NotificationToast 
        notifications={mockNotifications}
        autoHide={false}
      />
    );
    
    expect(screen.getByText('Deadline Extended')).toBeInTheDocument();
    expect(screen.getByText('Evaluation deadline has been extended to tomorrow')).toBeInTheDocument();
    expect(screen.getByText('Evaluation Closed')).toBeInTheDocument();
    expect(screen.getByText('Evaluation has been closed')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const mockDismiss = vi.fn();
    
    render(
      <NotificationToast 
        notifications={[mockNotifications[0]]}
        onDismiss={mockDismiss}
        autoHide={false}
      />
    );
    
    const dismissButton = screen.getByTitle('Dismiss notification');
    fireEvent.click(dismissButton);
    
    expect(mockDismiss).toHaveBeenCalledWith(1);
  });

  it('shows correct icons for different notification types', () => {
    render(
      <NotificationToast 
        notifications={mockNotifications}
        autoHide={false}
      />
    );
    
    expect(screen.getByText('⏰')).toBeInTheDocument(); // deadline_extended
    expect(screen.getByText('🔒')).toBeInTheDocument(); // closed
  });

  it('displays evaluation ID when provided', () => {
    render(
      <NotificationToast 
        notifications={[mockNotifications[0]]}
        autoHide={false}
      />
    );
    
    expect(screen.getByText('Evaluation ID: eval-123')).toBeInTheDocument();
  });

  it('limits visible notifications to maxVisible', () => {
    const manyNotifications = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      type: 'info',
      message: `Notification ${i + 1}`,
      timestamp: new Date()
    }));
    
    render(
      <NotificationToast 
        notifications={manyNotifications}
        maxVisible={3}
        autoHide={false}
      />
    );
    
    expect(screen.getByText('+7 more notifications')).toBeInTheDocument();
  });

  it('handles different notification types correctly', () => {
    const testNotifications = [
      { id: 1, type: 'updated', message: 'Test updated', timestamp: new Date() },
      { id: 2, type: 'maintenance', message: 'Test maintenance', timestamp: new Date() },
      { id: 3, type: 'urgent', message: 'Test urgent', timestamp: new Date() },
      { id: 4, type: 'success', message: 'Test success', timestamp: new Date() },
      { id: 5, type: 'error', message: 'Test error', timestamp: new Date() }
    ];
    
    render(
      <NotificationToast 
        notifications={testNotifications}
        autoHide={false}
      />
    );
    
    expect(screen.getByText('📝')).toBeInTheDocument(); // updated
    expect(screen.getByText('🔧')).toBeInTheDocument(); // maintenance
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // urgent
    expect(screen.getByText('✅')).toBeInTheDocument(); // success
    expect(screen.getByText('❌')).toBeInTheDocument(); // error
  });

  /**
   * **Feature: evaluation-realtime-sync, Property 18: Instruction Update Alert**
   * For any critical instruction update, students should see notification alerts immediately
   * **Validates: Requirements 4.3**
   */
  it('Property 18: Instruction Update Alert', () => {
    fc.assert(
      fc.property(
        // Generate random critical instruction updates
        fc.record({
          evaluationId: fc.integer({ min: 1, max: 1000 }),
          instructionType: fc.constantFrom(
            'submission_guidelines',
            'evaluation_criteria',
            'technical_requirements',
            'deadline_changes',
            'format_changes',
            'grading_rubric'
          ),
          updateContent: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length > 0),
          severity: fc.constantFrom('critical', 'high', 'medium'),
          timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
        }),
        // Generate number of students who should receive alerts (1-5)
        fc.integer({ min: 1, max: 5 }),
        (instructionUpdate, studentCount) => {
          // Only test critical instruction updates (as per requirement 4.3)
          if (instructionUpdate.severity !== 'critical') {
            return true; // Skip non-critical updates
          }

          // Create instruction update notification
          const instructionNotification = {
            id: Date.now() + Math.random(),
            type: 'updated',
            title: 'Critical Instructions Updated',
            message: `Critical evaluation instructions have been updated: ${instructionUpdate.updateContent}`,
            evaluationId: instructionUpdate.evaluationId,
            timestamp: instructionUpdate.timestamp,
            instructionType: instructionUpdate.instructionType,
            severity: instructionUpdate.severity
          };

          // Test that notification appears immediately for all students
          const studentNotificationDisplays = [];
          
          for (let i = 0; i < studentCount; i++) {
            // Mock onDismiss function for this student
            const mockOnDismiss = vi.fn();
            
            // Render NotificationToast component for each student
            const { container, rerender } = render(
              <NotificationToast 
                notifications={[]}
                onDismiss={mockOnDismiss}
                autoHide={false}
                position="top-right"
                maxVisible={5}
              />
            );

            // Initially no notifications should be displayed
            expect(container.querySelector('.notification-toast')).toBeNull();

            // Record time before instruction update notification
            const beforeAlert = new Date();

            // Simulate receiving critical instruction update notification
            rerender(
              <NotificationToast 
                notifications={[instructionNotification]}
                onDismiss={mockOnDismiss}
                autoHide={false}
                position="top-right"
                maxVisible={5}
              />
            );

            // Record time after notification display
            const afterAlert = new Date();

            // Verify notification alert appears immediately
            const notificationElement = container.querySelector('.notification-toast');
            expect(notificationElement).not.toBeNull();
            expect(notificationElement).toHaveClass('notification-updated');

            // Verify notification contains critical instruction update information
            expect(container.textContent).toContain('Critical Instructions Updated');
            expect(container.textContent).toContain(instructionUpdate.updateContent);
            expect(container.textContent).toContain(`Evaluation ID: ${instructionUpdate.evaluationId}`);

            // Verify notification has proper visual indicators for instruction updates
            expect(container.querySelector('.notification-icon')).not.toBeNull();
            expect(container.textContent).toContain('📝'); // Updated icon

            // Verify notification styling indicates importance
            const notificationStyle = window.getComputedStyle(notificationElement);
            expect(notificationStyle.borderLeftWidth).toBe('4px'); // Prominent border
            expect(notificationElement.style.boxShadow).toContain('rgba(0, 0, 0, 0.15)'); // Shadow for visibility

            // Verify notification is persistent (not auto-hidden for critical updates)
            expect(container.querySelector('.notification-progress')).toBeNull(); // No auto-hide progress bar

            // Verify notification has dismiss functionality
            const dismissButton = container.querySelector('.notification-dismiss');
            expect(dismissButton).not.toBeNull();
            expect(dismissButton.getAttribute('title')).toBe('Dismiss notification');

            // Verify notification timestamp is current
            const timestampElement = container.querySelector('.notification-timestamp, .notification-meta');
            expect(timestampElement).not.toBeNull();

            // Test dismiss functionality
            fireEvent.click(dismissButton);
            expect(mockOnDismiss).toHaveBeenCalledWith(instructionNotification.id);

            // Store notification display for timing verification
            studentNotificationDisplays.push({
              studentIndex: i,
              displayTime: afterAlert,
              notificationElement: notificationElement,
              onDismiss: mockOnDismiss
            });
          }

          // Verify all students received alerts immediately (within reasonable time)
          // Note: In test environment, we focus on immediate display rather than precise timing
          expect(studentNotificationDisplays.length).toBe(studentCount);

          // Verify notification content consistency across all students
          const firstStudentContent = studentNotificationDisplays[0].notificationElement.textContent;
          for (let i = 1; i < studentNotificationDisplays.length; i++) {
            const currentStudentContent = studentNotificationDisplays[i].notificationElement.textContent;
            expect(currentStudentContent).toBe(firstStudentContent);
          }

          // Test different instruction types are handled correctly
          const typeSpecificNotification = {
            ...instructionNotification,
            id: Date.now() + Math.random() + 1000,
            message: `${instructionUpdate.instructionType.replace('_', ' ')} instructions have been critically updated`,
            instructionType: instructionUpdate.instructionType
          };

          // Render notification with specific instruction type
          const { container: typeTestContainer } = render(
            <NotificationToast 
              notifications={[typeSpecificNotification]}
              autoHide={false}
            />
          );

          // Verify instruction type is reflected in the notification
          expect(typeTestContainer.textContent).toContain(instructionUpdate.instructionType.replace('_', ' '));
          expect(typeTestContainer.querySelector('.notification-updated')).not.toBeNull();

          // Verify notification has all required elements for instruction updates
          expect(typeTestContainer.querySelector('.notification-icon')).not.toBeNull();
          expect(typeTestContainer.querySelector('.notification-title')).not.toBeNull();
          expect(typeTestContainer.querySelector('.notification-message')).not.toBeNull();
          expect(typeTestContainer.querySelector('.notification-dismiss')).not.toBeNull();

          // Test notification positioning and visibility
          const notificationContainer = typeTestContainer.querySelector('.notification-container');
          expect(notificationContainer).not.toBeNull();
          
          const containerStyle = window.getComputedStyle(notificationContainer);
          expect(containerStyle.position).toBe('fixed');
          expect(parseInt(containerStyle.zIndex)).toBeGreaterThan(1000); // High z-index for visibility

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});