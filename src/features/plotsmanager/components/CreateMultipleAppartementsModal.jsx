/**
 * CreateMultipleAppartementsModal
 * Modal pour créer plusieurs appartements en même temps
 * Les tâches sont automatiquement héritées du chantier pour chaque appartement
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import { Plus, Trash2 } from 'lucide-react'
import { useAppartements } from '../hooks/useAppartements'
import { getEtageOptions } from '../utils/etageConstants'

const MAX_APPARTEMENTS = 20

export default function CreateMultipleAppartementsModal({
  isOpen,
  onClose,
  plotId,
  chantierId,
  plotNom,
  existingAppartementNames = [],
  onSuccess
}) {
  const { createMultipleAppartements } = useAppartements(plotId, chantierId)

  const [appartements, setAppartements] = useState([{ nom: '', etage: null }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAppartements([{ nom: '', etage: null }])
      setError(null)
    }
  }, [isOpen])

  // Add new appartement field
  const handleAddAppartement = () => {
    if (appartements.length >= MAX_APPARTEMENTS) {
      setError(`Vous ne pouvez pas créer plus de ${MAX_APPARTEMENTS} appartements à la fois`)
      return
    }
    setAppartements([...appartements, { nom: '', etage: null }])
    setError(null)
  }

  // Remove appartement field
  const handleRemoveAppartement = (index) => {
    if (appartements.length === 1) return // Don't remove last field
    const newAppartements = appartements.filter((_, i) => i !== index)
    setAppartements(newAppartements)
    setError(null)
  }

  // Update appartement name
  const handleNomChange = (index, value) => {
    const newAppartements = [...appartements]
    newAppartements[index] = { ...newAppartements[index], nom: value }
    setAppartements(newAppartements)
    setError(null)
  }

  // Update appartement etage
  const handleEtageChange = (index, value) => {
    const newAppartements = [...appartements]
    newAppartements[index] = { ...newAppartements[index], etage: value }
    setAppartements(newAppartements)
    setError(null)
  }

  // Validate appartements
  const validateAppartements = () => {
    // Remove empty names
    const nonEmptyAppartements = appartements.filter(appt => appt.nom.trim() !== '')

    if (nonEmptyAppartements.length === 0) {
      setError('Veuillez entrer au moins un nom d\'appartement')
      return null
    }

    // Check for duplicates within the list
    const noms = nonEmptyAppartements.map(appt => appt.nom.trim())
    const duplicates = noms.filter((nom, index) =>
      noms.indexOf(nom) !== index
    )
    if (duplicates.length > 0) {
      setError('Certains noms sont en double. Chaque appartement doit avoir un nom unique.')
      return null
    }

    // Check for duplicates with existing appartements
    const existingDuplicates = noms.filter(nom =>
      existingAppartementNames.some(existingNom =>
        existingNom.toLowerCase() === nom.toLowerCase()
      )
    )
    if (existingDuplicates.length > 0) {
      setError(`Les appartements suivants existent déjà : ${existingDuplicates.join(', ')}`)
      return null
    }

    return nonEmptyAppartements.map(appt => ({
      nom: appt.nom.trim(),
      etage: appt.etage
    }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validatedAppartements = validateAppartements()
    if (!validatedAppartements) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createMultipleAppartements(validatedAppartements)

      if (result.success) {
        handleClose()
        if (onSuccess) {
          onSuccess({
            created: result.created,
            failed: result.failed,
            total: validatedAppartements.length
          })
        }
      } else {
        setError(result.error?.message || 'Erreur lors de la création des appartements')
      }
    } catch (err) {
      console.error('Erreur création multiple appartements:', err)
      setError('Erreur lors de la création des appartements')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setAppartements([{ nom: '', etage: null }])
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title="Créer plusieurs appartements"
    >
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
            Les tâches du chantier seront automatiquement ajoutées à chaque appartement.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Appartements list */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {appartements.map((appt, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                {/* Header with appartement number and delete button */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Appartement {index + 1}
                  </h4>
                  {appartements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAppartement(index)}
                      disabled={isSubmitting}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Nom field */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <Input
                    type="text"
                    value={appt.nom}
                    onChange={(e) => handleNomChange(index, e.target.value)}
                    placeholder={`Ex: Appartement ${index + 1}, Studio ${String.fromCharCode(65 + index)}...`}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Étage field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Étage (facultatif)
                  </label>
                  <Select
                    value={appt.etage}
                    onChange={(value) => handleEtageChange(index, value)}
                    options={getEtageOptions()}
                    placeholder="Sélectionner un étage..."
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add button */}
          {appartements.length < MAX_APPARTEMENTS && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAppartement}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un appartement</span>
            </Button>
          )}

          {appartements.length >= MAX_APPARTEMENTS && (
            <p className="text-xs text-orange-600 text-center">
              Limite de {MAX_APPARTEMENTS} appartements atteinte
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 pb-64 md:pb-4 border-t border-gray-200">
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
              {isSubmitting
                ? 'Création en cours...'
                : `Créer ${appartements.filter(a => a.nom.trim()).length} appartement${appartements.filter(a => a.nom.trim()).length > 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
