/**
 * ChantierCard Component
 * Display a chantier in card format with actions
 */

import React from 'react'
import { Eye, Pencil, Trash2, MapPin, Calendar, Euro, User } from 'lucide-react'
import Card from '../../../shared/components/ui/Card'
import Button from '../../../shared/components/ui/Button'
import {
  formatDate,
  formatCurrency,
  getStatutLabel,
  getStatutColor,
  getClientDisplayName
} from '../utils/chantierHelpers'

export default function ChantierCard({ chantier, onView, onEdit, onDelete }) {
  if (!chantier) return null

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        {/* Header - Titre + Badge Statut */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {chantier.titre}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatutColor(chantier.statut)}`}>
            {getStatutLabel(chantier.statut)}
          </span>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{getClientDisplayName(chantier.client)}</span>
        </div>

        {/* Adresse */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">
            {chantier.ville && chantier.code_postal ? `${chantier.code_postal} ${chantier.ville}` : 'Adresse non définie'}
          </span>
        </div>

        {/* Dates */}
        {(chantier.date_debut || chantier.date_fin_prevue) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {chantier.date_debut && (
                <>Du {formatDate(chantier.date_debut)}</>
              )}
              {chantier.date_fin_prevue && (
                <> au {formatDate(chantier.date_fin_prevue)}</>
              )}
            </span>
          </div>
        )}

        {/* Budget */}
        {chantier.budget_estime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Euro className="w-4 h-4 flex-shrink-0" />
            <span>Budget: {formatCurrency(chantier.budget_estime)}</span>
          </div>
        )}

        {/* Description (extrait) */}
        {chantier.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {chantier.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => onView(chantier)}
            className="flex-1 h-12"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
            <span className="ml-2">Voir</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onEdit(chantier)}
            className="h-12 px-4"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => onDelete(chantier)}
            className="h-12 px-4 text-red-600 hover:bg-red-50 hover:border-red-300"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
