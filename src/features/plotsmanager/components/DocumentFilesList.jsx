/**
 * DocumentFilesList
 * Component to display list of files for a single document type
 */

import React, { useState } from 'react'
import { FileText, Download, Trash2, Image as ImageIcon, Eye } from 'lucide-react'
import { getDocumentUrl, deleteDocument, formatFileSize, isImage } from '../services/appartementDocumentsService'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import DocumentPreviewModal from './DocumentPreviewModal'

export default function DocumentFilesList({ files, onFileDeleted }) {
  const [deletingFileId, setDeletingFileId] = useState(null)
  const [fileToDelete, setFileToDelete] = useState(null)
  const [fileToPreview, setFileToPreview] = useState(null)

  // Handle view file (open preview modal)
  const handleView = (file) => {
    setFileToPreview(file)
  }

  // Handle download file (force download)
  const handleDownload = async (file) => {
    const { data: url } = await getDocumentUrl(file.storage_path)
    if (url) {
      // Force download instead of opening in new tab
      const link = document.createElement('a')
      link.href = url
      link.download = file.nom_fichier
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('Erreur lors du téléchargement du fichier')
    }
  }

  // Handle delete file (open confirmation)
  const handleDeleteFile = (file) => {
    setFileToDelete(file)
  }

  // Confirm delete file
  const confirmDeleteFile = async () => {
    if (!fileToDelete) return

    setDeletingFileId(fileToDelete.id)
    const { success } = await deleteDocument(fileToDelete.id)
    setDeletingFileId(null)
    setFileToDelete(null)

    if (success && onFileDeleted) {
      onFileDeleted(fileToDelete.id)
    }
  }

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      if (diffInHours === 0) return 'À l\'instant'
      if (diffInHours === 1) return 'Il y a 1 heure'
      return `Il y a ${diffInHours} heures`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (!files || files.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-2 mt-2">
        {files.map((file) => {
          const fileIcon = isImage(file.type_mime) ? ImageIcon : FileText

          return (
            <div
              key={file.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              {/* File icon */}
              <div className="flex-shrink-0">
                {React.createElement(fileIcon, {
                  className: `w-5 h-5 ${isImage(file.type_mime) ? 'text-blue-600' : 'text-red-600'}`
                })}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={file.nom_fichier}>
                  {file.nom_fichier}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(file.created_at)} • {formatFileSize(file.taille_fichier)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleView(file)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Voir"
                  disabled={deletingFileId === file.id}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Télécharger"
                  disabled={deletingFileId === file.id}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteFile(file)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer"
                  disabled={deletingFileId === file.id}
                >
                  {deletingFileId === file.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={confirmDeleteFile}
        title="Supprimer le fichier"
        message={`Êtes-vous sûr de vouloir supprimer le fichier "${fileToDelete?.nom_fichier}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!fileToPreview}
        onClose={() => setFileToPreview(null)}
        file={fileToPreview}
        onDownload={handleDownload}
      />
    </>
  )
}
