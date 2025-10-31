/**
 * useFactures Hook
 * Manages factures data and operations
 */

import { useState, useEffect } from 'react'
import {
  getAllFactures,
  createFacture as createFactureService,
  updateFacture as updateFactureService,
  deleteFacture as deleteFactureService,
  deleteMultipleFactures as deleteMultipleFacturesService
} from '../services/facturesService'

export function useFactures() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Load factures from Supabase
   */
  const loadFactures = async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAllFactures()

    if (fetchError) {
      setError('Erreur lors du chargement des factures')
      setFactures([])
    } else {
      setFactures(data || [])
    }

    setLoading(false)
  }

  /**
   * Create a new facture
   */
  const createFacture = async (factureData) => {
    const result = await createFactureService(factureData)

    if (result.success) {
      // Add to local state
      setFactures(prev => [result.data, ...prev])
    }

    return result
  }

  /**
   * Update an existing facture
   */
  const updateFacture = async (factureId, factureData) => {
    const result = await updateFactureService(factureId, factureData)

    if (result.success) {
      // Update in local state
      setFactures(prev =>
        prev.map(f => (f.id === factureId ? result.data : f))
      )
    }

    return result
  }

  /**
   * Delete a facture
   */
  const deleteFacture = async (factureId) => {
    const result = await deleteFactureService(factureId)

    if (result.success) {
      // Remove from local state
      setFactures(prev => prev.filter(f => f.id !== factureId))
    }

    return result
  }

  /**
   * Delete multiple factures
   */
  const deleteMultipleFactures = async (facturesData) => {
    const result = await deleteMultipleFacturesService(facturesData)

    if (result.deleted.length > 0) {
      // Remove successfully deleted factures from local state
      const deletedIds = result.deleted.map(d => d.factureId)
      setFactures(prev => prev.filter(f => !deletedIds.includes(f.id)))
    }

    return result
  }

  /**
   * Refresh factures
   */
  const refreshFactures = () => {
    loadFactures()
  }

  // Load factures on mount
  useEffect(() => {
    loadFactures()
  }, [])

  return {
    factures,
    loading,
    error,
    createFacture,
    updateFacture,
    deleteFacture,
    deleteMultipleFactures,
    refreshFactures
  }
}
