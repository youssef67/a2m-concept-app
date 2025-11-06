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
        chantier_clients(
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
        ),
        factures(
          id,
          type,
          statut,
          montant,
          montant_ht,
          montant_ttc,
          tva_applicable,
          retenue_garantie,
          prorata_applicable
        )
      `)
      .order('created_at', { ascending: false })

    if (statut) {
      query = query.eq('statut', statut)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform chantier_clients array to clients array
    const transformedData = data?.map(chantier => ({
      ...chantier,
      clients: chantier.chantier_clients?.map(cc => cc.contact) || [],
      client: chantier.chantier_clients?.[0]?.contact || null, // First client for backward compatibility
      chantier_clients: undefined // Remove to clean up response
    }))

    return { data: transformedData, error: null }
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
        chantier_clients(
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
        ),
        factures(
          id,
          type,
          statut,
          montant,
          montant_ht,
          montant_ttc,
          tva_applicable,
          retenue_garantie,
          prorata_applicable
        )
      `)
      .eq('id', chantierId)
      .single()

    if (error) throw error

    // Transform chantier_clients array to clients array
    const transformedData = {
      ...data,
      clients: data.chantier_clients?.map(cc => cc.contact) || [],
      client: data.chantier_clients?.[0]?.contact || null, // First client for backward compatibility
      chantier_clients: undefined // Remove to clean up response
    }

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching chantier:', error)
    return { data: null, error }
  }
}

/**
 * Create a new chantier
 * @param {Object} chantierData - Chantier data (must include client_ids array)
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function createChantier(chantierData) {
  try {
    // Extract client_ids from chantierData
    const { client_ids, ...chantierFields } = chantierData

    if (!client_ids || !Array.isArray(client_ids) || client_ids.length === 0) {
      throw new Error('Au moins un client est requis')
    }

    // Create chantier
    const { data: chantier, error: chantierError } = await supabase
      .from('chantiers')
      .insert([chantierFields])
      .select()
      .single()

    if (chantierError) throw chantierError

    // Create chantier_clients relationships
    const chantierClientsData = client_ids.map(client_id => ({
      chantier_id: chantier.id,
      contact_id: client_id
    }))

    const { error: clientsError } = await supabase
      .from('chantier_clients')
      .insert(chantierClientsData)

    if (clientsError) throw clientsError

    // Fetch complete chantier with clients
    return await getChantierById(chantier.id)
  } catch (error) {
    console.error('Error creating chantier:', error)
    return { data: null, error }
  }
}

/**
 * Update an existing chantier
 * @param {string} chantierId - UUID of the chantier
 * @param {Object} chantierData - Updated chantier data (may include client_ids array)
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function updateChantier(chantierId, chantierData) {
  try {
    // Extract client_ids from chantierData
    const { client_ids, ...chantierFields } = chantierData

    // Update chantier fields
    const { error: chantierError } = await supabase
      .from('chantiers')
      .update(chantierFields)
      .eq('id', chantierId)

    if (chantierError) throw chantierError

    // Update clients if client_ids provided
    if (client_ids && Array.isArray(client_ids)) {
      if (client_ids.length === 0) {
        throw new Error('Au moins un client est requis')
      }

      // Delete existing client relationships
      const { error: deleteError } = await supabase
        .from('chantier_clients')
        .delete()
        .eq('chantier_id', chantierId)

      if (deleteError) throw deleteError

      // Insert new client relationships
      const chantierClientsData = client_ids.map(client_id => ({
        chantier_id: chantierId,
        contact_id: client_id
      }))

      const { error: insertError } = await supabase
        .from('chantier_clients')
        .insert(chantierClientsData)

      if (insertError) throw insertError
    }

    // Fetch complete chantier with clients
    return await getChantierById(chantierId)
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

/**
 * Update payment status for chantier (finalisation 95% and retenue de garantie)
 * @param {string} chantierId - UUID of the chantier
 * @param {Object} paymentStatus - { finalisation_95_payee: boolean, retenue_garantie_payee: boolean }
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export async function updateChantierPaiementStatus(chantierId, paymentStatus) {
  try {
    const { data, error } = await supabase
      .from('chantiers')
      .update({
        finalisation_95_payee: paymentStatus.finalisation_95_payee || false,
        retenue_garantie_payee: paymentStatus.retenue_garantie_payee || false
      })
      .eq('id', chantierId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating chantier payment status:', error)
    return { data: null, error }
  }
}
