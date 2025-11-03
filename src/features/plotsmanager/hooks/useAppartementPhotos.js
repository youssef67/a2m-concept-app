/**
 * useAppartementPhotos Hook
 * Custom hook for managing photos for an appartement
 */

import { useState, useCallback } from 'react'
import {
  getAppartementPhotos,
  uploadPhoto as uploadPhotoService,
  deletePhoto as deletePhotoService,
  getPhotoUrl,
  linkPhotoToNote as linkPhotoToNoteService,
  unlinkPhotoFromNote as unlinkPhotoFromNoteService
} from '../services/appartementPhotosService'

/**
 * Hook to manage photos for an appartement
 * @param {string} appartementId - Appartement ID
 * @returns {Object} - { photos, loading, error, loadPhotos, uploadPhoto, deletePhoto, viewPhoto, linkPhotoToNote, unlinkPhotoFromNote }
 */
export function useAppartementPhotos(appartementId) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load photos for the appartement
   */
  const loadPhotos = useCallback(async () => {
    if (!appartementId) {
      setError('ID de l\'appartement manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAppartementPhotos(appartementId)

    if (fetchError) {
      setError('Erreur lors du chargement des photos')
      setPhotos([])
    } else {
      setPhotos(data || [])
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Upload a photo
   * @param {File} file - Image file to upload
   * @param {string|null} noteId - Optional note ID to link to
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const uploadPhoto = async (file, noteId = null) => {
    if (!appartementId) {
      return { success: false, data: null, error: new Error('ID de l\'appartement manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: uploadError } = await uploadPhotoService(
      appartementId,
      file,
      noteId
    )

    if (uploadError) {
      setError('Erreur lors de l\'upload de la photo')
      setLoading(false)
      return { success: false, data: null, error: uploadError }
    }

    // Reload photos after successful upload
    await loadPhotos()

    setLoading(false)
    return { success: true, data, error: null }
  }

  /**
   * Delete a photo
   * @param {string} photoId - UUID of the photo to delete
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deletePhoto = async (photoId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deletePhotoService(photoId)

    if (!success) {
      setError('Erreur lors de la suppression de la photo')
      setLoading(false)
      return { success: false, error: deleteError }
    }

    // Reload photos after successful deletion
    await loadPhotos()

    setLoading(false)
    return { success: true, error: null }
  }

  /**
   * View/open a photo (get public URL and open in new tab)
   * @param {string} storagePath - Storage path of the photo
   * @returns {Promise<{url: string|null, error: Error|null}>}
   */
  const viewPhoto = async (storagePath) => {
    const { data: url, error: urlError } = await getPhotoUrl(storagePath)

    if (urlError) {
      setError('Erreur lors de l\'ouverture de la photo')
      return { url: null, error: urlError }
    }

    return { url, error: null }
  }

  /**
   * Link a photo to a note
   * @param {string} photoId - UUID of the photo
   * @param {string} noteId - UUID of the note
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const linkPhotoToNote = async (photoId, noteId) => {
    setLoading(true)
    setError(null)

    const { data, error: linkError } = await linkPhotoToNoteService(photoId, noteId)

    if (linkError) {
      setError('Erreur lors de la liaison de la photo à la note')
      setLoading(false)
      return { success: false, data: null, error: linkError }
    }

    // Reload photos after successful link
    await loadPhotos()

    setLoading(false)
    return { success: true, data, error: null }
  }

  /**
   * Unlink a photo from its note
   * @param {string} photoId - UUID of the photo
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const unlinkPhotoFromNote = async (photoId) => {
    setLoading(true)
    setError(null)

    const { data, error: unlinkError } = await unlinkPhotoFromNoteService(photoId)

    if (unlinkError) {
      setError('Erreur lors de la dissociation de la photo')
      setLoading(false)
      return { success: false, data: null, error: unlinkError }
    }

    // Reload photos after successful unlink
    await loadPhotos()

    setLoading(false)
    return { success: true, data, error: null }
  }

  return {
    photos,
    loading,
    error,
    loadPhotos,
    uploadPhoto,
    deletePhoto,
    viewPhoto,
    linkPhotoToNote,
    unlinkPhotoFromNote
  }
}
