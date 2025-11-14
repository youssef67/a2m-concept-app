/**
 * plinthesService.js
 * Service pour gérer les plinthes des appartements
 */

import { supabase } from '../../../lib/supabaseClient'
import { createLivraison, updateLivraisonStatut } from './appartementLivraisonService'

// ============================================
// RÉCUPÉRATION
// ============================================

/**
 * Récupérer les informations plinthes d'un appartement
 * @param {string} appartementId - UUID de l'appartement
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getPlinthes(appartementId) {
  try {
    const { data, error } = await supabase
      .from('appartement_plinthes')
      .select('*')
      .eq('appartement_id', appartementId)
      .single()

    // Si aucune donnée trouvée, on retourne null (pas d'erreur)
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null }
    }

    return { data, error }
  } catch (err) {
    console.error('[getPlinthes] Error:', err)
    return { data: null, error: err }
  }
}

// ============================================
// MISE À JOUR / CRÉATION
// ============================================

/**
 * Créer ou mettre à jour les informations plinthes d'un appartement
 * @param {string} appartementId - UUID de l'appartement
 * @param {Object} plinthesData - Données plinthes
 * @param {number} plinthesData.quantite_ml - Quantité en mètres linéaires
 * @param {string} plinthesData.reference - Référence produit
 * @param {string} plinthesData.fournisseur - Nom du fournisseur
 * @param {boolean} plinthesData.est_commande - Si commandé
 * @param {string} plinthesData.date_commande - Date de commande (ISO format)
 * @returns {Promise<{success: boolean, data: Object|null, error: Error|null}>}
 */
export async function upsertPlinthes(appartementId, plinthesData) {
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
      quantite_ml: plinthesData.quantite_ml || null,
      reference: plinthesData.reference || null,
      fournisseur: plinthesData.fournisseur || null,
      est_commande: plinthesData.est_commande || false,
      date_commande: plinthesData.date_commande || null,
      updated_at: new Date().toISOString()
    }

    // Vérifier si un enregistrement existe déjà
    const { data: existing } = await getPlinthes(appartementId)

    let plinthesResult

    if (existing) {
      // UPDATE
      const { data, error } = await supabase
        .from('appartement_plinthes')
        .update(dataToUpsert)
        .eq('appartement_id', appartementId)
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

      // Vérifier si une livraison plinthes existe déjà
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
          'Plinthes',
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
