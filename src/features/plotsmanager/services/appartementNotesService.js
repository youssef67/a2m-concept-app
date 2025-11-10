/**
 * Appartement Notes Service
 * API calls for appartement text notes with photos
 */

import { supabase } from '../../../lib/supabaseClient'
import { uploadPhoto as uploadPhotoService, deletePhoto as deletePhotoService } from './appartementPhotosService'

/**
 * Get all notes for an appartement with linked photos (sorted by date, most recent first)
 * @param {string} appartementId - UUID of the appartement
 * @returns {Promise<{data: Array|null, error: any}>}
 */
export async function getAppartementNotes(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_notes')
      .select(`
        *,
        photos:appartement_photos(id, nom_fichier, storage_path, created_at)
      `)
      .eq('appartement_id', appartementId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching appartement notes:', error)
    return { data: null, error }
  }
}

/**
 * Create a new note for an appartement
 * @param {string} appartementId - UUID of the appartement
 * @param {string} contenu - Note content
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function createNote(appartementId, contenu) {
  try {
    if (!contenu || contenu.trim().length === 0) {
      throw new Error('Le contenu de la note ne peut pas être vide')
    }

    const noteData = {
      appartement_id: appartementId,
      contenu: contenu.trim()
    }

    const { data, error } = await supabase
      .from('appartement_notes')
      .insert([noteData])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating note:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing note
 * @param {string} noteId - UUID of the note
 * @param {string} contenu - New note content
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function updateNote(noteId, contenu) {
  try {
    if (!contenu || contenu.trim().length === 0) {
      throw new Error('Le contenu de la note ne peut pas être vide')
    }

    const { data, error } = await supabase
      .from('appartement_notes')
      .update({ contenu: contenu.trim() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating note:', error)
    return { data: null, error }
  }
}

/**
 * Delete a note
 * @param {string} noteId - UUID of the note
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deleteNote(noteId) {
  try {
    const { error } = await supabase
      .from('appartement_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting note:', error)
    return { success: false, error }
  }
}

/**
 * Create a note with optional photos
 * @param {string} appartementId - UUID of the appartement
 * @param {string} contenu - Note content
 * @param {File[]} photoFiles - Array of photo files to upload (optional)
 * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
 */
export async function createNoteWithPhotos(appartementId, contenu, photoFiles = []) {
  try {
    // 1. Create note first
    const { data: note, error: noteError } = await createNote(appartementId, contenu)

    if (noteError || !note) {
      return { success: false, data: null, error: noteError }
    }

    // 2. Upload photos if any
    if (photoFiles && photoFiles.length > 0) {
      const uploadPromises = photoFiles.map(file =>
        uploadPhotoService(appartementId, file, note.id)
      )

      const uploadResults = await Promise.all(uploadPromises)

      // Check if any upload failed
      const failedUploads = uploadResults.filter(result => !result.success)
      if (failedUploads.length > 0) {
        console.error('Photos failed to upload, rolling back note creation:', failedUploads)
        // Rollback: delete the note that was just created
        await deleteNote(note.id)
        return {
          success: false,
          data: null,
          error: { message: `Erreur lors de l'upload de ${failedUploads.length} photo(s)` }
        }
      }
    }

    return { success: true, data: note, error: null }
  } catch (error) {
    console.error('Error creating note with photos:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Delete a note and all its linked photos
 * @param {string} noteId - UUID of the note
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deleteNoteWithPhotos(noteId) {
  try {
    // 1. Get all photos linked to this note
    const { data: photos, error: fetchError } = await supabase
      .from('appartement_photos')
      .select('id')
      .eq('note_id', noteId)

    if (fetchError) {
      console.error('Error fetching photos for note:', fetchError)
      // Continue anyway to delete note
    }

    // 2. Delete all linked photos
    if (photos && photos.length > 0) {
      const deletePromises = photos.map(photo => deletePhotoService(photo.id))
      await Promise.all(deletePromises)
    }

    // 3. Delete the note
    const { success, error: deleteError } = await deleteNote(noteId)

    if (!success) {
      return { success: false, error: deleteError }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting note with photos:', error)
    return { success: false, error }
  }
}

/**
 * Add photos to an existing note
 * @param {string} appartementId - UUID of the appartement
 * @param {string} noteId - UUID of the note
 * @param {File[]} photoFiles - Array of photo files to upload
 * @returns {Promise<{success: boolean, data: Array|null, error: any}>}
 */
export async function addPhotosToNote(appartementId, noteId, photoFiles) {
  try {
    if (!photoFiles || photoFiles.length === 0) {
      return { success: true, data: [], error: null }
    }

    const uploadPromises = photoFiles.map(file =>
      uploadPhotoService(appartementId, file, noteId)
    )

    const uploadResults = await Promise.all(uploadPromises)

    // Check if any upload failed
    const failedUploads = uploadResults.filter(result => !result.success)
    if (failedUploads.length > 0) {
      console.error('Some photos failed to upload:', failedUploads)
      return {
        success: false,
        data: null,
        error: new Error(`${failedUploads.length} photo(s) failed to upload`)
      }
    }

    const uploadedPhotos = uploadResults.map(result => result.data)
    return { success: true, data: uploadedPhotos, error: null }
  } catch (error) {
    console.error('Error adding photos to note:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Delete a specific photo from a note
 * @param {string} photoId - UUID of the photo
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deletePhotoFromNote(photoId) {
  try {
    const { success, error } = await deletePhotoService(photoId)
    return { success, error }
  } catch (error) {
    console.error('Error deleting photo from note:', error)
    return { success: false, error }
  }
}

/**
 * Format date to French locale string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatNoteDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
