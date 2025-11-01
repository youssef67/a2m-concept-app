/**
 * Appartement Documents Service
 * API calls for appartement documents (PDF + images)
 * Links to chantier_documents_requis
 */

import { supabase } from '../../../lib/supabaseClient'

const BUCKET_NAME = 'appartements-documents'
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
 * Validate file (PDF or image)
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' }
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Seuls les fichiers PDF, JPEG et PNG sont acceptés' }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / 1048576).toFixed(0)
    return { valid: false, error: `La taille du fichier ne doit pas dépasser ${sizeMB} MB` }
  }

  return { valid: true, error: null }
}

/**
 * Get documents with status for an appartement
 * Fetches all required documents from the chantier and joins with uploaded documents
 * @param {string} appartementId - UUID of the appartement
 * @param {string} chantierId - UUID of the chantier
 * @returns {Promise<{data: Array|null, error: any}>}
 */
export async function getAppartementDocumentsWithStatus(appartementId, chantierId) {
  try {
    // Get required documents from chantier
    const { data: documentsRequis, error: requisError } = await supabase
      .from('chantier_documents_requis')
      .select('*')
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: true })

    if (requisError) throw requisError

    // Get uploaded documents for this appartement
    const { data: uploadedDocs, error: uploadError } = await supabase
      .from('appartement_documents')
      .select('*')
      .eq('appartement_id', appartementId)

    if (uploadError) throw uploadError

    // Merge data: for each required document, check if it's uploaded
    const documentsWithStatus = (documentsRequis || []).map((docRequis) => {
      const uploadedFile = (uploadedDocs || []).find(
        (doc) => doc.document_requis_id === docRequis.id
      )

      return {
        documentRequis: docRequis,
        uploadedFile: uploadedFile || null
      }
    })

    return { data: documentsWithStatus, error: null }
  } catch (error) {
    console.error('Error fetching appartement documents with status:', error)
    return { data: null, error }
  }
}

/**
 * Upload a document to Storage and create DB record
 * @param {string} appartementId - UUID of the appartement
 * @param {string} documentRequisId - UUID of the required document
 * @param {File} file - PDF or image file to upload
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function uploadDocument(appartementId, documentRequisId, file) {
  try {
    // Validate file
    const validation = validateFile(file)
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
    const documentData = {
      appartement_id: appartementId,
      document_requis_id: documentRequisId,
      nom_fichier: file.name,
      nom_original: file.name,
      storage_path: storagePath,
      taille_fichier: file.size,
      type_mime: file.type
    }

    const { data, error: dbError } = await supabase
      .from('appartement_documents')
      .insert([documentData])
      .select()
      .single()

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath])

      throw dbError
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error uploading document:', error)
    return { data: null, error }
  }
}

/**
 * Get public URL for a document
 * @param {string} storagePath - Storage path of the document
 * @returns {Promise<{data: string|null, error: any}>}
 */
export async function getDocumentUrl(storagePath) {
  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath)

    if (!data || !data.publicUrl) {
      throw new Error('Unable to generate document URL')
    }

    return { data: data.publicUrl, error: null }
  } catch (error) {
    console.error('Error getting document URL:', error)
    return { data: null, error }
  }
}

/**
 * Delete a document from Storage and DB
 * @param {string} documentId - UUID of the document
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deleteDocument(documentId) {
  try {
    // First, get document info to get storage path
    const { data: document, error: fetchError } = await supabase
      .from('appartement_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single()

    if (fetchError) throw fetchError
    if (!document) throw new Error('Document not found')

    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([document.storage_path])

    if (storageError) throw storageError

    // Delete from DB
    const { error: dbError } = await supabase
      .from('appartement_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) throw dbError

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting document:', error)
    return { success: false, error }
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
 * Check if file is an image
 * @param {string} typeMime - MIME type
 * @returns {boolean}
 */
export function isImage(typeMime) {
  return typeMime === 'image/jpeg' || typeMime === 'image/png'
}

/**
 * Check if file is a PDF
 * @param {string} typeMime - MIME type
 * @returns {boolean}
 */
export function isPDF(typeMime) {
  return typeMime === 'application/pdf'
}
