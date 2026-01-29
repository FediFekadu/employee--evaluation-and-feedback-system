import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import EvaluationResults from '../EvaluationResults.jsx'

// Mock the API client used by the component
vi.mock('../../../../services/api', () => {
  return {
    default: {
      get: vi.fn((url) => {
        if (url.startsWith('/departments/')) {
          return Promise.resolve({ data: { id: 41, name: 'Computer Science' } })
        }
        if (url.startsWith('/evaluations/15/results')) {
          return Promise.resolve({
            data: {
              course_information: { course: 'Algorithms', code: 'CS301', year_level: '3' },
              academic_year: '2026',
              semester: 'Semester I',
              final_score: 28,
              performance_level: 'Unsatisfactory',
              score_breakdown: {
                student: { raw_score: 20, weight: 50, weighted_value: 10 },
                peer: { raw_score: 60, weight: 30, weighted_value: 18 },
                admin: { raw_score: 0, weight: 20, weighted_value: 0 }
              },
              weighted_scores: {
                weighted_score: 28,
                performance_level: 'Unsatisfactory',
                student_score: 20,
                peer_score: 60,
                admin_score: 0
              },
              last_updated: new Date().toISOString()
            }
          })
        }
        throw new Error(`Unhandled API GET: ${url}`)
      })
    }
  }
})

describe('EvaluationResults', () => {
  it('renders course information and actions after data loads', async () => {
    render(
      <MemoryRouter initialEntries={["/department/41/results/15"]}>
        <Routes>
          <Route path="/department/:id/results/:evaluationId" element={<EvaluationResults />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for the header and course information to appear
    await waitFor(() => {
      expect(screen.getByText(/Evaluation Results/i)).toBeInTheDocument()
    })

    // Course name is rendered from mocked data
    expect(screen.getByText(/Algorithms/i)).toBeInTheDocument()

    // Export section header renders
    expect(screen.getByText(/Export \& Actions/i)).toBeInTheDocument()
  })
})