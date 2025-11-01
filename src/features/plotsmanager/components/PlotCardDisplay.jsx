/**
 * PlotCardDisplay Component
 * Card for displaying a plot (immeuble/structure) with appartement count
 */

import React from 'react'
import { Building2, Home, Edit, Trash2 } from 'lucide-react'
import Card from '../../../shared/components/ui/Card'

// Type labels in French
const TYPE_LABELS = {
  immeuble: 'Immeuble',
  structure: 'Structure',
  batiment: 'Bâtiment',
  annexe: 'Annexe',
  autre: 'Autre'
}

export default function PlotCardDisplay({ plot, appartementCount = 0, onClick, onEdit, onDelete }) {
  if (!plot) return null

  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(plot)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(plot)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full relative group">
      {/* Action buttons - shown on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={handleEdit}
          className="p-2 bg-white hover:bg-blue-50 rounded-lg shadow-md transition-colors"
          title="Modifier"
        >
          <Edit className="w-4 h-4 text-blue-600" />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 bg-white hover:bg-red-50 rounded-lg shadow-md transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Card content */}
      <div onClick={() => onClick(plot)} className="flex flex-col h-full justify-between">
        {/* Plot name and type */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
            {plot.nom}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{TYPE_LABELS[plot.type] || plot.type}</span>
          </div>
        </div>

        {/* Appartement count */}
        <div className="flex items-center gap-2 text-sm text-primary-600 font-medium">
          <Home className="w-4 h-4 flex-shrink-0" />
          <span>
            {appartementCount} {appartementCount <= 1 ? 'appartement' : 'appartements'}
          </span>
        </div>
      </div>
    </Card>
  )
}
