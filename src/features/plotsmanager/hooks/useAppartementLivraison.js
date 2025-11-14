/**
 * useAppartementLivraison.js
 * Hook personnalisé pour gérer les livraisons d'appartements (support multiple livraisons)
 */

import { useState, useCallback } from 'react'
import {
  getLivraisonsByAppartement,
  getLivraisonHistory,
  getLivraisonPhotos,
  updateLivraisonStatut,
  uploadPhotoIncomplete,
  deletePhotoIncomplete,
  createLivraison,
  deleteLivraison
} from '../services/appartementLivraisonService'

/**
 * Hook pour gérer les livraisons d'un appartement
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Object} - État et fonctions de gestion des livraisons
 */
export function useAppartementLivraison(appartementId) {
  const [livraisons, setLivraisons] = useState([])
  const [history, setHistory] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Charger toutes les livraisons d'un appartement
   */
  const loadLivraisons = useCallback(async () => {
    if (!appartementId) {
      setError('ID appartement manquant')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getLivraisonsByAppartement(appartementId)

    if (fetchError) {
      console.error('[useAppartementLivraison] loadLivraisons error:', fetchError)
      setError('Erreur lors du chargement des livraisons')
      setLivraisons([])
    } else {
      setLivraisons(data || [])
    }

    setLoading(false)
  }, [appartementId])

  /**
   * Charger l'historique des changements d'une livraison spécifique
   * @param {string} livraisonId - UUID de la livraison
   */
  const loadHistory = useCallback(async (livraisonId) => {
    if (!livraisonId) {
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getLivraisonHistory(livraisonId)

    if (fetchError) {
      console.error('[useAppartementLivraison] loadHistory error:', fetchError)
      setError('Erreur lors du chargement de l\'historique')
      setHistory([])
    } else {
      setHistory(data || [])
    }

    setLoading(false)
  }, [])

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
   * Créer une nouvelle livraison
   * @param {string} nomLivraison - Nom de la livraison
   * @param {string} statut - Statut initial
   * @param {string} type - Type de livraison (principale, plinthes)
   * @param {Object} extraData - Données supplémentaires
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const handleCreateLivraison = async (nomLivraison, statut, type = 'principale', extraData = {}) => {
    setLoading(true)
    setError(null)

    const result = await createLivraison(appartementId, nomLivraison, statut, type, extraData)

    if (result.success) {
      // Recharger les livraisons
      await loadLivraisons()
    } else {
      setError('Erreur lors de la création de la livraison')
    }

    setLoading(false)
    return result
  }

  /**
   * Mettre à jour le statut d'une livraison
   * @param {string} livraisonId - UUID de la livraison
   * @param {Object} statutData - Données de mise à jour (statut, dates, etc.)
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const updateStatut = async (livraisonId, statutData) => {
    if (!livraisonId) {
      return { success: false, data: null, error: new Error('ID livraison manquant') }
    }

    setLoading(true)
    setError(null)

    const { data, error: updateError } = await updateLivraisonStatut(
      livraisonId,
      statutData
    )

    if (updateError) {
      console.error('[useAppartementLivraison] updateStatut error:', updateError)
      setError('Erreur lors de la mise à jour du statut')
      setLoading(false)
      return { success: false, data: null, error: updateError }
    }

    // Recharger les données
    await loadLivraisons()
    setLoading(false)

    return { success: true, data, error: null }
  }

  /**
   * Supprimer une livraison
   * @param {string} livraisonId - UUID de la livraison
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const handleDeleteLivraison = async (livraisonId) => {
    setLoading(true)
    setError(null)

    const result = await deleteLivraison(livraisonId)

    if (result.success) {
      // Recharger les livraisons
      await loadLivraisons()
    } else {
      setError('Erreur lors de la suppression de la livraison')
    }

    setLoading(false)
    return result
  }

  /**
   * Upload une photo pour commande incomplète
   * @param {string} livraisonId - UUID de la livraison
   * @param {File} file - Fichier photo à uploader
   * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
   */
  const uploadPhoto = async (livraisonId, file) => {
    if (!livraisonId) {
      return { success: false, data: null, error: new Error('ID livraison manquant') }
    }

    const result = await uploadPhotoIncomplete(
      livraisonId,
      appartementId,
      file
    )

    if (result.success) {
      // Recharger les photos
      await loadPhotos(livraisonId)
    }

    return result
  }

  /**
   * Supprimer une photo
   * @param {string} photoId - UUID de la photo
   * @param {string} storagePath - Chemin dans Supabase Storage
   * @param {string} livraisonId - UUID de la livraison (pour recharger les photos)
   * @returns {Promise<{success: boolean, error: Error|null}>}
   */
  const deletePhoto = async (photoId, storagePath, livraisonId) => {
    const result = await deletePhotoIncomplete(photoId, storagePath)

    if (result.success && livraisonId) {
      // Recharger les photos
      await loadPhotos(livraisonId)
    }

    return result
  }

  return {
    livraisons,
    history,
    photos,
    loading,
    error,
    loadLivraisons,
    loadHistory,
    loadPhotos,
    updateStatut,
    uploadPhoto,
    deletePhoto,
    createLivraison: handleCreateLivraison,
    deleteLivraison: handleDeleteLivraison
  }
}
