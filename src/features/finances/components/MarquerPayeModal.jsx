/**
 * MarquerPayeModal - Modal pour marquer les retenues de garantie comme payées
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { AlertCircle } from 'lucide-react'

/**
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close handler
 * @param {Object} chantier - Chantier object
 * @param {function} onConfirm - Confirm handler (chantierId, { retenue_garantie_payee })
 */
export default function MarquerPayeModal({
  isOpen,
  onClose,
  chantier,
  onConfirm
}) {
  const [retenueGarantiePayee, setRetenueGarantiePayee] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Initialize checkbox states when modal opens
  useEffect(() => {
    if (isOpen && chantier) {
      setRetenueGarantiePayee(chantier.retenue_garantie_payee || false)
      setShowConfirmation(false)
    }
  }, [isOpen, chantier])

  const handleSubmit = async () => {
    // Check if we're marking as paid (needs confirmation)
    const markingAsPaid = retenueGarantiePayee && !chantier.retenue_garantie_payee

    // If marking as paid and not yet confirmed, show confirmation
    if (markingAsPaid && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    // Submit the changes
    setSubmitting(true)

    await onConfirm(chantier.id, {
      retenue_garantie_payee: retenueGarantiePayee
    })

    setSubmitting(false)
    setShowConfirmation(false)
    onClose()
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Marquer comme payé"
      size="md"
    >
      <div className="space-y-6">
        {/* Info chantier */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900">{chantier?.titre}</h3>
        </div>

        {/* Checkbox */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              id="retenue_garantie_payee"
              type="checkbox"
              checked={retenueGarantiePayee}
              onChange={(e) => setRetenueGarantiePayee(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="retenue_garantie_payee" className="flex-1 cursor-pointer">
              <span className="block text-sm font-medium text-gray-900">
                Retenues de garantie
              </span>
              <span className="block text-xs text-gray-600 mt-1">
                Marquer le paiement des retenues de garantie comme effectué
              </span>
            </label>
          </div>
        </div>

        {/* Confirmation message */}
        {showConfirmation && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                Confirmation requise
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Êtes-vous sûr de vouloir marquer les retenues de garantie comme payées ?
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'En cours...' : showConfirmation ? 'Confirmer' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
