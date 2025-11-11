/**
 * DocumentPreviewModal Component
 * Modal pour prévisualiser un document (PDF ou image)
 */

import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { getDocumentUrl, formatFileSize, isPDF, isImage } from '../services/appartementDocumentsService'
import Spinner from '../../../shared/components/ui/Spinner'

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  file,
  onDownload
}) {
  const [documentUrl, setDocumentUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Charger l'URL du document quand la modal s'ouvre
   */
  useEffect(() => {
    if (isOpen && file) {
      loadDocumentUrl()
    } else {
      // Reset quand la modal se ferme
      setDocumentUrl(null)
      setLoading(true)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, file])

  /**
   * Récupérer l'URL publique du document
   */
  const loadDocumentUrl = async () => {
    setLoading(true)
    setError(null)

    const { data: url, error: urlError } = await getDocumentUrl(file.storage_path)

    if (urlError) {
      setError('Erreur lors du chargement du document')
      setLoading(false)
      return
    }

    setDocumentUrl(url)
    setLoading(false)
  }

  /**
   * Gérer la touche Escape
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  /**
   * Empêcher le scroll du body
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !file) return null

  /**
   * Gérer le clic sur le backdrop
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  /**
   * Gérer le téléchargement
   */
  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload(file)
    }
  }

  /**
   * Formater la date
   */
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate pr-4">
            {file.nom_fichier}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Bouton télécharger */}
            <button
              onClick={handleDownloadClick}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
            {/* Bouton fermer */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadDocumentUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {!loading && !error && documentUrl && (
            <div className="h-full">
              {isPDF(file.type_mime) ? (
                // Prévisualisation PDF
                <iframe
                  src={documentUrl}
                  className="w-full h-full min-h-[500px] sm:min-h-[600px] md:min-h-[700px] border-0 rounded-lg bg-white shadow-inner"
                  title={file.nom_fichier}
                />
              ) : isImage(file.type_mime) ? (
                // Prévisualisation Image
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <img
                    src={documentUrl}
                    alt={file.nom_fichier}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                // Type non supporté
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <p className="text-gray-600">Type de fichier non supporté pour la prévisualisation</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Info fichier */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
            <span>
              <strong>Taille :</strong> {formatFileSize(file.taille_fichier)}
            </span>
            <span>
              <strong>Ajouté le :</strong> {formatDate(file.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
