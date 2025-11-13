/**
 * Plots Service
 * Service for managing plots (immeubles/structures) within a chantier
 */

import { supabase } from '../../../lib/supabaseClient'
import { calculateAppartementStatut } from '../utils/appartementHelpers'

/**
 * Get all plots for a specific chantier with appartement count and status statistics
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPlotsByChantier(chantierId) {
  try {
    // Fetch plots with full appartement data including tasks
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        appartements (
          id,
          appartement_taches (
            id,
            statut
          )
        )
      `)
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching plots:', error)
      return { data: null, error }
    }

    // For each plot, calculate status statistics for its appartements
    const transformedData = (data || []).map(plot => {
      const appartements = plot.appartements || []

      // Initialize statistics
      const stats = {
        total: appartements.length,
        en_attente: 0,
        en_cours: 0,
        finalise: 0
      }

      // Calculate status for each appartement
      appartements.forEach(appt => {
        const taches = appt.appartement_taches || []
        const statut = calculateAppartementStatut({ taches })

        stats[statut] = (stats[statut] || 0) + 1
      })

      return {
        ...plot,
        appartements_count: appartements.length,
        appartements_stats: stats
      }
    })

    return { data: transformedData, error: null }
  } catch (err) {
    console.error('Exception in getPlotsByChantier:', err)
    return { data: null, error: err }
  }
}

/**
 * Get a single plot by ID
 * @param {string} plotId - Plot ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getPlotById(plotId) {
  try {
    const { data, error } = await supabase
      .from('plots')
      .select('*')
      .eq('id', plotId)
      .single()

    if (error) {
      console.error('Error fetching plot:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in getPlotById:', err)
    return { data: null, error: err }
  }
}

/**
 * Create a new plot
 * @param {string} chantierId - Chantier ID
 * @param {Object} plotData - Plot data {nom, type, description}
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createPlot(chantierId, plotData) {
  try {
    // Validate
    if (!plotData.nom || plotData.nom.trim().length === 0) {
      return {
        data: null,
        error: new Error('Le nom est obligatoire')
      }
    }

    // Get current max ordre for this chantier
    const { data: existingPlots, error: fetchError } = await supabase
      .from('plots')
      .select('ordre')
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Error fetching existing plots:', fetchError)
      return { data: null, error: fetchError }
    }

    const nextOrdre = existingPlots && existingPlots.length > 0
      ? existingPlots[0].ordre + 1
      : 1

    // Insert plot
    const { data, error: insertError} = await supabase
      .from('plots')
      .insert({
        chantier_id: chantierId,
        nom: plotData.nom.trim(),
        type: plotData.type || 'immeuble',
        description: plotData.description?.trim() || null,
        nombre_etages: plotData.nombre_etages || 10,
        ordre: nextOrdre
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating plot:', insertError)
      return { data: null, error: insertError }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in createPlot:', err)
    return { data: null, error: err }
  }
}

/**
 * Update a plot
 * @param {string} plotId - Plot ID
 * @param {Object} plotData - Plot data to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updatePlot(plotId, plotData) {
  try {
    const updateData = {}

    if (plotData.nom !== undefined) {
      if (!plotData.nom || plotData.nom.trim().length === 0) {
        return {
          data: null,
          error: new Error('Le nom est obligatoire')
        }
      }
      updateData.nom = plotData.nom.trim()
    }

    if (plotData.type !== undefined) {
      updateData.type = plotData.type
    }

    if (plotData.description !== undefined) {
      updateData.description = plotData.description?.trim() || null
    }

    if (plotData.ordre !== undefined) {
      updateData.ordre = plotData.ordre
    }

    // Option A: Validate nombre_etages before updating
    if (plotData.nombre_etages !== undefined) {
      const nouveauNombreEtages = parseInt(plotData.nombre_etages)

      // Check if any appartements exist with etage > nouveauNombreEtages
      const { data: appartementsAuDela, error: checkError } = await supabase
        .from('appartements')
        .select('etage')
        .eq('plot_id', plotId)
        .gt('etage', nouveauNombreEtages)
        .limit(1)

      if (checkError) {
        console.error('Error checking appartements etages:', checkError)
        return { data: null, error: checkError }
      }

      if (appartementsAuDela && appartementsAuDela.length > 0) {
        const maxEtage = appartementsAuDela[0].etage
        return {
          data: null,
          error: new Error(`Impossible de réduire le nombre d'étages à ${nouveauNombreEtages} car des appartements existent à l'étage ${maxEtage} ou au-delà. Veuillez d'abord supprimer ces appartements.`)
        }
      }

      updateData.nombre_etages = nouveauNombreEtages
    }

    const { data, error: updateError } = await supabase
      .from('plots')
      .update(updateData)
      .eq('id', plotId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating plot:', updateError)
      return { data: null, error: updateError }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception in updatePlot:', err)
    return { data: null, error: err }
  }
}

/**
 * Delete a plot (will cascade delete all appartements and their tasks)
 * @param {string} plotId - Plot ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deletePlot(plotId) {
  try {
    const { error: deleteError } = await supabase
      .from('plots')
      .delete()
      .eq('id', plotId)

    if (deleteError) {
      console.error('Error deleting plot:', deleteError)
      return { success: false, error: deleteError }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Exception in deletePlot:', err)
    return { success: false, error: err }
  }
}
