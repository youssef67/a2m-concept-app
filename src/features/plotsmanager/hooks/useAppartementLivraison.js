/**
 * useAppartementLivraison.js
 * Hook personnalisé pour gérer les livraisons d'appartements
 */

import { useState, useCallback } from 'react'
import {
  getLivraisonByAppartement,
  getLivraisonHistory,
  getLivraisonPhotos,
  updateLivraisonStatut,
  uploadPhotoIncomplete,
  deletePhotoIncomplete
} from '../services/appartementLivraisonService'

/**
 * Hook pour gérer les livraisons d'un appartement
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Object} - État et fonctions de gestion de la livraison
 */
export function useAppartementLivraison(appartementId) {
  const [livraison, setLivraison] = useState(null)
  const [history, setHistory] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Charger la livraison d'un appartement
   */
  const loadLivraison = useCallback(async () => {
    if (!appartementId) {
      setError('ID appartement manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getLivraisonByAppartement(appartementId)

    if (fetchError) {
      console.error('[useAppartementLivraison] loadLivraison error:', fetchError)
      setError('Erreur lors du chargement de la livraison')
      setLivraison(null)
    } else {
      setLivraison(data)
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Charger l'historique des changements de statut
   */
  const loadHistory = useCallback(async () => {
    if (!appartementId) {
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getLivraisonHistory(appartementId)

    if (fetchError) {
      console.error('[useAppartementLivraison] loadHistory error:', fetchError)
      setError('Erreur lors du chargement de l\'historique')
      setHistory([])
    } else {
      setHistory(data || [])
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Charger les photos d'une livraison
   * @param {string} livraisonId - UUID de la livraison
   */
  const loadPhotos = useCallback(async (livraisonId) => {
    if (!livraisonId) {
      setPhotos([])
      return
    }

    const { data, error: fetchError } = await getLivraisonPhotos(livraisonId)

    if (fetchError) {
      console.error('[useAppartementLivraison] loadPhotos error:', fetchError)
      setPhotos([])
    } else {
      setPhotos(data || [])
    }
  }, [])

  /**
   * Mettre à jour le statut de la livraison
   * @param {Object} statutData - Données de mise à jour (statut, dates, etc.)
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const updateStatut = async (statutData) => {
    if (!livraison) {
      return { success: false, data: null, error: new Error('Livraison non chargée') }
    }

    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updateLivraisonStatut(
      livraison.id,
      statutData
    )

    if (updateError) {
      console.error('[useAppartementLivraison] updateStatut error:', updateError)
      setError('Erreur lors de la mise à jour du statut')
      setLoading(false)
      return { success: false, data: null, error: updateError }
    }

    // Recharger les données
    await loadLivraison()
    setLoading(false)

    return { success: true, data, error: null }
  }

  /**
   * Upload une photo pour commande incomplète
   * @param {File} file - Fichier photo à uploader
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const uploadPhoto = async (file) => {
    if (!livraison) {
      return { success: false, data: null, error: new Error('Livraison non chargée') }
    }

    const result = await uploadPhotoIncomplete(
      livraison.id,
      appartementId,
      file
    )

    if (result.success) {
      // Recharger les photos
      await loadPhotos(livraison.id)
    }

    return result
  }

  /**
   * Supprimer une photo
   * @param {string} photoId - UUID de la photo
   * @param {string} storagePath - Chemin dans Supabase Storage
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deletePhoto = async (photoId, storagePath) => {
    const result = await deletePhotoIncomplete(photoId, storagePath)

    if (result.success && livraison) {
      // Recharger les photos
      await loadPhotos(livraison.id)
    }

    return result
  }

  return {
    livraison,
    history,
    photos,
    loading,
    error,
    loadLivraison,
    loadHistory,
    loadPhotos,
    updateStatut,
    uploadPhoto,
    deletePhoto
  }
}
