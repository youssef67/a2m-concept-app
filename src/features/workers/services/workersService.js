/**
 * Workers Service
 * Gestion des appels API Supabase pour les travailleurs
 */

import { supabase } from '../../../lib/supabaseClient'

/**
 * Récupérer tous les workers avec pagination
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Promise<{data: Array|null, count: number|null, error: Error|null}>}
 */
export async function getAllWorkers(page = 1, limit = 10) {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('workers')
      .select('*', { count: 'exact' })
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('Error fetching workers:', error)
      return { data: null, count: null, error }
    }

    return { data, count, error: null }
  } catch (error) {
    console.error('Unexpected error in getAllWorkers:', error)
    return { data: null, count: null, error }
  }
}

/**
 * Récupérer un worker par ID
 * @param {string} workerId - ID du worker
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getWorkerById(workerId) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .single()

    if (error) {
      console.error('Error fetching worker:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in getWorkerById:', error)
    return { data: null, error }
  }
}

/**
 * Créer un nouveau worker
 * @param {Object} workerData - Données du worker
 * @param {string} workerData.first_name - Prénom
 * @param {string} workerData.last_name - Nom
 * @param {string} workerData.phone - Téléphone (10 chiffres)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createWorker(workerData) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .insert([workerData])
      .select()
      .single()

    if (error) {
      console.error('Error creating worker:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in createWorker:', error)
    return { data: null, error }
  }
}

/**
 * Mettre à jour un worker existant
 * @param {string} workerId - ID du worker
 * @param {Object} workerData - Nouvelles données
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateWorker(workerId, workerData) {
  try {
    const { data, error } = await supabase
      .from('workers')
      .update(workerData)
      .eq('id', workerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating worker:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error in updateWorker:', error)
    return { data: null, error }
  }
}

/**
 * Supprimer un worker
 * @param {string} workerId - ID du worker à supprimer
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteWorker(workerId) {
  try {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId)

    if (error) {
      console.error('Error deleting worker:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Unexpected error in deleteWorker:', error)
    return { success: false, error }
  }
}
