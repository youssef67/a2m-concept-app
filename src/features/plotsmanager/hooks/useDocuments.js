/**
 * useDocuments Hook
 * Custom hook for managing required documents for a chantier
 */

import { useState, useCallback } from 'react'
import { getDocumentsByChantier, saveDocuments as saveDocumentsService } from '../services/documentsService'

/**
 * Hook to manage documents for a chantier
 * @param {string} chantierId - Chantier ID
 * @returns {Object} - { documents, loading, error, loadDocuments, saveDocuments }
 */
export function useDocuments(chantierId) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load documents for the chantier
   */
  const loadDocuments = useCallback(async () => {
    if (!chantierId) {
      setError('ID du chantier manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getDocumentsByChantier(chantierId)

    if (fetchError) {
      setError('Erreur lors du chargement des documents')
      setDocuments([])
    } else {
      setDocuments(data || [])
    }

    setLoading(false)
  }, [chantierId])

  /**
   * Save documents for the chantier (replace all)
   * @param {Array<{nom_document: string}>} documentsData - Array of documents
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const saveDocuments = async (documentsData) => {
    if (!chantierId) {
      return { success: false, error: new Error('ID du chantier manquant') }
    }

    setLoading(true)
    setError(null)

    const result = await saveDocumentsService(chantierId, documentsData)

    if (result.success) {
      // Reload documents after save
      await loadDocuments()
    } else {
      setError('Erreur lors de la sauvegarde des documents')
    }

    setLoading(false)

    return result
  }

  return {
    documents,
    loading,
    error,
    loadDocuments,
    saveDocuments
  }
}
