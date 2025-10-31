/**
 * Chantiers Service - API calls to Supabase
 * Handles all CRUD operations for chantiers
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all chantiers with client information
 * @param {string|null} statut - Optional filter by statut (en_cours, planifie, devis)
 * @returns {Promise<{data: Array|null, error: any}>}
 */
export async function getAllChantiers(statut = null) {
  try {
    let query = supabase
      .from('chantiers')
      .select(`
        *,
        client:contacts(
          id,
          type,
          contact_type,
          company_name,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (statut) {
      query = query.eq('statut', statut)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching chantiers:', error)
    return { data: null, error }
  }
}

/**
 * Get a single chantier by ID
 * @param {string} chantierId - UUID of the chantier
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function getChantierById(chantierId) {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select(`
        *,
        client:contacts(
          id,
          type,
          contact_type,
          company_name,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('id', chantierId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching chantier:', error)
    return { data: null, error }
  }
}

/**
 * Create a new chantier
 * @param {Object} chantierData - Chantier data
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function createChantier(chantierData) {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .insert([chantierData])
      .select(`
        *,
        client:contacts(
          id,
          type,
          contact_type,
          company_name,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating chantier:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing chantier
 * @param {string} chantierId - UUID of the chantier
 * @param {Object} chantierData - Updated chantier data
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function updateChantier(chantierId, chantierData) {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .update(chantierData)
      .eq('id', chantierId)
      .select(`
        *,
        client:contacts(
          id,
          type,
          contact_type,
          company_name,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating chantier:', error)
    return { data: null, error }
  }
}

/**
 * Delete a chantier
 * @param {string} chantierId - UUID of the chantier
 * @returns {Promise<{success: boolean, error: any}>}
 */
export async function deleteChantier(chantierId) {
  try {
    // Check if chantier has associated factures
    const { count, error: countError } = await supabase
      .from('factures')
      .select('*', { count: 'exact', head: true })
      .eq('chantier_id', chantierId)

    if (countError) {
      console.error('Error checking factures:', countError)
      throw countError
    }

    // If chantier has factures, prevent deletion with explicit message
    if (count > 0) {
      const errorMessage = count === 1
        ? `Impossible de supprimer ce chantier car il contient ${count} facture. Supprimez d'abord la facture associée.`
        : `Impossible de supprimer ce chantier car il contient ${count} factures. Supprimez d'abord les factures associées.`

      return {
        success: false,
        error: {
          code: 'CHANTIER_HAS_FACTURES',
          message: errorMessage,
          count
        }
      }
    }

    // No factures, proceed with deletion
    const { error } = await supabase
      .from('chantiers')
      .delete()
      .eq('id', chantierId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting chantier:', error)
    return { success: false, error }
  }
}

/**
 * Get chantiers count by statut
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function getChantiersCountByStatut() {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .select('statut')

    if (error) throw error

    const counts = {
      en_cours: data.filter(c => c.statut === 'en_cours').length,
      planifie: data.filter(c => c.statut === 'planifie').length,
      devis: data.filter(c => c.statut === 'devis').length
    }

    return { data: counts, error: null }
  } catch (error) {
    console.error('Error fetching chantiers counts:', error)
    return { data: null, error }
  }
}
