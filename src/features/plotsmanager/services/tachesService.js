/**
 * Taches Service
 * Service for managing chantier taches (tasks common to all plots)
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all taches for a specific chantier
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getTachesByChantier(chantierId) {
  try {
    const { data, error } = await supabase
      .from('chantier_taches')
      .select('*')
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching taches:', error)
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Exception in getTachesByChantier:', err)
    return { data: null, error: err }
  }
}

/**
 * Save taches for a chantier (batch operation: DELETE all + INSERT new)
 * This allows for complete reordering, adding, and removing in a single transaction
 * @param {string} chantierId - Chantier ID
 * @param {Array} tachesData - Array of tache objects {intitule, statut}
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function saveTaches(chantierId, tachesData) {
  try {
    // Validate minimum 1 task
    if (!tachesData || tachesData.length === 0) {
      return {
        data: null,
        error: new Error('Au moins une tâche est requise')
      }
    }

    // Validate all tasks have intitule
    const hasEmptyIntitule = tachesData.some(
      t => !t.intitule || t.intitule.trim().length === 0
    )
    if (hasEmptyIntitule) {
      return {
        data: null,
        error: new Error('Toutes les tâches doivent avoir un intitulé')
      }
    }

    // Step 1: Delete all existing taches for this chantier
    const { error: deleteError } = await supabase
      .from('chantier_taches')
      .delete()
      .eq('chantier_id', chantierId)

    if (deleteError) {
      console.error('Error deleting existing taches:', deleteError)
      return { data: null, error: deleteError }
    }

    // Step 2: Insert new taches with ordre
    const tachesToInsert = tachesData.map((tache, index) => ({
      chantier_id: chantierId,
      intitule: tache.intitule.trim(),
      statut: tache.statut || 'a_faire',
      ordre: index + 1
    }))

    const { data, error: insertError } = await supabase
      .from('chantier_taches')
      .insert(tachesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting new taches:', insertError)
      return { data: null, error: insertError }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in saveTaches:', err)
    return { data: null, error: err }
  }
}
