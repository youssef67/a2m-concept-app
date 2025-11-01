/**
 * PlotCard Component
 * Simplified card for Plots Manager - shows only chantier name and client
 */

import React from 'react'
import { User } from 'lucide-react'
import Card from '../../../shared/components/ui/Card'
import { getClientDisplayName } from '../../chantiers/utils/chantierHelpers'

export default function PlotCard({ chantier, onClick }) {
  if (!chantier) return null

  return (
    <Card
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full"
      onClick={() => onClick(chantier)}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Titre du chantier */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {chantier.titre}
          </h3>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getClientDisplayName(chantier.client)}</span>
        </div>
      </div>
    </Card>
  )
}
