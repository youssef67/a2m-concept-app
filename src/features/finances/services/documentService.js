/**
 * Document Service
 * Handles PDF uploads, downloads, and deletions for factures
 */

import { supabase } from '../../../lib/supabaseClient'

const BUCKET_NAME = 'facture-documents'

/**
 * Upload a PDF document for a facture
 * @param {string} factureId - The facture ID
 * @param {File} file - The PDF file to upload
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function uploadDocument(factureId, file) {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: 'Aucun fichier fourni' }
    }

    if (file.type !== 'application/pdf') {
      return { success: false, error: 'Le fichier doit être un PDF' }
    }

    if (file.size > 10 * 1024 * 1024) { // 10 MB
      return { success: false, error: 'Le fichier ne doit pas dépasser 10 MB' }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${factureId}/${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: 'Erreur lors de l\'upload du fichier' }
    }

    // Create database entry in facture_documents
    const { data: docData, error: docError } = await supabase
      .from('facture_documents')
      .insert({
        facture_id: factureId,
        nom_fichier: sanitizedFileName,
        nom_original: file.name,
        storage_path: storagePath,
        taille_fichier: file.size,
        type_mime: file.type
      })
      .select()
      .single()

    if (docError) {
      console.error('Database insert error:', docError)
      // Cleanup: delete uploaded file if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([storagePath])
      return { success: false, error: 'Erreur lors de l\'enregistrement du document' }
    }

    return { success: true, data: docData }
  } catch (error) {
    console.error('Upload document error:', error)
    return { success: false, error: 'Erreur inattendue lors de l\'upload' }
  }
}

/**
 * Get all documents for a facture
 * @param {string} factureId - The facture ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export async function getDocuments(factureId) {
  try {
    const { data, error } = await supabase
      .from('facture_documents')
      .select('*')
      .eq('facture_id', factureId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get documents error:', error)
      return { success: false, error: 'Erreur lors de la récupération des documents' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get documents error:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Download a document (get signed URL)
 * @param {string} storagePath - The storage path of the document
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function downloadDocument(storagePath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 60) // URL valid for 60 seconds

    if (error) {
      console.error('Download document error:', error)
      return { success: false, error: 'Erreur lors de la génération du lien de téléchargement' }
    }

    return { success: true, url: data.signedUrl }
  } catch (error) {
    console.error('Download document error:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}

/**
 * Delete a document (from storage and database)
 * @param {string} documentId - The document ID
 * @param {string} storagePath - The storage path of the document
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteDocument(documentId, storagePath) {
  try {
    // Delete from database first
    const { error: dbError } = await supabase
      .from('facture_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      console.error('Delete document DB error:', dbError)
      return { success: false, error: 'Erreur lors de la suppression du document' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    if (storageError) {
      console.error('Delete document storage error:', storageError)
      // Note: DB entry already deleted, log but don't fail
      console.warn('Document supprimé de la DB mais pas du storage:', storagePath)
    }

    return { success: true }
  } catch (error) {
    console.error('Delete document error:', error)
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

/**
 * Delete all documents for a facture (used when deleting a facture)
 * @param {string} factureId - The facture ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteAllDocuments(factureId) {
  try {
    // Get all documents for this facture
    const { data: documents, error: getError } = await supabase
      .from('facture_documents')
      .select('id, storage_path')
      .eq('facture_id', factureId)

    if (getError) {
      console.error('Get documents error:', getError)
      return { success: false, error: 'Erreur lors de la récupération des documents' }
    }

    if (!documents || documents.length === 0) {
      return { success: true } // No documents to delete
    }

    // Delete all storage files
    const storagePaths = documents.map(doc => doc.storage_path)
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(storagePaths)

    if (storageError) {
      console.error('Delete storage files error:', storageError)
    }

    // Delete all database entries
    const { error: dbError } = await supabase
      .from('facture_documents')
      .delete()
      .eq('facture_id', factureId)

    if (dbError) {
      console.error('Delete documents DB error:', dbError)
      return { success: false, error: 'Erreur lors de la suppression des documents' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete all documents error:', error)
    return { success: false, error: 'Erreur inattendue' }
  }
}
