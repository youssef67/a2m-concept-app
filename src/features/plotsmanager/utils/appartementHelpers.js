/**
 * Appartement Helpers
 * Utility functions for appartement operations
 */

/**
 * Search appartements by nom (case-insensitive)
 * @param {Array} appartements - Array of appartements
 * @param {string} query - Search query
 * @returns {Array} Filtered appartements
 */
export function searchAppartements(appartements, query) {
  if (!query || query.trim() === '') return appartements

  const searchTerm = query.toLowerCase().trim()

  return appartements.filter((appartement) => {
    // Search in nom
    if (appartement.nom?.toLowerCase().includes(searchTerm)) return true

    return false
  })
}

/**
 * Calcule le statut d'un appartement basé sur sa validation et ses tâches
 * @param {Object} appartement - Appartement avec taches, valide
 * @returns {'en_attente' | 'en_cours' | 'pret' | 'finalise'} Statut de l'appartement
 */
export function calculateAppartementStatut(appartement) {
  const { taches = [], valide = false } = appartement

  // Vérifier si toutes les tâches sont terminées
  const allTasksCompleted =
    taches.length > 0 && taches.every((t) => t.statut === 'terminee')

  // Vérifier si au moins une tâche est en cours ou terminée (travail commencé)
  const hasWorkStarted = taches.length > 0 && taches.some((t) =>
    t.statut === 'en_cours' || t.statut === 'terminee'
  )

  // Déterminer le statut (ordre de priorité)
  if (allTasksCompleted && valide) {
    return 'finalise' // Priorité 1 : Toutes les tâches terminées ET validé
  } else if (hasWorkStarted) {
    return 'en_cours' // Priorité 2 : Au moins une tâche commencée (en_cours ou terminee)
  } else if (valide === true) {
    return 'pret' // Priorité 3 : Validé manuellement, prêt à démarrer (aucune tâche commencée)
  } else {
    return 'en_attente' // Priorité 4 : En attente de validation manuelle
  }
}

/**
 * Filtre les appartements par statut
 * @param {Array} appartements - Liste des appartements
 * @param {string} statut - Statut à filtrer ('en_attente' | 'en_cours' | 'pret' | 'finalise')
 * @returns {Array} Appartements filtrés
 */
export function filterAppartementsByStatut(appartements, statut) {
  return appartements.filter((appt) => {
    const appartStatut = calculateAppartementStatut(appt)
    return appartStatut === statut
  })
}

/**
 * Obtient les tâches en cours d'un appartement
 * @param {Object} appartement - Appartement avec taches
 * @returns {Array} Tâches avec statut 'en_cours'
 */
export function getTasksEnCours(appartement) {
  const { taches = [] } = appartement
  return taches.filter((t) => t.statut === 'en_cours')
}

/**
 * Obtient la configuration de style pour un statut d'appartement
 * @param {string} statut - Statut de l'appartement
 * @returns {Object} Configuration avec label, color, bgColor, textColor
 */
export function getStatutConfig(statut) {
  const configs = {
    en_attente: {
      label: 'En attente',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      badgeColor: 'bg-orange-500'
    },
    en_cours: {
      label: 'En cours',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-500'
    },
    pret: {
      label: 'Prêt',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      badgeColor: 'bg-blue-500'
    },
    finalise: {
      label: 'Finalisé',
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-500'
    }
  }

  return configs[statut] || configs.en_attente
}

/**
 * Filtre les appartements par étage spécifique
 * @param {Array} appartements - Liste des appartements
 * @param {number|null} etageFilter - Étage à filtrer (null = non spécifié, 0 = RdC, 1-10 = étages)
 * @returns {Array} Appartements filtrés
 */
export function filterAppartementsByEtage(appartements, etageFilter) {
  if (etageFilter === '') return appartements // Pas de filtre = tous

  return appartements.filter((appt) => {
    // Si filtre = null, chercher les appartements avec etage null ou undefined
    if (etageFilter === null) {
      return appt.etage === null || appt.etage === undefined
    }
    // Sinon, filtrer par étage spécifique
    return appt.etage === etageFilter
  })
}

/**
 * Trie les appartements par ordre alphabétique (nom)
 * @param {Array} appartements - Liste des appartements
 * @returns {Array} Appartements triés
 */
export function sortAppartementsAlphabetically(appartements) {
  return [...appartements].sort((a, b) => {
    const nomA = a.nom?.toLowerCase() || ''
    const nomB = b.nom?.toLowerCase() || ''
    return nomA.localeCompare(nomB, 'fr')
  })
}
