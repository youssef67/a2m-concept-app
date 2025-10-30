import React from 'react'
export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-center text-sm text-gray-600">
          © {currentYear} A2M Concepts. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
