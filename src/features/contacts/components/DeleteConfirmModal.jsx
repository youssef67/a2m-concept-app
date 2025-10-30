import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { getContactDisplayName } from '../utils/contactHelpers'

/**
 * Confirmation modal for deleting a contact
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm delete handler
 * @param {Object} contact - Contact to delete
 * @param {boolean} isDeleting - Whether delete is in progress
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  contact,
  isDeleting
}) {
  if (!contact) return null

  const displayName = getContactDisplayName(contact)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer le contact"
      size="sm"
      closeOnBackdropClick={!isDeleting}
    >
      <div className="space-y-4">
        {/* Warning icon */}
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-gray-700 mb-2">
            Êtes-vous sûr de vouloir supprimer le contact :
          </p>
          <p className="font-semibold text-gray-900 text-lg">{displayName}</p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            Cette action est irréversible. Toutes les données associées à ce contact
            (adresse, personnes de contact) seront également supprimées.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
