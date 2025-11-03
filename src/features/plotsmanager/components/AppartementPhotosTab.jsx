/**
 * AppartementPhotosTab
 * Tab component for displaying and managing photos for an appartement
 */

import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Image as ImageIcon, ExternalLink, Link2, Link2Off } from 'lucide-react'
import { useAppartementPhotos } from '../hooks/useAppartementPhotos'
import { useAppartementNotes } from '../hooks/useAppartementNotes'
import { formatPhotoDate } from '../services/appartementPhotosService'
import Button from '../../../shared/components/ui/Button'
import PhotoUploadModal from './PhotoUploadModal'
import PhotoLinkNoteModal from './PhotoLinkNoteModal'

export default function AppartementPhotosTab({ appartement }) {
  const {
    photos,
    loading: photosLoading,
    error: photosError,
    loadPhotos,
    uploadPhoto,
    deletePhoto,
    viewPhoto
  } = useAppartementPhotos(appartement.id)

  const { notes, loadNotes } = useAppartementNotes(appartement.id)

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [deletingPhotoId, setDeletingPhotoId] = useState(null)

  // Load photos and notes on mount
  useEffect(() => {
    loadPhotos()
    loadNotes()
  }, [loadPhotos, loadNotes])

  // Handle upload photo
  const handleUploadPhoto = () => {
    setIsUploadModalOpen(true)
  }

  // Handle view photo (open in new tab)
  const handleViewPhoto = async (photo) => {
    const { url, error } = await viewPhoto(photo.storage_path)
    if (url) {
      window.open(url, '_blank')
    } else {
      alert('Erreur lors de l\'ouverture de la photo')
    }
  }

  // Handle delete photo
  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return
    }

    setDeletingPhotoId(photoId)
    await deletePhoto(photoId)
    setDeletingPhotoId(null)
  }

  // Handle link/unlink photo to note
  const handleLinkPhoto = (photo) => {
    setSelectedPhoto(photo)
    setIsLinkModalOpen(true)
  }

  if (photosLoading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600">Chargement des photos...</p>
        </div>
      </div>
    )
  }

  if (photosError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{photosError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos ({photos.length})
        </h3>
        <Button
          variant="primary"
          size="sm"
          onClick={handleUploadPhoto}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une photo</span>
        </Button>
      </div>

      {/* Photos list */}
      {photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aucune photo pour cet appartement</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadPhoto}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter la première photo</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Photo preview placeholder */}
              <div className="bg-gray-100 aspect-video flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>

              {/* Photo info */}
              <div className="p-3 space-y-2">
                {/* Filename */}
                <p className="text-sm font-medium text-gray-900 truncate" title={photo.nom_fichier}>
                  {photo.nom_fichier}
                </p>

                {/* Date */}
                <p className="text-xs text-gray-500">
                  {formatPhotoDate(photo.created_at)}
                </p>

                {/* Linked note */}
                {photo.note && (
                  <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    <p className="text-xs text-blue-800 truncate" title={photo.note.contenu}>
                      <Link2 className="w-3 h-3 inline mr-1" />
                      {photo.note.contenu.substring(0, 50)}{photo.note.contenu.length > 50 ? '...' : ''}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleViewPhoto(photo)}
                    className="flex-1 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
                    title="Voir"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Voir</span>
                  </button>

                  <button
                    onClick={() => handleLinkPhoto(photo)}
                    className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                    title={photo.note_id ? "Modifier le lien" : "Lier à une note"}
                  >
                    {photo.note_id ? (
                      <><Link2Off className="w-3.5 h-3.5" /><span>Délier</span></>
                    ) : (
                      <><Link2 className="w-3.5 h-3.5" /><span>Lier</span></>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                    disabled={deletingPhotoId === photo.id}
                  >
                    {deletingPhotoId === photo.id ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={uploadPhoto}
        appartementNom={appartement.nom}
        notes={notes}
      />

      {/* Photo Link Note Modal */}
      <PhotoLinkNoteModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false)
          setSelectedPhoto(null)
        }}
        photo={selectedPhoto}
        notes={notes}
        onLinkChange={loadPhotos}
        appartementId={appartement.id}
      />
    </div>
  )
}
