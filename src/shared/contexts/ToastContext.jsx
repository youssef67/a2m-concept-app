/**
 * ToastContext - Global toast notification system
 */

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback } from 'react'
import Toast from '../components/ui/Toast'

export const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  /**
   * Show a new toast notification
   */
  const showToast = useCallback((message, variant = 'info', duration = 4000) => {
    const id = Date.now().toString()
    const newToast = { id, message, variant, duration }

    setToasts(prev => [...prev, newToast])
  }, [])

  /**
   * Remove a toast by id
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 left-4 md:left-auto md:right-4 z-50 flex flex-col gap-3 pointer-events-none">
        <div className="md:w-96 mx-auto md:mx-0 pointer-events-auto">
          {toasts.map(toast => (
            <div key={toast.id} className="mb-3">
              <Toast
                id={toast.id}
                message={toast.message}
                variant={toast.variant}
                duration={toast.duration}
                onClose={removeToast}
              />
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
