/**
 * DeleteConfirmModal Component
 * Confirmation modal for deleting a chantier
 */

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Alert from '../../../shared/components/ui/Alert'

export default function DeleteConfirmModal({ isOpen, onClose, chantier, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!chantier) return null

  /**
   * Handle delete confirmation
   */
  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await onConfirm(chantier.id)

      if (result && result.success) {
        // Success: close modal
        handleClose()
      } else {
        // Error from API
        setError(result?.error?.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err) {
      console.error('Error deleting chantier:', err)
      setError('Une erreur est survenue lors de la suppression')
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirmer la suppression"
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
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Message */}
        <div className="text-center">
          <p className="text-lg text-gray-900 mb-2">
            Êtes-vous sûr de vouloir supprimer ce chantier ?
          </p>
          <p className="text-base font-semibold text-gray-900 mb-4">
            {chantier.titre}
          </p>
          <p className="text-sm text-gray-600">
            Cette action est irréversible. Toutes les données associées à ce chantier seront définitivement supprimées.
          </p>
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
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
