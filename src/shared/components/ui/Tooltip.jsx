/**
 * Tooltip
 * Simple CSS-based tooltip component
 * Works on hover (desktop) and tap (mobile)
 */

import React, { useState } from 'react'

export default function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)

  // Don't render tooltip if no content
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return <>{children}</>
  }

  // Format content as array of strings
  const contentArray = Array.isArray(content) ? content : [content]

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  // Arrow position classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.stopPropagation()
        setIsVisible(!isVisible)
      }}
    >
      {children}

      {/* Tooltip */}
      {isVisible && (
        <>
          {/* Backdrop for mobile (dismisses on click) */}
          <div
            className="fixed inset-0 z-[9998] md:hidden"
            onClick={(e) => {
              e.stopPropagation()
              setIsVisible(false)
            }}
          />

          {/* Tooltip content */}
          <div
            className={`
              absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-xl
              max-w-xs whitespace-normal
              ${positionClasses[position]}
            `}
            style={{ maxHeight: '200px', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {contentArray.length === 1 ? (
              <div>{contentArray[0]}</div>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {contentArray.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}

            {/* Arrow */}
            <div
              className={`
                absolute w-0 h-0 border-4
                ${arrowClasses[position]}
              `}
            />
          </div>
        </>
      )}
    </div>
  )
}
