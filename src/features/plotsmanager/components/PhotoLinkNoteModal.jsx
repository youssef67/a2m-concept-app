/**
 * PhotoLinkNoteModal
 * Modal for linking or unlinking a photo to/from a note
 */

import React, { useState, useEffect } from 'react'
import { Link2, Link2Off } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Select from '../../../shared/components/ui/Select'
import {
  linkPhotoToNote,
  unlinkPhotoFromNote
} from '../services/appartementPhotosService'

export default function PhotoLinkNoteModal({
  isOpen,
  onClose,
  photo,
  notes = [],
  onLinkChange,
  appartementId
}) {
  const [selectedNoteId, setSelectedNoteId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && photo) {
      setSelectedNoteId(photo.note_id || '')
      setErrorMessage('')
    }
  }, [isOpen, photo])

  // Handle submit (link or unlink)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!photo) return

    setIsSubmitting(true)

    let result

    if (selectedNoteId === '') {
      // Unlink photo from note
      result = await unlinkPhotoFromNote(photo.id)
    } else {
      // Link photo to note
      result = await linkPhotoToNote(photo.id, selectedNoteId)
    }

    setIsSubmitting(false)

    if (result && result.success) {
      onLinkChange() // Reload photos
      handleClose()
    } else {
      setErrorMessage(
        result?.error?.message || 'Erreur lors de la modification du lien'
      )
    }
  }

  // Handle close
  const handleClose = () => {
    setSelectedNoteId('')
    setErrorMessage('')
    onClose()
  }

  if (!photo) return null

  // Prepare note options for Select
  const noteOptions = [
    { value: '', label: 'Aucune note (photo indépendante)' },
    ...notes.map((note) => ({
      value: note.id,
      label: note.contenu.substring(0, 60) + (note.contenu.length > 60 ? '...' : '')
    }))
  ]

  const isLinked = photo.note_id !== null
  const isChangingLink = selectedNoteId !== (photo.note_id || '')

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${isLinked ? 'Modifier le lien' : 'Lier à une note'} - ${photo.nom_fichier}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            {isLinked
              ? 'Cette photo est actuellement liée à une note. Vous pouvez modifier ce lien ou le supprimer.'
              : 'Sélectionnez une note pour lier cette photo.'}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Current link info */}
        {isLinked && photo.note && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Note actuelle :</p>
            <p className="text-sm text-gray-900">
              {photo.note.contenu}
            </p>
          </div>
        )}

        {/* Note selection */}
        {notes.length > 0 ? (
          <div>
            <label
              htmlFor="note-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Note
            </label>
            <Select
              id="note-select"
              value={selectedNoteId}
              onChange={setSelectedNoteId}
              options={noteOptions}
              disabled={isSubmitting}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Aucune note disponible. Créez une note pour pouvoir lier cette photo.
            </p>
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
            className="w-full sm:w-auto flex items-center justify-center gap-2"
            disabled={isSubmitting || !isChangingLink || notes.length === 0}
          >
            {isSubmitting ? (
              'Enregistrement...'
            ) : selectedNoteId === '' ? (
              <>
                <Link2Off className="w-4 h-4" />
                <span>Délier</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Lier</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
