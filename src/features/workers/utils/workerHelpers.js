/**
 * Worker Helpers
 * Fonctions utilitaires pour formater, valider et manipuler les données des workers
 */

/**
 * Obtenir le nom complet d'un worker
 * @param {Object} worker - Objet worker
 * @returns {string} - Nom complet formaté
 */
export function getWorkerFullName(worker) {
  if (!worker) return ''
  return `${worker.first_name} ${worker.last_name}`.trim()
}

/**
 * Formater un numéro de téléphone français
 * @param {string} phone - Numéro de téléphone (10 chiffres)
 * @returns {string} - Numéro formaté (XX XX XX XX XX)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''

  // Retirer tous les caractères non numériques
  const digits = phone.replace(/\D/g, '')

  // Formater en XX XX XX XX XX
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }

  return phone
}

/**
 * Normaliser un numéro de téléphone (retirer le formatage)
 * @param {string} phone - Numéro de téléphone formaté
 * @returns {string} - Numéro sans espaces (10 chiffres)
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Valider un numéro de téléphone français
 * @param {string} phone - Numéro de téléphone
 * @returns {boolean} - True si valide
 */
export function isValidPhoneNumber(phone) {
  if (!phone) return false

  const digits = normalizePhoneNumber(phone)

  // Doit contenir exactement 10 chiffres
  return digits.length === 10 && /^[0-9]{10}$/.test(digits)
}

/**
 * Préparer les données du worker pour l'API
 * @param {Object} formData - Données du formulaire
 * @returns {Object} - Données nettoyées pour Supabase
 */
export function prepareWorkerData(formData) {
  return {
    first_name: formData.first_name?.trim() || '',
    last_name: formData.last_name?.trim() || '',
    phone: normalizePhoneNumber(formData.phone)
  }
}

/**
 * Filtrer les workers par recherche textuelle
 * @param {Array} workers - Liste des workers
 * @param {string} query - Texte de recherche
 * @returns {Array} - Workers filtrés
 */
export function searchWorkers(workers, query) {
  if (!query || !query.trim()) return workers

  const searchTerm = query.toLowerCase().trim()

  return workers.filter(worker => {
    const fullName = getWorkerFullName(worker).toLowerCase()
    const phone = worker.phone || ''

    return (
      fullName.includes(searchTerm) ||
      phone.includes(searchTerm)
    )
  })
}

/**
 * Trier les workers par nom
 * @param {Array} workers - Liste des workers
 * @param {string} order - 'asc' ou 'desc'
 * @returns {Array} - Workers triés
 */
export function sortWorkersByName(workers, order = 'asc') {
  return [...workers].sort((a, b) => {
    const nameA = `${a.last_name} ${a.first_name}`.toLowerCase()
    const nameB = `${b.last_name} ${b.first_name}`.toLowerCase()

    if (order === 'asc') {
      return nameA.localeCompare(nameB, 'fr')
    } else {
      return nameB.localeCompare(nameA, 'fr')
    }
  })
}
