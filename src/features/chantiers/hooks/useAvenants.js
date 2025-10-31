/**
 * useAvenants Hook
 * Hook for managing chantier avenants state
 */

import { useState, useCallback } from 'react'
import {
  getAvenantsByChantier,
  createAvenant,
  updateAvenant,
  deleteAvenant
} from '../services/avenantsService'

export function useAvenants(chantierId) {
  const [avenants, setAvenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load avenants for the current chantier
   */
  const loadAvenants = useCallback(async () => {
    if (!chantierId) {
      setAvenants([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAvenantsByChantier(chantierId)

    if (fetchError) {
      setError('Erreur lors du chargement des avenants')
      setAvenants([])
    } else {
      setAvenants(data || [])
    }

    setLoading(false)
  }, [chantierId])

  /**
   * Add a new avenant
   * @param {number} montantHT - Montant HT
   * @param {string} description - Description (optional)
   * @returns {Promise<{success: boolean, data: Object|null}>}
   */
  const addAvenant = async (montantHT, description = '') => {
    if (!chantierId) {
      return { success: false, data: null }
    }

    setLoading(true)
    setError(null)

    const { data, error: createError } = await createAvenant(
      chantierId,
      montantHT,
      description
    )

    if (createError) {
      setError('Erreur lors de la création de l\'avenant')
      setLoading(false)
      return { success: false, data: null }
    }

    // Reload avenants to get fresh data
    await loadAvenants()

    return { success: true, data }
  }

  /**
   * Update an existing avenant
   * @param {string} avenantId - Avenant ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{success: boolean, data: Object|null}>}
   */
  const modifyAvenant = async (avenantId, updates) => {
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updateAvenant(avenantId, updates)

    if (updateError) {
      setError('Erreur lors de la modification de l\'avenant')
      setLoading(false)
      return { success: false, data: null }
    }

    // Reload avenants to get fresh data
    await loadAvenants()

    return { success: true, data }
  }

  /**
   * Delete an avenant
   * @param {string} avenantId - Avenant ID
   * @returns {Promise<{success: boolean}>}
   */
  const removeAvenant = async (avenantId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deleteAvenant(avenantId)

    if (deleteError) {
      setError('Erreur lors de la suppression de l\'avenant')
      setLoading(false)
      return { success: false }
    }

    // Reload avenants to get fresh data
    await loadAvenants()

    return { success }
  }

  return {
    avenants,
    loading,
    error,
    loadAvenants,
    addAvenant,
    modifyAvenant,
    removeAvenant
  }
}
