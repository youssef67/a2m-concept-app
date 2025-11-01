/**
 * useAppartementDocuments Hook
 * Custom hook for managing documents for an appartement
 */

import { useState, useCallback } from 'react'
import {
  getAppartementDocumentsWithStatus,
  uploadDocument as uploadDocumentService,
  deleteDocument as deleteDocumentService,
  getDocumentUrl
} from '../services/appartementDocumentsService'

/**
 * Hook to manage documents for an appartement
 * @param {string} appartementId - Appartement ID
 * @param {string} chantierId - Chantier ID
 * @returns {Object} - { documentsWithStatus, loading, error, loadDocuments, uploadDocument, deleteDocument, viewDocument }
 */
export function useAppartementDocuments(appartementId, chantierId) {
  const [documentsWithStatus, setDocumentsWithStatus] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load documents with status for the appartement
   */
  const loadDocuments = useCallback(async () => {
    if (!appartementId || !chantierId) {
      setError('ID de l\'appartement ou du chantier manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAppartementDocumentsWithStatus(
      appartementId,
      chantierId
    )

    if (fetchError) {
      setError('Erreur lors du chargement des documents')
      setDocumentsWithStatus([])
    } else {
      setDocumentsWithStatus(data || [])
    }

    setLoading(false)
  }, [appartementId, chantierId])

  /**
   * Upload a document for a required document
   * @param {string} documentRequisId - UUID of the required document
   * @param {File} file - File to upload
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const uploadDocument = async (documentRequisId, file) => {
    if (!appartementId) {
      return { success: false, error: new Error('ID de l\'appartement manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: uploadError } = await uploadDocumentService(
      appartementId,
      documentRequisId,
      file
    )

    if (uploadError) {
      setError('Erreur lors de l\'upload du document')
      setLoading(false)
      return { success: false, error: uploadError }
    }

    // Reload documents after successful upload
    await loadDocuments()

    setLoading(false)
    return { success: true, data, error: null }
  }

  /**
   * Delete a document
   * @param {string} documentId - UUID of the document to delete
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deleteDocument = async (documentId) => {
    setLoading(true)
    setError(null)

    const { success, error: deleteError } = await deleteDocumentService(documentId)

    if (!success) {
      setError('Erreur lors de la suppression du document')
      setLoading(false)
      return { success: false, error: deleteError }
    }

    // Reload documents after successful deletion
    await loadDocuments()

    setLoading(false)
    return { success: true, error: null }
  }

  /**
   * View/download a document (get public URL)
   * @param {string} storagePath - Storage path of the document
   * @returns {Promise<{url: string|null, error: Error|null}>}
   */
  const viewDocument = async (storagePath) => {
    const { data: url, error: urlError } = await getDocumentUrl(storagePath)

    if (urlError) {
      setError('Erreur lors de l\'ouverture du document')
      return { url: null, error: urlError }
    }

    return { url, error: null }
  }

  /**
   * Calculate statistics
   */
  const stats = {
    total: documentsWithStatus.length,
    uploaded: documentsWithStatus.filter((doc) => doc.uploadedFile !== null).length,
    pending: documentsWithStatus.filter((doc) => doc.uploadedFile === null).length
  }

  return {
    documentsWithStatus,
    stats,
    loading,
    error,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    viewDocument
  }
}
