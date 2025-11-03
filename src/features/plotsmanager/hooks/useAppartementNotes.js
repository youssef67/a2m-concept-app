/**
 * useAppartementNotes Hook
 * Custom hook for managing notes for an appartement
 */

import { useState, useCallback } from 'react'
import {
  getAppartementNotes,
  createNote as createNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService
} from '../services/appartementNotesService'

/**
 * Hook to manage notes for an appartement
 * @param {string} appartementId - Appartement ID
 * @returns {Object} - { notes, loading, error, loadNotes, createNote, updateNote, deleteNote }
 */
export function useAppartementNotes(appartementId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load notes for the appartement
   */
  const loadNotes = useCallback(async () => {
    if (!appartementId) {
      setError('ID de l\'appartement manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAppartementNotes(appartementId)

    if (fetchError) {
      setError('Erreur lors du chargement des notes')
      setNotes([])
    } else {
      setNotes(data || [])
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Create a new note
   * @param {string} contenu - Note content
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const createNote = async (contenu) => {
    if (!appartementId) {
      return { success: false, data: null, error: new Error('ID de l\'appartement manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: createError } = await createNoteService(appartementId, contenu)

    if (createError) {
      setError('Erreur lors de la création de la note')
      setLoading(false)
      return { success: false, data: null, error: createError }
    }

    // Reload notes after successful creation
    await loadNotes()

    setLoading(false)
    return { success: true, data, error: null }
  }

  /**
   * Update an existing note
   * @param {string} noteId - UUID of the note to update
   * @param {string} contenu - New note content
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const updateNote = async (noteId, contenu) => {
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updateNoteService(noteId, contenu)

    if (updateError) {
      setError('Erreur lors de la modification de la note')
      setLoading(false)
      return { success: false, data: null, error: updateError }
    }

    // Reload notes after successful update
    await loadNotes()

    setLoading(false)
    return { success: true, data, error: null }
  }

  /**
   * Delete a note
   * @param {string} noteId - UUID of the note to delete
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deleteNote = async (noteId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deleteNoteService(noteId)

    if (!success) {
      setError('Erreur lors de la suppression de la note')
      setLoading(false)
      return { success: false, error: deleteError }
    }

    // Reload notes after successful deletion
    await loadNotes()

    setLoading(false)
    return { success: true, error: null }
  }

  return {
    notes,
    loading,
    error,
    loadNotes,
    createNote,
    updateNote,
    deleteNote
  }
}
