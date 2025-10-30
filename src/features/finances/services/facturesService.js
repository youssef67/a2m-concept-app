/**
 * Factures Service - API calls to Supabase
 * Handles all CRUD operations for factures
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all factures with contact information
 * @param {string|null} type - Optional filter by type (client, fournisseur)
 * @returns {Promise<{data: Array|null, error: any}>}
 */
export async function getAllFactures(type = null) {
  try {
    let query = supabase
      .from('factures')
      .select(`
        *,
        contact:contacts(
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
      .order('date_emission', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching factures:', error)
    return { data: null, error }
  }
}

/**
 * Get a single facture by ID
 * @param {string} factureId - UUID of the facture
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function getFactureById(factureId) {
  try {
    const { data, error } = await supabase
      .from('factures')
      .select(`
        *,
        contact:contacts(
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
      .eq('id', factureId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching facture:', error)
    return { data: null, error }
  }
}

/**
 * Create a new facture
 * @param {Object} factureData - Facture data
 * @returns {Promise<{data: Object|null, error: any, success: boolean}>}
 */
export async function createFacture(factureData) {
  try {
    const { data, error } = await supabase
      .from('factures')
      .insert([factureData])
      .select(`
        *,
        contact:contacts(
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

    return { data, error: null, success: true }
  } catch (error) {
    console.error('Error creating facture:', error)
    return { data: null, error, success: false }
  }
}

/**
 * Update an existing facture
 * @param {string} factureId - UUID of the facture
 * @param {Object} factureData - Updated facture data
 * @returns {Promise<{data: Object|null, error: any, success: boolean}>}
 */
export async function updateFacture(factureId, factureData) {
  try {
    const { data, error } = await supabase
      .from('factures')
      .update(factureData)
      .eq('id', factureId)
      .select(`
        *,
        contact:contacts(
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

    return { data, error: null, success: true }
  } catch (error) {
    console.error('Error updating facture:', error)
    return { data: null, error, success: false }
  }
}

/**
 * Delete a facture
 * @param {string} factureId - UUID of the facture
 * @returns {Promise<{data: any, error: any, success: boolean}>}
 */
export async function deleteFacture(factureId) {
  try {
    const { data, error } = await supabase
      .from('factures')
      .delete()
      .eq('id', factureId)

    if (error) throw error

    return { data, error: null, success: true }
  } catch (error) {
    console.error('Error deleting facture:', error)
    return { data: null, error, success: false }
  }
}
