/**
 * AppartementNotesTab
 * Tab component for displaying and managing notes with photos for an appartement
 */

import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, FileText, Image as ImageIcon } from 'lucide-react'
import { useAppartementNotes } from '../hooks/useAppartementNotes'
import { formatNoteDate } from '../services/appartementNotesService'
import { getPhotoUrl } from '../services/appartementPhotosService'
import Button from '../../../shared/components/ui/Button'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import NoteFormModal from './NoteFormModal'

export default function AppartementNotesTab({ appartement, onModalStateChange }) {
  const {
    notes,
    loading,
    error,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    addPhotos,
    deletePhoto
  } = useAppartementNotes(appartement.id)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [deletingNoteId, setDeletingNoteId] = useState(null)
  const [noteToDelete, setNoteToDelete] = useState(null)

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Recover modal state from localStorage (PWA fix for camera reload)
  useEffect(() => {
    const storedState = localStorage.getItem('noteModalState')
    if (storedState) {
      try {
        const { isOpen, appartementId, timestamp } = JSON.parse(storedState)

        // Only restore if it's for the same appartement and within 2 minutes
        const isRecent = Date.now() - timestamp < 2 * 60 * 1000
        const isSameAppartement = appartementId === appartement.id

        console.log('[AppartementNotesTab] Found stored modal state:', {
          isOpen,
          appartementId,
          isSameAppartement,
          isRecent,
          currentAppartementId: appartement.id
        })

        if (isOpen && isSameAppartement && isRecent) {
          console.log('[AppartementNotesTab] Restoring modal state from localStorage')
          setIsFormModalOpen(true)
          setEditingNote(null)
        }

        // Clean up localStorage
        localStorage.removeItem('noteModalState')
      } catch (error) {
        console.error('[AppartementNotesTab] Error parsing stored modal state:', error)
        localStorage.removeItem('noteModalState')
      }
    }
  }, [appartement.id])

  // Prevent page unload/navigation when modal is open (PWA issue fix)
  useEffect(() => {
    if (isFormModalOpen) {
      // Prevent accidental page navigation
      const handleBeforeUnload = (e) => {
        e.preventDefault()
        e.returnValue = ''
      }

      window.addEventListener('beforeunload', handleBeforeUnload)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [isFormModalOpen])

  // Notify parent when modal state changes (PWA issue fix)
  useEffect(() => {
    console.log('[AppartementNotesTab] isFormModalOpen changed:', {
      isFormModalOpen,
      timestamp: new Date().toISOString()
    })
    if (onModalStateChange) {
      onModalStateChange(isFormModalOpen)
    }
  }, [isFormModalOpen, onModalStateChange])

  // Handle create note
  const handleCreateNote = () => {
    console.log('[AppartementNotesTab] handleCreateNote called')
    setEditingNote(null)
    setIsFormModalOpen(true)

    // Store modal state in localStorage for PWA recovery after camera use
    localStorage.setItem('noteModalState', JSON.stringify({
      isOpen: true,
      appartementId: appartement.id,
      timestamp: Date.now()
    }))

    console.log('[AppartementNotesTab] Modal should be opening now')
  }

  // Handle edit note
  const handleEditNote = (note) => {
    setEditingNote(note)
    setIsFormModalOpen(true)
  }

  // Handle save note (create or update)
  const handleSaveNote = async (contenu, photoFiles = []) => {
    if (editingNote) {
      // Update existing note (content only, photos handled separately)
      const result = await updateNote(editingNote.id, contenu)
      return result
    } else {
      // Create new note with photos
      const result = await createNote(contenu, photoFiles)
      return result
    }
  }

  // Handle delete note (open confirmation modal)
  const handleDeleteNote = (note) => {
    setNoteToDelete(note)
  }

  // Confirm delete note
  const confirmDeleteNote = async () => {
    if (!noteToDelete) return

    setDeletingNoteId(noteToDelete.id)
    await deleteNote(noteToDelete.id)
    setDeletingNoteId(null)
    setNoteToDelete(null)
  }

  // Handle add photos to note
  const handleAddPhotos = async (noteId, photoFiles) => {
    const result = await addPhotos(noteId, photoFiles)
    return result
  }

  // Handle delete photo from note
  const handleDeletePhoto = async (photoId) => {
    const result = await deletePhoto(photoId)
    return result
  }

  // Handle view photo in new tab
  const handleViewPhoto = async (photo) => {
    try {
      const { data: url } = await getPhotoUrl(photo.storage_path)
      if (url) {
        window.open(url, '_blank')
      } else {
        alert('Erreur lors de l\'ouverture de la photo')
      }
    } catch (error) {
      console.error('Error loading photo URL:', error)
      alert('Erreur lors de l\'ouverture de la photo')
    }
  }

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement des notes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Notes ({notes.length})
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateNote}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une note</span>
        </Button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aucune note pour ce lot</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNote}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter la première note</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Photos liste (if exist) */}
              {note.photos && note.photos.length > 0 && (
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {note.photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handleViewPhoto(photo)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors"
                        title={`Voir ${photo.nom_fichier}`}
                      >
                        <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate max-w-[150px]">
                          {photo.nom_fichier}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note content */}
              <div className="p-4">
                {/* Note header: date and actions */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="text-xs text-gray-500">
                    {formatNoteDate(note.created_at)}
                    {note.updated_at !== note.created_at && (
                      <span className="ml-2 italic">(modifié)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Modifier"
                      disabled={deletingNoteId === note.id}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                      disabled={deletingNoteId === note.id}
                    >
                      {deletingNoteId === note.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Note text */}
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {note.contenu}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Form Modal */}
      <NoteFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setEditingNote(null)
          // Clean up localStorage when modal closes normally
          localStorage.removeItem('noteModalState')
        }}
        onSave={handleSaveNote}
        onDeletePhoto={handleDeletePhoto}
        onAddPhotos={handleAddPhotos}
        initialNote={editingNote}
        appartementNom={appartement.nom}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
        title="Supprimer la note"
        message={`Êtes-vous sûr de vouloir supprimer cette note${noteToDelete?.photos?.length > 0 ? ` et ses ${noteToDelete.photos.length} photo(s)` : ''} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  )
}
