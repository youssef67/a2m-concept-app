/**
 * AvenantsSection Component
 * Section for managing avenants within a chantier
 */

import React, { useState } from 'react'
import { FileStack, Plus, Pencil, Trash2 } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import Alert from '../../../shared/components/ui/Alert'
import Spinner from '../../../shared/components/ui/Spinner'
import AvenantFormModal from './AvenantFormModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { useToast } from '../../../shared/hooks/useToast'
import { formatCurrency, formatNumeroAvenant } from '../utils/chantierHelpers'

export default function AvenantsSection({
  chantierId,
  avenants = [],
  loading = false,
  error = null,
  onAdd,
  onModify,
  onDelete
}) {
  const { showToast } = useToast()

  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAvenant, setSelectedAvenant] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  /**
   * Handle add avenant click
   */
  const handleAddClick = () => {
    setSelectedAvenant(null)
    setIsEditing(false)
    setShowFormModal(true)
  }

  /**
   * Handle edit avenant click
   */
  const handleEditClick = (avenant) => {
    setSelectedAvenant(avenant)
    setIsEditing(true)
    setShowFormModal(true)
  }

  /**
   * Handle delete avenant click
   */
  const handleDeleteClick = (avenant) => {
    setSelectedAvenant(avenant)
    setShowDeleteModal(true)
  }

  /**
   * Handle form submit (add or edit)
   */
  const handleFormSubmit = async (montantHT, description) => {
    if (isEditing && selectedAvenant) {
      // Update existing avenant
      const result = await onModify(selectedAvenant.id, {
        montant_ht: montantHT,
        description
      })

      if (result.success) {
        showToast('Avenant modifié avec succès', 'success')
        setShowFormModal(false)
        setSelectedAvenant(null)
      } else {
        showToast('Erreur lors de la modification de l\'avenant', 'error')
      }
    } else {
      // Create new avenant
      const result = await onAdd(montantHT, description)

      if (result.success) {
        showToast('Avenant créé avec succès', 'success')
        setShowFormModal(false)
      } else {
        showToast('Erreur lors de la création de l\'avenant', 'error')
      }
    }
  }

  /**
   * Confirm delete
   */
  const handleConfirmDelete = async () => {
    if (!selectedAvenant) return

    const result = await onDelete(selectedAvenant.id)

    if (result.success) {
      showToast('Avenant supprimé avec succès', 'success')
      setShowDeleteModal(false)
      setSelectedAvenant(null)
    } else {
      showToast('Erreur lors de la suppression de l\'avenant', 'error')
    }
  }

  /**
   * Cancel delete
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setSelectedAvenant(null)
  }

  /**
   * Calculate total avenants montant
   */
  const totalAvenants = avenants.reduce((sum, avenant) => {
    return sum + (parseFloat(avenant.montant_ht) || 0)
  }, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileStack className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Avenants
          </h3>
          {!loading && (
            <span className="text-sm text-gray-500">
              ({avenants.length})
            </span>
          )}
        </div>

        <Button
          variant="primary"
          onClick={handleAddClick}
          className="h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un avenant
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Avenants List */}
      {!loading && avenants.length > 0 && (
        <div className="space-y-3">
          {avenants.map((avenant) => (
            <div
              key={avenant.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Avenant Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-gray-900">
                      {formatNumeroAvenant(avenant.numero)}
                    </h4>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(avenant.montant_ht)}
                    </span>
                  </div>

                  {avenant.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {avenant.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleEditClick(avenant)}
                    className="h-10 px-3"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDeleteClick(avenant)}
                    className="h-10 px-3 text-red-600 hover:bg-red-50 hover:border-red-300"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Total Avenants */}
          {avenants.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Total des avenants
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalAvenants)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && avenants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <FileStack className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base text-gray-600 font-medium mb-1">
            Aucun avenant
          </p>
          <p className="text-sm text-gray-500">
            Ajoutez des avenants pour modifier le montant du chantier
          </p>
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      <AvenantFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setSelectedAvenant(null)
          setIsEditing(false)
        }}
        onSubmit={handleFormSubmit}
        avenant={selectedAvenant}
        isEditing={isEditing}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'avenant"
        message={
          selectedAvenant
            ? `Êtes-vous sûr de vouloir supprimer "${formatNumeroAvenant(selectedAvenant.numero)}" ? Cette action est irréversible.`
            : ''
        }
      />
    </div>
  )
}
