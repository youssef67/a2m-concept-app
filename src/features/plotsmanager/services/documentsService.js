/**
 * Documents Service
 * Service for managing required documents list for a chantier
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all required documents for a specific chantier
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getDocumentsByChantier(chantierId) {
  try {
    const { data, error } = await supabase
      .from('chantier_documents_requis')
      .select('*')
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching documents:', error)
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Exception in getDocumentsByChantier:', err)
    return { data: null, error: err }
  }
}

/**
 * Save documents for a chantier (delete all + insert new)
 * @param {string} chantierId - Chantier ID
 * @param {Array<{nom_document: string}>} documents - Array of documents with nom_document
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function saveDocuments(chantierId, documents) {
  try {
    // Step 1: Delete all existing documents for this chantier
    const { error: deleteError } = await supabase
      .from('chantier_documents_requis')
      .delete()
      .eq('chantier_id', chantierId)

    if (deleteError) {
      console.error('Error deleting existing documents:', deleteError)
      return { success: false, error: deleteError }
    }

    // Step 2: If documents array is empty, we're done (allow empty list)
    if (!documents || documents.length === 0) {
      return { success: true, error: null }
    }

    // Step 3: Insert new documents with ordre based on array index
    const documentsToInsert = documents.map((doc, index) => ({
      chantier_id: chantierId,
      nom_document: doc.nom_document.trim(),
      ordre: index + 1
    }))

    const { error: insertError } = await supabase
      .from('chantier_documents_requis')
      .insert(documentsToInsert)

    if (insertError) {
      console.error('Error inserting documents:', insertError)
      return { success: false, error: insertError }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Exception in saveDocuments:', err)
    return { success: false, error: err }
  }
}
