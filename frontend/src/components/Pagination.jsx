import React, { useState, useEffect } from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showJumpToPage = true,
  showItemsInfo = true,
  maxVisiblePages = 5,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = ''
}) => {
  const [jumpToPageValue, setJumpToPageValue] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);

  // Reset jump input when page changes
  useEffect(() => {
    setJumpToPageValue('');
    setShowJumpInput(false);
  }, [currentPage]);

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add ellipsis and first page if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPageValue);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    }
    setShowJumpInput(false);
    setJumpToPageValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    } else if (e.key === 'Escape') {
      setShowJumpInput(false);
      setJumpToPageValue('');
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`pagination-controls ${className}`}>
      {/* Items info */}
      {showItemsInfo && (
        <div className="pagination-info">
          <span>
            Showing {startItem} to {endItem} of {totalItems} items
          </span>
          {showPageSizeSelector && (
            <div className="page-size-selector">
              <label htmlFor="pageSize">Items per page:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="page-size-select"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Navigation controls */}
      <div className="pagination-navigation">
        {/* First/Previous buttons */}
        <div className="pagination-buttons">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="pagination-btn pagination-btn-first"
            title="First page"
          >
            ⟪
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn pagination-btn-prev"
            title="Previous page"
          >
            ⟨
          </button>
        </div>

        {/* Page numbers */}
        <div className="pagination-pages">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-ellipsis">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`pagination-btn pagination-btn-page ${
                    page === currentPage ? 'active' : ''
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next/Last buttons */}
        <div className="pagination-buttons">
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn pagination-btn-next"
            title="Next page"
          >
            ⟩
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn pagination-btn-last"
            title="Last page"
          >
            ⟫
          </button>
        </div>

        {/* Jump to page */}
        {showJumpToPage && (
          <div className="pagination-jump">
            {!showJumpInput ? (
              <button
                onClick={() => setShowJumpInput(true)}
                className="pagination-btn pagination-btn-jump"
                title="Jump to page"
              >
                Go to...
              </button>
            ) : (
              <div className="jump-input-container">
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPageValue}
                  onChange={(e) => setJumpToPageValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={() => {
                    if (!jumpToPageValue) {
                      setShowJumpInput(false);
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                  className="jump-input"
                  autoFocus
                />
                <button
                  onClick={handleJumpToPage}
                  disabled={!jumpToPageValue}
                  className="pagination-btn pagination-btn-go"
                >
                  Go
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current page indicator for mobile */}
      <div className="pagination-mobile-info">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

export default Pagination;