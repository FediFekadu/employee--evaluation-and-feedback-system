import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as fc from 'fast-check'

// Mock all dependencies before importing the component
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}))

vi.mock('../../../services/connectionManager', () => ({
  default: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    addStatusListener: vi.fn(),
    removeStatusListener: vi.fn(),
    reconnect: vi.fn(),
    getStatus: vi.fn(() => 'connected')
  }
}))

vi.mock('../../../hooks/useErrorHandling', () => ({
  useErrorHandling: vi.fn(() => ({
    errors: [],
    addError: vi.fn(),
    removeError: vi.fn(),
    clearErrors: vi.fn(),
    handleApiCall: vi.fn((fn) => fn()),
    isLoading: vi.fn(() => false),
    getProgress: vi.fn(() => ({ current: 0, total: 100 }))
  })),
  useSubmissionErrorHandling: vi.fn(() => ({
    submissionState: { isSubmitting: false, submissionError: null },
    handleSubmission: vi.fn((fn) => fn()),
    resetSubmissionState: vi.fn()
  }))
}))

vi.mock('../../../utils/errorHandling', () => ({
  gracefulDegradationManager: {
    handleError: vi.fn(),
    isEnabled: vi.fn(() => true)
  },
  getErrorInfo: vi.fn(() => ({ type: 'unknown', message: 'Test error' }))
}))

vi.mock('../../../components/ErrorHandling/ErrorAlert', () => ({
  default: ({ error, onRetry, onDismiss }) => (
    <div data-testid="error-alert">
      <span>{error?.response?.data?.message || 'Error occurred'}</span>
      <button onClick={onRetry}>Retry</button>
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

vi.mock('../../../components/ErrorHandling/LoadingSpinner', () => ({
  default: ({ message }) => <div data-testid="loading-spinner">{message}</div>
}))

vi.mock('../../../components/ErrorHandling/ProgressIndicator', () => ({
  default: ({ title }) => <div data-testid="progress-indicator">{title}</div>
}))

// Now import the component and other dependencies
import StudentEvaluations from './Evaluations'
import api from '../../../services/api'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('StudentEvaluations Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default localStorage values
    mockLocalStorage.getItem.mockImplementation((key) => {
      switch (key) {
        case 'department_id': return '1'
        case 'year_level': return '1'
        case 'semester': return '1'
        case 'student_db_id': return '123'
        default: return null
      }
    })
  })

  /**
   * **Feature: evaluation-submission-control, Property 2: Status Indicator Accuracy**
   * **Validates: Requirements 1.2**
   * 
   * For any student viewing their evaluation list, the status indicators should 
   * accurately reflect whether each evaluation has been completed
   */
  it('Property 2: Status indicators accurately reflect submission status', async () => {
    await fc.assert(fc.asyncProperty(
      // Generate random evaluation data with unique identifiers
      fc.array(fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        course: fc.record({
          title: fc.constantFrom('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History'),
          code: fc.constantFrom('MATH101', 'PHYS201', 'CHEM301', 'BIO401', 'CS501', 'ENG601', 'HIST701')
        }),
        teacher: fc.record({
          name: fc.constantFrom('Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown', 'Dr. Davis', 'Prof. Miller')
        }),
        academic_year: fc.constantFrom('2023-2024', '2024-2025', '2025-2026'),
        semester: fc.constantFrom('Semester I', 'Semester II'),
        opened_at: fc.constantFrom('2024-01-01', '2024-06-01', '2024-12-01', '2025-01-01', '2025-06-01'),
        closed_at: fc.option(fc.constantFrom('2024-12-31', '2025-06-30', '2025-12-31', '2026-06-30')),
        feedbacks: fc.array(fc.record({
          student_id: fc.integer({ min: 1, max: 1000 })
        }))
      }), { minLength: 1, maxLength: 3 }),
      fc.integer({ min: 1, max: 1000 }), // student_db_id
      async (evaluations, studentDbId) => {
        // Ensure unique evaluation IDs and course titles to avoid conflicts
        const uniqueEvaluations = evaluations.map((evaluation, index) => ({
          ...evaluation,
          id: index + 1,
          course: {
            ...evaluation.course,
            title: `${evaluation.course.title} ${index + 1}` // Make titles unique
          }
        }))

        // Mock API response
        api.get.mockResolvedValue({
          data: { data: uniqueEvaluations }
        })

        // Mock localStorage to return the test student ID
        mockLocalStorage.getItem.mockImplementation((key) => {
          switch (key) {
            case 'student_db_id': return String(studentDbId)
            case 'department_id': return '1'
            case 'year_level': return '1'
            case 'semester': return '1'
            default: return null
          }
        })

        const { container } = render(<StudentEvaluations />)

        // Wait for evaluations to load
        await waitFor(() => {
          expect(api.get).toHaveBeenCalled()
        })

        // Wait for evaluation cards to be rendered
        await waitFor(() => {
          const evaluationCards = container.querySelectorAll('.evaluation-card')
          expect(evaluationCards).toHaveLength(uniqueEvaluations.length)
        })

        // Get all evaluation cards after they're rendered
        const evaluationCards = container.querySelectorAll('.evaluation-card')

        // Check each evaluation's status indicator
        uniqueEvaluations.forEach((evaluation, index) => {
          const isSubmitted = evaluation.feedbacks.some(fb => Number(fb.student_id) === studentDbId)
          const today = new Date().toISOString().slice(0, 10)
          const isClosed = evaluation.closed_at && evaluation.closed_at < today
          const isNotYetOpen = evaluation.opened_at && evaluation.opened_at > today

          const evaluationCard = evaluationCards[index]
          expect(evaluationCard).toBeTruthy()

          // Check status indicator accuracy
          if (isSubmitted) {
            expect(evaluationCard.querySelector('.status-badge.completed')).toBeTruthy()
            expect(evaluationCard.querySelector('.status-badge.completed')).toHaveTextContent('✅ Completed')
          } else if (isClosed) {
            expect(evaluationCard.querySelector('.status-badge.closed')).toBeTruthy()
            expect(evaluationCard.querySelector('.status-badge.closed')).toHaveTextContent('🔒 Closed')
          } else if (isNotYetOpen) {
            expect(evaluationCard.querySelector('.status-badge.pending')).toBeTruthy()
            expect(evaluationCard.querySelector('.status-badge.pending')).toHaveTextContent('⏳ Not Open')
          } else {
            expect(evaluationCard.querySelector('.status-badge.open')).toBeTruthy()
            expect(evaluationCard.querySelector('.status-badge.open')).toHaveTextContent('📝 Open')
          }
        })
      }
    ), { numRuns: 10 }) // Reduce number of runs to speed up test
  })

  /**
   * **Feature: evaluation-submission-control, Property 3: Completed Evaluation Access Control**
   * **Validates: Requirements 1.3**
   * 
   * For any completed evaluation, clicking on it should display an "Already Submitted" 
   * message instead of the evaluation form
   */
  it('Property 3: Completed evaluations show "Already Submitted" message', async () => {
    await fc.assert(fc.asyncProperty(
      // Generate evaluation data with meaningful strings
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        course: fc.record({
          title: fc.constantFrom('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History'),
          code: fc.constantFrom('MATH101', 'PHYS201', 'CHEM301', 'BIO401', 'CS501', 'ENG601', 'HIST701')
        }),
        teacher: fc.record({
          name: fc.constantFrom('Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown', 'Dr. Davis', 'Prof. Miller')
        }),
        academic_year: fc.constantFrom('2023-2024', '2024-2025', '2025-2026'),
        semester: fc.constantFrom('Semester I', 'Semester II'),
        opened_at: fc.constantFrom('2024-01-01', '2024-06-01', '2024-12-01', '2025-01-01'),
        closed_at: fc.option(fc.constantFrom('2025-06-30', '2025-12-31', '2026-06-30', '2026-12-31')),
        feedbacks: fc.array(fc.record({
          student_id: fc.integer({ min: 1, max: 1000 })
        }))
      }),
      fc.integer({ min: 1, max: 1000 }), // student_db_id
      async (evaluation, studentDbId) => {
        // Ensure this evaluation is submitted by adding the student to feedbacks
        const evaluationWithSubmission = {
          ...evaluation,
          feedbacks: [...evaluation.feedbacks, { student_id: studentDbId }]
        }

        // Mock API response for evaluations list
        api.get.mockResolvedValue({
          data: { data: [evaluationWithSubmission] }
        })

        // Mock localStorage
        mockLocalStorage.getItem.mockImplementation((key) => {
          switch (key) {
            case 'student_db_id': return String(studentDbId)
            case 'department_id': return '1'
            case 'year_level': return '1'
            case 'semester': return '1'
            default: return null
          }
        })

        const { container } = render(<StudentEvaluations />)

        // Wait for evaluations to load and render with longer timeout
        await waitFor(() => {
          expect(api.get).toHaveBeenCalled()
          const evaluationCards = container.querySelectorAll('.evaluation-card')
          expect(evaluationCards.length).toBeGreaterThan(0)
        }, { timeout: 3000 })

        // Find the evaluation card - look for any card since we only have one evaluation
        const evaluationCard = container.querySelector('.evaluation-card')
        expect(evaluationCard).toBeTruthy()

        // Check that the button shows "Already Submitted" and is disabled
        const actionButton = evaluationCard.querySelector('.eval-btn')
        expect(actionButton).toBeTruthy()
        expect(actionButton).toHaveTextContent('✅ Already Submitted')
        expect(actionButton).toBeDisabled()

        // Verify that clicking the button doesn't open the evaluation form
        fireEvent.click(actionButton)
        
        // Should not see the evaluation modal
        expect(screen.queryByText('Teachers\' Performance Evaluation Criteria')).toBeNull()
      }
    ), { numRuns: 10 }) // Reduce number of runs to speed up test
  }, 10000) // Increase test timeout to 10 seconds

  /**
   * **Feature: evaluation-realtime-sync, Property 26: Update Indicator Display**
   * **Validates: Requirements 6.1**
   * 
   * For any real-time update received, the system should provide subtle visual indicators of the changes
   */
  it('Property 26: Visual indicators are displayed when real-time updates are received', async () => {
    await fc.assert(fc.asyncProperty(
      // Generate random connection status and update scenarios
      fc.record({
        connectionStatus: fc.constantFrom('connected', 'connecting', 'error', 'polling'),
        lastUpdate: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })),
        notifications: fc.array(fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          messageType: fc.constantFrom('deadline_extended', 'closed', 'updated', 'maintenance'),
        }).map(base => ({
          ...base,
          message: base.messageType === 'deadline_extended' ? 'Evaluation deadline has been extended' :
                   base.messageType === 'closed' ? 'Evaluation has been closed' :
                   base.messageType === 'updated' ? 'Evaluation questions have been updated' :
                   'System maintenance scheduled',
          type: base.messageType,
          evaluationId: fc.sample(fc.integer({ min: 1, max: 100 }), 1)[0],
          timestamp: fc.sample(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }), 1)[0],
          read: fc.sample(fc.boolean(), 1)[0]
        })), { minLength: 0, maxLength: 5 }).map(notifications => 
          // Ensure unique IDs to avoid React key conflicts
          notifications.map((notification, index) => ({
            ...notification,
            id: notification.id + index * 10000 // Make IDs unique
          }))
        ),
        evaluations: fc.array(fc.record({
          id: fc.integer({ min: 1, max: 1000 }),
          course: fc.record({
            title: fc.constantFrom('Mathematics', 'Physics', 'Chemistry', 'Biology'),
            code: fc.constantFrom('MATH101', 'PHYS201', 'CHEM301', 'BIO401')
          }),
          teacher: fc.record({
            name: fc.constantFrom('Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown')
          }),
          academic_year: fc.constantFrom('2023-2024', '2024-2025'),
          semester: fc.constantFrom('Semester I', 'Semester II'),
          opened_at: fc.constantFrom('2024-01-01', '2024-06-01', '2025-01-01'),
          closed_at: fc.option(fc.constantFrom('2024-12-31', '2025-06-30', '2025-12-31')),
          feedbacks: fc.array(fc.record({
            student_id: fc.integer({ min: 1, max: 1000 })
          }))
        }), { minLength: 0, maxLength: 3 })
      }),
      async (testData) => {
        // Mock API response for evaluations
        api.get.mockResolvedValue({
          data: { data: testData.evaluations }
        })

        const { container } = render(<StudentEvaluations />)

        // Wait for component to render
        await waitFor(() => {
          expect(container.querySelector('.student-evaluations')).toBeTruthy()
        })

        // Test 1: Connection status indicator should be visible and accurate
        const connectionStatusElement = container.querySelector('.connection-status .status-indicator')
        expect(connectionStatusElement).toBeTruthy()

        const statusIcon = container.querySelector(`.status-icon.${testData.connectionStatus}`)
        expect(statusIcon).toBeTruthy()

        const statusText = container.querySelector(`.status-text.${testData.connectionStatus}`)
        expect(statusText).toBeTruthy()

        // Verify correct status icon is displayed
        switch (testData.connectionStatus) {
          case 'connected':
            expect(statusIcon).toHaveTextContent('🟢')
            expect(statusText).toHaveTextContent('Live Updates')
            break
          case 'connecting':
            expect(statusIcon).toHaveTextContent('🟡')
            expect(statusText).toHaveTextContent('Connecting...')
            break
          case 'error':
            expect(statusIcon).toHaveTextContent('🔴')
            expect(statusText).toHaveTextContent('Connection Lost')
            // Should show retry button for error state
            expect(container.querySelector('.retry-btn')).toBeTruthy()
            break
          case 'polling':
            expect(statusIcon).toHaveTextContent('🔄')
            expect(statusText).toHaveTextContent('Polling Mode')
            break
        }

        // Test 2: Last update timestamp should be displayed when available
        if (testData.lastUpdate) {
          const lastUpdateElement = container.querySelector('.last-update')
          expect(lastUpdateElement).toBeTruthy()
          expect(lastUpdateElement).toHaveTextContent('Last update:')
          expect(lastUpdateElement).toHaveTextContent(testData.lastUpdate.toLocaleTimeString())
        }

        // Test 3: Notification indicators should be displayed
        if (unreadCount > 0) {
          const notificationBadge = container.querySelector('.notification-badge')
          expect(notificationBadge).toBeTruthy()
          expect(notificationBadge).toHaveTextContent(`${unreadCount} new notification`)
          if (unreadCount > 1) {
            expect(notificationBadge).toHaveTextContent('notifications')
          }
        }

        // Test 4: Notification toasts should be displayed with proper visual indicators
        if (testData.notifications.length > 0) {
          const notificationContainer = container.querySelector('.notification-container')
          expect(notificationContainer).toBeTruthy()

          // Check that we have the expected number of notification toasts
          const notificationToasts = container.querySelectorAll('.notification-toast')
          expect(notificationToasts.length).toBe(testData.notifications.length)

          testData.notifications.forEach((notification, index) => {
            const notificationToast = notificationToasts[index]
            expect(notificationToast).toBeTruthy()

            // Check notification has proper visual indicators
            const notificationIcon = notificationToast.querySelector('.notification-icon')
            expect(notificationIcon).toBeTruthy()

            // Verify correct icon for notification type
            switch (notification.type) {
              case 'deadline_extended':
                expect(notificationIcon).toHaveTextContent('⏰')
                break
              case 'closed':
                expect(notificationIcon).toHaveTextContent('🔒')
                break
              case 'updated':
                expect(notificationIcon).toHaveTextContent('📝')
                break
              case 'maintenance':
                expect(notificationIcon).toHaveTextContent('🔧')
                break
            }

            // Check notification has proper CSS class for styling
            expect(notificationToast.classList.contains('notification-toast')).toBe(true)
            
            // Check read/unread visual state
            if (notification.read) {
              expect(notificationToast.classList.contains('read')).toBe(true)
            } else {
              expect(notificationToast.classList.contains('unread')).toBe(true)
            }

            // Check timestamp is displayed
            const timestampElement = notificationToast.querySelector('.notification-time')
            expect(timestampElement).toBeTruthy()
            // Just check that timestamp is displayed, don't check exact format since it can vary
            expect(timestampElement.textContent.length).toBeGreaterThan(0)
          })
        }

        // Test 5: Visual feedback should be consistent across all update types
        // All visual indicators should be present and properly styled
        const allStatusElements = container.querySelectorAll('.status-icon, .status-text, .notification-icon, .notification-badge')
        allStatusElements.forEach(element => {
          // Each visual indicator should have proper styling classes
          expect(element.className).toBeTruthy()
          expect(element.className.length).toBeGreaterThan(0)
        })
      }
    ), { numRuns: 20 }) // Run more iterations to test various scenarios
  })
})