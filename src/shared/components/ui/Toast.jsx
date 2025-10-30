/**
 * Toast Component
 * Notification toast with animations
 */

import React, { useEffect } from 'react'

export default function Toast({ id, message, variant = 'info', onClose, duration = 4000 }) {
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-800',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: '✗'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-800',
      icon: 'ℹ'
    }
  }

  const style = variants[variant]

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  return (
    <div
      className={`
        ${style.bg} ${style.border} ${style.text}
        border-l-4 rounded-lg shadow-lg p-4
        flex items-center gap-3
        min-h-[60px]
        animate-slide-in-down
        transition-all duration-300
      `}
      role="alert"
    >
      <span className="text-2xl flex-shrink-0">{style.icon}</span>
      <div className="flex-1 text-base font-medium">{message}</div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 text-2xl leading-none"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}
