import React, { useState } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { FileText, AlertTriangle, User, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate, getContactDisplayName } from '../utils/factureHelpers'

/**
 * Modal for deleting a single facture
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {Object} facture - Facture to delete
 * @param {function} onConfirm - Confirm delete handler
 */
export default function DeleteFactureModal({
  isOpen,
  onClose,
  facture,
  onConfirm
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!facture) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(facture.id)
      onClose()
    } catch (error) {
      console.error('Error deleting facture:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer la facture"
      size="md"
      closeOnBackdropClick={!isDeleting}
    >
      <div className="space-y-5">
        {/* Warning message */}
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
                Cette facture et ses paiements associés seront définitivement supprimés.
              </p>
            </div>
          </div>
        </div>

        {/* Facture details card */}
        <div className="bg-white border-2 border-red-200 rounded-xl p-5 shadow-sm">
          {/* Header with facture number */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-lg truncate">
                {facture.numero_facture}
              </div>
              <div className="text-sm">
                {facture.statut === 'en_attente' && (
                  <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                    En attente
                  </span>
                )}
                {facture.statut === 'annulee' && (
                  <span className="text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                    Annulée
                  </span>
                )}
                {facture.statut === 'partiellement_payee' && (
                  <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium">
                    Partiellement payée
                  </span>
                )}
                {facture.statut === 'payee' && (
                  <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                    Payée
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {/* Contact */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">Contact</div>
                <div className="font-medium text-gray-900 truncate">
                  {getContactDisplayName(facture.contact)}
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">Date d&apos;émission</div>
                <div className="font-medium text-gray-900">
                  {formatDate(facture.date_emission)}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">Montant</div>
                <div className="font-bold text-red-600 text-lg">
                  {formatCurrency(facture.montant)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional warning for paid invoices */}
        {(facture.statut === 'payee' || facture.statut === 'partiellement_payee') && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-3 shadow-sm">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ Cette facture a des paiements associés qui seront également supprimés.
            </p>
          </div>
        )}

        {/* Actions */}
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
            onClick={handleConfirm}
            loading={isDeleting}
            disabled={isDeleting}
            className="min-w-[180px]"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
