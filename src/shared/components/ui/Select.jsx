import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Custom Select component with controlled dropdown
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {Array} options - Array of {value, label} objects
 * @param {string} placeholder - Placeholder text when no value selected
 * @param {string} className - Additional classes for wrapper
 * @param {boolean} disabled - Disable the select
 */
export default function Select({ value, onChange, options, placeholder, className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
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

  // Scroll into view when dropdown opens
  useEffect(() => {
    if (isOpen && selectRef.current) {
      setTimeout(() => {
        selectRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }, [isOpen])

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value)
  const displayText = selectedOption ? selectedOption.label : placeholder

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Select button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
            onClick={() => setIsOpen(false)}
          />

          {/* Options list */}
          <div className="absolute left-0 z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between
                    ${isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-900'}
                  `}
                >
                  <span className="text-base">{option.label}</span>
                  {isSelected && <Check className="w-5 h-5 text-primary-600" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
