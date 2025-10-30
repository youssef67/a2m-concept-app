/**
 * useChantierDocuments Hook - Manage chantier documents state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getChantierDocuments,
  uploadDocument as uploadDocumentAPI,
  deleteDocument as deleteDocumentAPI,
  getDocumentUrl
} from '../services/documentsService'

/**
 * Custom hook for managing chantier documents
 * @param {string} chantierId - UUID of the chantier
 * @returns {Object} Documents state and CRUD methods
 */
export function useChantierDocuments(chantierId) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)

  /**
   * Fetch documents from API
   */
  const fetchDocuments = useCallback(async () => {
    if (!chantierId) {
      setDocuments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getChantierDocuments(chantierId)

    if (fetchError) {
      setError(fetchError)
      setDocuments([])
    } else {
      setDocuments(data || [])
    }

    setLoading(false)
  }, [chantierId])

  /**
   * Initial fetch on mount or chantierId change
   */
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  /**
   * Upload a new document
   * @param {File} file - PDF file to upload
   * @returns {Promise<{success: boolean, data: Object|null, error: any}>}
   */
  const uploadDocument = async (file) => {
    setUploading(true)
    setError(null)

    const { data, error } = await uploadDocumentAPI(chantierId, file)

    if (error) {
      setError(error)
      setUploading(false)
      return { success: false, data: null, error }
    }

    // Optimistic UI update
    setDocuments(prev => [data, ...prev])
    setUploading(false)

    return { success: true, data, error: null }
  }

  /**
   * Delete a document
   * @param {string} documentId - UUID of the document
   * @returns {Promise<{success: boolean, error: any}>}
   */
  const deleteDocument = async (documentId) => {
    const { success, error } = await deleteDocumentAPI(documentId)

    if (!success || error) {
      setError(error)
      return { success: false, error }
    }

    // Optimistic UI update
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setError(null)

    return { success: true, error: null }
  }

  /**
   * Get document public URL
   * @param {string} storagePath - Storage path
   * @returns {Promise<{data: string|null, error: any}>}
   */
  const getUrl = async (storagePath) => {
    return await getDocumentUrl(storagePath)
  }

  /**
   * Refresh documents data
   */
  const refetch = () => {
    fetchDocuments()
  }

  return {
    documents,
    loading,
    error,
    uploading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl: getUrl,
    refetch
  }
}
