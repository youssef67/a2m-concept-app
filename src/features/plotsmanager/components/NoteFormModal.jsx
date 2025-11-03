/**
 * NoteFormModal
 * Modal for creating or editing a note
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'

export default function NoteFormModal({
  isOpen,
  onClose,
  onSave,
  initialNote = null,
  appartementNom
}) {
  const [contenu, setContenu] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isEditMode = initialNote !== null

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setContenu(initialNote.contenu || '')
      } else {
        setContenu('')
      }
      setErrorMessage('')
    }
  }, [isOpen, initialNote])

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!contenu || contenu.trim().length === 0) {
      setErrorMessage('Le contenu de la note ne peut pas être vide')
      return
    }

    setIsSubmitting(true)

    const result = await onSave(contenu)

    setIsSubmitting(false)

    if (result && result.success) {
      handleClose()
    } else {
      setErrorMessage(
        result?.error?.message || 'Erreur lors de la sauvegarde de la note'
      )
    }
  }

  // Handle close
  const handleClose = () => {
    setContenu('')
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? `Modifier la note - ${appartementNom}` : `Nouvelle note - ${appartementNom}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Note content textarea */}
        <div>
          <label
            htmlFor="contenu"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Contenu de la note
          </label>
          <textarea
            id="contenu"
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Saisissez votre note ici..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {contenu.length} caractères
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
