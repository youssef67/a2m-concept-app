/**
 * Appartements Service
 * Service for managing appartements and their inherited tasks
 */

import { supabase } from '../../../lib/supabaseClient'
import { getTachesByChantier } from './tachesService'

/**
 * Get all appartements for a specific plot with task counts
 * @param {string} plotId - Plot ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getAppartementsByPlot(plotId) {
  try {
    const { data, error } = await supabase
      .from('appartements')
      .select(`
        *,
        appartement_taches (count)
      `)
      .eq('plot_id', plotId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching appartements:', error)
      return { data: null, error }
    }

    // Transform data to include task count
    const transformedData = (data || []).map(appt => ({
      ...appt,
      taches_count: appt.appartement_taches?.[0]?.count || 0
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
          statut
        )
      `)
      .eq('plot_id', plotId)
      .order('ordre', { ascending: true })

    if (apptsError) throw apptsError

    // 2. Récupérer les documents requis du chantier
    const { data: documentsRequis, error: docsRequisError } = await supabase
      .from('chantier_documents_requis')
      .select('id')
      .eq('chantier_id', chantierId)

    if (docsRequisError) throw docsRequisError

    const totalDocumentsRequis = documentsRequis?.length || 0

    // 3. Pour chaque appartement, récupérer ses documents uploadés
    const appartementsWithDetails = await Promise.all(
      (appartements || []).map(async (appt) => {
        const { data: docs } = await supabase
          .from('appartement_documents')
          .select('id')
          .eq('appartement_id', appt.id)

        return {
          ...appt,
          taches: appt.appartement_taches || [],
          documents_uploaded_count: docs?.length || 0,
          documents_required_count: totalDocumentsRequis,
          taches_count: appt.appartement_taches?.length || 0
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
        ordre: nextOrdre
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
