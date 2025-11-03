/**
 * Custom Storage for Supabase Auth
 * Utilise IndexedDB + localStorage (double-write) pour une persistance maximale sur Android PWA
 *
 * Stratégie :
 * - Double-write : écrit dans les deux storages en même temps
 * - Lecture prioritaire depuis IndexedDB, fallback vers localStorage
 * - Maximise les chances de persistance sur Android
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
 * Storage avec double-write (IndexedDB + localStorage)
 */
export const customStorage = {
  /**
   * Récupère un item du storage
   * Essaie IndexedDB d'abord, puis localStorage
   * @param {string} key - Clé de l'item
   * @returns {Promise<string|null>}
   */
  async getItem(key) {
    // Essayer IndexedDB d'abord
    try {
      const db = await openDB()
      const value = await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onsuccess = () => {
          db.close()
          resolve(request.result ?? null)
        }

        request.onerror = () => {
          db.close()
          reject(request.error)
        }
      })

      // Si trouvé dans IndexedDB, le retourner
      if (value !== null) {
        return value
      }
    } catch (error) {
      console.warn('[customStorage] IndexedDB getItem failed:', error)
    }

    // Fallback vers localStorage
    try {
      return localStorage.getItem(key)
    } catch (localStorageError) {
      console.error('[customStorage] localStorage getItem failed:', localStorageError)
      return null
    }
  },

  /**
   * Enregistre un item dans le storage
   * Double-write : écrit dans IndexedDB ET localStorage
   * @param {string} key - Clé de l'item
   * @param {string} value - Valeur à enregistrer
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    // 1. Écrire dans localStorage en premier (synchrone, rapide)
    try {
      localStorage.setItem(key, value)
    } catch (localStorageError) {
      console.warn('[customStorage] localStorage setItem failed:', localStorageError)
    }

    // 2. Écrire dans IndexedDB (asynchrone, plus robuste)
    try {
      const db = await openDB()
      await new Promise((resolve, reject) => {
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
      console.warn('[customStorage] IndexedDB setItem failed:', error)
      // localStorage déjà écrit, donc pas grave
    }
  },

  /**
   * Supprime un item du storage
   * Supprime des deux storages
   * @param {string} key - Clé de l'item
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    // Supprimer de localStorage
    try {
      localStorage.removeItem(key)
    } catch (localStorageError) {
      console.warn('[customStorage] localStorage removeItem failed:', localStorageError)
    }

    // Supprimer d'IndexedDB
    try {
      const db = await openDB()
      await new Promise((resolve, reject) => {
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
      console.warn('[customStorage] IndexedDB removeItem failed:', error)
    }
  }
}
