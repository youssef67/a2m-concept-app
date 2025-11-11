import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Enable eruda (mobile debug console) when ?debug=true is in URL
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('debug') === 'true') {
    import('eruda').then(eruda => eruda.default.init())
    console.log('[Debug] Eruda console enabled - check bottom-right corner for debug button')
  }
}

createRoot(document.getElementById('root')).render(
  <App />
)
