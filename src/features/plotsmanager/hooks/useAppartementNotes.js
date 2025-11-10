/**
 * useAppartementNotes Hook
 * Custom hook for managing notes for an appartement
 */

import { useState, useCallback } from 'react'
import {
  getAppartementNotes,
  createNote as createNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService,
  createNoteWithPhotos,
  deleteNoteWithPhotos,
  addPhotosToNote,
  deletePhotoFromNote
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
   * Create a new note with optional photos
   * @param {string} contenu - Note content
   * @param {File[]} photoFiles - Array of photo files (optional)
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const createNote = async (contenu, photoFiles = []) => {
    if (!appartementId) {
      return { success: false, data: null, error: new Error('ID de l\'appartement manquant') }
    }

    setLoading(true)
    setError(null)

    const { success, data, error: createError } = await createNoteWithPhotos(
      appartementId,
      contenu,
      photoFiles
    )

    if (!success) {
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
   * Delete a note and all its linked photos
   * @param {string} noteId - UUID of the note to delete
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deleteNote = async (noteId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deleteNoteWithPhotos(noteId)

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

  /**
   * Add photos to an existing note
   * @param {string} noteId - UUID of the note
   * @param {File[]} photoFiles - Array of photo files
   * @returns {Promise<{success: boolean, data: Array|null, error: Error|null}>}
   */
  const addPhotos = async (noteId, photoFiles) => {
    if (!appartementId) {
      return { success: false, data: null, error: new Error('ID de l\'appartement manquant') }
    }

    setLoading(true)
    setError(null)

    const { success, data, error: addError } = await addPhotosToNote(
      appartementId,
      noteId,
      photoFiles
    )

    if (!success) {
      setError('Erreur lors de l\'ajout des photos')
      setLoading(false)
      return { success: false, data: null, error: addError }
    }

    // Reload notes after successful addition
    await loadNotes()

    setLoading(false)
    return { success: true, data, error: null }
  }

  /**
   * Delete a specific photo from a note
   * @param {string} photoId - UUID of the photo
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deletePhoto = async (photoId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deletePhotoFromNote(photoId)

    if (!success) {
      setError('Erreur lors de la suppression de la photo')
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
    deleteNote,
    addPhotos,
    deletePhoto
  }
}
