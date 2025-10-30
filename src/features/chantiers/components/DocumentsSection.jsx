/**
 * DocumentsSection Component
 * Section for managing PDF documents within a chantier
 */

import React, { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import Alert from '../../../shared/components/ui/Alert'
import DocumentItem from './DocumentItem'
import DocumentUploadModal from './DocumentUploadModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { useChantierDocuments } from '../hooks/useChantierDocuments'

export default function DocumentsSection({ chantierId }) {
  const {
    documents,
    loading,
    error,
    uploading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl
  } = useChantierDocuments(chantierId)

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  /**
   * Handle document upload
   */
  const handleUpload = async (file) => {
    const result = await uploadDocument(file)

    if (result.success) {
      setShowUploadModal(false)
    }

    return result
  }

  /**
   * Handle document download
   */
  const handleDownload = async (document) => {
    const { data: url, error } = await getDocumentUrl(document.storage_path)

    if (error || !url) {
      console.error('Error getting document URL:', error)
      return
    }

    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /**
   * Handle delete click
   */
  const handleDeleteClick = (document) => {
    setSelectedDocument(document)
    setShowDeleteModal(true)
    setDeleteError(null)
  }

  /**
   * Confirm delete
   */
  const handleConfirmDelete = async () => {
    if (!selectedDocument) return

    const { success, error } = await deleteDocument(selectedDocument.id)

    if (success) {
      setShowDeleteModal(false)
      setSelectedDocument(null)
    } else {
      setDeleteError(error?.message || 'Erreur lors de la suppression')
    }
  }

  /**
   * Cancel delete
   */
  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setSelectedDocument(null)
    setDeleteError(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Documents
          </h3>
          {!loading && (
            <span className="text-sm text-gray-500">
              ({documents.length})
            </span>
          )}
        </div>

        <Button
          variant="primary"
          onClick={() => setShowUploadModal(true)}
          className="h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          {error.message || 'Erreur lors du chargement des documents'}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}

      {/* Documents List */}
      {!loading && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((document) => (
            <DocumentItem
              key={document.id}
              document={document}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base text-gray-600 font-medium mb-1">
            Aucun document
          </p>
          <p className="text-sm text-gray-500">
            Ajoutez des documents PDF pour ce chantier
          </p>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer le document"
        message={
          selectedDocument
            ? `Êtes-vous sûr de vouloir supprimer "${selectedDocument.nom_fichier}" ? Cette action est irréversible.`
            : ''
        }
        error={deleteError}
      />
    </div>
  )
}
