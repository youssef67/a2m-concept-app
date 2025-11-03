/**
 * PhotoUploadModal
 * Modal for uploading a photo with optional note linking
 */

import React, { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Select from '../../../shared/components/ui/Select'

export default function PhotoUploadModal({
  isOpen,
  onClose,
  onUpload,
  appartementNom,
  notes = []
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setSelectedNoteId('')
      setErrorMessage('')
    }
  }, [isOpen])

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setErrorMessage('')
    }
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!selectedFile) {
      setErrorMessage('Veuillez sélectionner une photo')
      return
    }

    setIsSubmitting(true)

    const noteId = selectedNoteId === '' ? null : selectedNoteId

    const result = await onUpload(selectedFile, noteId)

    setIsSubmitting(false)

    if (result && result.success) {
      handleClose()
    } else {
      setErrorMessage(
        result?.error?.message || 'Erreur lors de l\'upload de la photo'
      )
    }
  }

  // Handle close
  const handleClose = () => {
    setSelectedFile(null)
    setSelectedNoteId('')
    setErrorMessage('')
    onClose()
  }

  // Prepare note options for Select
  const noteOptions = [
    { value: '', label: 'Aucune note (photo indépendante)' },
    ...notes.map((note) => ({
      value: note.id,
      label: note.contenu.substring(0, 60) + (note.contenu.length > 60 ? '...' : '')
    }))
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Ajouter une photo - ${appartementNom}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Sélectionnez une photo à uploader. Vous pouvez optionnellement la lier à une note existante.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* File input */}
        <div>
          <label
            htmlFor="photo-file"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Photo
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="photo-file"
              className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : 'Choisir une photo'}
              </span>
            </label>
            <input
              id="photo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Formats acceptés: JPEG, PNG, WebP (max 10 MB)
          </p>
        </div>

        {/* Note selection (optional) */}
        {notes.length > 0 && (
          <div>
            <label
              htmlFor="note-link"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Lier à une note (optionnel)
            </label>
            <Select
              id="note-link"
              value={selectedNoteId}
              onChange={setSelectedNoteId}
              options={noteOptions}
              disabled={isSubmitting}
            />
          </div>
        )}

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
            disabled={isSubmitting || !selectedFile}
          >
            {isSubmitting ? 'Upload en cours...' : 'Ajouter la photo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
