import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

/**
 * SearchableSelect - Custom select with search functionality
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler (receives value)
 * @param {Array} options - Array of {value, label, subtitle} objects
 * @param {string} placeholder - Placeholder when no value selected
 * @param {string} searchPlaceholder - Placeholder for search input
 * @param {string} className - Additional classes
 * @param {boolean} disabled - Disable the select
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  className = '',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectRef = useRef(null)
  const searchInputRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Get selected option
  const selectedOption = options.find(opt => opt.value === value)
  const displayText = selectedOption ? selectedOption.label : placeholder

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const label = option.label?.toLowerCase() || ''
    const subtitle = option.subtitle?.toLowerCase() || ''

    return label.includes(query) || subtitle.includes(query)
  })

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchQuery('')
      }
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div ref={selectRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Select button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full h-12 px-4 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white flex items-center justify-between text-left transition-all ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-gray-300'
            : isOpen
            ? 'cursor-pointer border-primary-500 shadow-sm'
            : 'cursor-pointer border-gray-300 hover:border-gray-400 hover:shadow-sm'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {displayText}
        </span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180 text-primary-600' : 'text-gray-400'}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-10 md:hidden"
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
            }}
          />

          {/* Dropdown container */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-10 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  Aucun résultat trouvé
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0
                        ${isSelected ? 'bg-primary-50' : ''}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-base truncate ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-900'}`}>
                          {option.label}
                        </div>
                        {option.subtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {option.subtitle}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary-600 ml-2 flex-shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
