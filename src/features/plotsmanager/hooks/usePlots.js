/**
 * usePlots Hook
 * Hook for managing plots state
 */

import { useState, useCallback } from 'react'
import {
  getPlotsByChantier,
  createPlot as createPlotService,
  updatePlot as updatePlotService,
  deletePlot as deletePlotService
} from '../services/plotsService'

export function usePlots(chantierId) {
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load plots for the current chantier
   */
  const loadPlots = useCallback(async () => {
    if (!chantierId) {
      setPlots([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPlotsByChantier(chantierId)

    if (fetchError) {
      setError('Erreur lors du chargement des plots')
      setPlots([])
    } else {
      setPlots(data || [])
    }

    setLoading(false)
  }, [chantierId])

  /**
   * Create a new plot
   * @param {Object} plotData - Plot data {nom, type, description}
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const createPlot = async (plotData) => {
    if (!chantierId) {
      return { success: false, data: null, error: new Error('Chantier ID manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: createError } = await createPlotService(chantierId, plotData)

    if (createError) {
      setError(createError.message || 'Erreur lors de la création du plot')
      setLoading(false)
      return { success: false, data: null, error: createError }
    }

    // Refresh plots list
    await loadPlots()

    return { success: true, data, error: null }
  }

  /**
   * Update a plot
   * @param {string} plotId - Plot ID
   * @param {Object} plotData - Data to update
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const updatePlot = async (plotId, plotData) => {
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updatePlotService(plotId, plotData)

    if (updateError) {
      setError(updateError.message || 'Erreur lors de la mise à jour du plot')
      setLoading(false)
      return { success: false, data: null, error: updateError }
    }

    // Refresh plots list
    await loadPlots()

    return { success: true, data, error: null }
  }

  /**
   * Delete a plot
   * @param {string} plotId - Plot ID
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deletePlot = async (plotId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deletePlotService(plotId)

    if (!success) {
      setError(deleteError?.message || 'Erreur lors de la suppression du plot')
      setLoading(false)
      return { success: false, error: deleteError }
    }

    // Refresh plots list
    await loadPlots()

    return { success: true, error: null }
  }

  return {
    plots,
    loading,
    error,
    loadPlots,
    createPlot,
    updatePlot,
    deletePlot
  }
}
