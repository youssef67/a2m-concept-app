/**
 * Plots Service
 * Service for managing plots (immeubles/structures) within a chantier
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Get all plots for a specific chantier with appartement count
 * @param {string} chantierId - Chantier ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getPlotsByChantier(chantierId) {
  try {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        appartements (count)
      `)
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: true })

    if (error) {
      console.error('Error fetching plots:', error)
      return { data: null, error }
    }

    // Transform data to include appartement count
    const transformedData = (data || []).map(plot => ({
      ...plot,
      appartements_count: plot.appartements?.[0]?.count || 0
    }))

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
    const { data, error: insertError } = await supabase
      .from('plots')
      .insert({
        chantier_id: chantierId,
        nom: plotData.nom.trim(),
        type: plotData.type || 'immeuble',
        description: plotData.description?.trim() || null,
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
