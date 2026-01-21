import React from 'react';

function StatusBadge({ status, type = 'evaluation' }) {
  // Helper function to get status badge class
  const getStatusBadgeClass = (status, type) => {
    const normalizedStatus = status?.toLowerCase();
    
    if (type === 'evaluation') {
      switch (normalizedStatus) {
        case 'active':
        case 'ongoing':
          return 'status-active';
        case 'closed':
        case 'completed':
          return 'status-closed';
        case 'draft':
          return 'status-draft';
        case 'pending':
          return 'status-pending';
        default:
          return 'status-unknown';
      }
    }
    
    if (type === 'instructor') {
      switch (normalizedStatus) {
        case 'active':
        case 'teaching':
          return 'status-active';
        case 'inactive':
        case 'on leave':
          return 'status-inactive';
        case 'part-time':
          return 'status-part-time';
        default:
          return 'status-unknown';
      }
    }
    
    return 'status-unknown';
  };

  // Helper function to get display text
  const getDisplayText = (status) => {
    if (!status) return 'Unknown';
    
    // Capitalize first letter of each word
    return status.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const badgeClass = getStatusBadgeClass(status, type);
  const displayText = getDisplayText(status);

  return (
    <span 
      className={`status-badge ${badgeClass}`}
      role="status"
      aria-label={`${type} status: ${displayText}`}
    >
      {displayText}
    </span>
  );
}

export default StatusBadge;