/**
 * ChantierCard Component
 * Display a chantier in card format with actions
 */

import React from 'react'
import { Eye, Pencil, Trash2, MapPin, Calendar, Euro, User, StickyNote, TrendingUp, TrendingDown } from 'lucide-react'
import Card from '../../../shared/components/ui/Card'
import Button from '../../../shared/components/ui/Button'
import {
  formatDate,
  formatCurrency,
  getStatutLabel,
  getStatutColor,
  getClientDisplayName,
  calculateTotalFacturesClients,
  calculateTotalFacturesFournisseurs,
  calculateDifferenceFinanciere,
  getDifferenceColor
} from '../utils/chantierHelpers'

export default function ChantierCard({ chantier, onView, onEdit, onDelete }) {
  if (!chantier) return null

  // Calculate financial stats
  const factures = chantier.factures || []
  const totalClients = calculateTotalFacturesClients(factures)
  const totalFournisseurs = calculateTotalFacturesFournisseurs(factures)
  const marge = calculateDifferenceFinanciere(totalClients, totalFournisseurs)
  const margeColor = getDifferenceColor(marge)

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 h-full">
      <div className="flex flex-col h-full">
        {/* Content - grows to fill space */}
        <div className="flex-1 space-y-4">
          {/* Header - Titre + Badge Statut */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {chantier.titre}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatutColor(chantier.statut)}`}>
                {getStatutLabel(chantier.statut)}
              </span>
              {/* Badge indicateur de notes */}
              {chantier.notes && chantier.notes.trim() !== '' && (
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0" title="A des notes">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                </div>
              )}
            </div>
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
        {(chantier.date_debut || chantier.date_fin_prevue || chantier.date_fin_reelle) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {chantier.date_debut && (
                <>Du {formatDate(chantier.date_debut)}</>
              )}
              {chantier.date_fin_prevue && (
                <> au {formatDate(chantier.date_fin_prevue)}</>
              )}
              {/* Date de fin réelle (uniquement si clôturé) */}
              {chantier.statut === 'cloture' && chantier.date_fin_reelle && (
                <span className="ml-2 font-medium text-green-700">
                  (Clôturé le {formatDate(chantier.date_fin_reelle)})
                </span>
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

        {/* Marge (différence financière) */}
        <div className="flex items-center gap-2">
          {marge >= 0 ? (
            <TrendingUp className={`w-5 h-5 flex-shrink-0 ${margeColor}`} />
          ) : (
            <TrendingDown className={`w-5 h-5 flex-shrink-0 ${margeColor}`} />
          )}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Marge</span>
            <span className={`text-lg font-bold ${margeColor}`}>
              {marge >= 0 ? '+' : ''}{formatCurrency(marge)}
            </span>
          </div>
        </div>

          {/* Description (extrait) */}
          {chantier.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {chantier.description}
            </p>
          )}
        </div>

        {/* Actions - stays at bottom */}
        <div className="flex items-center gap-1.5 pt-4 border-t border-gray-200 mt-4">
          <Button
            variant="outline"
            onClick={() => onView(chantier)}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">Voir</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onEdit(chantier)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => onDelete(chantier)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-300"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
