/**
 * CreateMultipleAppartementsModal
 * Modal pour créer plusieurs lots en même temps
 * Les tâches sont automatiquement héritées du chantier pour chaque lot
 */

import React, { useState, useEffect, useRef } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import { Plus, Trash2 } from 'lucide-react'
import { useAppartements } from '../hooks/useAppartements'
import { getEtageOptions } from '../utils/etageConstants'
import { useToast } from '../../../shared/hooks/useToast'

const MAX_APPARTEMENTS = 20

export default function CreateMultipleAppartementsModal({
  isOpen,
  onClose,
  plotId,
  chantierId,
  plotNom,
  plotNombreEtages = 10,
  existingAppartementNames = [],
  onSuccess
}) {
  const { createMultipleAppartements } = useAppartements(plotId, chantierId)
  const { showToast } = useToast()

  const [appartements, setAppartements] = useState([{ nom: '', etage: null }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRefs = useRef([])
  const lotContainerRefs = useRef([])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAppartements([{ nom: '', etage: null }])
      setError(null)

      // Auto-focus on first nom input when modal opens
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus()
        }
      }, 100)
    }
  }, [isOpen])

  // Add new appartement field
  const handleAddLot = () => {
    if (appartements.length >= MAX_APPARTEMENTS) {
      setError(`Vous ne pouvez pas créer plus de ${MAX_APPARTEMENTS} lots à la fois`)
      return
    }
    const newIndex = appartements.length
    setAppartements([...appartements, { nom: '', etage: null }])
    setError(null)

    // Scroll to the new lot container and focus the input field
    setTimeout(() => {
      // Scroll to the lot container to show the entire lot (nom + dropdown)
      if (lotContainerRefs.current[newIndex]) {
        lotContainerRefs.current[newIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }
      // Then focus the input after a small delay
      setTimeout(() => {
        if (inputRefs.current[newIndex]) {
          inputRefs.current[newIndex].focus()
        }
      }, 100)
    }, 200)
  }

  // Remove appartement field
  const handleRemoveLot = (index) => {
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
        const created = result.created || 0
        const failed = result.failed || 0

        // Tous créés avec succès
        if (created > 0 && failed === 0) {
          showToast(
            `${created} lot${created > 1 ? 's' : ''} créé${created > 1 ? 's' : ''} avec succès`,
            'success'
          )
        }
        // Créations partielles (succès + échecs)
        else if (created > 0 && failed > 0) {
          const failedNames = result.failedNames || []
          showToast(
            `${created} lot${created > 1 ? 's' : ''} créé${created > 1 ? 's' : ''} avec succès. ${failed} échec${failed > 1 ? 's' : ''} : ${failedNames.join(', ')}`,
            'warning'
          )
        }

        handleClose()
        if (onSuccess) {
          onSuccess({
            created: result.created,
            failed: result.failed,
            total: validatedAppartements.length,
            data: result.data // Pass created appartements data
          })
        }
      } else {
        setError(result.error?.message || 'Erreur lors de la création des lots')
        showToast(result.error?.message || 'Erreur lors de la création des lots', 'error')
      }
    } catch (err) {
      console.error('Erreur création multiple appartements:', err)
      setError('Erreur lors de la création des lots')
      showToast('Erreur lors de la création des lots', 'error')
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
      title="Créer plusieurs lots"
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
            Les tâches du chantier seront automatiquement ajoutées à chaque lot.
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
              <div
                key={index}
                ref={(el) => (lotContainerRefs.current[index] = el)}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                {/* Header with appartement number and delete button */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Lot {index + 1}
                  </h4>
                  {appartements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLot(index)}
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
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    value={appt.nom}
                    onChange={(e) => handleNomChange(index, e.target.value)}
                    placeholder={`Ex: Lot ${index + 1}, Studio ${String.fromCharCode(65 + index)}...`}
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
                    options={getEtageOptions(plotNombreEtages)}
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
              onClick={handleAddLot}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un lot</span>
            </Button>
          )}

          {appartements.length >= MAX_APPARTEMENTS && (
            <p className="text-xs text-orange-600 text-center">
              Limite de {MAX_APPARTEMENTS} lots atteinte
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
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
                : `Créer ${appartements.filter(a => a.nom.trim()).length} lot${appartements.filter(a => a.nom.trim()).length > 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
