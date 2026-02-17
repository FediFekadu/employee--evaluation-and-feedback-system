# Department Reports Dashboard - Component Structure

This directory contains all React components for the Department Reports Dashboard feature.

## Directory Structure

```
Reports/
├── Analytics/          # Analytics dashboard components
│   ├── MetricsCard.jsx
│   ├── QuickInsights.jsx
│   └── AnalyticsDashboard.jsx
│
├── Charts/            # Visualization components
│   ├── PerformanceDistributionChart.jsx
│   ├── ParticipationTrendChart.jsx
│   ├── TeacherComparisonChart.jsx
│   ├── RatingDistributionChart.jsx
│   └── ChartContainer.jsx
│
├── DataQuality/       # Data quality monitoring
│   ├── ParticipationWarnings.jsx
│   ├── CompletenessMetrics.jsx
│   ├── ReliabilityIndicators.jsx
│   ├── RecommendationsPanel.jsx
│   └── DataQualityPanel.jsx
│
├── Export/            # Export functionality
│   ├── ExportControls.jsx
│   ├── FormatSelector.jsx
│   └── ExportProgress.jsx
│
├── Filters/           # Filtering and search
│   ├── FilterPanel.jsx
│   ├── FilterDropdown.jsx
│   ├── SearchBar.jsx
│   └── ActiveFilters.jsx
│
├── Rankings/          # Teacher rankings
│   ├── TopPerformersTable.jsx
│   ├── NeedsImprovementTable.jsx
│   ├── CourseBreakdownTable.jsx
│   └── TeacherRankings.jsx
│
└── Shared/            # Reusable components
    ├── LoadingState.jsx
    ├── EmptyState.jsx
    ├── ErrorState.jsx
    └── Card.jsx
```

## Component Guidelines

### Naming Conventions
- Use PascalCase for component files (e.g., `MetricsCard.jsx`)
- Use descriptive names that indicate component purpose
- Group related components in subdirectories

### Component Structure
Each component should follow this structure:
```jsx
/**
 * Component description
 * @param {Object} props - Component props
 */
import React from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    // JSX
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

ComponentName.defaultProps = {
  prop2: 0,
};

export default ComponentName;
```

### Testing
- Each component should have corresponding tests in `__tests__` directory
- Use React Testing Library for component tests
- Use fast-check for property-based tests
- Test files should be named `ComponentName.test.jsx`

### Styling
- Use Tailwind CSS utility classes for styling
- Follow existing design system patterns
- Ensure WCAG AA accessibility compliance
- Support responsive design (mobile, tablet, desktop)

## Data Flow

```
Reports.jsx (Main Container)
    ↓
    ├─→ FilterPanel → Updates filters state
    ├─→ AnalyticsDashboard → Displays metrics
    ├─→ VisualAnalytics → Renders charts
    ├─→ TeacherRankings → Shows rankings
    ├─→ DataQualityPanel → Monitors quality
    └─→ ExportControls → Handles exports
```

## State Management

The main `Reports.jsx` container manages:
- Evaluations data
- Analytics data
- Filter criteria
- Sort options
- Pagination state
- Loading/error states

Child components receive data via props and communicate changes via callback functions.

## API Integration

Components use custom hooks for data fetching:
- `useReportsData()` - Fetches evaluation reports
- `useAnalytics()` - Fetches analytics data
- `useFilters()` - Manages filter state
- `useExport()` - Handles export operations

## Accessibility

All components must:
- Include proper ARIA labels and roles
- Support keyboard navigation
- Provide focus indicators
- Use semantic HTML
- Include alt text for images
- Support screen readers

## Performance

Optimization strategies:
- Use React.memo for pure components
- Implement useMemo for expensive calculations
- Use useCallback for event handlers
- Lazy load charts and heavy components
- Virtualize long lists
- Debounce search and filter inputs

## Related Files

- Types: `frontend/src/types/reports.ts`
- Constants: `frontend/src/constants/reportsConstants.ts`
- Utilities: `frontend/src/utils/reportsFormatters.ts`, `frontend/src/utils/reportsCalculations.ts`
- Main Container: `frontend/src/pages/dashboards/Department/Reports.jsx`
