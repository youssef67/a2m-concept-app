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
 * @returns {'en_attente' | 'pret' | 'finalise'} Statut de l'appartement
 */
export function calculateAppartementStatut(appartement) {
  const { taches = [], documents_uploaded_count = 0, documents_required_count = 0 } = appartement

  // Vérifier si tous les documents sont uploadés
  const allDocumentsUploaded =
    documents_required_count === 0 || // Pas de documents requis = OK
    (documents_required_count > 0 && documents_uploaded_count === documents_required_count)

  // Vérifier si toutes les tâches sont terminées
  const allTasksCompleted =
    taches.length > 0 && taches.every((t) => t.statut === 'terminee')

  // Déterminer le statut
  if (allTasksCompleted && allDocumentsUploaded) {
    return 'finalise'
  } else if (allDocumentsUploaded) {
    return 'pret'
  } else {
    return 'en_attente'
  }
}

/**
 * Filtre les appartements par statut
 * @param {Array} appartements - Liste des appartements
 * @param {string} statut - Statut à filtrer ('en_attente' | 'pret' | 'finalise')
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
