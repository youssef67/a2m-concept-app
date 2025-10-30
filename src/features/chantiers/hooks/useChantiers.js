/**
 * useChantiers Hook - Manage chantiers state and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAllChantiers,
  getChantierById,
  createChantier as createChantierAPI,
  updateChantier as updateChantierAPI,
  deleteChantier as deleteChantierAPI
} from '../services/chantiersService'

/**
 * Custom hook for managing chantiers
 * @param {string|null} statut - Optional filter by statut
 * @returns {Object} Chantiers state and CRUD methods
 */
export function useChantiers(statut = null) {
  const [chantiers, setChantiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch chantiers from API
   */
  const fetchChantiers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAllChantiers(statut)

    if (fetchError) {
      setError(fetchError)
      setChantiers([])
    } else {
      setChantiers(data || [])
    }

    setLoading(false)
  }, [statut])

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchChantiers()
  }, [fetchChantiers])

  /**
   * Get a single chantier by ID
   * @param {string} chantierId - UUID of the chantier
   * @returns {Promise<Object|null>} Chantier object or null
   */
  const getChantier = async (chantierId) => {
    const { data, error } = await getChantierById(chantierId)

    if (error) {
      console.error('Error getting chantier:', error)
      return null
    }

    return data
  }

  /**
   * Create a new chantier
   * @param {Object} chantierData - Chantier data
   * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
   */
  const createChantier = async (chantierData) => {
    const { data, error } = await createChantierAPI(chantierData)

    if (error) {
      setError(error)
      return { success: false, data: null, error }
    }

    // Optimistic UI update
    setChantiers(prev => [data, ...prev])
    setError(null)

    return { success: true, data, error: null }
  }

  /**
   * Update an existing chantier
   * @param {string} chantierId - UUID of the chantier
   * @param {Object} chantierData - Updated chantier data
   * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
   */
  const updateChantier = async (chantierId, chantierData) => {
    const { data, error } = await updateChantierAPI(chantierId, chantierData)

    if (error) {
      setError(error)
      return { success: false, data: null, error }
    }

    // Optimistic UI update
    setChantiers(prev =>
      prev.map(chantier => (chantier.id === chantierId ? data : chantier))
    )
    setError(null)

    return { success: true, data, error: null }
  }

  /**
   * Delete a chantier
   * @param {string} chantierId - UUID of the chantier
   * @returns {Promise<{success: boolean, error: any}>}
   */
  const deleteChantier = async (chantierId) => {
    const { success, error } = await deleteChantierAPI(chantierId)

    if (!success || error) {
      setError(error)
      return { success: false, error }
    }

    // Optimistic UI update
    setChantiers(prev => prev.filter(chantier => chantier.id !== chantierId))
    setError(null)

    return { success: true, error: null }
  }

  /**
   * Refresh chantiers data
   */
  const refetch = () => {
    fetchChantiers()
  }

  return {
    chantiers,
    loading,
    error,
    refetch,
    getChantier,
    createChantier,
    updateChantier,
    deleteChantier
  }
}
