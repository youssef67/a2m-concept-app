/**
 * PhotoUploadModal
 * Modal for uploading a photo with optional note linking
 */

import React, { useState, useEffect } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
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
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadPhase, setUploadPhase] = useState('idle') // 'idle' | 'uploading' | 'refreshing' | 'success'
  const [errorMessage, setErrorMessage] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setSelectedNoteId('')
      setUploadPhase('idle')
      setErrorMessage('')
    }
  }, [isOpen])

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setErrorMessage('')

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
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

    try {
      setIsSubmitting(true)
      setUploadPhase('uploading')

      const noteId = selectedNoteId === '' ? null : selectedNoteId

      // Phase 1: Upload vers Supabase Storage + DB
      const result = await onUpload(selectedFile, noteId)

      if (result && result.success) {
        // Phase 2: Actualisation de la liste (loadPhotos est déjà appelé dans onUpload)
        setUploadPhase('refreshing')

        // Attendre un peu pour que loadPhotos() se termine complètement
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Phase 3: Succès
        setUploadPhase('success')

        // Attendre 1.5 secondes avant de fermer pour que l'utilisateur voie le message
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Fermer le modal
        handleClose()
      } else {
        setErrorMessage(
          result?.error?.message || 'Erreur lors de l\'upload de la photo'
        )
        setUploadPhase('idle')
      }
    } catch (error) {
      setErrorMessage('Erreur inattendue lors de l\'upload')
      setUploadPhase('idle')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
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

        {/* Photo selection buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photo
          </label>

          {/* 2 boutons distincts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Bouton 1: Prendre une photo (Primary) */}
            <label
              htmlFor="camera-input"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors min-h-[56px]"
            >
              <Camera className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Prendre une photo</span>
            </label>
            <input
              id="camera-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />

            {/* Bouton 2: Choisir depuis la galerie (Outline) */}
            <label
              htmlFor="gallery-input"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 hover:border-primary-600 hover:bg-gray-50 text-gray-700 rounded-lg cursor-pointer transition-colors min-h-[56px]"
            >
              <ImagePlus className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Choisir depuis la galerie</span>
            </label>
            <input
              id="gallery-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>

          {/* Prévisualisation et nom du fichier */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {/* Miniature */}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Prévisualisation"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              {/* Nom du fichier */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
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
            {uploadPhase === 'uploading' && 'Upload en cours...'}
            {uploadPhase === 'refreshing' && 'Actualisation de la liste...'}
            {uploadPhase === 'success' && '✓ Photo ajoutée !'}
            {uploadPhase === 'idle' && 'Ajouter la photo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
