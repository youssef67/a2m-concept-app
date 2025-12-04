import React from 'react'
import Sidebar from './Sidebar'
import BottomNavbar from './BottomNavbar'
import Footer from './Footer'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Main content area with responsive margin */}
      <div className="flex-1 flex flex-col md:ml-64">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 relative z-10">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Bottom navbar - Mobile only */}
      <BottomNavbar />
    </div>
  )
}
