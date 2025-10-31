/**
 * Factures Service - API calls to Supabase
 * Handles all CRUD operations for factures
 */

import { supabase } from '../../../lib/supabaseClient'
import { sendInvoiceCreatedNotification, sendInvoiceDeletedNotification } from './emailNotificationService'

/**
 * Get all factures with contact information and payment totals
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

    const { data: factures, error } = await query

    if (error) throw error

    // Fetch all paiements for these factures
    const { data: paiements, error: paiementsError } = await supabase
      .from('paiements')
      .select('facture_id, montant')

    if (paiementsError) {
      console.error('Error fetching paiements:', paiementsError)
      // Continue without payment data
    }

    // Calculate montant_paye for each facture
    const facturesWithPaiements = factures.map(facture => {
      const facturePaiements = paiements?.filter(p => p.facture_id === facture.id) || []
      const montantPaye = facturePaiements.reduce((sum, p) => sum + parseFloat(p.montant), 0)
      const montantRestant = parseFloat(facture.montant) - montantPaye

      return {
        ...facture,
        montant_paye: montantPaye,
        montant_restant: Math.max(0, montantRestant) // Ensure not negative
      }
    })

    return { data: facturesWithPaiements, error: null }
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

    // New factures have no payments yet
    const factureWithPaiements = {
      ...data,
      montant_paye: 0,
      montant_restant: parseFloat(data.montant)
    }

    // Send email notification (non-blocking, async)
    sendInvoiceCreatedNotification(factureWithPaiements)
      .catch(err => console.error('[Email] Invoice creation notification failed:', err))

    return { data: factureWithPaiements, error: null, success: true }
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

    // Fetch paiements for this facture to calculate totals
    const { data: paiements } = await supabase
      .from('paiements')
      .select('montant')
      .eq('facture_id', factureId)

    const montantPaye = paiements?.reduce((sum, p) => sum + parseFloat(p.montant), 0) || 0
    const montantRestant = parseFloat(data.montant) - montantPaye

    const factureWithPaiements = {
      ...data,
      montant_paye: montantPaye,
      montant_restant: Math.max(0, montantRestant)
    }

    return { data: factureWithPaiements, error: null, success: true }
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
    // IMPORTANT: Fetch facture data BEFORE deleting (for email notification)
    const { data: factureToDelete, error: fetchError } = await supabase
      .from('factures')
      .select(`
        *,
        contact:contacts(
          company_name,
          first_name,
          last_name
        )
      `)
      .eq('id', factureId)
      .single()

    if (fetchError) {
      console.error('Error fetching facture before delete:', fetchError)
      // Continue with deletion even if fetch fails
    }

    // Delete the facture
    const { data, error } = await supabase
      .from('factures')
      .delete()
      .eq('id', factureId)

    if (error) throw error

    // Send email notification (non-blocking, async)
    if (factureToDelete) {
      sendInvoiceDeletedNotification(factureToDelete)
        .catch(err => console.error('[Email] Invoice deletion notification failed:', err))
    }

    return { data, error: null, success: true }
  } catch (error) {
    console.error('Error deleting facture:', error)
    return { data: null, error, success: false }
  }
}

/**
 * Delete multiple factures in batch
 * @param {Array<{id: string, numero_facture: string}>} facturesData - Array of facture objects with id and numero
 * @returns {Promise<{success: boolean, deleted: Array, errors: Array}>}
 */
export async function deleteMultipleFactures(facturesData) {
  try {
    // Delete all factures with Promise.allSettled
    // This ensures all deletions are attempted even if some fail
    const promises = facturesData.map(async (facture) => {
      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', facture.id)

      if (error) throw error

      return {
        factureId: facture.id,
        factureNumero: facture.numero_facture
      }
    })

    const results = await Promise.allSettled(promises)

    // Separate successful from failed deletions
    const deleted = []
    const errors = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        deleted.push(result.value)
      } else {
        errors.push({
          factureId: facturesData[index].id,
          factureNumero: facturesData[index].numero_facture,
          error: result.reason.message || 'Erreur inconnue'
        })
      }
    })

    return {
      success: errors.length === 0,
      deleted,
      errors
    }
  } catch (error) {
    console.error('Error in deleteMultipleFactures:', error)
    return {
      success: false,
      deleted: [],
      errors: [{ error: error.message }]
    }
  }
}
