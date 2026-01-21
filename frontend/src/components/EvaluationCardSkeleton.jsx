import React, { memo } from 'react';

const EvaluationCardSkeleton = memo(() => {
  return (
    <div className="evaluation-card-skeleton">
      <div className="skeleton-header"></div>
      <div className="skeleton-line medium"></div>
      <div className="skeleton-line short"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
    </div>
  );
});

EvaluationCardSkeleton.displayName = 'EvaluationCardSkeleton';

export default EvaluationCardSkeleton;