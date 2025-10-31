/**
 * Chantier Helpers - Utility functions for chantiers
 * Formatting, validation, search, and data preparation
 */

/**
 * Format a date string to French locale format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (DD/MM/YYYY) or '-'
 */
export function formatDate(date) {
  if (!date) return '-'

  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'

    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return '-'
  }
}

/**
 * Format currency amount to Euro format
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount or '-'
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount)
  } catch {
    return '-'
  }
}

/**
 * Format chantier address to single line
 * @param {Object} chantier - Chantier object
 * @returns {string} Formatted address
 */
export function formatAdresse(chantier) {
  if (!chantier) return ''

  const parts = []

  if (chantier.adresse_ligne1) parts.push(chantier.adresse_ligne1)
  if (chantier.adresse_ligne2) parts.push(chantier.adresse_ligne2)
  if (chantier.code_postal) parts.push(chantier.code_postal)
  if (chantier.ville) parts.push(chantier.ville)

  return parts.join(', ')
}

/**
 * Get display label for statut
 * @param {string} statut - Statut value (en_cours, planifie, devis, cloture)
 * @returns {string} Display label
 */
export function getStatutLabel(statut) {
  const labels = {
    en_cours: 'En cours',
    planifie: 'Planifié',
    devis: 'Devis',
    cloture: 'Clôturé'
  }

  return labels[statut] || statut
}

/**
 * Get Tailwind color classes for statut badge
 * @param {string} statut - Statut value
 * @returns {string} Tailwind classes
 */
export function getStatutColor(statut) {
  const colors = {
    en_cours: 'bg-blue-100 text-blue-800',
    planifie: 'bg-orange-100 text-orange-800',
    devis: 'bg-gray-100 text-gray-800',
    cloture: 'bg-green-100 text-green-800'
  }

  return colors[statut] || 'bg-gray-100 text-gray-800'
}

/**
 * Get client display name from client object
 * @param {Object} client - Client object
 * @returns {string} Display name
 */
export function getClientDisplayName(client) {
  if (!client) return 'Client non défini'

  if (client.contact_type === 'professionnel') {
    return client.company_name || 'Entreprise'
  }

  return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Particulier'
}

/**
 * Search chantiers by titre or client name
 * @param {Array} chantiers - Array of chantiers
 * @param {string} query - Search query
 * @returns {Array} Filtered chantiers
 */
export function searchChantiers(chantiers, query) {
  if (!query || query.trim() === '') return chantiers

  const searchTerm = query.toLowerCase().trim()

  return chantiers.filter(chantier => {
    // Search in titre
    if (chantier.titre?.toLowerCase().includes(searchTerm)) {
      return true
    }

    // Search in client name
    const clientName = getClientDisplayName(chantier.client)
    if (clientName.toLowerCase().includes(searchTerm)) {
      return true
    }

    // Search in ville
    if (chantier.ville?.toLowerCase().includes(searchTerm)) {
      return true
    }

    return false
  })
}

/**
 * Filter chantiers by statut
 * @param {Array} chantiers - Array of chantiers
 * @param {string} statut - Statut to filter by
 * @returns {Array} Filtered chantiers
 */
export function filterChantiersByStatut(chantiers, statut) {
  if (!statut) return chantiers

  return chantiers.filter(chantier => chantier.statut === statut)
}

/**
 * Sort chantiers by date
 * @param {Array} chantiers - Array of chantiers
 * @param {boolean} ascending - Sort order
 * @returns {Array} Sorted chantiers
 */
export function sortChantiersByDate(chantiers, ascending = false) {
  return [...chantiers].sort((a, b) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)

    return ascending ? dateA - dateB : dateB - dateA
  })
}

/**
 * Validate budget amount
 * @param {number} amount - Budget amount
 * @returns {boolean} Is valid
 */
export function isValidBudget(amount) {
  if (amount === null || amount === undefined || amount === '') return true

  const num = Number(amount)
  return !isNaN(num) && num >= 0
}

/**
 * Validate date range
 * @param {string|Date} dateDebut - Start date
 * @param {string|Date} dateFin - End date
 * @returns {boolean} Is valid
 */
export function isValidDateRange(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return true

  try {
    const start = new Date(dateDebut)
    const end = new Date(dateFin)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return true

    return end >= start
  } catch {
    return true
  }
}

/**
 * Validate complete chantier data before submission
 * @param {Object} data - Chantier data
 * @returns {{valid: boolean, errors: Object}} Validation result
 */
export function validateChantierData(data) {
  const errors = {}

  // Required fields
  if (!data.titre || data.titre.trim() === '') {
    errors.titre = 'Le titre est obligatoire'
  }

  if (!data.statut) {
    errors.statut = 'Le statut est obligatoire'
  }

  if (!data.client_id) {
    errors.client_id = 'Le client est obligatoire'
  }

  if (!data.adresse_ligne1 || data.adresse_ligne1.trim() === '') {
    errors.adresse_ligne1 = 'L\'adresse est obligatoire'
  }

  if (!data.ville || data.ville.trim() === '') {
    errors.ville = 'La ville est obligatoire'
  }

  if (!data.code_postal || data.code_postal.trim() === '') {
    errors.code_postal = 'Le code postal est obligatoire'
  }

  // Budget validation
  if (data.budget_estime && !isValidBudget(data.budget_estime)) {
    errors.budget_estime = 'Le budget doit être un nombre positif'
  }

  if (data.cout_reel && !isValidBudget(data.cout_reel)) {
    errors.cout_reel = 'Le coût doit être un nombre positif'
  }

  // Date range validation
  if (data.date_debut && data.date_fin_prevue && !isValidDateRange(data.date_debut, data.date_fin_prevue)) {
    errors.date_fin_prevue = 'La date de fin doit être après la date de début'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Prepare chantier data for API submission
 * Clean and format data before sending to Supabase
 * @param {Object} formData - Raw form data
 * @returns {Object} Prepared data
 */
export function prepareChantierData(formData) {
  const data = { ...formData }

  // Trim string fields
  if (data.titre) data.titre = data.titre.trim()
  if (data.description) data.description = data.description.trim()
  if (data.adresse_ligne1) data.adresse_ligne1 = data.adresse_ligne1.trim()
  if (data.adresse_ligne2) data.adresse_ligne2 = data.adresse_ligne2.trim()
  if (data.ville) data.ville = data.ville.trim()
  if (data.code_postal) data.code_postal = data.code_postal.trim()
  if (data.notes) data.notes = data.notes.trim()

  // Convert empty strings to null
  Object.keys(data).forEach(key => {
    if (data[key] === '') data[key] = null
  })

  // Convert budget to number
  if (data.budget_estime) {
    data.budget_estime = Number(data.budget_estime)
  }

  if (data.cout_reel) {
    data.cout_reel = Number(data.cout_reel)
  }

  return data
}

/**
 * Calculate chantier progress based on dates
 * @param {Object} chantier - Chantier object
 * @returns {number} Progress percentage (0-100) or null
 */
export function calculateProgress(chantier) {
  if (!chantier.date_debut || !chantier.date_fin_prevue) return null

  try {
    const start = new Date(chantier.date_debut)
    const end = new Date(chantier.date_fin_prevue)
    const today = new Date()

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null

    // If not started yet
    if (today < start) return 0

    // If finished
    if (today > end) return 100

    // Calculate progress
    const total = end - start
    const elapsed = today - start
    const progress = Math.round((elapsed / total) * 100)

    return Math.min(Math.max(progress, 0), 100)
  } catch {
    return null
  }
}
