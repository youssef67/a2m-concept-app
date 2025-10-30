/**
 * usePaiements Hook
 * Manages payment operations for a facture
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getPaiementsByFacture,
  createPaiement as createPaiementService,
  updatePaiement as updatePaiementService,
  deletePaiement as deletePaiementService
} from '../services/paiementsService'

export function usePaiements(factureId, factureMontant) {
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading] = useState(false)
  const [montantPaye, setMontantPaye] = useState(0)
  const [montantRestant, setMontantRestant] = useState(0)

  /**
   * Load paiements for the facture
   */
  const loadPaiements = useCallback(async () => {
    if (!factureId) return

    setLoading(true)
    const { data, error } = await getPaiementsByFacture(factureId)

    if (!error && data) {
      setPaiements(data)
    }

    setLoading(false)
  }, [factureId])

  /**
   * Calculate montant_paye and montant_restant
   */
  useEffect(() => {
    const total = paiements.reduce((sum, p) => sum + parseFloat(p.montant), 0)
    setMontantPaye(total)
    setMontantRestant(parseFloat(factureMontant || 0) - total)
  }, [paiements, factureMontant])

  /**
   * Create a new paiement
   */
  const createPaiement = async (paiementData) => {
    const result = await createPaiementService({
      ...paiementData,
      facture_id: factureId
    })

    if (result.success) {
      // Add to local state
      setPaiements(prev => [result.data, ...prev])
    }

    return result
  }

  /**
   * Update a paiement
   */
  const updatePaiement = async (paiementId, paiementData) => {
    const result = await updatePaiementService(paiementId, paiementData)

    if (result.success) {
      // Update local state
      setPaiements(prev =>
        prev.map(p => p.id === paiementId ? result.data : p)
      )
    }

    return result
  }

  /**
   * Delete a paiement
   */
  const deletePaiement = async (paiementId) => {
    const result = await deletePaiementService(paiementId)

    if (result.success) {
      // Remove from local state
      setPaiements(prev => prev.filter(p => p.id !== paiementId))
    }

    return result
  }

  /**
   * Refresh paiements list
   */
  const refreshPaiements = () => {
    loadPaiements()
  }

  // Load paiements when factureId changes
  useEffect(() => {
    loadPaiements()
  }, [loadPaiements])

  return {
    paiements,
    loading,
    montantPaye,
    montantRestant,
    createPaiement,
    updatePaiement,
    deletePaiement,
    refreshPaiements
  }
}
