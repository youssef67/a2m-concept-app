/**
 * NoteFormModal
 * Modal for creating or editing a note with photos
 */

import React, { useState, useEffect } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'

export default function NoteFormModal({
  isOpen,
  onClose,
  onSave,
  initialNote = null,
  appartementNom,
  onDeletePhoto,
  onAddPhotos
}) {
  const [contenu, setContenu] = useState('')
  const [newPhotoFiles, setNewPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [photosToDelete, setPhotosToDelete] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isEditMode = initialNote !== null

  // Initialize form when modal opens
  useEffect(() => {
    console.log('[NoteFormModal] useEffect isOpen changed:', {
      isOpen,
      hasInitialNote: !!initialNote,
      timestamp: new Date().toISOString()
    })

    if (isOpen) {
      if (initialNote) {
        setContenu(initialNote.contenu || '')
        setExistingPhotos(initialNote.photos || [])
      } else {
        setContenu('')
        setExistingPhotos([])
      }
      setNewPhotoFiles([])
      setPhotoPreviews([])
      setPhotosToDelete([])
      setErrorMessage('')

      // Restore photos from localStorage (PWA recovery)
      try {
        const storedPhotos = JSON.parse(localStorage.getItem('pendingNotePhotos') || '[]')
        if (storedPhotos.length > 0) {
          console.log('[NoteFormModal] Restoring', storedPhotos.length, 'photos from localStorage')

          // Convert base64 data back to File objects
          const restoredFiles = []
          const restoredPreviews = []

          storedPhotos.forEach((photoData) => {
            // Convert dataUrl to Blob
            const arr = photoData.dataUrl.split(',')
            const mime = arr[0].match(/:(.*?);/)[1]
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n)
            }
            const blob = new Blob([u8arr], { type: mime })

            // Create File from Blob
            const file = new File([blob], photoData.name, { type: photoData.type })
            restoredFiles.push(file)
            restoredPreviews.push({ file, url: photoData.dataUrl })
          })

          setNewPhotoFiles(restoredFiles)
          setPhotoPreviews(restoredPreviews)

          // Clean up localStorage
          localStorage.removeItem('pendingNotePhotos')
          console.log('[NoteFormModal] Photos restored and localStorage cleaned')
        }
      } catch (error) {
        console.error('[NoteFormModal] Error restoring photos from localStorage:', error)
        localStorage.removeItem('pendingNotePhotos')
      }
    }
  }, [isOpen, initialNote])

  // Handle file selection
  const handleFileChange = (e) => {
    console.log('[NoteFormModal] handleFileChange called', {
      filesCount: e.target.files?.length,
      isOpen,
      timestamp: new Date().toISOString()
    })

    const files = Array.from(e.target.files || [])
    if (files.length === 0) {
      console.log('[NoteFormModal] No files selected')
      return
    }

    console.log('[NoteFormModal] Files selected:', files.map(f => ({ name: f.name, size: f.size })))
    setErrorMessage('')

    // Add new files to the list
    const newFiles = [...newPhotoFiles, ...files]
    setNewPhotoFiles(newFiles)

    // Create previews for new files and save to localStorage for PWA recovery
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        console.log('[NoteFormModal] Preview created for file:', file.name)
        const preview = { file, url: reader.result }
        setPhotoPreviews(prev => [...prev, preview])

        // Save to localStorage for PWA recovery (base64 data)
        try {
          const storedPhotos = JSON.parse(localStorage.getItem('pendingNotePhotos') || '[]')
          storedPhotos.push({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result, // base64 data
            timestamp: Date.now()
          })
          localStorage.setItem('pendingNotePhotos', JSON.stringify(storedPhotos))
          console.log('[NoteFormModal] Photo saved to localStorage for PWA recovery')
        } catch (error) {
          console.error('[NoteFormModal] Error saving photo to localStorage:', error)
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

  // Handle remove new photo (before upload)
  const handleRemoveNewPhoto = (index) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Handle mark existing photo for deletion
  const handleMarkPhotoForDeletion = (photoId) => {
    setPhotosToDelete(prev => [...prev, photoId])
  }

  // Handle unmark existing photo for deletion
  const handleUnmarkPhotoForDeletion = (photoId) => {
    setPhotosToDelete(prev => prev.filter(id => id !== photoId))
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!contenu || contenu.trim().length === 0) {
      setErrorMessage('Le contenu de la note ne peut pas être vide')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode) {
        // Edit mode: update content, delete marked photos, add new photos

        // 1. Update note content
        const updateResult = await onSave(contenu)
        if (!updateResult || !updateResult.success) {
          setErrorMessage(updateResult?.error?.message || 'Erreur lors de la modification de la note')
          setIsSubmitting(false)
          return
        }

        // 2. Delete marked photos
        if (photosToDelete.length > 0) {
          for (const photoId of photosToDelete) {
            await onDeletePhoto(photoId)
          }
        }

        // 3. Add new photos
        if (newPhotoFiles.length > 0) {
          const addResult = await onAddPhotos(initialNote.id, newPhotoFiles)
          if (!addResult || !addResult.success) {
            setErrorMessage('Note modifiée mais erreur lors de l\'ajout des photos')
            setIsSubmitting(false)
            return
          }
        }

        handleClose()
      } else {
        // Create mode: create note with photos
        const result = await onSave(contenu, newPhotoFiles)

        if (result && result.success) {
          handleClose()
        } else {
          setErrorMessage(
            result?.error?.message || 'Erreur lors de la création de la note'
          )
        }
      }
    } catch (error) {
      console.error('Error in form submit:', error)
      setErrorMessage('Erreur inattendue lors de la sauvegarde')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setContenu('')
    setNewPhotoFiles([])
    setPhotoPreviews([])
    setExistingPhotos([])
    setPhotosToDelete([])
    setErrorMessage('')

    // Clean up localStorage when closing normally
    localStorage.removeItem('pendingNotePhotos')

    onClose()
  }

  const displayedExistingPhotos = existingPhotos.filter(
    photo => !photosToDelete.includes(photo.id)
  )

  const totalPhotos = displayedExistingPhotos.length + newPhotoFiles.length

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? `Modifier la note - ${appartementNom}` : `Nouvelle note - ${appartementNom}`}
      size="lg"
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
            Contenu de la note <span className="text-red-500">*</span>
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

        {/* Photos section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photos (optionnel) - {totalPhotos} photo{totalPhotos > 1 ? 's' : ''}
          </label>

          {/* Photo upload buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Camera button */}
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
              multiple
            />

            {/* Gallery button */}
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
              multiple
            />
          </div>

          {/* Existing photos (edit mode) */}
          {isEditMode && existingPhotos.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Photos existantes</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {existingPhotos.map((photo) => {
                  const isMarkedForDeletion = photosToDelete.includes(photo.id)
                  return (
                    <div
                      key={photo.id}
                      className={`relative rounded-lg overflow-hidden border-2 ${
                        isMarkedForDeletion ? 'border-red-500 opacity-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <p className="text-xs text-gray-500 px-2 text-center truncate">
                          {photo.nom_fichier}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          isMarkedForDeletion
                            ? handleUnmarkPhotoForDeletion(photo.id)
                            : handleMarkPhotoForDeletion(photo.id)
                        }
                        className={`absolute top-1 right-1 p-1 rounded-full ${
                          isMarkedForDeletion
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } text-white transition-colors`}
                        title={isMarkedForDeletion ? 'Annuler suppression' : 'Supprimer'}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {isMarkedForDeletion && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <p className="text-white text-xs font-medium">À supprimer</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* New photos preview */}
          {photoPreviews.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                {isEditMode ? 'Nouvelles photos à ajouter' : 'Photos à ajouter'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden border-2 border-green-500"
                  >
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewPhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                      title="Supprimer"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
                      <p className="text-white text-xs truncate">{preview.file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Formats acceptés: JPEG, PNG, WebP (max 10 MB par photo)
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
