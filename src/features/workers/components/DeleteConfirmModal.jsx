/**
 * DeleteConfirmModal
 * Modal de confirmation pour la suppression d'un worker
 */

import React from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import { getWorkerFullName } from '../utils/workerHelpers'

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, worker, isDeleting }) {
  if (!worker) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmer la suppression"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">
              Êtes-vous sûr de vouloir supprimer <strong>{getWorkerFullName(worker)}</strong> ?
            </p>
            <p className="text-xs text-red-700 mt-1">
              Cette action est irréversible.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
