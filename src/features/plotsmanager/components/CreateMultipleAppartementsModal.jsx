/**
 * CreateMultipleAppartementsModal
 * Modal pour créer plusieurs appartements en même temps
 * Les tâches sont automatiquement héritées du chantier pour chaque appartement
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import { useAppartements } from '../hooks/useAppartements'

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

  const [noms, setNoms] = useState([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNoms([''])
      setError(null)
    }
  }, [isOpen])

  // Add new appartement field
  const handleAddAppartement = () => {
    if (noms.length >= MAX_APPARTEMENTS) {
      setError(`Vous ne pouvez pas créer plus de ${MAX_APPARTEMENTS} appartements à la fois`)
      return
    }
    setNoms([...noms, ''])
    setError(null)
  }

  // Remove appartement field
  const handleRemoveAppartement = (index) => {
    if (noms.length === 1) return // Don't remove last field
    const newNoms = noms.filter((_, i) => i !== index)
    setNoms(newNoms)
    setError(null)
  }

  // Update appartement name
  const handleNomChange = (index, value) => {
    const newNoms = [...noms]
    newNoms[index] = value
    setNoms(newNoms)
    setError(null)
  }

  // Validate names
  const validateNoms = () => {
    // Remove empty names
    const nonEmptyNoms = noms.filter(nom => nom.trim() !== '')

    if (nonEmptyNoms.length === 0) {
      setError('Veuillez entrer au moins un nom d\'appartement')
      return null
    }

    // Check for duplicates within the list
    const duplicates = nonEmptyNoms.filter((nom, index) =>
      nonEmptyNoms.indexOf(nom.trim()) !== index
    )
    if (duplicates.length > 0) {
      setError('Certains noms sont en double. Chaque appartement doit avoir un nom unique.')
      return null
    }

    // Check for duplicates with existing appartements
    const existingDuplicates = nonEmptyNoms.filter(nom =>
      existingAppartementNames.some(existingNom =>
        existingNom.toLowerCase() === nom.trim().toLowerCase()
      )
    )
    if (existingDuplicates.length > 0) {
      setError(`Les appartements suivants existent déjà : ${existingDuplicates.join(', ')}`)
      return null
    }

    return nonEmptyNoms.map(nom => nom.trim())
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validatedNoms = validateNoms()
    if (!validatedNoms) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createMultipleAppartements(validatedNoms)

      if (result.success) {
        handleClose()
        if (onSuccess) {
          onSuccess({
            created: result.created,
            failed: result.failed,
            total: validatedNoms.length
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
      setNoms([''])
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
          {/* Appartement names list */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {noms.map((nom, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={nom}
                    onChange={(e) => handleNomChange(index, e.target.value)}
                    placeholder={`Ex: Appartement ${index + 1}, Studio ${String.fromCharCode(65 + index)}...`}
                    disabled={isSubmitting}
                  />
                </div>
                {noms.length > 1 && (
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
            ))}
          </div>

          {/* Add button */}
          {noms.length < MAX_APPARTEMENTS && (
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

          {noms.length >= MAX_APPARTEMENTS && (
            <p className="text-xs text-orange-600 text-center">
              Limite de {MAX_APPARTEMENTS} appartements atteinte
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
                : `Créer ${noms.filter(n => n.trim()).length} appartement${noms.filter(n => n.trim()).length > 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
