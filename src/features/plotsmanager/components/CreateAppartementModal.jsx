/**
 * CreateAppartementModal
 * Modal pour créer un appartement lié à un plot
 * Les tâches sont automatiquement héritées du chantier
 */

import React, { useState } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import { useAppartements } from '../hooks/useAppartements'

export default function CreateAppartementModal({
  isOpen,
  onClose,
  plotId,
  chantierId,
  plotNom,
  onSuccess
}) {
  const { createAppartement } = useAppartements(plotId, chantierId)

  const [formData, setFormData] = useState({
    nom: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nom.trim()) {
      alert('Le nom est obligatoire')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createAppartement(formData)

      if (result.success) {
        alert('Appartement créé avec succès ! Les tâches ont été automatiquement ajoutées.')
        handleClose()
        // Notify parent to refresh appartements list
        if (onSuccess) {
          onSuccess()
        }
      } else {
        alert(result.error?.message || 'Erreur lors de la création de l\'appartement')
      }
    } catch (error) {
      console.error('Erreur création appartement:', error)
      alert('Erreur lors de la création de l\'appartement')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        nom: ''
      })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Créer un appartement">
      <div>
        {/* Plot info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Plot :</strong> {plotNom}
          </p>
        </div>

        {/* Info about task inheritance */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Les tâches du chantier seront automatiquement ajoutées à cet appartement.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de l'appartement */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'appartement <span className="text-red-500">*</span>
            </label>
            <Input
              id="nom"
              name="nom"
              type="text"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Appartement 101, Studio A..."
              required
              disabled={isSubmitting}
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
              Créer l'appartement
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
