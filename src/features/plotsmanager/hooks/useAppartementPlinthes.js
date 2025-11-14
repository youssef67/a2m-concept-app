/**
 * useAppartementPlinthes.js
 * Hook personnalisé pour gérer les plinthes d'un appartement
 */

import { useState, useCallback } from 'react'
import { getPlinthes, upsertPlinthes } from '../services/plinthesService'

/**
 * Hook pour gérer les plinthes d'un appartement
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Object} - État et fonctions de gestion des plinthes
 */
export function useAppartementPlinthes(appartementId) {
  const [plinthes, setPlinthes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Charger les informations plinthes de l'appartement
   */
  const loadPlinthes = useCallback(async () => {
    if (!appartementId) {
      setError('ID appartement manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getPlinthes(appartementId)

    if (fetchError) {
      console.error('[useAppartementPlinthes] loadPlinthes error:', fetchError)
      setError('Erreur lors du chargement des plinthes')
      setPlinthes(null)
    } else {
      setPlinthes(data)
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Sauvegarder les informations plinthes (créer ou mettre à jour)
   * @param {Object} plinthesData - Données plinthes à sauvegarder
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const savePlinthes = async (plinthesData) => {
    if (!appartementId) {
      return { success: false, data: null, error: new Error('ID appartement manquant') }
    }

    setLoading(true)
    setError(null)

    const result = await upsertPlinthes(appartementId, plinthesData)

    if (result.success) {
      // Recharger les données après sauvegarde
      setPlinthes(result.data)
    } else {
      setError('Erreur lors de la sauvegarde des plinthes')
    }

    setLoading(false)
    return result
  }

  return {
    plinthes,
    loading,
    error,
    loadPlinthes,
    savePlinthes
  }
}
