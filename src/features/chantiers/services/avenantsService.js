/**
 * Avenants Service
 * Service for managing chantier avenants (amendments)
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all avenants for a specific chantier
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAvenantsByChantier(chantierId) {
  try {
    const { data, error } = await supabase
      .from('avenants')
      .select('*')
      .eq('chantier_id', chantierId)
      .order('numero', { ascending: true })

    if (error) {
      console.error('Error fetching avenants:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in getAvenantsByChantier:', err)
    return { data: null, error: err }
  }
}

/**
 * Get next avenant numero for a chantier
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<number>} Next numero (1 if no avenants exist)
 */
async function getNextNumero(chantierId) {
  try {
    const { data, error } = await supabase
      .from('avenants')
      .select('numero')
      .eq('chantier_id', chantierId)
      .order('numero', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error getting next numero:', error)
      return 1
    }

    if (!data || data.length === 0) {
      return 1
    }

    return data[0].numero + 1
  } catch (err) {
    console.error('Exception in getNextNumero:', err)
    return 1
  }
}

/**
 * Create a new avenant for a chantier
 * @param {string} chantierId - Chantier ID
 * @param {number} montantHT - Montant HT
 * @param {string} description - Description (optional)
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export async function createAvenant(chantierId, montantHT, description = '') {
  try {
    // Get next numero
    const nextNumero = await getNextNumero(chantierId)

    const avenantData = {
      chantier_id: chantierId,
      numero: nextNumero,
      montant_ht: parseFloat(montantHT),
      description: description || null
    }

    const { data, error } = await supabase
      .from('avenants')
      .insert([avenantData])
      .select()
      .single()

    if (error) {
      console.error('Error creating avenant:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in createAvenant:', err)
    return { data: null, error: err }
  }
}

/**
 * Update an existing avenant
 * @param {string} avenantId - Avenant ID
 * @param {Object} updates - Fields to update (montant_ht, description)
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export async function updateAvenant(avenantId, updates) {
  try {
    const updateData = {}

    if (updates.montant_ht !== undefined) {
      updateData.montant_ht = parseFloat(updates.montant_ht)
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description || null
    }

    const { data, error } = await supabase
      .from('avenants')
      .update(updateData)
      .eq('id', avenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating avenant:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in updateAvenant:', err)
    return { data: null, error: err }
  }
}

/**
 * Delete an avenant
 * @param {string} avenantId - Avenant ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteAvenant(avenantId) {
  try {
    const { error } = await supabase
      .from('avenants')
      .delete()
      .eq('id', avenantId)

    if (error) {
      console.error('Error deleting avenant:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Exception in deleteAvenant:', err)
    return { success: false, error: err }
  }
}
