import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Enable eruda (mobile debug console) in production or when ?debug=true is in URL
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')

  // Enable eruda if in production OR if debug=true in URL
  if (isProduction || urlParams.get('debug') === 'true') {
    import('eruda').then(eruda => {
      eruda.default.init()
      console.log('[Debug] Eruda console enabled - check bottom-right corner for green button')
    })
  }
}

createRoot(document.getElementById('root')).render(
  <App />
)
