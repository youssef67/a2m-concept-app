/**
 * appartementLivraisonService.js
 * Service pour gérer les livraisons des appartements (statuts, photos, historique)
 */

import { supabase } from '../../../lib/supabaseClient'

// ============================================
// RÉCUPÉRATION
// ============================================

/**
 * Récupérer la livraison d'un appartement (avec jours retard calculés)
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getLivraisonByAppartement(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_livraisons_with_retard') // Vue avec calcul retard
      .select('*')
      .eq('appartement_id', appartementId)
      .single()

    return { data, error }
  } catch (err) {
    console.error('[getLivraisonByAppartement] Error:', err)
    return { data: null, error: err }
  }
}

/**
 * Récupérer l'historique des changements de statut
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getLivraisonHistory(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_livraison_historique')
      .select('*')
      .eq('appartement_id', appartementId)
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (err) {
    console.error('[getLivraisonHistory] Error:', err)
    return { data: null, error: err }
  }
}

/**
 * Récupérer les photos d'une livraison
 * @param {string} livraisonId - UUID de la livraison
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getLivraisonPhotos(livraisonId) {
  try {
    const { data, error } = await supabase
      .from('appartement_livraison_photos')
      .select('*')
      .eq('livraison_id', livraisonId)
      .order('created_at', { ascending: true })

    return { data, error }
  } catch (err) {
    console.error('[getLivraisonPhotos] Error:', err)
    return { data: null, error: err }
  }
}

// ============================================
// MISE À JOUR
// ============================================

/**
 * Mettre à jour le statut de livraison
 * @param {string} livraisonId - UUID de la livraison
 * @param {Object} statutData - Données de mise à jour
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateLivraisonStatut(livraisonId, statutData) {
  try {
    const { data, error } = await supabase
      .from('appartement_livraisons')
      .update(statutData)
      .eq('id', livraisonId)
      .select()
      .single()

    return { data, error }
  } catch (err) {
    console.error('[updateLivraisonStatut] Error:', err)
    return { data: null, error: err }
  }
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprimer une livraison complète (avec ses photos et historique)
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteLivraison(appartementId) {
  try {
    // Récupérer la livraison pour avoir son ID et les photos
    const { data: livraison, error: fetchError } = await supabase
      .from('appartement_livraisons')
      .select('id')
      .eq('appartement_id', appartementId)
      .single()

    if (fetchError || !livraison) {
      console.error('[deleteLivraison] Fetch error:', fetchError)
      return { success: false, error: fetchError || new Error('Livraison introuvable') }
    }

    const livraisonId = livraison.id

    // 1. Récupérer les photos pour supprimer les fichiers du storage
    const { data: photos } = await supabase
      .from('appartement_livraison_photos')
      .select('storage_path')
      .eq('livraison_id', livraisonId)

    // 2. Supprimer les fichiers du storage
    if (photos && photos.length > 0) {
      const storagePaths = photos.map(p => p.storage_path)
      const { error: storageError } = await supabase.storage
        .from('appartements-livraisons')
        .remove(storagePaths)

      if (storageError) {
        console.error('[deleteLivraison] Storage error (non-blocking):', storageError)
        // Continue même si erreur storage
      }
    }

    // 3. Supprimer les photos de la table (CASCADE devrait gérer, mais pour être sûr)
    const { error: photosError } = await supabase
      .from('appartement_livraison_photos')
      .delete()
      .eq('livraison_id', livraisonId)

    if (photosError) {
      console.error('[deleteLivraison] Photos delete error:', photosError)
    }

    // 4. Supprimer l'historique (CASCADE devrait gérer, mais pour être sûr)
    const { error: historyError } = await supabase
      .from('appartement_livraison_historique')
      .delete()
      .eq('appartement_id', appartementId)

    if (historyError) {
      console.error('[deleteLivraison] History delete error:', historyError)
    }

    // 5. Supprimer la livraison
    const { error: deleteError } = await supabase
      .from('appartement_livraisons')
      .delete()
      .eq('id', livraisonId)

    if (deleteError) {
      console.error('[deleteLivraison] Delete error:', deleteError)
      return { success: false, error: deleteError }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('[deleteLivraison] Unexpected error:', err)
    return { success: false, error: err }
  }
}

// ============================================
// PHOTOS
// ============================================

/**
 * Upload une photo pour commande incomplète
 * @param {string} livraisonId - UUID de la livraison
 * @param {string} appartementId - UUID de l'appartement
 * @param {File} file - Fichier photo à uploader
 * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
 */
export async function uploadPhotoIncomplete(livraisonId, appartementId, file) {
  try {
    // Valider le fichier
    const validation = validatePhotoFile(file)
    if (!validation.valid) {
      return { success: false, data: null, error: new Error(validation.error) }
    }

    // Upload vers Supabase Storage
    const timestamp = Date.now()
    const fileName = `${appartementId}_${timestamp}_${file.name}`
    const storagePath = `livraisons/${appartementId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('appartements-livraisons')
      .upload(storagePath, file)

    if (uploadError) {
      console.error('[uploadPhotoIncomplete] Storage error:', uploadError)
      return { success: false, data: null, error: uploadError }
    }

    // Créer l'entrée dans la table
    const { data, error } = await supabase
      .from('appartement_livraison_photos')
      .insert({
        livraison_id: livraisonId,
        appartement_id: appartementId,
        nom_fichier: file.name,
        storage_path: storagePath,
        taille_fichier: file.size,
        type_mime: file.type
      })
      .select()
      .single()

    if (error) {
      // Rollback: supprimer le fichier uploadé
      console.error('[uploadPhotoIncomplete] DB error, rolling back storage upload:', error)
      await supabase.storage
        .from('appartements-livraisons')
        .remove([storagePath])

      return { success: false, data: null, error }
    }

    return { success: true, data, error: null }
  } catch (err) {
    console.error('[uploadPhotoIncomplete] Unexpected error:', err)
    return { success: false, data: null, error: err }
  }
}

/**
 * Supprimer une photo
 * @param {string} photoId - UUID de la photo
 * @param {string} storagePath - Chemin dans Supabase Storage
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deletePhotoIncomplete(photoId, storagePath) {
  try {
    // Supprimer de la table
    const { error: dbError } = await supabase
      .from('appartement_livraison_photos')
      .delete()
      .eq('id', photoId)

    if (dbError) {
      console.error('[deletePhotoIncomplete] DB error:', dbError)
      return { success: false, error: dbError }
    }

    // Supprimer du storage
    const { error: storageError } = await supabase.storage
      .from('appartements-livraisons')
      .remove([storagePath])

    if (storageError) {
      console.error('[deletePhotoIncomplete] Storage error (non-blocking):', storageError)
      // Pas bloquant - continuer
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('[deletePhotoIncomplete] Unexpected error:', err)
    return { success: false, error: err }
  }
}

/**
 * Obtenir l'URL signée d'une photo
 * @param {string} storagePath - Chemin dans Supabase Storage
 * @returns {Promise<{data: string|null, error: Error|null}>}
 */
export async function getPhotoUrl(storagePath) {
  try {
    const { data, error } = await supabase.storage
      .from('appartements-livraisons')
      .createSignedUrl(storagePath, 3600) // 1h de validité

    if (error) {
      console.error('[getPhotoUrl] Error:', error)
      return { data: null, error }
    }

    return { data: data?.signedUrl || null, error: null }
  } catch (err) {
    console.error('[getPhotoUrl] Unexpected error:', err)
    return { data: null, error: err }
  }
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Valider un fichier photo
 * @param {File} file - Fichier à valider
 * @returns {{valid: boolean, error: string|null}}
 */
export function validatePhotoFile(file) {
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  if (!file) {
    return { valid: false, error: 'Aucun fichier sélectionné' }
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux (max 10MB)' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format non supporté (JPEG, PNG, WebP uniquement)' }
  }

  return { valid: true, error: null }
}

/**
 * Formater la taille d'un fichier pour affichage
 * @param {number} bytes - Taille en bytes
 * @returns {string} - Taille formatée (ex: "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
