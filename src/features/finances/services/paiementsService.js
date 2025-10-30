/**
 * Paiements Service
 * CRUD operations for facture payments
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all paiements for a specific facture
 * @param {string} factureId - The facture ID
 * @returns {Promise<{data: Array|null, error: any}>}
 */
export async function getPaiementsByFacture(factureId) {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .select('*')
      .eq('facture_id', factureId)
      .order('date_paiement', { ascending: false }) // Plus récent d'abord

    if (error) {
      console.error('Get paiements error:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get paiements exception:', error)
    return { data: null, error }
  }
}

/**
 * Create a new paiement
 * @param {Object} paiementData - Paiement data
 * @param {string} paiementData.facture_id - Facture ID
 * @param {number} paiementData.montant - Payment amount
 * @param {string} paiementData.date_paiement - Payment date (YYYY-MM-DD)
 * @param {string} paiementData.reference - Payment reference (optional)
 * @param {string} paiementData.notes - Additional notes (optional)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function createPaiement(paiementData) {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .insert({
        facture_id: paiementData.facture_id,
        montant: parseFloat(paiementData.montant),
        date_paiement: paiementData.date_paiement,
        reference: paiementData.reference || null,
        notes: paiementData.notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Create paiement error:', error)
      return { success: false, error: 'Erreur lors de la création du paiement' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Create paiement exception:', error)
    return { success: false, error: 'Erreur inattendue lors de la création' }
  }
}

/**
 * Update a paiement
 * @param {string} paiementId - Paiement ID
 * @param {Object} paiementData - Updated paiement data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function updatePaiement(paiementId, paiementData) {
  try {
    const { data, error } = await supabase
      .from('paiements')
      .update({
        montant: parseFloat(paiementData.montant),
        date_paiement: paiementData.date_paiement,
        reference: paiementData.reference || null,
        notes: paiementData.notes || null
      })
      .eq('id', paiementId)
      .select()
      .single()

    if (error) {
      console.error('Update paiement error:', error)
      return { success: false, error: 'Erreur lors de la modification du paiement' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update paiement exception:', error)
    return { success: false, error: 'Erreur inattendue lors de la modification' }
  }
}

/**
 * Delete a paiement
 * @param {string} paiementId - Paiement ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePaiement(paiementId) {
  try {
    const { error } = await supabase
      .from('paiements')
      .delete()
      .eq('id', paiementId)

    if (error) {
      console.error('Delete paiement error:', error)
      return { success: false, error: 'Erreur lors de la suppression du paiement' }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete paiement exception:', error)
    return { success: false, error: 'Erreur inattendue lors de la suppression' }
  }
}

/**
 * Get facture with payment summary
 * @param {string} factureId - The facture ID
 * @returns {Promise<{data: object|null, error: any}>}
 */
export async function getFactureWithPaiements(factureId) {
  try {
    // Get facture
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select('*')
      .eq('id', factureId)
      .single()

    if (factureError) {
      console.error('Get facture error:', factureError)
      return { data: null, error: factureError }
    }

    // Get paiements
    const { data: paiements, error: paiementsError } = await getPaiementsByFacture(factureId)

    if (paiementsError) {
      return { data: null, error: paiementsError }
    }

    // Calculate totals
    const montantPaye = paiements?.reduce((sum, p) => sum + parseFloat(p.montant), 0) || 0
    const montantRestant = parseFloat(facture.montant) - montantPaye

    return {
      data: {
        ...facture,
        paiements: paiements || [],
        montant_paye: montantPaye,
        montant_restant: montantRestant,
        nombre_paiements: paiements?.length || 0
      },
      error: null
    }
  } catch (error) {
    console.error('Get facture with paiements exception:', error)
    return { data: null, error }
  }
}
