/**
 * DocumentUploadModal Component
 * Modal for uploading PDF documents with preview
 */

import React, { useState, useEffect } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Alert from '../../../shared/components/ui/Alert'
import { validatePDFFile, formatFileSize } from '../services/documentsService'

export default function DocumentUploadModal({ isOpen, onClose, onUpload, uploading }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)

  /**
   * Cleanup preview URL on unmount
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setError(null)
    }
  }, [isOpen, previewUrl])

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validatePDFFile(file)
    if (!validation.valid) {
      setError(validation.error)
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)

    setSelectedFile(file)
    setPreviewUrl(url)
    setError(null)
  }

  /**
   * Handle upload
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    const result = await onUpload(selectedFile)

    if (result.success) {
      handleClose()
    } else {
      setError(result.error?.message || 'Erreur lors de l\'upload')
    }
  }

  /**
   * Handle close
   */
  const handleClose = () => {
    if (!uploading) {
      onClose()
    }
  }

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ajouter un document"
      size="xl"
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* File Input */}
        {!selectedFile && (
          <div>
            <label
              htmlFor="document-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="mb-2 text-sm text-gray-700 font-medium">
                  Cliquez pour sélectionner un PDF
                </p>
                <p className="text-xs text-gray-500">
                  ou glissez-déposez le fichier ici
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF uniquement · Maximum 10 MB
                </p>
              </div>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* Selected File + Preview */}
        {selectedFile && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>

              {!uploading && (
                <button
                  onClick={handleRemoveFile}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Retirer le fichier"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* PDF Preview */}
            {previewUrl && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  src={previewUrl}
                  className="w-full h-96 md:h-[600px]"
                  title="Prévisualisation PDF"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Annuler
          </Button>

          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            loading={uploading}
          >
            {uploading ? 'Upload en cours...' : 'Ajouter le document'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
