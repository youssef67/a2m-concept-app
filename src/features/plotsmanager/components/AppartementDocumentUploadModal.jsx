/**
 * AppartementDocumentUploadModal Component
 * Modal for uploading documents (PDF or images) for a required document
 */

import React, { useState, useEffect } from 'react'
import { Upload, FileText, Image as ImageIcon, Camera, X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Select from '../../../shared/components/ui/Select'
import Alert from '../../../shared/components/ui/Alert'
import { validateFile, formatFileSize, isPDF } from '../services/appartementDocumentsService'

export default function AppartementDocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  uploading,
  documentsRequis,
  selectedDocumentRequisId = null
}) {
  const [documentRequisId, setDocumentRequisId] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)

  /**
   * Initialize selected document if provided
   */
  useEffect(() => {
    if (isOpen && selectedDocumentRequisId) {
      setDocumentRequisId(selectedDocumentRequisId)
    }
  }, [isOpen, selectedDocumentRequisId])

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
      setDocumentRequisId(selectedDocumentRequisId || '')
      setSelectedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setError(null)
    }
  }, [isOpen, previewUrl, selectedDocumentRequisId])

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateFile(file)
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
    if (!documentRequisId) {
      setError('Veuillez sélectionner un document')
      return
    }

    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    const result = await onUpload(documentRequisId, selectedFile)

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

  // Convert documents requis to select options
  const selectOptions = (documentsRequis || []).map((doc) => ({
    value: doc.id,
    label: doc.nom_document
  }))

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

        {/* Select required document */}
        {!selectedDocumentRequisId && (
          <div>
            <label htmlFor="document-requis" className="block text-sm font-medium text-gray-700 mb-2">
              Document à ajouter <span className="text-red-500">*</span>
            </label>
            <Select
              id="document-requis"
              value={documentRequisId}
              onChange={setDocumentRequisId}
              options={selectOptions}
              placeholder="Sélectionnez un document"
              disabled={uploading}
            />
          </div>
        )}

        {/* Info about selected document */}
        {selectedDocumentRequisId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Document :</strong> {documentsRequis?.find(d => d.id === selectedDocumentRequisId)?.nom_document}
            </p>
          </div>
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
                  Cliquez pour sélectionner un fichier
                </p>
                <p className="text-xs text-gray-500">
                  ou glissez-déposez le fichier ici
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, JPEG ou PNG · Maximum 10 MB
                </p>
              </div>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {/* Camera button for mobile */}
            <div className="mt-3 sm:hidden">
              <label
                htmlFor="camera-upload"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-primary-300 rounded-lg cursor-pointer bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                <Camera className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Prendre une photo</span>
              </label>
              <input
                id="camera-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>
        )}

        {/* Selected File + Preview */}
        {selectedFile && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isPDF(selectedFile.type) ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {isPDF(selectedFile.type) ? (
                    <FileText className={`w-5 h-5 ${isPDF(selectedFile.type) ? 'text-red-600' : 'text-blue-600'}`} />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)} • {isPDF(selectedFile.type) ? 'PDF' : 'Image'}
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

            {/* Preview */}
            {previewUrl && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                {isPDF(selectedFile.type) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-96 md:h-[600px]"
                    title="Prévisualisation PDF"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Prévisualisation"
                    className="w-full h-auto max-h-[600px] object-contain bg-gray-100"
                  />
                )}
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
            disabled={!documentRequisId || !selectedFile || uploading}
            loading={uploading}
          >
            {uploading ? 'Upload en cours...' : 'Ajouter le document'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
