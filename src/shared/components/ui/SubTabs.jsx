import React from 'react'

/**
 * SubTabs component for secondary level navigation (smaller, more subtle)
 * @param {Array} tabs - Array of tab objects with { id, label, count (optional) }
 * @param {string} activeTab - Currently active tab ID
 * @param {function} onChange - Tab change handler
 */
export default function SubTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 -mx-6 px-6 md:mx-0 md:px-0 md:rounded-t-lg md:border">
      <nav className="flex space-x-6 py-3 ml-4" aria-label="Sub tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                whitespace-nowrap text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-1.5 py-0.5 px-1.5 rounded text-xs font-medium
                    ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
