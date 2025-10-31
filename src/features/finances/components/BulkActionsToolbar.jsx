import React from 'react'
import { CreditCard, Trash2, CheckSquare, X } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'

/**
 * Toolbar for bulk actions in selection mode
 * @param {number} selectedCount - Number of selected factures
 * @param {number} totalCount - Total number of factures
 * @param {function} onSelectAll - Handler for select all
 * @param {function} onCancel - Handler for cancel selection
 * @param {function} onPay - Handler for pay selected factures
 * @param {function} onDelete - Handler for delete selected factures
 * @param {boolean} hasPayableSelection - Whether selection contains payable factures
 * @param {boolean} hasDeletableSelection - Whether selection contains deletable factures
 */
export default function BulkActionsToolbar({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onCancel,
  onPay,
  onDelete,
  hasPayableSelection = false,
  hasDeletableSelection = false
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary-500 shadow-lg z-40 md:relative md:border md:border-gray-200 md:rounded-lg md:mb-4">
      <div className="p-4 space-y-3">
        {/* Header - Selection count and controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900">
              {selectedCount} {selectedCount > 1 ? 'factures sélectionnées' : 'facture sélectionnée'}
            </span>
            <button
              onClick={onSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <CheckSquare className="w-4 h-4" />
              Tout sélectionner ({totalCount})
            </button>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="Annuler la sélection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={onPay}
            disabled={!hasPayableSelection || selectedCount < 2}
            className="flex-1"
          >
            <CreditCard className="w-5 h-5" />
            Payer ({selectedCount})
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            disabled={!hasDeletableSelection || selectedCount === 0}
            className="flex-1"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer ({selectedCount})
          </Button>
        </div>

        {/* Helper text */}
        {selectedCount < 2 && selectedCount > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Sélectionnez au moins 2 factures pour effectuer un paiement multiple
          </p>
        )}
        {selectedCount === 0 && (
          <p className="text-sm text-gray-500 text-center">
            Sélectionnez des factures pour effectuer des actions en masse
          </p>
        )}
      </div>
    </div>
  )
}
