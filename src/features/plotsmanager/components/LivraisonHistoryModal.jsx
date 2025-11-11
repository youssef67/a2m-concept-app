/**
 * LivraisonHistoryModal.jsx
 * Modal pour afficher l'historique des changements de statut de livraison
 */

import React, { useEffect } from 'react'
import { Clock, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { useAppartementLivraison } from '../hooks/useAppartementLivraison'
import {
  getLivraisonStatutConfig,
  formatDateHistorique,
  formatDateLivraison
} from '../utils/livraisonHelpers'

export default function LivraisonHistoryModal({
  isOpen,
  onClose,
  appartementId
}) {
  const { history, loading, error, loadHistory } = useAppartementLivraison(appartementId)

  // Charger l'historique à l'ouverture
  useEffect(() => {
    if (isOpen && appartementId) {
      loadHistory()
    }
  }, [isOpen, appartementId, loadHistory])

  // Loading state
  if (loading && history.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Historique de livraison"
        size="lg"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Chargement de l&apos;historique...</p>
          </div>
        </div>
      </Modal>
    )
  }

  // Error state
  if (error && history.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Historique de livraison"
        size="lg"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
          </div>
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </Modal>
    )
  }

  // Empty history
  if (history.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Historique de livraison"
        size="lg"
      >
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun historique disponible</p>
          <p className="text-sm text-gray-500 mt-2">
            Les changements de statut apparaîtront ici
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historique de livraison"
      size="lg"
    >
      <div className="space-y-4">
        {/* Timeline */}
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Entrées historique */}
          <div className="space-y-6">
            {history.map((entry, index) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                isFirst={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Composant pour une entrée d'historique
 */
function HistoryEntry({ entry, isFirst }) {
  const ancienStatutConfig = entry.ancien_statut
    ? getLivraisonStatutConfig(entry.ancien_statut)
    : null
  const nouveauStatutConfig = getLivraisonStatutConfig(entry.nouveau_statut)

  const AncienIcon = ancienStatutConfig?.icon
  const NouveauIcon = nouveauStatutConfig.icon

  return (
    <div className="relative pl-12">
      {/* Point timeline */}
      <div
        className={`absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center ${
          isFirst ? nouveauStatutConfig.badgeColor : 'bg-gray-400'
        }`}
      >
        <Clock className="w-4 h-4 text-white" />
      </div>

      {/* Contenu */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        {/* Date et heure */}
        <p className="text-xs text-gray-500 mb-2">
          {formatDateHistorique(entry.created_at)}
        </p>

        {/* Transition de statut */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {ancienStatutConfig ? (
            <>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${ancienStatutConfig.color}`}>
                {AncienIcon && <AncienIcon className="w-4 h-4" />}
                <span className="text-sm font-medium">{ancienStatutConfig.label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </>
          ) : (
            <span className="text-xs text-gray-500 italic">Création initiale</span>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${nouveauStatutConfig.color}`}>
            <NouveauIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{nouveauStatutConfig.label}</span>
          </div>
        </div>

        {/* Détails selon le statut */}
        <HistoryDetails entry={entry} />
      </div>
    </div>
  )
}

/**
 * Afficher les détails d'une entrée selon le statut
 */
function HistoryDetails({ entry }) {
  const hasDetails =
    entry.date_commande ||
    entry.fournisseur ||
    entry.numero_commande ||
    entry.date_livraison_prevue ||
    entry.date_reception ||
    entry.note_incomplete

  if (!hasDetails) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      {entry.date_commande && (
        <DetailRow
          label="Date de commande"
          value={formatDateLivraison(entry.date_commande, 'short')}
        />
      )}

      {entry.fournisseur && (
        <DetailRow label="Fournisseur" value={entry.fournisseur} />
      )}

      {entry.numero_commande && (
        <DetailRow label="N° commande" value={entry.numero_commande} />
      )}

      {entry.date_livraison_prevue && (
        <DetailRow
          label="Livraison prévue"
          value={formatDateLivraison(entry.date_livraison_prevue, 'short')}
        />
      )}

      {entry.date_reception && (
        <DetailRow
          label="Date réception"
          value={formatDateLivraison(entry.date_reception, 'short')}
        />
      )}

      {entry.note_incomplete && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-1">Note:</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-2 rounded">
            {entry.note_incomplete}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Ligne de détail
 */
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
