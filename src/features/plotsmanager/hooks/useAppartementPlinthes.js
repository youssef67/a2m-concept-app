/**
 * useAppartementPlinthes.js
 * Hook personnalisé pour gérer les plinthes d'un appartement (multi-pièces)
 */

import { useState, useCallback } from 'react'
import { getPlinthes, upsertPlinthes, deletePlinthes } from '../services/plinthesService'

/**
 * Hook pour gérer les plinthes d'un appartement (avec support multi-pièces)
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Object} - État et fonctions de gestion des plinthes
 */
export function useAppartementPlinthes(appartementId) {
  const [plinthes, setPlinthes] = useState([]) // Array au lieu d'un objet unique
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Charger toutes les configurations de plinthes de l'appartement
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
      setPlinthes([])
    } else {
      setPlinthes(data || [])
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Sauvegarder les informations plinthes pour une pièce donnée (créer ou mettre à jour)
   * @param {string} piece - Nom de la pièce
   * @param {Object} plinthesData - Données plinthes à sauvegarder
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const savePlinthes = async (piece, plinthesData) => {
    if (!appartementId) {
      return { success: false, data: null, error: new Error('ID appartement manquant') }
    }

    if (!piece) {
      return { success: false, data: null, error: new Error('Nom de pièce manquant') }
    }

    setLoading(true)
    setError(null)

    const result = await upsertPlinthes(appartementId, piece, plinthesData)

    if (result.success) {
      // Recharger toutes les données après sauvegarde
      await loadPlinthes()
    } else {
      setError('Erreur lors de la sauvegarde des plinthes')
    }

    setLoading(false)
    return result
  }

  /**
   * Supprimer une configuration de plinthes pour une pièce donnée
   * @param {string} piece - Nom de la pièce à supprimer
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const removePlinthes = async (piece) => {
    if (!appartementId) {
      return { success: false, error: new Error('ID appartement manquant') }
    }

    if (!piece) {
      return { success: false, error: new Error('Nom de pièce manquant') }
    }

    setLoading(true)
    setError(null)

    const result = await deletePlinthes(appartementId, piece)

    if (result.success) {
      // Recharger toutes les données après suppression
      await loadPlinthes()
    } else {
      setError('Erreur lors de la suppression des plinthes')
    }

    setLoading(false)
    return result
  }

  return {
    plinthes, // Array de configurations (une par pièce)
    loading,
    error,
    loadPlinthes,
    savePlinthes,
    removePlinthes
  }
}
