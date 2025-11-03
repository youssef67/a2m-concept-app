/**
 * Custom Storage for Supabase Auth
 * Utilise IndexedDB pour une persistance robuste sur Android PWA
 *
 * IndexedDB est plus fiable que localStorage sur Android car :
 * - Ne se fait pas vider lors du force quit
 * - Meilleure persistance sur mobile
 * - Fallback vers localStorage si IndexedDB n'est pas disponible
 */

const DB_NAME = 'supabase-auth-pwa'
const STORE_NAME = 'auth-storage'
const DB_VERSION = 1

/**
 * Ouvre la connexion IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Storage avec IndexedDB et fallback localStorage
 */
export const customStorage = {
  /**
   * Récupère un item du storage
   * @param {string} key - Clé de l'item
   * @returns {Promise<string|null>}
   */
  async getItem(key) {
    try {
      // Essayer IndexedDB d'abord
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onsuccess = () => {
          const value = request.result
          db.close()
          resolve(value ?? null)
        }

        request.onerror = () => {
          db.close()
          reject(request.error)
        }
      })
    } catch (error) {
      // Fallback vers localStorage
      console.warn('[customStorage] IndexedDB getItem failed, using localStorage:', error)
      try {
        return localStorage.getItem(key)
      } catch (localStorageError) {
        console.error('[customStorage] localStorage getItem failed:', localStorageError)
        return null
      }
    }
  },

  /**
   * Enregistre un item dans le storage
   * @param {string} key - Clé de l'item
   * @param {string} value - Valeur à enregistrer
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    try {
      // Essayer IndexedDB d'abord
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(value, key)

        request.onsuccess = () => {
          db.close()
          resolve()
        }

        request.onerror = () => {
          db.close()
          reject(request.error)
        }
      })
    } catch (error) {
      // Fallback vers localStorage
      console.warn('[customStorage] IndexedDB setItem failed, using localStorage:', error)
      try {
        localStorage.setItem(key, value)
      } catch (localStorageError) {
        console.error('[customStorage] localStorage setItem failed:', localStorageError)
      }
    }
  },

  /**
   * Supprime un item du storage
   * @param {string} key - Clé de l'item
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    try {
      // Essayer IndexedDB d'abord
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(key)

        request.onsuccess = () => {
          db.close()
          resolve()
        }

        request.onerror = () => {
          db.close()
          reject(request.error)
        }
      })
    } catch (error) {
      // Fallback vers localStorage
      console.warn('[customStorage] IndexedDB removeItem failed, using localStorage:', error)
      try {
        localStorage.removeItem(key)
      } catch (localStorageError) {
        console.error('[customStorage] localStorage removeItem failed:', localStorageError)
      }
    }
  }
}
