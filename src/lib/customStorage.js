/**
 * Custom Storage for Supabase Auth
 * Plus robuste pour les PWA Android - Résout le problème de force quit
 *
 * Utilise localStorage avec :
 * - Préfixe unique pour éviter les conflits
 * - Gestion d'erreurs robuste pour contextes restrictifs
 * - Support des promesses pour compatibilité Supabase
 */

const STORAGE_PREFIX = 'supabase-auth-pwa-'

export const customStorage = {
  /**
   * Récupère un item du localStorage
   * @param {string} key - Clé de l'item
   * @returns {Promise<string|null>}
   */
  getItem: (key) => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
      return Promise.resolve(item)
    } catch (error) {
      console.warn('[customStorage] getItem error:', error)
      return Promise.resolve(null)
    }
  },

  /**
   * Enregistre un item dans le localStorage
   * @param {string} key - Clé de l'item
   * @param {string} value - Valeur à enregistrer
   * @returns {Promise<void>}
   */
  setItem: (key, value) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, value)
      return Promise.resolve()
    } catch (error) {
      console.error('[customStorage] setItem error:', error)
      return Promise.resolve()
    }
  },

  /**
   * Supprime un item du localStorage
   * @param {string} key - Clé de l'item
   * @returns {Promise<void>}
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
      return Promise.resolve()
    } catch (error) {
      console.warn('[customStorage] removeItem error:', error)
      return Promise.resolve()
    }
  }
}
