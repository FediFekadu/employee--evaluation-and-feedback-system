import React, { useState } from 'react';
import {
  DashboardCard,
  StatCard,
  LoadingState,
  EmptyState,
  EnhancedPerformanceInsights,
  EnhancedVisualAnalytics,
  EnhancedTeacherRankings
} from './index';

/**
 * Demo Page for Enhanced Dashboard Components
 * 
 * Showcases all the enhanced UI components with various states and configurations.
 * This page demonstrates the modern design system and responsive behavior.
 */
function DemoPage() {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorDemo, setErrorDemo] = useState(false);

  const toggleLoading = () => {
    setLoadingDemo(!loadingDemo);
    setErrorDemo(false);
  };

  const toggleError = () => {
    setErrorDemo(!errorDemo);
    setLoadingDemo(false);
  };

  const resetStates = () => {
    setLoadingDemo(false);
    setErrorDemo(false);
  };

  return (
    <div className="demo-page" style={{ padding: 'var(--space-8)', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="demo-header" style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="text-display" style={{ marginBottom: 'var(--space-4)' }}>
          Enhanced Dashboard Components
        </h1>
        <p className="text-body-large" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Modern, responsive, and accessible UI components with enhanced design system.
        </p>
        
        {/* Demo Controls */}
        <div className="demo-controls enhanced-flex enhanced-gap-4">
          <button 
            className={`enhanced-btn ${loadingDemo ? 'enhanced-btn-primary' : 'enhanced-btn-secondary'}`}
            onClick={toggleLoading}
          >
            {loadingDemo ? 'Hide' : 'Show'} Loading States
          </button>
          <button 
            className={`enhanced-btn ${errorDemo ? 'enhanced-btn-danger' : 'enhanced-btn-secondary'}`}
            onClick={toggleError}
          >
            {errorDemo ? 'Hide' : 'Show'} Error States
          </button>
          <button 
            className="enhanced-btn enhanced-btn-ghost"
            onClick={resetStates}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Stat Cards Section */}
      <section className="demo-section" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="text-heading-2" style={{ marginBottom: 'var(--space-6)' }}>
          Stat Cards
        </h2>
        <div className="enhanced-grid enhanced-grid-cols-4 enhanced-gap-6">
          <StatCard
            title="Total Students"
            value={1247}
            format="integer"
            icon="👥"
            trend="up"
            change={12.5}
            variant="primary"
            loading={loadingDemo}
          />
          <StatCard
            title="Average Score"
            value={87.3}
            format="percentage"
            icon="🎯"
            trend="up"
            change={3.2}
            variant="success"
            loading={loadingDemo}
          />
          <StatCard
            title="Completion Rate"
            value={94.8}
            format="percentage"
            icon="✅"
            trend="down"
            change={-1.8}
            variant="warning"
            loading={loadingDemo}
          />
          <StatCard
            title="Response Time"
            value={2.4}
            format="decimal"
            precision={1}
            subtitle="seconds"
            icon="⚡"
            trend="down"
            change={-15.3}
            variant="info"
            loading={loadingDemo}
          />
        </div>
      </section>

      {/* Dashboard Cards Section */}
      <section className="demo-section" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="text-heading-2" style={{ marginBottom: 'var(--space-6)' }}>
          Dashboard Cards
        </h2>
        <div className="enhanced-grid enhanced-grid-cols-2 enhanced-gap-6">
          <DashboardCard
            title="Recent Activity"
            subtitle="Latest system events"
            icon="📊"
            variant="primary"
            loading={loadingDemo}
            error={errorDemo ? { message: 'Failed to load activity data', retry: resetStates } : null}
            headerActions={
              <button className="enhanced-btn enhanced-btn-sm enhanced-btn-ghost">
                View All
              </button>
            }
          >
            {!loadingDemo && !errorDemo && (
              <div className="activity-list enhanced-flex enhanced-flex-col enhanced-gap-3">
                <div className="activity-item enhanced-flex enhanced-gap-3">
                  <div className="activity-icon">📝</div>
                  <div>
                    <div className="text-body-small font-medium">New evaluation created</div>
                    <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>2 minutes ago</div>
                  </div>
                </div>
                <div className="activity-item enhanced-flex enhanced-gap-3">
                  <div className="activity-icon">👤</div>
                  <div>
                    <div className="text-body-small font-medium">Student submitted feedback</div>
                    <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>5 minutes ago</div>
                  </div>
                </div>
                <div className="activity-item enhanced-flex enhanced-gap-3">
                  <div className="activity-icon">📈</div>
                  <div>
                    <div className="text-body-small font-medium">Report generated</div>
                    <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>1 hour ago</div>
                  </div>
                </div>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="Quick Actions"
            subtitle="Common tasks"
            icon="⚡"
            variant="success"
            loading={loadingDemo}
            error={errorDemo ? { message: 'Actions unavailable', retry: resetStates } : null}
          >
            {!loadingDemo && !errorDemo && (
              <div className="quick-actions enhanced-flex enhanced-flex-col enhanced-gap-3">
                <button className="enhanced-btn enhanced-btn-primary">
                  Create New Evaluation
                </button>
                <button className="enhanced-btn enhanced-btn-secondary">
                  Generate Report
                </button>
                <button className="enhanced-btn enhanced-btn-ghost">
                  View Analytics
                </button>
              </div>
            )}
          </DashboardCard>
        </div>
      </section>

      {/* Loading States Section */}
      <section className="demo-section" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="text-heading-2" style={{ marginBottom: 'var(--space-6)' }}>
          Loading States
        </h2>
        <div className="enhanced-grid enhanced-grid-cols-3 enhanced-gap-6">
          <DashboardCard title="Skeleton Loading" variant="primary">
            <LoadingState type="skeleton" message="Loading content..." />
          </DashboardCard>
          
          <DashboardCard title="Spinner Loading" variant="success">
            <LoadingState type="spinner" message="Processing data..." />
          </DashboardCard>
          
          <DashboardCard title="Progress Loading" variant="warning">
            <LoadingState 
              type="progress" 
              message="Generating report..." 
              progress={67}
              estimatedTime="30 seconds"
            />
          </DashboardCard>
        </div>
      </section>

      {/* Empty States Section */}
      <section className="demo-section" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="text-heading-2" style={{ marginBottom: 'var(--space-6)' }}>
          Empty States
        </h2>
        <div className="enhanced-grid enhanced-grid-cols-2 enhanced-gap-6">
          <DashboardCard title="No Data" variant="info">
            <EmptyState
              variant="no-data"
              action={() => alert('Refresh clicked!')}
              actionText="Refresh Data"
            />
          </DashboardCard>
          
          <DashboardCard title="Error State" variant="danger">
            <EmptyState
              variant="error"
              action={() => alert('Retry clicked!')}
              actionText="Try Again"
            />
          </DashboardCard>
        </div>
      </section>

      {/* Enhanced Components Section */}
      <section className="demo-section" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="text-heading-2" style={{ marginBottom: 'var(--space-6)' }}>
          Enhanced Components
        </h2>
        
        {/* Note about demo data */}
        <div className="enhanced-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="enhanced-card-body">
            <div className="enhanced-flex enhanced-gap-3">
              <div style={{ fontSize: 'var(--text-lg)' }}>ℹ️</div>
              <div>
                <div className="text-body font-medium">Demo Components</div>
                <div className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                  The components below would normally connect to real APIs. In this demo, they will show loading or error states.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Performance Insights */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
            Enhanced Performance Insights
          </h3>
          <EnhancedPerformanceInsights
            departmentId="demo"
            className="demo-component"
          />
        </div>

        {/* Enhanced Visual Analytics */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
            Enhanced Visual Analytics
          </h3>
          <EnhancedVisualAnalytics
            departmentId="demo"
            height="400px"
            className="demo-component"
          />
        </div>

        {/* Enhanced Teacher Rankings */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 className="text-heading-3" style={{ marginBottom: 'var(--space-4)' }}>
            Enhanced Teacher Rankings
          </h3>
          <EnhancedTeacherRankings
            departmentId="demo"
            className="demo-component"
          />
        </div>
      </section>

      {/* Design System Showcase */}
      <section className="demo-section" style={{ marginBottom: 'var(--space-8)' }}>
        <h2 className="text-heading-2" style={{ marginBottom: 'var(--space-6)' }}>
          Design System Elements
        </h2>
        
        {/* Typography */}
        <div className="enhanced-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="enhanced-card-header">
            <h3 className="text-heading-5">Typography Scale</h3>
          </div>
          <div className="enhanced-card-body">
            <div className="enhanced-flex enhanced-flex-col enhanced-gap-4">
              <div className="text-display">Display Text</div>
              <div className="text-heading-1">Heading 1</div>
              <div className="text-heading-2">Heading 2</div>
              <div className="text-heading-3">Heading 3</div>
              <div className="text-body-large">Large body text for important content</div>
              <div className="text-body">Regular body text for most content</div>
              <div className="text-body-small">Small body text for secondary information</div>
              <div className="text-caption">Caption text for labels and metadata</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="enhanced-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="enhanced-card-header">
            <h3 className="text-heading-5">Button Variants</h3>
          </div>
          <div className="enhanced-card-body">
            <div className="enhanced-flex enhanced-flex-wrap enhanced-gap-4">
              <button className="enhanced-btn enhanced-btn-primary">Primary</button>
              <button className="enhanced-btn enhanced-btn-secondary">Secondary</button>
              <button className="enhanced-btn enhanced-btn-success">Success</button>
              <button className="enhanced-btn enhanced-btn-warning">Warning</button>
              <button className="enhanced-btn enhanced-btn-danger">Danger</button>
              <button className="enhanced-btn enhanced-btn-ghost">Ghost</button>
            </div>
            <div className="enhanced-flex enhanced-flex-wrap enhanced-gap-4" style={{ marginTop: 'var(--space-4)' }}>
              <button className="enhanced-btn enhanced-btn-primary enhanced-btn-sm">Small</button>
              <button className="enhanced-btn enhanced-btn-primary">Medium</button>
              <button className="enhanced-btn enhanced-btn-primary enhanced-btn-lg">Large</button>
              <button className="enhanced-btn enhanced-btn-primary enhanced-btn-xl">Extra Large</button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="enhanced-card">
          <div className="enhanced-card-header">
            <h3 className="text-heading-5">Status Badges</h3>
          </div>
          <div className="enhanced-card-body">
            <div className="enhanced-flex enhanced-flex-wrap enhanced-gap-4">
              <span className="enhanced-badge enhanced-badge-success">Success</span>
              <span className="enhanced-badge enhanced-badge-warning">Warning</span>
              <span className="enhanced-badge enhanced-badge-error">Error</span>
              <span className="enhanced-badge enhanced-badge-info">Info</span>
              <span className="enhanced-badge enhanced-badge-neutral">Neutral</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="demo-footer" style={{ marginTop: 'var(--space-12)', textAlign: 'center' }}>
        <div className="text-body-small" style={{ color: 'var(--text-tertiary)' }}>
          Enhanced Dashboard Components Demo • Built with modern design principles
        </div>
      </footer>
    </div>
  );
}

export default DemoPage;