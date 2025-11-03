/**
 * AppartementNotesTab
 * Tab component for displaying and managing notes for an appartement
 */

import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, FileText, Image as ImageIcon } from 'lucide-react'
import { useAppartementNotes } from '../hooks/useAppartementNotes'
import { formatNoteDate } from '../services/appartementNotesService'
import { getPhotoUrl } from '../services/appartementPhotosService'
import Button from '../../../shared/components/ui/Button'
import NoteFormModal from './NoteFormModal'

export default function AppartementNotesTab({ appartement }) {
  const { notes, loading, error, loadNotes, createNote, updateNote, deleteNote } =
    useAppartementNotes(appartement.id)

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [deletingNoteId, setDeletingNoteId] = useState(null)

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Handle create note
  const handleCreateNote = () => {
    setEditingNote(null)
    setIsFormModalOpen(true)
  }

  // Handle edit note
  const handleEditNote = (note) => {
    setEditingNote(note)
    setIsFormModalOpen(true)
  }

  // Handle save note (create or update)
  const handleSaveNote = async (contenu) => {
    if (editingNote) {
      // Update existing note
      const result = await updateNote(editingNote.id, contenu)
      return result
    } else {
      // Create new note
      const result = await createNote(contenu)
      return result
    }
  }

  // Handle delete note
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return
    }

    setDeletingNoteId(noteId)
    await deleteNote(noteId)
    setDeletingNoteId(null)
  }

  // Handle view photo
  const handleViewPhoto = async (photo) => {
    const { data: url, error } = await getPhotoUrl(photo.storage_path)
    if (url) {
      window.open(url, '_blank')
    } else {
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
          <p className="text-gray-600 mb-4">Aucune note pour cet appartement</p>
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
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
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
                    onClick={() => handleDeleteNote(note.id)}
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

              {/* Note content */}
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {note.contenu}
              </div>

              {/* Linked photos */}
              {note.photos && note.photos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">
                      {note.photos.length} photo{note.photos.length > 1 ? 's' : ''} liée{note.photos.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {note.photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handleViewPhoto(photo)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs text-blue-700 transition-colors"
                        title={`Voir ${photo.nom_fichier}`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{photo.nom_fichier}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
        }}
        onSave={handleSaveNote}
        initialNote={editingNote}
        appartementNom={appartement.nom}
      />
    </div>
  )
}
