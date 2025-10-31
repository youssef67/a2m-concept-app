import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

/**
 * Pagination component - Mobile-first design
 *
 * Mobile: [← Précédent] [Page 1 sur 5] [Suivant →]
 * Desktop: [← Précédent] [1] [2] [3] ... [10] [Suivant →]
 *
 * @param {number} currentPage - Current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {string} className - Optional additional classes
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) {
  // Don't render if only 1 page or less
  if (totalPages <= 1) {
    return null
  }

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  // Generate page numbers for desktop view
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5 // Max page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Smart pagination with ellipsis
      if (currentPage <= 3) {
        // Near start: 1 2 3 4 ... 10
        pages.push(1, 2, 3, 4)
        pages.push('ellipsis-end')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near end: 1 ... 7 8 9 10
        pages.push(1)
        pages.push('ellipsis-start')
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        // Middle: 1 ... 4 5 6 ... 10
        pages.push(1)
        pages.push('ellipsis-start')
        pages.push(currentPage - 1, currentPage, currentPage + 1)
        pages.push('ellipsis-end')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1)
    }
  }

  const handlePageClick = (page) => {
    if (page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={isFirstPage}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Précédent</span>
      </Button>

      {/* Mobile: Page indicator */}
      <div className="flex items-center md:hidden px-4 py-2 text-sm font-medium text-gray-700">
        Page {currentPage} sur {totalPages}
      </div>

      {/* Desktop: Page numbers */}
      <div className="hidden md:flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (typeof page === 'string' && page.startsWith('ellipsis')) {
            // Render ellipsis
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500 select-none"
              >
                ...
              </span>
            )
          }

          // Render page button
          const isActive = page === currentPage

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={isActive}
              className={`
                min-w-[44px] min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg
                transition-colors duration-200
                ${isActive
                  ? 'bg-primary-600 text-white cursor-default'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }
                disabled:cursor-not-allowed
              `}
            >
              {page}
            </button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={isLastPage}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1"
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
