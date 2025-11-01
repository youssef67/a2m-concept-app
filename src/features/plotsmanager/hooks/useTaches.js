/**
 * useTaches Hook
 * Hook for managing chantier taches (tasks) state
 */

import { useState, useCallback } from 'react'
import {
  getTachesByChantier,
  saveTaches as saveTachesService
} from '../services/tachesService'

export function useTaches(chantierId) {
  const [taches, setTaches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load taches for the current chantier
   */
  const loadTaches = useCallback(async () => {
    if (!chantierId) {
      setTaches([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getTachesByChantier(chantierId)

    if (fetchError) {
      setError('Erreur lors du chargement des tâches')
      setTaches([])
    } else {
      setTaches(data || [])
    }

    setLoading(false)
  }, [chantierId])

  /**
   * Save all taches for the chantier (batch operation)
   * Replaces all existing taches with new data
   * @param {Array} tachesData - Array of tache objects {intitule, statut}
   * @returns {Promise<{success: boolean, data: Array|null, error: Error|null}>}
   */
  const saveTaches = async (tachesData) => {
    if (!chantierId) {
      return { success: false, data: null, error: new Error('Chantier ID manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: saveError } = await saveTachesService(
      chantierId,
      tachesData
    )

    if (saveError) {
      setError(saveError.message || 'Erreur lors de la sauvegarde des tâches')
      setLoading(false)
      return { success: false, data: null, error: saveError }
    }

    // Update local state with new data
    setTaches(data || [])
    setLoading(false)

    return { success: true, data, error: null }
  }

  return {
    taches,
    loading,
    error,
    loadTaches,
    saveTaches
  }
}
