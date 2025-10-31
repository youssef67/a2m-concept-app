/**
 * AvenantFormModal Component
 * Modal for adding or editing an avenant
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'

export default function AvenantFormModal({ isOpen, onClose, onSubmit, avenant, isEditing }) {
  const [montantHT, setMontantHT] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})

  // Initialize form when editing
  useEffect(() => {
    if (isEditing && avenant) {
      setMontantHT(avenant.montant_ht?.toString() || '')
      setDescription(avenant.description || '')
    } else {
      setMontantHT('')
      setDescription('')
    }
    setErrors({})
  }, [isOpen, isEditing, avenant])

  /**
   * Validate form
   */
  const validate = () => {
    const newErrors = {}

    // Montant HT is required and must be positive
    if (!montantHT || montantHT.trim() === '') {
      newErrors.montantHT = 'Le montant HT est obligatoire'
    } else {
      const montant = parseFloat(montantHT)
      if (isNaN(montant) || montant <= 0) {
        newErrors.montantHT = 'Le montant HT doit être un nombre positif'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    onSubmit(parseFloat(montantHT), description.trim())
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setMontantHT('')
    setDescription('')
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={isEditing ? 'Modifier l\'avenant' : 'Ajouter un avenant'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Montant HT */}
        <div>
          <label htmlFor="montant-ht" className="block text-sm font-medium text-gray-700 mb-2">
            Montant HT <span className="text-red-500">*</span>
          </label>
          <Input
            id="montant-ht"
            type="number"
            step="0.01"
            min="0.01"
            value={montantHT}
            onChange={(e) => setMontantHT(e.target.value)}
            placeholder="Ex: 5000.00"
            error={errors.montantHT}
          />
          {errors.montantHT && (
            <p className="mt-1 text-sm text-red-600">{errors.montantHT}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (optionnelle)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de l'avenant..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Annuler
          </Button>

          <Button
            type="submit"
            variant="primary"
          >
            {isEditing ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
