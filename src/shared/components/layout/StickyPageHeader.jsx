/**
 * StickyPageHeader
 * Composant de header sticky réutilisable pour les pages
 * Hauteur alignée avec le header de la sidebar (py-6 + h-12 = 96px total)
 */

import React from 'react'
import { ArrowLeft } from 'lucide-react'

export default function StickyPageHeader({ onBack, showBackButton = true, children }) {
  return (
    <>
      {/* Fixed Header - collée aux bords de l'écran */}
      <div className="fixed top-0 left-0 right-0 md:left-64 z-10 bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 h-12">
            {/* Back button (optionnel) */}
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Content (title, actions, etc.) */}
            {children}
          </div>
        </div>
      </div>

      {/* Spacer pour la navbar fixe */}
      <div className="h-[96px]"></div>
    </>
  )
}
