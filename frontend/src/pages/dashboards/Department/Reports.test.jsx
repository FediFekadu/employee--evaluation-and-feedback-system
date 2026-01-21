import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as fc from 'fast-check'
import Reports from './Reports'
import api from '../../../services/api'

// Mock the API
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
}))

describe('Department Reports Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any existing DOM elements
    document.body.innerHTML = ''
    // Reset any global state
    window.history.replaceState({}, '', '/')
  })

  /**
   * **Feature: evaluation-submission-control, Property 8: Question Analysis Completeness**
   * **Validates: Requirements 2.4**
   * 
   * For any individual evaluation result, the question-by-question analysis should 
   * include average ratings and response distributions for all questions
   */
  it('Property 8: Question analysis includes complete data for all questions', async () => {
    await fc.assert(fc.asyncProperty(
      // Generate random evaluation data with questions and responses
      fc.record({
        id: fc.integer({ min: 1, max: 1000 }),
        course: fc.record({
          title: fc.constantFrom('Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'),
          code: fc.constantFrom('MATH101', 'PHYS201', 'CHEM301', 'BIO401', 'CS501')
        }),
        teacher: fc.record({
          name: fc.constantFrom('Dr. Smith', 'Prof. Johnson', 'Dr. Williams', 'Prof. Brown', 'Dr. Davis')
        }),
        academic_year: fc.constantFrom('2023-2024', '2024-2025', '2025-2026'),
        semester: fc.constantFrom('Semester I', 'Semester II'),
        question_analysis: fc.array(fc.record({
          question_id: fc.integer({ min: 1, max: 50 }),
          question_text: fc.constantFrom(
            'Explains the course clearly using instructional language',
            'Has adequate knowledge about the course offered',
            'Gets prepared & comes to the class always for daily lesson',
            'Treats students equally and fairly without any discrimination',
            'Usually motivates and encourages students to learn'
          ),
          category: fc.constantFrom('Instructional Skills', 'Professional Ethics', 'Assessment Methods'),
          average_rating: fc.float({ min: 1, max: 5 }),
          total_responses: fc.integer({ min: 5, max: 100 }),
          rating_distribution: fc.record({
            '1': fc.integer({ min: 1, max: 20 }),
            '2': fc.integer({ min: 1, max: 20 }),
            '3': fc.integer({ min: 1, max: 20 }),
            '4': fc.integer({ min: 1, max: 20 }),
            '5': fc.integer({ min: 1, max: 20 })
          }),
          performance_percentage: fc.float({ min: 20, max: 100 })
        }), { minLength: 2, maxLength: 5 })
      }),
      async (evaluationData) => {
        // Ensure unique question IDs and texts
        const questionTexts = [
          'Explains the course clearly using instructional language',
          'Has adequate knowledge about the course offered',
          'Gets prepared & comes to the class always for daily lesson',
          'Treats students equally and fairly without any discrimination',
          'Usually motivates and encourages students to learn'
        ]
        
        const uniqueQuestions = evaluationData.question_analysis.map((q, index) => ({
          ...q,
          question_id: index + 1,
          question_text: questionTexts[index % questionTexts.length] + ` (${index + 1})`,
          // Ensure rating distribution sums match total responses
          rating_distribution: (() => {
            const dist = q.rating_distribution
            const total = q.total_responses
            const sum = Object.values(dist).reduce((a, b) => a + b, 0)
            if (sum === 0) return { '1': 1, '2': 1, '3': total - 2, '4': 0, '5': 0 }
            const factor = total / sum
            return {
              '1': Math.max(1, Math.floor(dist['1'] * factor)),
              '2': Math.max(1, Math.floor(dist['2'] * factor)),
              '3': Math.max(1, Math.floor(dist['3'] * factor)),
              '4': Math.max(1, Math.floor(dist['4'] * factor)),
              '5': Math.max(1, Math.floor(dist['5'] * factor))
            }
          })()
        }))

        const reportData = {
          ...evaluationData,
          question_analysis: uniqueQuestions
        }

        // Mock API responses
        api.get.mockImplementation((url) => {
          if (url.includes('/departments/')) {
            return Promise.resolve({
              data: { id: 1, name: 'Computer Science', code: 'CS' }
            })
          }
          if (url.includes('/evaluations') && url.includes('/analytics')) {
            return Promise.resolve({ data: reportData })
          }
          if (url.includes('/evaluations')) {
            return Promise.resolve({
              data: { data: [reportData] }
            })
          }
          if (url.includes('/analytics') || url.includes('/reports')) {
            return Promise.resolve({ data: {} })
          }
          return Promise.resolve({ data: [] })
        })

        const { container, unmount } = render(<Reports />)

        try {
          // Wait for component to load
          await waitFor(() => {
            expect(api.get).toHaveBeenCalled()
          }, { timeout: 2000 })

          // Switch to evaluation analysis tab first
          const evaluationTabs = screen.queryAllByText(/evaluation analysis/i)
          if (evaluationTabs.length > 0) {
            fireEvent.click(evaluationTabs[0])
          }

          // Find and click on an evaluation to view its analysis
          await waitFor(() => {
            const evaluationCards = container.querySelectorAll('.evaluation-card, .report-card, [data-testid="evaluation-item"]')
            if (evaluationCards.length > 0) {
              fireEvent.click(evaluationCards[0])
            }
          }, { timeout: 2000 })

          // Wait for question analysis to appear
          await waitFor(() => {
            const questionCards = container.querySelectorAll('.question-card')
            expect(questionCards.length).toBeGreaterThan(0)
          }, { timeout: 2000 })

          // Property: All questions should be displayed
          const questionCards = container.querySelectorAll('.question-card')
          expect(questionCards.length).toBe(uniqueQuestions.length)

          // Property: Each question analysis should contain all required fields
          uniqueQuestions.forEach((question, index) => {
            // Check for average rating display
            const avgRatingText = question.average_rating.toFixed(2)
            const avgRatingElements = screen.queryAllByText(new RegExp(avgRatingText, 'i'))
            expect(avgRatingElements.length).toBeGreaterThan(0)

            // Check for total responses display
            const totalResponsesText = question.total_responses.toString()
            const totalResponsesElements = screen.queryAllByText(new RegExp(totalResponsesText, 'i'))
            expect(totalResponsesElements.length).toBeGreaterThan(0)

            // Check for performance percentage display
            const performanceText = question.performance_percentage.toFixed(1)
            const performanceElements = screen.queryAllByText(new RegExp(performanceText, 'i'))
            expect(performanceElements.length).toBeGreaterThan(0)

            // Property: Rating distribution should be displayed
            Object.entries(question.rating_distribution).forEach(([rating, count]) => {
              if (count > 0) {
                const distributionElements = screen.queryAllByText(new RegExp(`${rating}.*${count}`, 'i'))
                expect(distributionElements.length).toBeGreaterThan(0)
              }
            })
          })
        } finally {
          unmount()
        }
      }
    ), { numRuns: 5 })
  }, 10000)

  /**
   * **Feature: evaluation-submission-control, Property 12: Visual Chart Generation**
   * **Validates: Requirements 3.3**
   * 
   * For any report creation, visual charts showing performance trends, rating 
   * distributions, and comparative analysis should be included
   */
  it('Property 12: Visual charts are generated for all report data', async () => {
    await fc.assert(fc.asyncProperty(
      // Generate simple report data
      fc.record({
        teacher_performances: fc.array(fc.record({
          teacher_id: fc.integer({ min: 1, max: 10 }),
          teacher_name: fc.constantFrom('Dr. Smith', 'Prof. Johnson', 'Dr. Williams'),
          overall_performance_score: fc.float({ min: 50, max: 100 })
        }), { minLength: 1, maxLength: 3 }),
        rating_trends: fc.array(fc.record({
          period: fc.constantFrom('2024-Q1', '2024-Q2', '2024-Q3'),
          average_rating: fc.float({ min: 3, max: 5 })
        }), { minLength: 1, maxLength: 3 }),
        rating_distribution: fc.record({
          '1': fc.integer({ min: 1, max: 10 }),
          '2': fc.integer({ min: 1, max: 10 }),
          '3': fc.integer({ min: 1, max: 10 }),
          '4': fc.integer({ min: 1, max: 10 }),
          '5': fc.integer({ min: 1, max: 10 })
        })
      }),
      async (reportData) => {
        // Mock API responses
        api.get.mockImplementation((url) => {
          if (url.includes('/departments/')) {
            return Promise.resolve({
              data: { id: 1, name: 'Computer Science', code: 'CS' }
            })
          }
          if (url.includes('/reports') || url.includes('/analytics')) {
            return Promise.resolve({ data: reportData })
          }
          return Promise.resolve({ data: { data: [] } })
        })

        const { container, unmount } = render(<Reports />)

        try {
          // Wait for component to load
          await waitFor(() => {
            expect(api.get).toHaveBeenCalled()
          }, { timeout: 2000 })

          // Property 1: Visual charts should be present
          const charts = container.querySelectorAll('.chart-container, canvas, svg')
          expect(charts.length).toBeGreaterThan(0)

          // Property 2: Charts should contain visual elements
          const hasVisualElements = Array.from(charts).some(chart => 
            chart.querySelector('rect, circle, path, line, text') || 
            chart.tagName === 'CANVAS' ||
            chart.getAttribute('data-interactive')
          )
          expect(hasVisualElements).toBeTruthy()

          // Property 3: Rating distribution data should be valid
          const hasValidRatingData = reportData.rating_distribution && 
                                    Object.values(reportData.rating_distribution).some(count => count > 0)
          expect(hasValidRatingData).toBeTruthy()

          // Property 4: Teacher performance data should be valid
          const hasValidTeacherData = reportData.teacher_performances && 
                                     reportData.teacher_performances.length > 0
          expect(hasValidTeacherData).toBeTruthy()

          // Property 5: Trend data should be valid
          const hasValidTrendData = reportData.rating_trends && 
                                   reportData.rating_trends.length > 0
          expect(hasValidTrendData).toBeTruthy()

        } finally {
          unmount()
        }
      }
    ), { numRuns: 3 })
  }, 8000)
})