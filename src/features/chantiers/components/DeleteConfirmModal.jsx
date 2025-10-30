/**
 * DeleteConfirmModal Component
 * Confirmation modal for deleting a chantier
 */

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Alert from '../../../shared/components/ui/Alert'

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  chantier,
  onConfirm,
  title,
  message,
  error: externalError
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Use external error if provided, otherwise use local error
  const displayError = externalError || error

  /**
   * Handle delete confirmation
   */
  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      // If chantier is provided, pass chantier.id, otherwise just call onConfirm
      const result = chantier
        ? await onConfirm(chantier.id)
        : await onConfirm()

      if (result && result.success) {
        // Success: close modal
        handleClose()
      } else {
        // Error from API
        setError(result?.error?.message || 'Une erreur est survenue')
      }
    } catch (err) {
      console.error('Error in confirmation:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  // Use custom title/message if provided, otherwise use default delete messages
  const modalTitle = title || 'Confirmer la suppression'
  const isDeleteMode = !!chantier && !title && !message

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Alert */}
        {displayError && (
          <Alert variant="error">
            {displayError}
          </Alert>
        )}

        {/* Message */}
        <div className="text-center">
          {message ? (
            // Custom message
            <p className="text-base text-gray-900">
              {message}
            </p>
          ) : (
            // Default delete message
            <>
              <p className="text-lg text-gray-900 mb-2">
                Êtes-vous sûr de vouloir supprimer ce chantier ?
              </p>
              {chantier && (
                <p className="text-base font-semibold text-gray-900 mb-4">
                  {chantier.titre}
                </p>
              )}
              <p className="text-sm text-gray-600">
                Cette action est irréversible. Toutes les données associées à ce chantier seront définitivement supprimées.
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>

          <Button
            variant={isDeleteMode ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {isDeleteMode ? 'Supprimer' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
