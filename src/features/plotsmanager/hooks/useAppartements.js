/**
 * useAppartements Hook
 * Hook for managing appartements state
 */

import { useState, useCallback } from 'react'
import {
  getAppartementsByPlot,
  getAppartementTaches,
  createAppartementWithTaches,
  updateAppartement as updateAppartementService,
  updateAppartementTacheStatut as updateTacheStatutService,
  deleteAppartement as deleteAppartementService
} from '../services/appartementsService'

export function useAppartements(plotId, chantierId = null) {
  const [appartements, setAppartements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load appartements for the current plot
   */
  const loadAppartements = useCallback(async () => {
    if (!plotId) {
      setAppartements([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAppartementsByPlot(plotId)

    if (fetchError) {
      setError('Erreur lors du chargement des appartements')
      setAppartements([])
    } else {
      setAppartements(data || [])
    }

    setLoading(false)
  }, [plotId])

  /**
   * Create a new appartement with inherited tasks
   * @param {Object} appartementData - Appartement data {nom}
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const createAppartement = async (appartementData) => {
    if (!plotId) {
      return { success: false, data: null, error: new Error('Plot ID manquant') }
    }

    if (!chantierId) {
      return { success: false, data: null, error: new Error('Chantier ID manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: createError } = await createAppartementWithTaches(
      plotId,
      chantierId,
      appartementData
    )

    if (createError) {
      setError(createError.message || 'Erreur lors de la création de l\'appartement')
      setLoading(false)
      return { success: false, data: null, error: createError }
    }

    // Refresh appartements list
    await loadAppartements()

    return { success: true, data, error: null }
  }

  /**
   * Update an appartement
   * @param {string} appartementId - Appartement ID
   * @param {Object} appartementData - Data to update
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const updateAppartement = async (appartementId, appartementData) => {
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updateAppartementService(
      appartementId,
      appartementData
    )

    if (updateError) {
      setError(updateError.message || 'Erreur lors de la mise à jour de l\'appartement')
      setLoading(false)
      return { success: false, data: null, error: updateError }
    }

    // Refresh appartements list
    await loadAppartements()

    return { success: true, data, error: null }
  }

  /**
   * Delete an appartement
   * @param {string} appartementId - Appartement ID
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deleteAppartement = async (appartementId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deleteAppartementService(appartementId)

    if (!success) {
      setError(deleteError?.message || 'Erreur lors de la suppression de l\'appartement')
      setLoading(false)
      return { success: false, error: deleteError }
    }

    // Refresh appartements list
    await loadAppartements()

    return { success: true, error: null }
  }

  return {
    appartements,
    loading,
    error,
    loadAppartements,
    createAppartement,
    updateAppartement,
    deleteAppartement
  }
}

/**
 * useAppartementTaches Hook
 * Hook for managing appartement tasks state
 */
export function useAppartementTaches(appartementId) {
  const [taches, setTaches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load tasks for the current appartement
   */
  const loadTaches = useCallback(async () => {
    if (!appartementId) {
      setTaches([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAppartementTaches(appartementId)

    if (fetchError) {
      setError('Erreur lors du chargement des tâches')
      setTaches([])
    } else {
      setTaches(data || [])
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Update task status
   * @param {string} tacheId - Task ID
   * @param {string} statut - New status
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const updateTacheStatut = async (tacheId, statut) => {
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updateTacheStatutService(tacheId, statut)

    if (updateError) {
      setError(updateError.message || 'Erreur lors de la mise à jour du statut')
      setLoading(false)
      return { success: false, error: updateError }
    }

    // Refresh tasks list
    await loadTaches()

    return { success: true, error: null }
  }

  return {
    taches,
    loading,
    error,
    loadTaches,
    updateTacheStatut
  }
}
