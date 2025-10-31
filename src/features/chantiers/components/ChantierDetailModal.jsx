/**
 * ChantierDetailModal Component
 * Display chantier details in read-only mode
 */

import React, { useState, useEffect } from 'react'
import { Pencil, MapPin, Calendar, Euro, User, FileText } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import DocumentsSection from './DocumentsSection'
import DeleteConfirmModal from './DeleteConfirmModal'
import { useToast } from '../../../shared/hooks/useToast'
import {
  formatDate,
  formatCurrency,
  getStatutLabel,
  getStatutColor,
  getClientDisplayName
} from '../utils/chantierHelpers'

export default function ChantierDetailModal({ isOpen, onClose, chantier, onEdit, onUpdateStatut }) {
  const [currentStatut, setCurrentStatut] = useState(chantier?.statut || 'devis')
  const [pendingStatut, setPendingStatut] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { showToast } = useToast()

  // Sync currentStatut with chantier.statut when it changes
  useEffect(() => {
    if (chantier?.statut) {
      setCurrentStatut(chantier.statut)
    }
  }, [chantier?.statut])

  if (!chantier) return null

  /**
   * Handle statut selection change
   */
  const handleStatutChange = (e) => {
    const newStatut = e.target.value

    if (newStatut === chantier.statut) {
      return // No change
    }

    // Update UI immediately for visual feedback
    setCurrentStatut(newStatut)
    setPendingStatut(newStatut)
    setShowConfirmModal(true)
  }

  /**
   * Confirm statut change
   */
  const handleConfirmStatutChange = async () => {
    if (!pendingStatut || !onUpdateStatut) return

    setIsUpdating(true)
    setShowConfirmModal(false)

    const result = await onUpdateStatut(chantier.id, { statut: pendingStatut })

    setIsUpdating(false)

    if (result && result.success) {
      setCurrentStatut(pendingStatut)
      showToast(`Statut changé en "${getStatutLabel(pendingStatut)}" avec succès`, 'success')
      setPendingStatut(null)
      onClose() // Fermer la modal immédiatement
    } else {
      showToast('Erreur lors du changement de statut', 'error')
      // Reset to original status on error
      setCurrentStatut(chantier.statut)
      setPendingStatut(null)
    }
  }

  /**
   * Cancel statut change
   */
  const handleCancelStatutChange = () => {
    setShowConfirmModal(false)
    setPendingStatut(null)
    // Reset to original status on cancel
    setCurrentStatut(chantier.statut)
  }

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

        {/* Changement de statut rapide */}
        <div>
          <label htmlFor="statut-select" className="block text-sm font-medium text-gray-700 mb-2">
            Changer le statut
          </label>
          <select
            id="statut-select"
            value={currentStatut}
            onChange={handleStatutChange}
            disabled={isUpdating}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="devis">Devis</option>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
            <option value="cloture">Clôturé</option>
          </select>
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

        {/* Montants */}
        {(chantier.montant_ht || chantier.montant_ttc) && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-start gap-3">
              <Euro className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">Montants</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chantier.montant_ht && (
                    <div>
                      <p className="text-xs text-gray-500">Montant HT</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(chantier.montant_ht)}
                      </p>
                    </div>
                  )}
                  {chantier.montant_ttc && (
                    <div>
                      <p className="text-xs text-gray-500">Montant TTC</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(chantier.montant_ttc)}
                      </p>
                    </div>
                  )}
                </div>
                {chantier.finalisation_95 && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ℹ️ Ce chantier a une finalisation à 95%
                    </p>
                  </div>
                )}
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

        {/* Documents Section */}
        <div className="border-t border-gray-200 pt-6">
          <DocumentsSection chantierId={chantier.id} />
        </div>

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

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCancelStatutChange}
        onConfirm={handleConfirmStatutChange}
        title="Changer le statut"
        message={
          pendingStatut
            ? `Êtes-vous sûr de vouloir changer le statut de "${getStatutLabel(chantier.statut)}" à "${getStatutLabel(pendingStatut)}" ?`
            : ''
        }
      />
    </Modal>
  )
}
