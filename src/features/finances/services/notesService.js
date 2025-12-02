/**
 * Notes Service - API calls to Supabase
 * Handles all CRUD operations for facture notes
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all notes for a facture
 * @param {string} factureId - UUID of the facture
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function getNotes(factureId) {
  try {
    const { data, error } = await supabase
      .from('facture_notes')
      .select('*')
      .eq('facture_id', factureId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching notes:', error)
    return { success: false, error: 'Erreur lors de la récupération des notes' }
  }
}

/**
 * Create a new note for a facture
 * @param {string} factureId - UUID of the facture
 * @param {string} contenu - Note content
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createNote(factureId, contenu) {
  try {
    if (!contenu || !contenu.trim()) {
      return { success: false, error: 'Le contenu de la note est requis' }
    }

    const { data, error } = await supabase
      .from('facture_notes')
      .insert({
        facture_id: factureId,
        contenu: contenu.trim()
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating note:', error)
    return { success: false, error: 'Erreur lors de la création de la note' }
  }
}

/**
 * Update a note
 * @param {string} noteId - UUID of the note
 * @param {string} contenu - New note content
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function updateNote(noteId, contenu) {
  try {
    if (!contenu || !contenu.trim()) {
      return { success: false, error: 'Le contenu de la note est requis' }
    }

    const { data, error } = await supabase
      .from('facture_notes')
      .update({ contenu: contenu.trim() })
      .eq('id', noteId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating note:', error)
    return { success: false, error: 'Erreur lors de la modification de la note' }
  }
}

/**
 * Delete a note
 * @param {string} noteId - UUID of the note
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteNote(noteId) {
  try {
    const { error } = await supabase
      .from('facture_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    return { success: false, error: 'Erreur lors de la suppression de la note' }
  }
}
