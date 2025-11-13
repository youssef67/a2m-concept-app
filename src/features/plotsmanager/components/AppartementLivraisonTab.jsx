/**
 * AppartementLivraisonTab.jsx
 * Onglet pour gérer les livraisons d'un appartement
 */

import React, { useEffect, useState } from 'react'
import { RefreshCw, Edit, History, AlertCircle, Trash2 } from 'lucide-react'
import { useAppartementLivraison } from '../hooks/useAppartementLivraison'
import {
  getLivraisonStatutConfig,
  getBadgeLabel,
  getJoursRetard,
  formatDateLivraison
} from '../utils/livraisonHelpers'
import Button from '../../../shared/components/ui/Button'
import { useToast } from '../../../shared/hooks/useToast'
import LivraisonFormModal from './LivraisonFormModal'
import LivraisonHistoryModal from './LivraisonHistoryModal'

export default function AppartementLivraisonTab({ appartement }) {
  const {
    livraison,
    loading,
    error,
    loadLivraison,
    updateStatut,
    uploadPhoto,
    deletePhoto,
    deleteLivraison
  } = useAppartementLivraison(appartement.id)

  const { showToast } = useToast()

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Charger la livraison au montage
  useEffect(() => {
    loadLivraison()
  }, [loadLivraison])

  // Handle delete livraison
  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteLivraison()
    setIsDeleting(false)

    if (result.success) {
      showToast('Livraison supprimée avec succès', 'success')
      setShowDeleteConfirm(false)
      // Reload to show empty state
      loadLivraison()
    } else {
      showToast(result.error?.message || 'Erreur lors de la suppression', 'error')
    }
  }

  // Loading state
  if (loading && !livraison) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement de la livraison...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !livraison) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-sm font-medium text-red-800">Erreur</h3>
        </div>
        <p className="text-sm text-red-700">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLivraison}
          className="mt-3"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  // No livraison (ne devrait pas arriver grâce au trigger)
  if (!livraison) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-600 mb-4">Aucune information de livraison</p>
        <Button
          variant="primary"
          size="sm"
          onClick={loadLivraison}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recharger
        </Button>
      </div>
    )
  }

  const statutConfig = getLivraisonStatutConfig(livraison.statut)
  const StatutIcon = statutConfig.icon
  const joursRetard = getJoursRetard(livraison)
  const isEnRetard = joursRetard > 0

  return (
    <div className="space-y-4">
      {/* Header avec badge statut */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Livraison
        </h3>
      </div>

      {/* Card statut actuel */}
      <div className={`${statutConfig.bgColor} border-2 ${statutConfig.color.replace('bg-', 'border-')} rounded-lg p-4`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`${statutConfig.badgeColor} p-2 rounded-lg`}>
            <StatutIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-600 mb-1">Statut actuel</p>
            <p className={`text-lg font-semibold ${statutConfig.textColor}`}>
              {getBadgeLabel(livraison)}
            </p>
          </div>
        </div>

        {/* Alerte retard */}
        {isEnRetard && (
          <div className="bg-white border-2 border-red-300 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Livraison en retard
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {joursRetard} jour{joursRetard > 1 ? 's' : ''} de retard sur la date prévue
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations détaillées */}
        <div className="space-y-2">
          {livraison.fournisseur && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fournisseur:</span>
              <span className="font-medium text-gray-900">{livraison.fournisseur}</span>
            </div>
          )}

          {livraison.numero_commande && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">N° commande:</span>
              <span className="font-medium text-gray-900">{livraison.numero_commande}</span>
            </div>
          )}

          {livraison.date_commande && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date commande:</span>
              <span className="font-medium text-gray-900">
                {formatDateLivraison(livraison.date_commande, 'short')}
              </span>
            </div>
          )}

          {livraison.date_livraison_prevue && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Livraison prévue:</span>
              <span className={`font-medium ${isEnRetard ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDateLivraison(livraison.date_livraison_prevue, 'short')}
              </span>
            </div>
          )}

          {livraison.date_reception && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date réception:</span>
              <span className="font-medium text-gray-900">
                {formatDateLivraison(livraison.date_reception, 'short')}
              </span>
            </div>
          )}

          {livraison.note_incomplete && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Note:</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {livraison.note_incomplete}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Boutons actions */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="primary"
            onClick={() => setIsFormModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Edit className="w-5 h-5" />
            <span>Mettre à jour le statut</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsHistoryModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 min-h-[44px]"
          >
            <History className="w-5 h-5" />
            <span>Voir l&apos;historique</span>
          </Button>
        </div>

        <Button
          variant="danger"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 min-h-[44px]"
          disabled={isDeleting}
        >
          <Trash2 className="w-5 h-5" />
          <span>Supprimer la livraison</span>
        </Button>
      </div>

      {/* Modal formulaire mise à jour */}
      <LivraisonFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        livraison={livraison}
        appartement={appartement}
        onUpdate={updateStatut}
        onUploadPhoto={uploadPhoto}
        onDeletePhoto={deletePhoto}
        onSuccess={() => {
          setIsFormModalOpen(false)
          loadLivraison()
        }}
      />

      {/* Modal historique */}
      <LivraisonHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        appartementId={appartement.id}
      />

      {/* Confirmation suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Supprimer la livraison ?
                </h3>
                <p className="text-sm text-gray-600">
                  Cette action supprimera définitivement toutes les informations de livraison,
                  l&apos;historique et les photos associées. Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
                loading={isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? 'Suppression...' : 'Oui, supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
