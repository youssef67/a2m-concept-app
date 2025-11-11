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
 * Save taches for a chantier (differential update: UPDATE/INSERT/DELETE selective)
 * This preserves statuts of existing taches while allowing reordering, adding, and removing
 * @param {string} chantierId - Chantier ID
 * @param {Array} tachesData - Array of tache objects {id?, intitule, statut}
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

    // Step 1: Get existing taches
    const { data: existingTaches, error: fetchError } = await getTachesByChantier(chantierId)
    if (fetchError) {
      return { data: null, error: fetchError }
    }

    const existingIds = new Set(existingTaches.map(t => t.id))
    const updatedIds = new Set()

    // Step 2: Update existing taches and insert new ones
    const updates = []
    const inserts = []

    for (let index = 0; index < tachesData.length; index++) {
      const tache = tachesData[index]
      const ordre = index + 1

      if (tache.id && existingIds.has(tache.id)) {
        // Existing tache: UPDATE (triggers will update appartement_taches with preserved statuts)
        updates.push({
          id: tache.id,
          intitule: tache.intitule.trim(),
          statut: tache.statut || 'a_faire',
          ordre
        })
        updatedIds.add(tache.id)
      } else {
        // New tache: INSERT (triggers will copy to all appartements)
        inserts.push({
          chantier_id: chantierId,
          intitule: tache.intitule.trim(),
          statut: tache.statut || 'a_faire',
          ordre
        })
      }
    }

    // Step 3: Execute updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('chantier_taches')
        .update({
          intitule: update.intitule,
          statut: update.statut,
          ordre: update.ordre
        })
        .eq('id', update.id)

      if (updateError) {
        console.error('Error updating tache:', updateError)
        return { data: null, error: updateError }
      }
    }

    // Step 4: Execute inserts
    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('chantier_taches')
        .insert(inserts)

      if (insertError) {
        console.error('Error inserting new taches:', insertError)
        return { data: null, error: insertError }
      }
    }

    // Step 5: Delete removed taches (CASCADE will delete appartement_taches)
    const idsToDelete = Array.from(existingIds).filter(id => !updatedIds.has(id))
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('chantier_taches')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) {
        console.error('Error deleting removed taches:', deleteError)
        return { data: null, error: deleteError }
      }
    }

    // Step 6: Fetch and return updated taches
    const { data: finalData, error: finalError } = await getTachesByChantier(chantierId)
    if (finalError) {
      return { data: null, error: finalError }
    }

    return { data: finalData, error: null }
  } catch (err) {
    console.error('Exception in saveTaches:', err)
    return { data: null, error: err }
  }
}
