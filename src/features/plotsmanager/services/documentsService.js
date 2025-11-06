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
 * Save documents for a chantier (UPDATE existing, INSERT new, DELETE removed)
 * Preserves IDs to avoid cascade deletion of appartement_documents
 * @param {string} chantierId - Chantier ID
 * @param {Array<{nom_document: string}>} documents - Array of documents with nom_document
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function saveDocuments(chantierId, documents) {
  try {
    // Step 1: Get existing documents for this chantier
    const { data: existingDocs, error: fetchError } = await supabase
      .from('chantier_documents_requis')
      .select('*')
      .eq('chantier_id', chantierId)

    if (fetchError) {
      console.error('Error fetching existing documents:', fetchError)
      return { success: false, error: fetchError }
    }

    // Step 2: Process each document in the new list
    const newDocNames = (documents || []).map(d => d.nom_document.trim())

    // Documents to update (exist in both lists)
    const toUpdate = []
    // Documents to insert (new names)
    const toInsert = []
    // Documents to delete (not in new list)
    const toDelete = (existingDocs || []).filter(
      (doc) => !newDocNames.includes(doc.nom_document)
    )

    documents?.forEach((doc, index) => {
      const nomDocument = doc.nom_document.trim()
      const existingDoc = existingDocs?.find(d => d.nom_document === nomDocument)

      if (existingDoc) {
        // Document exists, update ordre
        toUpdate.push({
          id: existingDoc.id,
          nom_document: nomDocument,
          ordre: index + 1
        })
      } else {
        // New document, insert
        toInsert.push({
          chantier_id: chantierId,
          nom_document: nomDocument,
          ordre: index + 1
        })
      }
    })

    // Step 3: Execute updates
    for (const doc of toUpdate) {
      const { error: updateError } = await supabase
        .from('chantier_documents_requis')
        .update({ nom_document: doc.nom_document, ordre: doc.ordre })
        .eq('id', doc.id)

      if (updateError) {
        console.error('Error updating document:', updateError)
        return { success: false, error: updateError }
      }
    }

    // Step 4: Execute inserts
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('chantier_documents_requis')
        .insert(toInsert)

      if (insertError) {
        console.error('Error inserting documents:', insertError)
        return { success: false, error: insertError }
      }
    }

    // Step 5: Execute deletes (WARNING: Will cascade delete appartement_documents)
    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map(d => d.id)
      const { error: deleteError } = await supabase
        .from('chantier_documents_requis')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        console.error('Error deleting documents:', deleteError)
        return { success: false, error: deleteError }
      }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Exception in saveDocuments:', err)
    return { success: false, error: err }
  }
}
