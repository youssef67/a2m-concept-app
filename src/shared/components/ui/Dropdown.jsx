/**
 * Dropdown
 * Composant dropdown réutilisable pour afficher un menu contextuel
 */

import React, { useState, useRef, useEffect } from 'react'

export default function Dropdown({ trigger, children, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <div onClick={handleToggle}>
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={handleClose}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ children, onClick, className = '', danger = false }) {
  const handleClick = (e) => {
    e.stopPropagation()
    if (onClick) onClick(e)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm min-h-[44px] ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      } ${className}`}
    >
      {children}
    </button>
  )
}
