import React, { useState } from 'react';
import LoadingSpinner from './ErrorHandling/LoadingSpinner';

function ExportControls({ 
  onExport, 
  loading = false, 
  disabled = false, 
  formats = ['csv', 'pdf', 'excel'],
  size = 'medium',
  variant = 'buttons' // 'buttons' or 'dropdown'
}) {
  const [exportingFormat, setExportingFormat] = useState(null);

  const handleExport = async (format) => {
    if (loading || disabled) return;
    
    setExportingFormat(format);
    try {
      await onExport(format);
    } finally {
      setExportingFormat(null);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'csv': return '📊';
      case 'pdf': return '📄';
      case 'excel': return '📈';
      default: return '📁';
    }
  };

  const getFormatLabel = (format) => {
    switch (format) {
      case 'csv': return 'CSV Report';
      case 'pdf': return 'PDF Report';
      case 'excel': return 'Excel Report';
      default: return format.toUpperCase();
    }
  };

  const buttonClass = `dept-btn dept-btn-ghost export-btn export-btn-${size}`;
  const isFormatLoading = (format) => exportingFormat === format;

  if (variant === 'dropdown') {
    return (
      <div className="export-controls export-dropdown">
        <div className="dropdown">
          <button 
            className={`${buttonClass} dropdown-toggle`}
            disabled={loading || disabled}
            aria-haspopup="true"
            aria-expanded="false"
            aria-label="Export report options"
          >
            📁 Export Report
            <span className="dropdown-arrow" aria-hidden="true">▼</span>
          </button>
          <div className="dropdown-menu" role="menu">
            {formats.map(format => (
              <button
                key={format}
                className="dropdown-item"
                onClick={() => handleExport(format)}
                disabled={loading || disabled}
                role="menuitem"
                aria-label={`Export as ${getFormatLabel(format)}`}
              >
                <span className="format-icon" aria-hidden="true">{getFormatIcon(format)}</span>
                <span className="format-label">{getFormatLabel(format)}</span>
                {isFormatLoading(format) && (
                  <LoadingSpinner size="small" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="export-controls export-buttons" role="group" aria-label="Export options">
      {formats.map(format => (
        <button
          key={format}
          className={buttonClass}
          onClick={() => handleExport(format)}
          disabled={loading || disabled || isFormatLoading(format)}
          aria-label={`Export as ${getFormatLabel(format)}`}
        >
          <span className="export-icon" aria-hidden="true">{getFormatIcon(format)}</span>
          <span className="export-label">
            {size === 'small' ? format.toUpperCase() : getFormatLabel(format)}
          </span>
          {isFormatLoading(format) && (
            <LoadingSpinner size="small" />
          )}
        </button>
      ))}
    </div>
  );
}

export default ExportControls;