import React, { useState } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { FileText, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '../utils/factureHelpers'

/**
 * Modal for deleting multiple factures at once
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {Array} factures - Selected factures to delete
 * @param {function} onSuccess - Success callback
 * @param {function} onDelete - Delete handler from hook
 */
export default function DeleteMultipleModal({
  isOpen,
  onClose,
  factures = [],
  onSuccess,
  onDelete
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

      const result = await onDelete(facturesData)

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
      title={`Supprimer ${factures.length} facture${factures.length > 1 ? 's' : ''}`}
      size="lg"
      closeOnBackdropClick={!isDeleting}
    >
      <div className="space-y-5">
        {/* Warning message - Plus visible et moderne */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-red-900 mb-1.5">
                Action irréversible
              </h4>
              <p className="text-sm text-red-800 leading-relaxed">
                Les factures et leurs paiements associés seront définitivement supprimés.
              </p>
            </div>
          </div>
        </div>

        {/* Deletion errors */}
        {deletionErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-600 rounded-r-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900 mb-2">
                  Erreurs lors de la suppression
                </h4>
                <ul className="text-sm text-red-800 space-y-1.5">
                  {deletionErrors.map((err, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>
                        {err.factureNumero ? `${err.factureNumero}: ` : ''}
                        {err.error}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Factures list - Design moderne avec cards */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
            Factures concernées
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
            {factures.map(facture => (
              <div
                key={facture.id}
                className="bg-white border-2 border-gray-200 hover:border-red-200 rounded-xl p-4 flex items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-base truncate">
                      {facture.numero_facture}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {facture.contact?.nom || 'Contact inconnu'}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900 text-base">
                    {formatCurrency(facture.montant)}
                  </div>
                  <div className="text-xs font-medium mt-1">
                    {facture.statut === 'en_attente' && (
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">En attente</span>
                    )}
                    {facture.statut === 'annulee' && (
                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">Annulée</span>
                    )}
                    {facture.statut === 'partiellement_payee' && (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Part. payée</span>
                    )}
                    {facture.statut === 'payee' && (
                      <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Payée</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary - Plus visible */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="text-sm text-gray-600">Nombre de factures</div>
              <div className="text-2xl font-bold text-gray-900">{factures.length}</div>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div className="space-y-1.5 text-right">
              <div className="text-sm text-gray-600">Montant total</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalMontant)}</div>
            </div>
          </div>
        </div>

        {/* Actions - Plus d'espace et meilleure hiérarchie */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting || factures.length === 0}
            className="min-w-[180px]"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
