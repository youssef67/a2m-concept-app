import React from 'react'

/**
 * Tabs component for switching between different views
 * @param {Array} tabs - Array of tab objects with { id, label, count (optional) }
 * @param {string} activeTab - Currently active tab ID
 * @param {function} onChange - Tab change handler
 */
export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200 -mx-6 md:mx-0 overflow-x-auto md:overflow-x-visible">
      <nav className="-mb-px flex space-x-2 md:space-x-8 px-6 md:px-0 min-w-max md:min-w-0" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-shrink-0
                ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-1 md:ml-2 py-0.5 px-1.5 md:px-2.5 rounded-full text-xs font-medium
                    ${
                      isActive
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600'
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
