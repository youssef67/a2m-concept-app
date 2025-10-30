/**
 * useDocuments Hook
 * Manages document operations for factures
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument
} from '../services/documentService'

export function useDocuments(factureId) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  /**
   * Load documents for the facture
   */
  const loadDocuments = useCallback(async () => {
    if (!factureId) return

    setLoading(true)
    const result = await getDocuments(factureId)

    if (result.success) {
      setDocuments(result.data)
    }

    setLoading(false)
  }, [factureId])

  /**
   * Upload a new document
   */
  const upload = async (file) => {
    if (!factureId) {
      return { success: false, error: 'Facture ID manquant' }
    }

    setUploading(true)
    const result = await uploadDocument(factureId, file)

    if (result.success) {
      // Add new document to list
      setDocuments(prev => [result.data, ...prev])
    }

    setUploading(false)
    return result
  }

  /**
   * Get download URL for a document
   */
  const download = async (storagePath) => {
    const result = await downloadDocument(storagePath)
    return result
  }

  /**
   * Delete a document
   */
  const remove = async (documentId, storagePath) => {
    const result = await deleteDocument(documentId, storagePath)

    if (result.success) {
      // Remove from list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    }

    return result
  }

  /**
   * Refresh documents list
   */
  const refresh = () => {
    loadDocuments()
  }

  // Load documents when factureId changes
  useEffect(() => {
    loadDocuments()
  }, [factureId, loadDocuments])

  return {
    documents,
    loading,
    uploading,
    upload,
    download,
    remove,
    refresh
  }
}
