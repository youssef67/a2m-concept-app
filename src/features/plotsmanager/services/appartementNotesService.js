/**
 * Appartement Notes Service
 * API calls for appartement text notes
 */

import { supabase } from '../../../lib/supabaseClient'

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
