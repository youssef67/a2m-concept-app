/**
 * Factures Service - API calls to Supabase
 * Handles all CRUD operations for factures
 */

import { supabase } from '../../../lib/supabaseClient'
import { sendInvoiceCreatedNotification, sendInvoiceDeletedNotification } from './emailNotificationService'
import { getMontantAPayer } from '../utils/factureHelpers'
import { createPaiement } from './paiementsService'

/**
 * Parse Supabase error and return user-friendly message in French
 * @param {Object} error - Supabase error object
 * @returns {string} User-friendly error message
 */
function parseSupabaseError(error) {
  // Duplicate numero_facture (unique violation)
  if (error.code === '23505' && error.message?.includes('factures_numero_facture_unique')) {
    return 'Ce numéro de facture existe déjà. Veuillez en choisir un autre ou laisser vide pour génération automatique.'
  }

  // Generic duplicate key violation
  if (error.code === '23505') {
    return 'Cette valeur existe déjà dans la base de données.'
  }

  // Foreign key violation (contact doesn't exist)
  if (error.code === '23503') {
    if (error.message?.includes('contact_id')) {
      return 'Le client/fournisseur sélectionné n\'existe pas ou a été supprimé.'
    }
    return 'Une des relations référencées n\'existe pas ou a été supprimée.'
  }

  // Check constraint violation (invalid data)
  if (error.code === '23514') {
    if (error.message?.includes('valid_dates')) {
      return 'La date d\'échéance doit être >= à la date d\'émission.'
    }
    if (error.message?.includes('montant')) {
      return 'Le montant doit être supérieur à 0.'
    }
    return 'Les données saisies ne respectent pas les contraintes de validation.'
  }

  // Not null violation
  if (error.code === '23502') {
    return 'Tous les champs obligatoires doivent être renseignés.'
  }

  // Generic error
  return 'Erreur lors de l\'enregistrement de la facture.'
}

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
        ),
        chantier:chantiers(
          id,
          titre,
          statut
        ),
        deductions:facture_deductions(
          id,
          intitule,
          pourcentage,
          montant,
          ordre
        ),
        documents:facture_documents(
          id,
          nom_fichier,
          nom_original,
          storage_path,
          taille_fichier,
          created_at
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

    // Calculate montant_paye for each facture and extract first document
    const facturesWithPaiements = factures.map(facture => {
      const facturePaiements = paiements?.filter(p => p.facture_id === facture.id) || []
      const montantPaye = facturePaiements.reduce((sum, p) => sum + parseFloat(p.montant), 0)
      const montantAPayer = getMontantAPayer(facture)
      const montantRestant = montantAPayer - montantPaye

      // Extract first document (limit 1 PDF per facture)
      const document = facture.documents && facture.documents.length > 0
        ? facture.documents[0]
        : null

      return {
        ...facture,
        montant_paye: montantPaye,
        montant_restant: Math.max(0, montantRestant), // Ensure not negative
        document // Single document (or null)
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
        ),
        deductions:facture_deductions(
          id,
          intitule,
          pourcentage,
          montant,
          ordre
        ),
        chantier:chantiers(
          id,
          titre,
          statut
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
 * @param {Array} deductions - Optional array of deductions {intitule, pourcentage, montant}
 * @returns {Promise<{data: Object|null, error: any, success: boolean}>}
 */
export async function createFacture(factureData, deductions = []) {
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
        ),
        deductions:facture_deductions(
          id,
          intitule,
          pourcentage,
          montant,
          ordre
        )
      `)
      .single()

    if (error) throw error

    // Insert deductions if provided
    if (deductions && deductions.length > 0) {
      const deductionsData = deductions.map((ded, index) => ({
        facture_id: data.id,
        intitule: ded.intitule,
        pourcentage: ded.pourcentage || null,
        montant: parseFloat(ded.montant),
        ordre: index + 1
      }))

      const { error: deductionsError } = await supabase
        .from('facture_deductions')
        .insert(deductionsData)

      if (deductionsError) {
        console.error('Error inserting deductions:', deductionsError)
        // Continue without failing the whole operation
      }
    }

    // Calculate montant à payer
    const montantAPayer = getMontantAPayer(data)

    // If facture is created with status "payee", automatically create a payment
    let montantPaye = 0
    if (data.statut === 'payee') {
      const paiementResult = await createPaiement({
        facture_id: data.id,
        montant: montantAPayer,
        date_paiement: data.date_emission || new Date().toISOString().split('T')[0],
        reference: 'Paiement initial',
        notes: 'Paiement créé automatiquement lors de la création de la facture avec statut "payée"'
      })

      if (paiementResult.success) {
        montantPaye = montantAPayer
      } else {
        console.error('[Auto-payment] Failed to create automatic payment:', paiementResult.error)
      }
    }

    const factureWithPaiements = {
      ...data,
      montant_paye: montantPaye,
      montant_restant: montantAPayer - montantPaye
    }

    // Send email notification (non-blocking, async)
    sendInvoiceCreatedNotification(factureWithPaiements)
      .catch(err => console.error('[Email] Invoice creation notification failed:', err))

    return { data: factureWithPaiements, error: null, success: true }
  } catch (error) {
    console.error('Error creating facture:', error)
    const errorMessage = parseSupabaseError(error)
    return { data: null, error: errorMessage, success: false }
  }
}

/**
 * Update an existing facture
 * @param {string} factureId - UUID of the facture
 * @param {Object} factureData - Updated facture data
 * @param {Array} deductions - Optional array of deductions {intitule, pourcentage, montant}
 * @returns {Promise<{data: Object|null, error: any, success: boolean}>}
 */
export async function updateFacture(factureId, factureData, deductions = null) {
  try {
    // If deductions are provided, delete existing ones and recreate
    if (deductions !== null) {
      // Delete existing deductions
      await supabase
        .from('facture_deductions')
        .delete()
        .eq('facture_id', factureId)

      // Insert new deductions if any
      if (deductions.length > 0) {
        const deductionsData = deductions.map((ded, index) => ({
          facture_id: factureId,
          intitule: ded.intitule,
          pourcentage: ded.pourcentage || null,
          montant: parseFloat(ded.montant),
          ordre: index + 1
        }))

        const { error: deductionsError } = await supabase
          .from('facture_deductions')
          .insert(deductionsData)

        if (deductionsError) {
          console.error('Error inserting deductions:', deductionsError)
          throw deductionsError
        }
      }
    }

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
        ),
        chantier:chantiers(
          id,
          titre,
          statut
        ),
        deductions:facture_deductions(
          id,
          intitule,
          pourcentage,
          montant,
          ordre
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
    const montantAPayer = getMontantAPayer(data)
    const montantRestant = montantAPayer - montantPaye

    const factureWithPaiements = {
      ...data,
      montant_paye: montantPaye,
      montant_restant: Math.max(0, montantRestant)
    }

    return { data: factureWithPaiements, error: null, success: true }
  } catch (error) {
    console.error('Error updating facture:', error)
    const errorMessage = parseSupabaseError(error)
    return { data: null, error: errorMessage, success: false }
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
