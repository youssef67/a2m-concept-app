/**
 * Appartement Photos Service
 * API calls for appartement photos
 * Photos can be linked to notes optionally
 */

import { supabase } from '../../../lib/supabaseClient'

const BUCKET_NAME = 'appartements-photos'
const MAX_FILE_SIZE = 10485760 // 10 MB

/**
 * Generate unique filename for storage
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename (UUID_timestamp_sanitized)
 */
export function generateUniqueFileName(originalName) {
  const timestamp = Date.now()
  const uuid = crypto.randomUUID().slice(0, 8)
  const sanitized = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()

  return `${uuid}_${timestamp}_${sanitized}`
}

/**
 * Validate photo file (images only)
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export function validatePhotoFile(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' }
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Seuls les fichiers JPEG, PNG et WebP sont acceptés' }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / 1048576).toFixed(0)
    return { valid: false, error: `La taille du fichier ne doit pas dépasser ${sizeMB} MB` }
  }

  return { valid: true, error: null }
}

/**
 * Get all photos for an appartement (sorted by date, most recent first)
 * Includes linked note information if available
 * @param {string} appartementId - UUID of the appartement
 * @returns {Promise<{success: boolean, data: Array|null, error: any}>}
 */
export async function getAppartementPhotos(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_photos')
      .select(`
        *,
        note:appartement_notes(id, contenu, created_at)
      `)
      .eq('appartement_id', appartementId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error fetching appartement photos:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Upload a photo to Storage and create DB record
 * @param {string} appartementId - UUID of the appartement
 * @param {File} file - Image file to upload
 * @param {string|null} noteId - Optional UUID of note to link to
 * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
 */
export async function uploadPhoto(appartementId, file, noteId = null) {
  try {
    // Validate file
    const validation = validatePhotoFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(file.name)
    const storagePath = `${appartementId}/${uniqueFileName}`

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Create DB record
    const photoData = {
      appartement_id: appartementId,
      note_id: noteId,
      nom_fichier: file.name,
      storage_path: storagePath,
      taille_fichier: file.size,
      type_mime: file.type
    }

    const { data, error: dbError } = await supabase
      .from('appartement_photos')
      .insert([photoData])
      .select()
      .single()

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath])

      throw dbError
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error uploading photo:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Get signed URL for a photo (valid for 1 hour)
 * @param {string} storagePath - Storage path of the photo
 * @returns {Promise<{success: boolean, data: string|null, error: any}>}
 */
export async function getPhotoUrl(storagePath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600) // 1 hour validity

    if (error) throw error

    if (!data || !data.signedUrl) {
      throw new Error('Unable to generate photo URL')
    }

    return { success: true, data: data.signedUrl, error: null }
  } catch (error) {
    console.error('Error getting photo URL:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Delete a photo from Storage and DB
 * @param {string} photoId - UUID of the photo
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deletePhoto(photoId) {
  try {
    // First, get photo info to get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('appartement_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single()

    if (fetchError) throw fetchError
    if (!photo) throw new Error('Photo not found')

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([photo.storage_path])

    if (storageError) throw storageError

    // Delete from DB
    const { error: dbError } = await supabase
      .from('appartement_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) throw dbError

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting photo:', error)
    return { success: false, error }
  }
}

/**
 * Link an existing photo to a note
 * @param {string} photoId - UUID of the photo
 * @param {string} noteId - UUID of the note
 * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
 */
export async function linkPhotoToNote(photoId, noteId) {
  try {
    const { data, error } = await supabase
      .from('appartement_photos')
      .update({ note_id: noteId })
      .eq('id', photoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error linking photo to note:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Unlink a photo from its note
 * @param {string} photoId - UUID of the photo
 * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
 */
export async function unlinkPhotoFromNote(photoId) {
  try {
    const { data, error } = await supabase
      .from('appartement_photos')
      .update({ note_id: null })
      .eq('id', photoId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error unlinking photo from note:', error)
    return { success: false, data: null, error }
  }
}

/**
 * Format file size to human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g. "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Format date to French locale string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatPhotoDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
