import React, { useState, useEffect } from 'react'
import { StickyNote, Plus, Edit2, Trash2, X, Check, Calendar, Flag } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import { getNotes, createNote, updateNote, deleteNote, toggleNoteImportance } from '../services/notesService'
import { formatDate } from '../utils/factureHelpers'

/**
 * Modal pour gérer les notes d'une facture
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {Object} facture - Facture data
 * @param {function} onNotesChange - Callback when notes change (to refresh facture list)
 */
export default function NotesModal({
  isOpen,
  onClose,
  facture,
  onNotesChange
}) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteImportant, setNewNoteImportant] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [error, setError] = useState(null)

  const loadNotes = async (factureId) => {
    setLoading(true)
    setError(null)
    const result = await getNotes(factureId)
    if (result.success) {
      setNotes(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  // Load notes when modal opens
  useEffect(() => {
    if (isOpen && facture?.id) {
      loadNotes(facture.id)
    }
  }, [isOpen, facture?.id])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAddingNote(false)
      setNewNoteContent('')
      setNewNoteImportant(false)
      setEditingNoteId(null)
      setEditingContent('')
      setError(null)
    }
  }, [isOpen])

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return

    setSaving(true)
    const result = await createNote(facture.id, newNoteContent, newNoteImportant)
    if (result.success) {
      setNotes([result.data, ...notes])
      setNewNoteContent('')
      setNewNoteImportant(false)
      setIsAddingNote(false)
      onNotesChange?.()
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  const handleToggleImportance = async (note) => {
    setSaving(true)
    const result = await toggleNoteImportance(note.id, !note.is_important)
    if (result.success) {
      setNotes(notes.map(n => n.id === note.id ? result.data : n))
      onNotesChange?.()
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  const handleStartEdit = (note) => {
    setEditingNoteId(note.id)
    setEditingContent(note.contenu)
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditingContent('')
  }

  const handleSaveEdit = async (noteId) => {
    if (!editingContent.trim()) return

    setSaving(true)
    const result = await updateNote(noteId, editingContent)
    if (result.success) {
      setNotes(notes.map(n => n.id === noteId ? result.data : n))
      setEditingNoteId(null)
      setEditingContent('')
      onNotesChange?.()
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Supprimer cette note ?')) return

    setSaving(true)
    const result = await deleteNote(noteId)
    if (result.success) {
      setNotes(notes.filter(n => n.id !== noteId))
      onNotesChange?.()
    } else {
      setError(result.error)
    }
    setSaving(false)
  }

  if (!facture) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Notes - ${facture.numero_facture || 'Facture'}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Add note section */}
        {isAddingNote ? (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Écrivez votre note..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
              rows={3}
              autoFocus
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newNoteImportant}
                onChange={(e) => setNewNoteImportant(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <Flag className={`w-4 h-4 ${newNoteImportant ? 'text-red-600' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-700">Action requise</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingNote(false)
                  setNewNoteContent('')
                  setNewNoteImportant(false)
                }}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={saving || !newNoteContent.trim()}
              >
                {saving ? <Spinner size="sm" /> : 'Ajouter'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsAddingNote(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une note
          </Button>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune note pour cette facture</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg ${
                  note.is_important
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                {editingNoteId === note.id ? (
                  /* Editing mode */
                  <div className="space-y-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-base"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Annuler"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={saving || !editingContent.trim()}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Enregistrer"
                      >
                        {saving ? <Spinner size="sm" /> : <Check className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {note.is_important && (
                          <div className="flex items-center gap-1 text-red-600 text-xs font-medium mb-1">
                            <Flag className="w-3 h-3" />
                            <span>Action requise</span>
                          </div>
                        )}
                        <p className="text-gray-800 whitespace-pre-wrap">
                          {note.contenu}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleImportance(note)}
                          disabled={saving}
                          className={`p-2 rounded-lg transition-colors ${
                            note.is_important
                              ? 'text-red-600 hover:bg-red-100'
                              : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
                          }`}
                          title={note.is_important ? 'Retirer le flag' : 'Marquer comme action requise'}
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(note)}
                          className={`p-2 text-gray-500 rounded-lg transition-colors ${
                            note.is_important ? 'hover:bg-red-100' : 'hover:bg-amber-100'
                          }`}
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(note.created_at)}</span>
                      {note.updated_at && note.updated_at !== note.created_at && (
                        <span className="ml-2">(modifié)</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
