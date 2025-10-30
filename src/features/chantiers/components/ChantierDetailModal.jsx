/**
 * ChantierDetailModal Component
 * Display chantier details in read-only mode
 */

import React from 'react'
import { Pencil, MapPin, Calendar, Euro, User, FileText } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import {
  formatDate,
  formatCurrency,
  getStatutLabel,
  getStatutColor,
  getClientDisplayName
} from '../utils/chantierHelpers'

export default function ChantierDetailModal({ isOpen, onClose, chantier, onEdit }) {
  if (!chantier) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails du chantier"
      size="lg"
    >
      <div className="space-y-6">
        {/* Titre et Statut */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 flex-1">
            {chantier.titre}
          </h2>
          <span className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${getStatutColor(chantier.statut)}`}>
            {getStatutLabel(chantier.statut)}
          </span>
        </div>

        {/* Description */}
        {chantier.description && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{chantier.description}</p>
          </div>
        )}

        {/* Client */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Client</p>
              <p className="text-base text-gray-900 mt-1">
                {getClientDisplayName(chantier.client)}
              </p>
              {chantier.client?.phone && (
                <p className="text-sm text-gray-600 mt-1">
                  📞 {chantier.client.phone}
                </p>
              )}
              {chantier.client?.email && (
                <p className="text-sm text-gray-600">
                  ✉️ {chantier.client.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Adresse du chantier */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-500">Adresse du chantier</p>
              <div className="text-base text-gray-900 mt-1">
                {chantier.adresse_ligne1 && <p>{chantier.adresse_ligne1}</p>}
                {chantier.adresse_ligne2 && <p>{chantier.adresse_ligne2}</p>}
                <p>
                  {chantier.code_postal} {chantier.ville}
                </p>
                {chantier.pays && chantier.pays !== 'France' && <p>{chantier.pays}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Dates */}
        {(chantier.date_debut || chantier.date_fin_prevue || chantier.date_fin_reelle) && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Dates</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {chantier.date_debut && (
                    <div>
                      <p className="text-xs text-gray-500">Début</p>
                      <p className="text-base text-gray-900">{formatDate(chantier.date_debut)}</p>
                    </div>
                  )}
                  {chantier.date_fin_prevue && (
                    <div>
                      <p className="text-xs text-gray-500">Fin prévue</p>
                      <p className="text-base text-gray-900">{formatDate(chantier.date_fin_prevue)}</p>
                    </div>
                  )}
                  {chantier.date_fin_reelle && (
                    <div>
                      <p className="text-xs text-gray-500">Fin réelle</p>
                      <p className="text-base text-gray-900">{formatDate(chantier.date_fin_reelle)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget */}
        {chantier.budget_estime && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start gap-3">
              <Euro className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Budget</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(chantier.budget_estime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {chantier.notes && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                <p className="text-base text-gray-700 whitespace-pre-wrap">
                  {chantier.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              onClose()
              onEdit(chantier)
            }}
          >
            <Pencil className="w-4 h-4" />
            <span className="ml-2">Modifier</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
