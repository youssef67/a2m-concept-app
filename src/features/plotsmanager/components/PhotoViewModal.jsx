/**
 * PhotoViewModal
 * Modal pour afficher une photo en plein écran sans défilement
 */

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import { getPhotoUrl } from '../services/appartementPhotosService'

export default function PhotoViewModal({ isOpen, onClose, photo, photoNumber }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load photo URL when modal opens
  useEffect(() => {
    if (isOpen && photo) {
      loadPhotoUrl()
    } else {
      // Reset state when modal closes
      setImageUrl(null)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, photo])

  const loadPhotoUrl = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: url, error: fetchError } = await getPhotoUrl(photo.storage_path)

      if (fetchError || !url) {
        setError('Erreur lors du chargement de la photo')
      } else {
        setImageUrl(url)
      }
    } catch (err) {
      console.error('[PhotoViewModal] Error loading photo:', err)
      setError('Erreur lors du chargement de la photo')
    } finally {
      setLoading(false)
    }
  }

  if (!photo) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={photoNumber ? `Photo ${photoNumber}` : photo.nom_fichier}
      size="full"
    >
      <div className="flex flex-col h-full">
        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Chargement de la photo...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Image display */}
        {imageUrl && !loading && !error && (
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-black rounded-lg">
            <img
              src={imageUrl}
              alt={photoNumber ? `Photo ${photoNumber}` : photo.nom_fichier}
              className="max-w-full max-h-full object-contain"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto'
              }}
            />
          </div>
        )}

        {/* Close button - visible on image */}
        {imageUrl && !loading && !error && (
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
              title="Fermer"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
