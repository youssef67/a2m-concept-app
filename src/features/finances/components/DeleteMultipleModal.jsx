import React, { useState } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { FileText, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../utils/factureHelpers'
import { deleteMultipleFactures } from '../services/facturesService'

/**
 * Modal for deleting multiple factures at once
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {Array} factures - Selected factures to delete
 * @param {function} onSuccess - Success callback
 */
export default function DeleteMultipleModal({
  isOpen,
  onClose,
  factures = [],
  onSuccess
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletionErrors, setDeletionErrors] = useState([])

  // Calculate total amount that will be affected
  const totalMontant = factures.reduce((sum, f) => sum + parseFloat(f.montant || 0), 0)

  // Handle deletion
  const handleDelete = async () => {
    setIsDeleting(true)
    setDeletionErrors([])

    try {
      // Prepare factures data for deletion
      const facturesData = factures.map(f => ({
        id: f.id,
        numero_facture: f.numero_facture
      }))

      const result = await deleteMultipleFactures(facturesData)

      if (result.success) {
        // All deletions successful
        onSuccess({
          message: `${result.deleted.length} facture(s) supprimée(s) avec succès`,
          deleted: result.deleted.length,
          total: factures.length
        })
        onClose()
      } else if (result.deleted.length > 0) {
        // Partial success
        setDeletionErrors(result.errors)
        onSuccess({
          message: `${result.deleted.length} sur ${factures.length} facture(s) supprimée(s)`,
          deleted: result.deleted.length,
          total: factures.length,
          hasErrors: true
        })
      } else {
        // All failed
        setDeletionErrors(result.errors)
      }
    } catch (error) {
      console.error('Error deleting factures:', error)
      setDeletionErrors([{ error: 'Une erreur est survenue lors de la suppression' }])
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Supprimer ${factures.length} facture(s)`}
      size="lg"
      closeOnBackdropClick={!isDeleting}
    >
      <div className="space-y-6">
        {/* Warning message */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-orange-900 mb-1">
                Attention : Suppression définitive
              </h4>
              <p className="text-sm text-orange-700">
                Cette action est irréversible. Tous les paiements associés à ces factures seront également supprimés.
              </p>
            </div>
          </div>
        </div>

        {/* Deletion errors */}
        {deletionErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-2">
                  Erreurs lors de la suppression
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {deletionErrors.map((err, index) => (
                    <li key={index}>
                      {err.factureNumero ? `${err.factureNumero}: ` : ''}
                      {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Factures list */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Factures à supprimer :
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {factures.map(facture => (
              <div
                key={facture.id}
                className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {facture.numero_facture}
                    </div>
                    <div className="text-sm text-gray-600">
                      {facture.contact?.nom || 'Contact inconnu'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(facture.montant)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {facture.statut === 'en_attente' && 'En attente'}
                    {facture.statut === 'annulee' && 'Annulée'}
                    {facture.statut === 'partiellement_payee' && 'Partiellement payée'}
                    {facture.statut === 'payee' && 'Payée'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Résumé</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre de factures:</span>
              <span className="font-semibold text-gray-900">{factures.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant total concerné:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalMontant)}</span>
            </div>
          </div>
        </div>

        {/* Confirmation text */}
        <div className="text-center py-2">
          <p className="text-sm text-gray-700">
            Êtes-vous sûr de vouloir supprimer ces factures ?
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting || factures.length === 0}
          >
            Confirmer la suppression
          </Button>
        </div>
      </div>
    </Modal>
  )
}
