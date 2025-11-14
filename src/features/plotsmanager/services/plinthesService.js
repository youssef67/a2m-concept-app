/**
 * plinthesService.js
 * Service pour gérer les plinthes des appartements (multi-pièces)
 */

import { supabase } from '../../../lib/supabaseClient'
import { createLivraison, updateLivraisonStatut } from './appartementLivraisonService'

// ============================================
// RÉCUPÉRATION
// ============================================

/**
 * Récupérer toutes les configurations de plinthes d'un appartement
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getPlinthes(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_plinthes')
      .select('*')
      .eq('appartement_id', appartementId)
      .order('piece', { ascending: true })

    if (error) {
      console.error('[getPlinthes] Error:', error)
      return { data: null, error }
    }

    // Retourner un array (vide si aucune donnée)
    return { data: data || [], error: null }
  } catch (err) {
    console.error('[getPlinthes] Unexpected error:', err)
    return { data: null, error: err }
  }
}

/**
 * Récupérer une configuration de plinthes spécifique (appartement + pièce)
 * @param {string} appartementId - UUID de l'appartement
 * @param {string} piece - Nom de la pièce
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getPlinthesParPiece(appartementId, piece) {
  try {
    const { data, error } = await supabase
      .from('appartement_plinthes')
      .select('*')
      .eq('appartement_id', appartementId)
      .eq('piece', piece)
      .single()

    // Si aucune donnée trouvée, on retourne null (pas d'erreur)
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null }
    }

    return { data, error }
  } catch (err) {
    console.error('[getPlinthesParPiece] Error:', err)
    return { data: null, error: err }
  }
}

// ============================================
// MISE À JOUR / CRÉATION
// ============================================

/**
 * Créer ou mettre à jour les informations plinthes d'un appartement pour une pièce donnée
 * @param {string} appartementId - UUID de l'appartement
 * @param {string} piece - Nom de la pièce
 * @param {Object} plinthesData - Données plinthes
 * @param {number} plinthesData.quantite_ml - Quantité en mètres linéaires
 * @param {string} plinthesData.reference - Référence produit
 * @param {string} plinthesData.fournisseur - Nom du fournisseur
 * @param {boolean} plinthesData.est_commande - Si commandé
 * @param {string} plinthesData.date_commande - Date de commande (ISO format)
 * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
 */
export async function upsertPlinthes(appartementId, piece, plinthesData) {
  try {
    // Récupérer l'utilisateur courant
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        data: null,
        error: new Error('Utilisateur non authentifié')
      }
    }

    // Préparer les données
    const dataToUpsert = {
      appartement_id: appartementId,
      piece: piece,
      quantite_ml: plinthesData.quantite_ml || null,
      reference: plinthesData.reference || null,
      fournisseur: plinthesData.fournisseur || null,
      statut: plinthesData.statut || 'non_commande',
      est_commande: plinthesData.est_commande || false,
      date_commande: plinthesData.date_commande || null,
      date_livraison_prevue: plinthesData.date_livraison_prevue || null,
      date_reception: plinthesData.date_reception || null,
      updated_at: new Date().toISOString()
    }

    // Vérifier si un enregistrement existe déjà pour cette pièce
    const { data: existing } = await getPlinthesParPiece(appartementId, piece)

    let plinthesResult

    if (existing) {
      // UPDATE
      const { data, error } = await supabase
        .from('appartement_plinthes')
        .update(dataToUpsert)
        .eq('appartement_id', appartementId)
        .eq('piece', piece)
        .select()
        .single()

      if (error) {
        console.error('[upsertPlinthes] Update error:', error)
        return { success: false, data: null, error }
      }

      plinthesResult = data
    } else {
      // INSERT
      dataToUpsert.created_by = user.id

      const { data, error } = await supabase
        .from('appartement_plinthes')
        .insert([dataToUpsert])
        .select()
        .single()

      if (error) {
        console.error('[upsertPlinthes] Insert error:', error)
        return { success: false, data: null, error }
      }

      plinthesResult = data
    }

    // Gérer la livraison si commandé
    if (plinthesData.est_commande) {
      const extraData = {}
      if (plinthesData.reference) extraData.numero_commande = plinthesData.reference
      if (plinthesData.fournisseur) extraData.fournisseur = plinthesData.fournisseur
      if (plinthesData.date_commande) extraData.date_commande = plinthesData.date_commande

      // Vérifier si une livraison plinthes existe déjà pour cette pièce
      if (existing && existing.livraison_id) {
        // Mettre à jour la livraison existante
        await updateLivraisonStatut(existing.livraison_id, {
          statut: 'commande_effectuee',
          ...extraData
        })
      } else {
        // Créer une nouvelle livraison de type plinthes
        const livraisonResult = await createLivraison(
          appartementId,
          `Plinthes - ${piece}`,
          'commande_effectuee',
          'plinthes',
          extraData
        )

        if (livraisonResult.success && livraisonResult.data) {
          // Lier la livraison aux plinthes
          await supabase
            .from('appartement_plinthes')
            .update({ livraison_id: livraisonResult.data.id })
            .eq('appartement_id', appartementId)
            .eq('piece', piece)

          plinthesResult.livraison_id = livraisonResult.data.id
        }
      }
    }

    return { success: true, data: plinthesResult, error: null }
  } catch (err) {
    console.error('[upsertPlinthes] Unexpected error:', err)
    return { success: false, data: null, error: err }
  }
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprimer une configuration de plinthes pour une pièce donnée
 * @param {string} appartementId - UUID de l'appartement
 * @param {string} piece - Nom de la pièce
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deletePlinthes(appartementId, piece) {
  try {
    const { error } = await supabase
      .from('appartement_plinthes')
      .delete()
      .eq('appartement_id', appartementId)
      .eq('piece', piece)

    if (error) {
      console.error('[deletePlinthes] Error:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('[deletePlinthes] Unexpected error:', err)
    return { success: false, error: err }
  }
}
