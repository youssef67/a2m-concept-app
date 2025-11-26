/**
 * CreateAppartementModal
 * Modal pour créer ou modifier un appartement lié à un plot
 * Les tâches sont automatiquement héritées du chantier (création uniquement)
 */

import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import { useAppartements } from '../hooks/useAppartements'
import { getEtageOptions } from '../utils/etageConstants'
import { useToast } from '../../../shared/hooks/useToast'

export default function CreateAppartementModal({
  isOpen,
  onClose,
  plotId,
  chantierId,
  plotNom,
  plotNombreEtages = 10,
  appartementToEdit = null,
  onSuccess
}) {
  const { createAppartement, updateAppartement } = useAppartements(plotId, chantierId)
  const { showToast } = useToast()
  const isEditMode = !!appartementToEdit

  const [formData, setFormData] = useState({
    nom: '',
    etage: null,
    has_tma: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const nomInputRef = useRef(null)

  // Initialize form data when modal opens (create or edit mode)
  useEffect(() => {
    if (isOpen) {
      setValidationError(null)
      if (isEditMode && appartementToEdit) {
        // Edit mode: pre-fill with existing data
        setFormData({
          nom: appartementToEdit.nom,
          etage: appartementToEdit.etage !== undefined ? appartementToEdit.etage : null,
          has_tma: appartementToEdit.has_tma || false
        })
      } else {
        // Create mode: reset form
        setFormData({
          nom: '',
          etage: null,
          has_tma: false
        })
      }

      // Auto-focus on nom input when modal opens
      setTimeout(() => {
        if (nomInputRef.current) {
          nomInputRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen, isEditMode, appartementToEdit])

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear validation error when user types
    if (name === 'nom' && validationError) {
      setValidationError(null)
    }
  }

  // Handle etage change
  const handleEtageChange = (value) => {
    setFormData(prev => ({
      ...prev,
      etage: value
    }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation inline
    if (!formData.nom.trim()) {
      setValidationError('Le nom est obligatoire')
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (isEditMode) {
        // Update existing appartement
        result = await updateAppartement(appartementToEdit.id, formData)
      } else {
        // Create new appartement
        result = await createAppartement(formData)
      }

      if (result.success) {
        showToast(
          isEditMode ? 'Lot modifié avec succès' : 'Lot créé avec succès',
          'success'
        )
        handleClose()
        // Notify parent to refresh appartements list and pass created appartement data
        if (onSuccess) {
          onSuccess(result.data)
        }
      } else {
        showToast(
          result.error?.message || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du lot`,
          'error'
        )
      }
    } catch (error) {
      console.error(`Erreur ${isEditMode ? 'modification' : 'création'} appartement:`, error)
      showToast(`Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du lot`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        nom: '',
        etage: null,
        has_tma: false
      })
      setValidationError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title={isEditMode ? "Modifier le lot" : "Créer un lot"}
    >
      <div>
        {/* Plot info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Plot :</strong> {plotNom}
          </p>
        </div>

        {/* Info about task inheritance (only in create mode) */}
        {!isEditMode && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Les tâches du chantier seront automatiquement ajoutées à ce lot.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du lot */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l&apos;appartement <span className="text-red-500">*</span>
            </label>
            <Input
              ref={nomInputRef}
              id="nom"
              name="nom"
              type="text"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Lot 101, Studio A..."
              required
              disabled={isSubmitting}
            />
            {validationError && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {/* Étage du lot */}
          <div>
            <label htmlFor="etage" className="block text-sm font-medium text-gray-700 mb-1">
              Étage (facultatif)
            </label>
            <Select
              value={formData.etage}
              onChange={handleEtageChange}
              options={getEtageOptions(plotNombreEtages)}
              placeholder="Sélectionner un étage..."
              disabled={isSubmitting}
            />
          </div>

          {/* TMA (Travaux Modificatifs Acquéreur) */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="has_tma"
                checked={formData.has_tma || false}
                onChange={(e) => setFormData({ ...formData, has_tma: e.target.checked })}
                disabled={isSubmitting}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="has_tma" className="text-sm font-medium text-gray-700">
                TMA (Travaux Modificatifs Acquéreur)
              </label>
              <p className="text-xs text-gray-500">
                Cochez si ce lot a une TMA
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isEditMode ? 'Enregistrer' : "Créer le lot"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
