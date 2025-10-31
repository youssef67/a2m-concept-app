/**
 * Batch Paiements Service
 * Service for creating multiple payments at once
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Create multiple paiements in batch
 * @param {Array} paiementsData - Array of {factureId, montant, date_paiement, reference, notes}
 * @returns {Promise<{success: boolean, created: Array, errors: Array}>}
 */
export async function createMultiplePaiements(paiementsData) {
  try {
    // Create all paiements with Promise.allSettled
    // This ensures all paiements are attempted even if some fail
    const promises = paiementsData.map(async (paiementData) => {
      const { error } = await supabase
        .from('paiements')
        .insert({
          facture_id: paiementData.factureId,
          montant: paiementData.montant,
          date_paiement: paiementData.date_paiement,
          reference: paiementData.reference || null,
          notes: paiementData.notes || null
        })

      if (error) throw error

      return {
        factureId: paiementData.factureId,
        factureNumero: paiementData.factureNumero,
        montant: paiementData.montant
      }
    })

    const results = await Promise.allSettled(promises)

    // Separate successful from failed paiements
    const created = []
    const errors = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        created.push(result.value)
      } else {
        errors.push({
          factureId: paiementsData[index].factureId,
          factureNumero: paiementsData[index].factureNumero,
          error: result.reason.message || 'Erreur inconnue'
        })
      }
    })

    return {
      success: errors.length === 0,
      created,
      errors
    }
  } catch (error) {
    console.error('Error in createMultiplePaiements:', error)
    return {
      success: false,
      created: [],
      errors: [{ error: error.message }]
    }
  }
}
