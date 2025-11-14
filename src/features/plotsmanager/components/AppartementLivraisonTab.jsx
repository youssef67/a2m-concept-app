/**
 * AppartementLivraisonTab.jsx
 * Onglet pour gérer les livraisons d'un appartement (supporte plusieurs livraisons)
 */

import React, { useEffect, useState } from 'react'
import { RefreshCw, Edit, History, AlertCircle, Trash2, Plus, Package, Ruler } from 'lucide-react'
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

export default function AppartementLivraisonTab({
  appartement,
  plinthes,
  loading: plinthesLoading,
  onOpenPlinthesModal
}) {
  const {
    livraisons,
    loading,
    error,
    loadLivraisons,
    createLivraison,
    updateStatut,
    uploadPhoto,
    deletePhoto,
    deleteLivraison
  } = useAppartementLivraison(appartement.id)

  const { showToast } = useToast()

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedLivraison, setSelectedLivraison] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [livraisonToDelete, setLivraisonToDelete] = useState(null)

  // Charger les livraisons au montage
  useEffect(() => {
    loadLivraisons()
  }, [loadLivraisons])

  // Handle création nouvelle livraison
  const handleCreateClick = () => {
    setSelectedLivraison(null)
    setIsFormModalOpen(true)
  }

  // Handle édition livraison
  const handleEditClick = (livraison) => {
    setSelectedLivraison(livraison)
    setIsFormModalOpen(true)
  }

  // Handle voir historique
  const handleHistoryClick = (livraison) => {
    setSelectedLivraison(livraison)
    setIsHistoryModalOpen(true)
  }

  // Handle delete livraison
  const handleDelete = async () => {
    if (!livraisonToDelete) return

    setIsDeleting(true)
    const result = await deleteLivraison(livraisonToDelete.id)
    setIsDeleting(false)

    if (result.success) {
      showToast('Livraison supprimée avec succès', 'success')
      setLivraisonToDelete(null)
    } else {
      showToast(result.error?.message || 'Erreur lors de la suppression', 'error')
    }
  }

  // Loading state
  if (loading && livraisons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement des livraisons...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && livraisons.length === 0) {
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
          onClick={loadLivraisons}
          className="mt-3"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section Plinthes */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Ruler className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Plinthes</h4>
              {plinthes ? (
                <p className="text-sm text-gray-600">
                  {plinthes.quantite_ml ? `${plinthes.quantite_ml} ML` : 'Non renseigné'}
                  {plinthes.est_commande && ' • Commandé'}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Aucune information</p>
              )}
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenPlinthesModal}
            disabled={plinthesLoading}
            className="flex items-center gap-2 min-h-[44px]"
          >
            <Ruler className="w-4 h-4" />
            <span>Gérer</span>
          </Button>
        </div>
      </div>

      {/* Header avec bouton nouvelle livraison */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Livraisons {livraisons.length > 0 && `(${livraisons.length})`}
        </h3>
        <Button
          variant="primary"
          onClick={handleCreateClick}
          className="flex items-center gap-2 min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle livraison</span>
        </Button>
      </div>

      {/* Liste des livraisons */}
      {livraisons.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Aucune livraison pour ce lot</p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer la première livraison
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {livraisons.map((livraison) => {
            const statutConfig = getLivraisonStatutConfig(livraison.statut)
            const StatutIcon = statutConfig.icon
            const joursRetard = getJoursRetard(livraison)
            const isEnRetard = joursRetard > 0

            return (
              <div
                key={livraison.id}
                className={`${statutConfig.bgColor} border-2 ${statutConfig.color.replace('bg-', 'border-')} rounded-lg p-4`}
              >
                {/* Nom + Badge statut */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`${statutConfig.badgeColor} p-2 rounded-lg`}>
                      <StatutIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 truncate">
                        {livraison.nom_livraison}
                      </h4>
                      <p className={`text-sm ${statutConfig.textColor}`}>
                        {getBadgeLabel(livraison)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alerte retard */}
                {isEnRetard && (
                  <div className="bg-white border-2 border-red-300 rounded-lg p-2 mb-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800">
                        {joursRetard} jour{joursRetard > 1 ? 's' : ''} de retard
                      </p>
                    </div>
                  </div>
                )}

                {/* Informations détaillées */}
                <div className="space-y-1 mb-3 text-sm">
                  {livraison.fournisseur && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fournisseur:</span>
                      <span className="font-medium text-gray-900">{livraison.fournisseur}</span>
                    </div>
                  )}

                  {livraison.numero_commande && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">N° commande:</span>
                      <span className="font-medium text-gray-900">{livraison.numero_commande}</span>
                    </div>
                  )}

                  {livraison.date_commande && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date commande:</span>
                      <span className="font-medium text-gray-900">
                        {formatDateLivraison(livraison.date_commande, 'short')}
                      </span>
                    </div>
                  )}

                  {livraison.date_livraison_prevue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Livraison prévue:</span>
                      <span className={`font-medium ${isEnRetard ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDateLivraison(livraison.date_livraison_prevue, 'short')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Boutons actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEditClick(livraison)}
                    className="w-full flex items-center justify-center gap-1 min-h-[44px]"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-xs">Modifier</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleHistoryClick(livraison)}
                    className="w-full flex items-center justify-center gap-1 min-h-[44px]"
                  >
                    <History className="w-4 h-4" />
                    <span className="text-xs">Historique</span>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setLivraisonToDelete(livraison)}
                    className="w-full flex items-center justify-center gap-1 min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs">Supprimer</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal formulaire création/édition */}
      <LivraisonFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedLivraison(null)
        }}
        livraison={selectedLivraison}
        appartement={appartement}
        onUpdate={updateStatut}
        onUploadPhoto={uploadPhoto}
        onDeletePhoto={deletePhoto}
        onCreate={createLivraison}
        onSuccess={() => {
          setIsFormModalOpen(false)
          setSelectedLivraison(null)
          loadLivraisons()
        }}
      />

      {/* Modal historique */}
      <LivraisonHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false)
          setSelectedLivraison(null)
        }}
        livraisonId={selectedLivraison?.id}
      />

      {/* Confirmation suppression */}
      {livraisonToDelete && (
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
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{livraisonToDelete.nom_livraison}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Cette action supprimera définitivement toutes les informations de livraison,
                  l&apos;historique et les photos associées. Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setLivraisonToDelete(null)}
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
