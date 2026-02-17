# Implementation Plan: Department Reports Dashboard

## Overview

This implementation plan breaks down the Department Reports Dashboard feature into discrete, incremental coding tasks. Each task builds on previous work and includes testing as sub-tasks. The plan follows a bottom-up approach: core utilities → data services → UI components → integration → testing.

## Tasks

- [x] 1. Set up project structure and core utilities
  - Create directory structure for Reports dashboard components
  - Set up TypeScript interfaces and types for all data models (Evaluation, Analytics, Filters, etc.)
  - Create utility functions for data formatting (dates, percentages, scores)
  - Set up constants file for thresholds, colors, and configuration values
  - _Requirements: 1.1, 2.1, 8.3, 8.4_

- [-] 2. Implement data fetching and state management
  - [x] 2.1 Create API service functions for reports endpoints
    - Implement `fetchReportsData()` for /api/departments/{id}/reports
    - Implement `fetchAnalyticsData()` for /api/departments/{id}/analytics
    - Implement `fetchEvaluationResults()` for /api/departments/{id}/evaluation-results
    - Add request/response type definitions
    - _Requirements: 1.1, 9.1_
  
  - [ ]* 2.2 Write property test for filter application consistency
    - **Property 3: Filter Application Consistency**
    - **Validates: Requirements 2.1, 2.3**
  
  - [~] 2.3 Create custom React hooks for data management
    - Implement `useReportsData()` hook with React Query
    - Implement `useAnalytics()` hook with caching
    - Implement `useFilters()` hook with session persistence
    - Add loading and error states
    - _Requirements: 2.6, 9.4, 9.5_
  
  - [ ]* 2.4 Write property test for filter session persistence
    - **Property 5: Filter Session Persistence**
    - **Validates: Requirements 2.6**
  
  - [ ]* 2.5 Write property test for cache utilization
    - **Property 15: Cache Utilization**
    - **Validates: Requirements 9.4**

- [~] 3. Build FilterPanel component
  - [~] 3.1 Create FilterPanel component with all filter controls
    - Implement multi-select dropdowns for academic year, semester, year level
    - Implement course and instructor filters
    - Implement status filter
    - Add search bar with debouncing (300ms)
    - Add clear filters button
    - _Requirements: 2.2, 2.4_
  
  - [ ]* 3.2 Write property test for filter clear round-trip
    - **Property 4: Filter Clear Round-Trip**
    - **Validates: Requirements 2.5**
  
  - [~] 3.3 Add filter persistence to session storage
    - Save filter state on change
    - Restore filters on component mount
    - Clear storage on logout
    - _Requirements: 2.6_
  
  - [ ]* 3.4 Write unit tests for FilterPanel
    - Test filter selection triggers onFilterChange
    - Test clear button resets all filters
    - Test search input debouncing
    - Test filter persistence across re-renders
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

- [~] 4. Checkpoint - Ensure filter functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Build AnalyticsDashboard component
  - [~] 5.1 Create metrics cards components
    - Implement TotalEvaluationsCard with trend indicator
    - Implement AverageScoreCard with performance level
    - Implement ParticipationRateCard with quality indicator
    - Implement DataQualityCard with color coding
    - _Requirements: 1.1_
  
  - [~] 5.2 Create QuickInsights component
    - Implement TopPerformersPreview (top 3)
    - Implement LowParticipationAlert for < 70% rates
    - Add recent activity summary
    - _Requirements: 1.1, 6.1_
  
  - [ ]* 5.3 Write unit tests for AnalyticsDashboard
    - Test all metric cards display correct data
    - Test empty state when no data available
    - Test loading state display
    - Test error state handling
    - _Requirements: 1.1, 1.5_

- [~] 6. Build VisualAnalytics component with charts
  - [~] 6.1 Set up Recharts library and create chart wrapper components
    - Install and configure Recharts
    - Create reusable ChartContainer component
    - Create ChartTooltip component with accessibility
    - Create ChartLegend component
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [~] 6.2 Implement PerformanceDistributionChart (Bar Chart)
    - Create component with score range buckets (0-50, 51-60, etc.)
    - Add color coding by performance level
    - Implement responsive sizing
    - _Requirements: 3.1_
  
  - [~] 6.3 Implement ParticipationTrendChart (Line Chart)
    - Create component with time-series data
    - Add multiple lines for evaluation types
    - Implement zoom and pan interactions
    - _Requirements: 3.2, 1.4_
  
  - [ ]* 6.4 Write property test for trend data temporal coverage
    - **Property 2: Trend Data Temporal Coverage**
    - **Validates: Requirements 1.4**
  
  - [~] 6.5 Implement TeacherComparisonChart (Horizontal Bar Chart)
    - Create component showing top 10 teachers
    - Add color gradient based on scores
    - Implement sorting and filtering
    - _Requirements: 3.3, 6.1_
  
  - [~] 6.6 Implement RatingDistributionChart (Pie Chart)
    - Create component with rating segments
    - Add percentages and counts
    - Implement interactive tooltips
    - _Requirements: 3.1, 3.5_
  
  - [ ]* 6.7 Write property test for chart color accessibility
    - **Property 6: Chart Color Accessibility**
    - **Validates: Requirements 3.4**
  
  - [ ]* 6.8 Write property test for interactive tooltip display
    - **Property 7: Interactive Tooltip Display**
    - **Validates: Requirements 3.5**
  
  - [ ]* 6.9 Write unit tests for chart components
    - Test charts render with valid data
    - Test charts handle empty data gracefully
    - Test tooltip interactions
    - Test responsive behavior
    - Test accessibility attributes (ARIA labels)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [~] 7. Checkpoint - Ensure visualization components work
  - Ensure all tests pass, ask the user if questions arise.

- [~] 8. Build TeacherRankings component
  - [~] 8.1 Create TopPerformersTable component
    - Implement table with columns: Rank, Teacher, Course, Weighted Score, Participation, Performance Level
    - Add sortable columns
    - Implement expandable rows for course breakdown
    - Add responsive design with horizontal scroll on mobile
    - _Requirements: 6.1, 6.3_
  
  - [ ]* 8.2 Write property test for top performers identification
    - **Property 10: Top Performers Identification**
    - **Validates: Requirements 6.1**
  
  - [~] 8.3 Create NeedsImprovementTable component
    - Implement table with same columns as TopPerformersTable
    - Filter teachers below department average
    - Highlight low participation rates
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 8.4 Write property test for below-average teacher identification
    - **Property 11: Below-Average Teacher Identification**
    - **Validates: Requirements 6.2**
  
  - [~] 8.5 Create CourseBreakdownTable component
    - Implement table showing course-level details
    - Add columns for Student/Peer/HOD scores
    - Implement filtering by teacher
    - Add export individual table functionality
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 8.6 Write property test for teacher rankings order consistency
    - **Property 1: Teacher Rankings Order Consistency**
    - **Validates: Requirements 1.2**
  
  - [ ]* 8.7 Write property test for semester performance delta calculation
    - **Property 12: Semester Performance Delta Calculation**
    - **Validates: Requirements 6.4**
  
  - [ ]* 8.8 Write unit tests for ranking tables
    - Test tables render with data
    - Test sorting functionality
    - Test expandable rows
    - Test empty states
    - Test responsive behavior
    - _Requirements: 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [~] 9. Build DataQualityPanel component
  - [~] 9.1 Create ParticipationWarnings component
    - Implement list of evaluations with < 70% participation
    - Add severity levels (Critical < 50%, Warning 50-70%)
    - Display recommended actions
    - _Requirements: 7.1, 7.4_
  
  - [~] 9.2 Create CompletenessMetrics component
    - Calculate and display percentage of expected evaluations
    - Show missing evaluation types
    - Add data freshness indicators
    - _Requirements: 7.2_
  
  - [~] 9.3 Create ReliabilityIndicators component
    - Calculate response consistency scores
    - Implement outlier detection
    - Display suspicious pattern alerts
    - _Requirements: 7.3, 7.5_
  
  - [~] 9.4 Create RecommendationsPanel component
    - Generate actionable suggestions based on data quality
    - Add priority ranking
    - Provide implementation guidance
    - _Requirements: 7.4_
  
  - [ ]* 9.5 Write property test for data quality metrics calculation
    - **Property 13: Data Quality Metrics Calculation**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
  
  - [ ]* 9.6 Write unit tests for DataQualityPanel
    - Test warnings display for low participation
    - Test completeness calculations
    - Test reliability indicators
    - Test recommendations generation
    - Test edge case: insufficient data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 6.5_

- [~] 10. Build ExportControls component
  - [~] 10.1 Create ExportControls component with format selection
    - Implement format selector (CSV, PDF, Excel)
    - Add privacy preservation toggle
    - Add selected evaluations export option
    - Display filter summary
    - _Requirements: 5.1, 5.2_
  
  - [~] 10.2 Integrate with existing useExport hook
    - Connect to /api/departments/{id}/export endpoint
    - Handle export request with filters and sort options
    - Implement progress indicator
    - Add download notification
    - _Requirements: 5.2, 4.5_
  
  - [~] 10.3 Implement export error handling
    - Display descriptive error messages
    - Add retry functionality
    - Suggest alternative formats on failure
    - Log errors for debugging
    - _Requirements: 5.6, 4.6_
  
  - [ ]* 10.4 Write property test for CSV special character escaping
    - **Property 9: CSV Special Character Escaping**
    - **Validates: Requirements 5.3**
  
  - [ ]* 10.5 Write property test for report data completeness
    - **Property 8: Report Data Completeness**
    - **Validates: Requirements 4.1**
  
  - [ ]* 10.6 Write unit tests for ExportControls
    - Test format selection
    - Test export button triggers export
    - Test progress indicator display
    - Test error handling and retry
    - Test privacy toggle
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [~] 11. Checkpoint - Ensure export functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [~] 12. Build main Reports.jsx container component
  - [~] 12.1 Create Reports.jsx with state management
    - Set up component state for evaluations, analytics, filters, sorting, pagination
    - Implement data fetching with useReportsData and useAnalytics hooks
    - Add loading and error states
    - Implement refresh functionality
    - _Requirements: 1.1, 9.1, 10.1_
  
  - [~] 12.2 Integrate all child components
    - Add ReportsHeader with title, refresh button, last updated timestamp
    - Add FilterPanel with filter state management
    - Add AnalyticsDashboard with analytics data
    - Add VisualAnalytics with evaluation data
    - Add TeacherRankings with sorting
    - Add DataQualityPanel with quality metrics
    - Add ExportControls with export functionality
    - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.1, 10.1_
  
  - [~] 12.3 Implement sorting and pagination
    - Add sort controls for evaluation list
    - Implement pagination for large datasets (> 50 records)
    - Preserve sort/pagination state during refresh
    - _Requirements: 9.2, 10.3_
  
  - [ ]* 12.4 Write property test for pagination threshold triggering
    - **Property 14: Pagination Threshold Triggering**
    - **Validates: Requirements 9.2**
  
  - [ ]* 12.5 Write property test for state preservation during refresh
    - **Property 16: State Preservation During Refresh**
    - **Validates: Requirements 10.3**
  
  - [ ]* 12.6 Write unit tests for Reports.jsx
    - Test component renders all child components
    - Test data fetching on mount
    - Test refresh functionality
    - Test filter changes trigger data updates
    - Test sort changes update display
    - Test pagination controls
    - Test error boundary catches errors
    - _Requirements: 1.1, 2.1, 9.1, 9.2, 10.1, 10.3, 10.4, 10.5_

- [~] 13. Implement error handling and recovery
  - [~] 13.1 Create error handling utilities
    - Implement NetworkErrorHandler with retry logic
    - Implement DataErrorHandler with validation
    - Implement InputErrorHandler with sanitization
    - Implement ExportErrorHandler with alternatives
    - _Requirements: 4.6, 5.6, 9.5, 10.5_
  
  - [~] 13.2 Create error UI components
    - Implement ErrorAlert component with severity levels
    - Implement ErrorBoundary component for crash recovery
    - Implement NetworkStatus indicator
    - Add offline mode detection
    - _Requirements: 9.5, 10.5_
  
  - [ ]* 13.3 Write unit tests for error handling
    - Test network error retry logic
    - Test fallback to cached data
    - Test error notifications display
    - Test error boundary catches and recovers
    - Test offline mode indicator
    - _Requirements: 4.6, 5.6, 9.5, 10.5_

- [~] 14. Implement accessibility features
  - [~] 14.1 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Implement logical tab order
    - Add visible focus indicators
    - Add skip links for main content
    - _Requirements: 8.3_
  
  - [~] 14.2 Add ARIA labels and roles
    - Add ARIA labels to all controls
    - Add ARIA live regions for dynamic updates
    - Use semantic HTML elements
    - Add alt text for visual elements
    - _Requirements: 8.4_
  
  - [~] 14.3 Ensure color accessibility
    - Verify WCAG AA contrast ratios (4.5:1 minimum)
    - Use colorblind-friendly palettes
    - Ensure no information conveyed by color alone
    - Test with high contrast mode
    - _Requirements: 3.4_
  
  - [ ]* 14.4 Write accessibility tests
    - Test keyboard navigation through all components
    - Test ARIA labels are present
    - Test color contrast ratios
    - Test screen reader compatibility
    - _Requirements: 3.4, 8.3, 8.4_

- [~] 15. Add responsive design and mobile support
  - [~] 15.1 Implement responsive layouts
    - Add mobile-specific layouts for FilterPanel
    - Adapt chart layouts for smaller screens
    - Implement responsive tables with horizontal scroll
    - Add collapsible sections for mobile
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [~] 15.2 Optimize for mobile performance
    - Lazy load charts on mobile
    - Reduce data fetched on mobile
    - Optimize touch interactions
    - Test on various mobile devices
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 15.3 Write responsive design tests
    - Test layouts at key breakpoints (320px, 768px, 1024px, 1920px)
    - Test touch interactions
    - Test mobile-specific features
    - _Requirements: 8.1, 8.2, 8.5_

- [~] 16. Checkpoint - Ensure complete dashboard works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [~] 17. Integration and final testing
  - [~] 17.1 Add route configuration
    - Add Reports route to Department dashboard router
    - Add route guard for department admin role
    - Add navigation link in Department Layout
    - Test navigation from other pages
    - _Requirements: 1.1_
  
  - [ ]* 17.2 Write integration tests
    - Test complete user workflow: load → filter → view charts → export
    - Test API integration with mock server
    - Test error recovery flows
    - Test data refresh with filter preservation
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 10.1, 10.3_
  
  - [ ]* 17.3 Write end-to-end tests
    - Test complete dashboard workflow with real backend
    - Test export downloads
    - Test accessibility with keyboard-only navigation
    - Test performance with large datasets (1000 records)
    - _Requirements: 1.1, 2.1, 4.1, 4.4, 5.1, 8.3, 9.1_
  
  - [~] 17.4 Performance optimization
    - Profile component render times
    - Optimize expensive calculations with useMemo
    - Optimize callbacks with useCallback
    - Implement code splitting for charts
    - Add bundle size analysis
    - _Requirements: 9.1, 9.3_
  
  - [~] 17.5 Final manual testing
    - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
    - Test on multiple devices (desktop, tablet, mobile)
    - Test with screen readers
    - Test with keyboard only
    - Test with slow network
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1_

- [~] 18. Final checkpoint - Complete feature validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- End-to-end tests validate complete user workflows
- The implementation follows a bottom-up approach: utilities → services → components → integration
- All components should be built with TypeScript for type safety
- Use existing export infrastructure (useExport hook, exportService)
- Leverage existing UI components where possible (StatusBadge, ParticipationIndicator, etc.)
- Follow existing code style and patterns from Department/EvaluationResults.jsx and Department/Overview.jsx
