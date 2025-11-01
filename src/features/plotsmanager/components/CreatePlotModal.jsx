/**
 * CreatePlotModal
 * Modal pour créer ou modifier un plot (immeuble/structure) lié à un chantier
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import { usePlots } from '../hooks/usePlots'

export default function CreatePlotModal({ isOpen, onClose, chantierId, chantierTitre, plotToEdit, hasTaches, hasDocuments, onSuccess }) {
  const { createPlot, updatePlot } = usePlots(chantierId)
  const [formData, setFormData] = useState({
    nom: '',
    type: 'immeuble',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isEditMode = !!plotToEdit

  // Initialize form data when modal opens or plot changes
  useEffect(() => {
    if (isOpen) {
      if (plotToEdit) {
        setFormData({
          nom: plotToEdit.nom || '',
          type: plotToEdit.type || 'immeuble',
          description: plotToEdit.description || ''
        })
      } else {
        setFormData({
          nom: '',
          type: 'immeuble',
          description: ''
        })
      }
      setErrorMessage('')
    }
  }, [isOpen, plotToEdit])

  // Type options for Select component
  const typeOptions = [
    { value: 'immeuble', label: 'Immeuble' },
    { value: 'structure', label: 'Structure' },
    { value: 'batiment', label: 'Bâtiment' },
    { value: 'annexe', label: 'Annexe' },
    { value: 'autre', label: 'Autre' }
  ]

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setErrorMessage('')
  }

  // Handle select change (custom Select component)
  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate taches and documents requirement
    if (!hasTaches || !hasDocuments) {
      setErrorMessage(
        'Vous devez définir au moins une tâche ET un document pour ce chantier avant de créer un plot. Utilisez les boutons "Créer des tâches" et "Définir les documents".'
      )
      return
    }

    if (!formData.nom.trim()) {
      setErrorMessage('Le nom est obligatoire')
      return
    }

    setErrorMessage('')

    setIsSubmitting(true)

    try {
      let result
      if (isEditMode) {
        result = await updatePlot(plotToEdit.id, formData)
      } else {
        result = await createPlot(formData)
      }

      if (result.success) {
        handleClose()
        // Notify parent to refresh plots list
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setErrorMessage(result.error?.message || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du plot`)
      }
    } catch (error) {
      console.error(`Erreur ${isEditMode ? 'modification' : 'création'} plot:`, error)
      setErrorMessage(`Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du plot`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        nom: '',
        type: 'immeuble',
        description: ''
      })
      setErrorMessage('')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title={isEditMode ? 'Modifier le plot' : 'Créer un plot'}>
      <div>
        {/* Chantier info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Chantier :</strong> {chantierTitre}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du plot */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du plot <span className="text-red-500">*</span>
            </label>
            <Input
              id="nom"
              name="nom"
              type="text"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Immeuble A, Structure principale..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.type}
              onChange={handleSelectChange}
              options={typeOptions}
              placeholder="Sélectionner un type"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Description du plot..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            />
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
              {isEditMode ? 'Enregistrer' : 'Créer le plot'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
