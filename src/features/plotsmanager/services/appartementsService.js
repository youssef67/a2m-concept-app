/**
 * Appartements Service
 * Service for managing appartements and their inherited tasks
 */

import { supabase } from '../../../lib/supabaseClient'
import { getTachesByChantier } from './tachesService'

/**
 * Get all appartements for a specific plot with task counts and note counts
 * @param {string} plotId - Plot ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAppartementsByPlot(plotId) {
  try {
    const { data, error } = await supabase
      .from('appartements')
      .select(`
        *,
        appartement_taches (count),
        appartement_notes (count)
      `)
      .eq('plot_id', plotId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching appartements:', error)
      return { data: null, error }
    }

    // Transform data to include task count and note count
    const transformedData = (data || []).map(appt => ({
      ...appt,
      taches_count: appt.appartement_taches?.[0]?.count || 0,
      notes_count: appt.appartement_notes?.[0]?.count || 0
    }))

    return { data: transformedData, error: null }
  } catch (err) {
    console.error('Exception in getAppartementsByPlot:', err)
    return { data: null, error: err }
  }
}

/**
 * Get all appartements for a specific plot with full details (tasks and documents)
 * @param {string} plotId - Plot ID
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAppartementsByPlotWithDetails(plotId, chantierId) {
  try {
    // 1. Récupérer les appartements avec leurs tâches
    const { data: appartements, error: apptsError } = await supabase
      .from('appartements')
      .select(`
        *,
        appartement_taches (
          id,
          chantier_tache_id,
          intitule,
          statut,
          ordre
        )
      `)
      .eq('plot_id', plotId)
      .order('ordre', { ascending: true })

    if (apptsError) throw apptsError

    // 2. Récupérer tous les documents requis du chantier
    const { data: documentsRequis, error: docsRequisError } = await supabase
      .from('chantier_documents_requis')
      .select('id, obligatoire')
      .eq('chantier_id', chantierId)

    if (docsRequisError) throw docsRequisError

    const totalDocumentsRequis = documentsRequis?.length || 0
    const obligatoireDocIds = (documentsRequis || [])
      .filter(d => d.obligatoire === true)
      .map(d => d.id)

    // 3. Pour chaque appartement, récupérer ses documents uploadés et notes
    const appartementsWithDetails = await Promise.all(
      (appartements || []).map(async (appt) => {
        const { data: docs } = await supabase
          .from('appartement_documents')
          .select('id, document_requis_id')
          .eq('appartement_id', appt.id)

        const { data: notes } = await supabase
          .from('appartement_notes')
          .select('id')
          .eq('appartement_id', appt.id)

        // Check if all obligatoire documents have at least 1 file
        const uploadedDocIds = (docs || []).map(d => d.document_requis_id)
        const missingObligatoireDocs = obligatoireDocIds.filter(
          docId => !uploadedDocIds.includes(docId)
        )

        // Count unique document types covered (not total files)
        const uniqueDocTypes = new Set(uploadedDocIds)

        return {
          ...appt,
          taches: appt.appartement_taches || [],
          documents_uploaded_count: uniqueDocTypes.size,
          documents_required_count: totalDocumentsRequis,
          taches_count: appt.appartement_taches?.length || 0,
          notes_count: notes?.length || 0,
          missing_obligatoire_documents: missingObligatoireDocs.length > 0
        }
      })
    )

    return { data: appartementsWithDetails, error: null }
  } catch (err) {
    console.error('Exception in getAppartementsByPlotWithDetails:', err)
    return { data: null, error: err }
  }
}

/**
 * Get a single appartement by ID
 * @param {string} appartementId - Appartement ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getAppartementById(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartements')
      .select('*')
      .eq('id', appartementId)
      .single()

    if (error) {
      console.error('Error fetching appartement:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in getAppartementById:', err)
    return { data: null, error: err }
  }
}

/**
 * Get tasks for a specific appartement
 * @param {string} appartementId - Appartement ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAppartementTaches(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_taches')
      .select('*')
      .eq('appartement_id', appartementId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching appartement taches:', error)
      return { data: null, error }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Exception in getAppartementTaches:', err)
    return { data: null, error: err }
  }
}

/**
 * Update a single appartement task status
 * @param {string} tacheId - Task ID
 * @param {string} statut - New status (a_faire, en_cours, terminee)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateAppartementTacheStatut(tacheId, statut) {
  try {
    const { data, error } = await supabase
      .from('appartement_taches')
      .update({ statut })
      .eq('id', tacheId)
      .select()
      .single()

    if (error) {
      console.error('Error updating appartement tache status:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in updateAppartementTacheStatut:', err)
    return { data: null, error: err }
  }
}

/**
 * Create a new appartement WITH automatic task inheritance from chantier
 * @param {string} plotId - Plot ID
 * @param {string} chantierId - Chantier ID (for task inheritance)
 * @param {Object} appartementData - Appartement data {nom}
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createAppartementWithTaches(plotId, chantierId, appartementData) {
  try {
    // Validate
    if (!appartementData.nom || appartementData.nom.trim().length === 0) {
      return {
        data: null,
        error: new Error('Le nom est obligatoire')
      }
    }

    // Step 1: Get current max ordre for this plot
    const { data: existingAppts, error: fetchError } = await supabase
      .from('appartements')
      .select('ordre')
      .eq('plot_id', plotId)
      .order('ordre', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching existing appartements:', fetchError)
      return { data: null, error: fetchError }
    }

    const nextOrdre = existingAppts && existingAppts.length > 0
      ? existingAppts[0].ordre + 1
      : 1

    // Step 2: Create appartement
    const { data: appartement, error: insertError } = await supabase
      .from('appartements')
      .insert({
        plot_id: plotId,
        nom: appartementData.nom.trim(),
        ordre: nextOrdre,
        etage: appartementData.etage !== undefined ? appartementData.etage : null,
        has_tma: appartementData.has_tma || false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating appartement:', insertError)
      return { data: null, error: insertError }
    }

    // Step 3: Get chantier tasks
    const { data: chantierTaches, error: tachesError } = await getTachesByChantier(chantierId)

    if (tachesError) {
      console.error('Error fetching chantier taches:', tachesError)
      // Don't fail the appartement creation, but warn
      console.warn('Appartement created but tasks inheritance failed')
      return { data: appartement, error: null }
    }

    // Step 4: Create inherited tasks (if any)
    if (chantierTaches && chantierTaches.length > 0) {
      const appartementTachesToInsert = chantierTaches.map(tache => ({
        appartement_id: appartement.id,
        chantier_tache_id: tache.id,
        intitule: tache.intitule,
        statut: 'a_faire',
        ordre: tache.ordre
      }))

      const { error: insertTachesError } = await supabase
        .from('appartement_taches')
        .insert(appartementTachesToInsert)

      if (insertTachesError) {
        console.error('Error inserting inherited tasks:', insertTachesError)
        // Don't fail the appartement creation, but warn
        console.warn('Appartement created but tasks inheritance failed')
      }
    }

    return { data: appartement, error: null }
  } catch (err) {
    console.error('Exception in createAppartementWithTaches:', err)
    return { data: null, error: err }
  }
}

/**
 * Update an appartement
 * @param {string} appartementId - Appartement ID
 * @param {Object} appartementData - Data to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateAppartement(appartementId, appartementData) {
  try {
    const updateData = {}

    if (appartementData.nom !== undefined) {
      if (!appartementData.nom || appartementData.nom.trim().length === 0) {
        return {
          data: null,
          error: new Error('Le nom est obligatoire')
        }
      }
      updateData.nom = appartementData.nom.trim()
    }

    if (appartementData.ordre !== undefined) {
      updateData.ordre = appartementData.ordre
    }

    if (appartementData.etage !== undefined) {
      updateData.etage = appartementData.etage
    }

    if (appartementData.has_tma !== undefined) {
      updateData.has_tma = appartementData.has_tma
    }

    const { data, error: updateError } = await supabase
      .from('appartements')
      .update(updateData)
      .eq('id', appartementId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating appartement:', updateError)
      return { data: null, error: updateError }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in updateAppartement:', err)
    return { data: null, error: err }
  }
}

/**
 * Delete an appartement (will cascade delete all tasks)
 * @param {string} appartementId - Appartement ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteAppartement(appartementId) {
  try {
    const { error: deleteError } = await supabase
      .from('appartements')
      .delete()
      .eq('id', appartementId)

    if (deleteError) {
      console.error('Error deleting appartement:', deleteError)
      return { success: false, error: deleteError }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Exception in deleteAppartement:', err)
    return { success: false, error: err }
  }
}

/**
 * Create multiple appartements WITH automatic task inheritance from chantier
 * @param {string} plotId - Plot ID
 * @param {string} chantierId - Chantier ID (for task inheritance)
 * @param {Array<Object>} appartementsData - Array of apartment objects {nom, etage}
 * @returns {Promise<{success: boolean, created: number, failed: number, errors: Array, data: Array}>}
 */
export async function createMultipleAppartementsWithTaches(plotId, chantierId, appartementsData) {
  try {
    // Validate input
    if (!Array.isArray(appartementsData) || appartementsData.length === 0) {
      return {
        success: false,
        created: 0,
        failed: 0,
        errors: ['Aucun appartement fourni'],
        data: []
      }
    }

    // Remove empty names and trim
    const validAppartements = appartementsData
      .map(appt => ({
        nom: typeof appt === 'string' ? appt.trim() : appt.nom?.trim() || '',
        etage: typeof appt === 'string' ? null : (appt.etage !== undefined ? appt.etage : null)
      }))
      .filter(appt => appt.nom.length > 0)

    if (validAppartements.length === 0) {
      return {
        success: false,
        created: 0,
        failed: 0,
        errors: ['Aucun appartement valide fourni'],
        data: []
      }
    }

    // Step 1: Get current max ordre for this plot
    const { data: existingAppts, error: fetchError } = await supabase
      .from('appartements')
      .select('ordre')
      .eq('plot_id', plotId)
      .order('ordre', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching existing appartements:', fetchError)
      return {
        success: false,
        created: 0,
        failed: validAppartements.length,
        errors: [fetchError.message],
        data: []
      }
    }

    let nextOrdre = existingAppts && existingAppts.length > 0
      ? existingAppts[0].ordre + 1
      : 1

    // Step 2: Get chantier tasks ONCE (optimization)
    const { data: chantierTaches, error: tachesError } = await getTachesByChantier(chantierId)

    if (tachesError) {
      console.error('Error fetching chantier taches:', tachesError)
      // Don't fail completely, but warn
      console.warn('Tasks inheritance will be skipped due to error')
    }

    // Step 3: Create each appartement with its tasks
    const results = []
    const errors = []
    let createdCount = 0
    let failedCount = 0

    for (const apptData of validAppartements) {
      try {
        // Create appartement
        const { data: appartement, error: insertError } = await supabase
          .from('appartements')
          .insert({
            plot_id: plotId,
            nom: apptData.nom,
            ordre: nextOrdre,
            etage: apptData.etage
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Error creating appartement "${apptData.nom}":`, insertError)
          errors.push(`${apptData.nom}: ${insertError.message}`)
          failedCount++
          continue
        }

        // Create inherited tasks (if any)
        if (chantierTaches && chantierTaches.length > 0) {
          const appartementTachesToInsert = chantierTaches.map(tache => ({
            appartement_id: appartement.id,
            chantier_tache_id: tache.id,
            intitule: tache.intitule,
            statut: 'a_faire',
            ordre: tache.ordre
          }))

          const { error: insertTachesError } = await supabase
            .from('appartement_taches')
            .insert(appartementTachesToInsert)

          if (insertTachesError) {
            console.error(`Error inserting tasks for "${apptData.nom}":`, insertTachesError)
            // Don't fail the appartement creation, but log warning
            console.warn(`Appartement "${apptData.nom}" created but tasks inheritance failed`)
          }
        }

        results.push(appartement)
        createdCount++
        nextOrdre++ // Increment for next appartement
      } catch (err) {
        console.error(`Exception creating appartement "${apptData.nom}":`, err)
        errors.push(`${apptData.nom}: ${err.message}`)
        failedCount++
      }
    }

    return {
      success: createdCount > 0,
      created: createdCount,
      failed: failedCount,
      errors: errors,
      data: results
    }
  } catch (err) {
    console.error('Exception in createMultipleAppartementsWithTaches:', err)
    return {
      success: false,
      created: 0,
      failed: appartementsData.length,
      errors: [err.message],
      data: []
    }
  }
}

/**
 * Validate multiple appartements (set valide = true)
 * Checks if obligatoire documents are uploaded before validation
 * @param {Array<string>} appartementIds - Array of appartement IDs
 * @param {string} chantierId - Chantier ID to fetch obligatoire documents
 * @returns {Promise<{success: boolean, updated: number, failed: number, errors: Array, blockedAppartements: Array}>}
 */
export async function validateAppartements(appartementIds, chantierId) {
  try {
    if (!Array.isArray(appartementIds) || appartementIds.length === 0) {
      return {
        success: false,
        updated: 0,
        failed: 0,
        errors: ['Aucun appartement fourni'],
        blockedAppartements: []
      }
    }

    // Step 1: Get all obligatoire documents for this chantier
    const { data: documentsRequis, error: docsError } = await supabase
      .from('chantier_documents_requis')
      .select('id, nom_document, obligatoire')
      .eq('chantier_id', chantierId)
      .eq('obligatoire', true)

    if (docsError) {
      console.error('Error fetching obligatoire documents:', docsError)
      return {
        success: false,
        updated: 0,
        failed: appartementIds.length,
        errors: ['Erreur lors de la vérification des documents obligatoires'],
        blockedAppartements: []
      }
    }

    const obligatoireDocIds = (documentsRequis || []).map(d => d.id)
    const blockedAppartements = []
    const validAppartementIds = []

    // Step 2: Check each appartement for missing obligatoire documents
    if (obligatoireDocIds.length > 0) {
      for (const appartementId of appartementIds) {
        // Get uploaded documents for this appartement
        const { data: uploadedDocs, error: uploadError } = await supabase
          .from('appartement_documents')
          .select('document_requis_id')
          .eq('appartement_id', appartementId)

        if (uploadError) {
          console.error('Error fetching uploaded documents:', uploadError)
          blockedAppartements.push({
            id: appartementId,
            reason: 'Erreur lors de la vérification des documents'
          })
          continue
        }

        const uploadedDocIds = (uploadedDocs || []).map(d => d.document_requis_id)

        // Check if all obligatoire documents have at least 1 file
        const missingObligatoireDocs = obligatoireDocIds.filter(
          docId => !uploadedDocIds.includes(docId)
        )

        if (missingObligatoireDocs.length > 0) {
          const missingDocNames = documentsRequis
            .filter(d => missingObligatoireDocs.includes(d.id))
            .map(d => d.nom_document)
            .join(', ')

          blockedAppartements.push({
            id: appartementId,
            reason: `Documents obligatoires manquants: ${missingDocNames}`
          })
        } else {
          validAppartementIds.push(appartementId)
        }
      }
    } else {
      // No obligatoire documents, all appartements can be validated
      validAppartementIds.push(...appartementIds)
    }

    // Step 3: Validate only appartements with all obligatoire documents
    if (validAppartementIds.length === 0) {
      return {
        success: false,
        updated: 0,
        failed: appartementIds.length,
        errors: blockedAppartements.map(b => b.reason),
        blockedAppartements
      }
    }

    const { data, error } = await supabase
      .from('appartements')
      .update({ valide: true })
      .in('id', validAppartementIds)
      .select()

    if (error) {
      console.error('Error validating appartements:', error)
      return {
        success: false,
        updated: 0,
        failed: appartementIds.length,
        errors: [error.message],
        blockedAppartements
      }
    }

    return {
      success: true,
      updated: data?.length || 0,
      failed: blockedAppartements.length,
      errors: blockedAppartements.map(b => b.reason),
      blockedAppartements
    }
  } catch (err) {
    console.error('Exception in validateAppartements:', err)
    return {
      success: false,
      updated: 0,
      failed: appartementIds.length,
      errors: [err.message],
      blockedAppartements: []
    }
  }
}

/**
 * Invalidate multiple appartements (set valide = false)
 * @param {Array<string>} appartementIds - Array of appartement IDs
 * @returns {Promise<{success: boolean, updated: number, failed: number, errors: Array}>}
 */
export async function invalidateAppartements(appartementIds) {
  try {
    if (!Array.isArray(appartementIds) || appartementIds.length === 0) {
      return {
        success: false,
        updated: 0,
        failed: 0,
        errors: ['Aucun appartement fourni']
      }
    }

    const { data, error } = await supabase
      .from('appartements')
      .update({ valide: false })
      .in('id', appartementIds)
      .select()

    if (error) {
      console.error('Error invalidating appartements:', error)
      return {
        success: false,
        updated: 0,
        failed: appartementIds.length,
        errors: [error.message]
      }
    }

    return {
      success: true,
      updated: data?.length || 0,
      failed: 0,
      errors: []
    }
  } catch (err) {
    console.error('Exception in invalidateAppartements:', err)
    return {
      success: false,
      updated: 0,
      failed: appartementIds.length,
      errors: [err.message]
    }
  }
}
