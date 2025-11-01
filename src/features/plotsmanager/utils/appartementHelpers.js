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
 * Calcule le statut d'un appartement basé sur ses documents et tâches
 * @param {Object} appartement - Appartement avec taches, documents_uploaded_count, documents_required_count
 * @returns {'en_attente' | 'en_cours' | 'pret' | 'finalise'} Statut de l'appartement
 */
export function calculateAppartementStatut(appartement) {
  const { taches = [], documents_uploaded_count = 0, documents_required_count = 0 } = appartement

  // Vérifier si au moins une tâche est en cours
  const hasTaskInProgress = taches.length > 0 && taches.some((t) => t.statut === 'en_cours')

  // Vérifier si tous les documents sont uploadés
  const allDocumentsUploaded =
    documents_required_count === 0 || // Pas de documents requis = OK
    (documents_required_count > 0 && documents_uploaded_count === documents_required_count)

  // Vérifier si toutes les tâches sont terminées
  const allTasksCompleted =
    taches.length > 0 && taches.every((t) => t.statut === 'terminee')

  // Déterminer le statut (ordre de priorité)
  if (hasTaskInProgress) {
    return 'en_cours' // Priorité 1 : Au moins une tâche commencée
  } else if (allTasksCompleted && allDocumentsUploaded) {
    return 'finalise' // Priorité 2 : Tout terminé
  } else if (allDocumentsUploaded) {
    return 'pret' // Priorité 3 : Documents OK, prêt à démarrer
  } else {
    return 'en_attente' // Priorité 4 : Documents manquants
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
