/**
 * Facture Helpers - Utility functions
 */

/**
 * Format currency (EUR)
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Get statut label
 */
export function getStatutLabel(statut) {
  const labels = {
    en_attente: 'En attente',
    partiellement_payee: 'Partiellement payée',
    payee: 'Payée',
    annulee: 'Annulée'
  }
  return labels[statut] || statut
}

/**
 * Get statut color (Tailwind classes)
 */
export function getStatutColor(statut) {
  const colors = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    partiellement_payee: 'bg-orange-100 text-orange-800',
    payee: 'bg-green-100 text-green-800',
    annulee: 'bg-red-100 text-red-800'
  }
  return colors[statut] || 'bg-gray-100 text-gray-800'
}

/**
 * Get contact display name
 */
export function getContactDisplayName(contact) {
  if (!contact) return 'Contact inconnu'

  if (contact.contact_type === 'professionnel') {
    return contact.company_name || 'Entreprise inconnue'
  }

  return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Particulier inconnu'
}

/**
 * Search factures
 */
export function searchFactures(factures, query) {
  if (!query || query.trim() === '') return factures

  const lowerQuery = query.toLowerCase().trim()

  return factures.filter(facture => {
    // Search in numero_facture
    if (facture.numero_facture?.toLowerCase().includes(lowerQuery)) return true

    // Search in contact name
    const contactName = getContactDisplayName(facture.contact).toLowerCase()
    if (contactName.includes(lowerQuery)) return true

    // Search in montant (as string)
    if (facture.montant?.toString().includes(lowerQuery)) return true

    // Search in notes
    if (facture.notes?.toLowerCase().includes(lowerQuery)) return true

    return false
  })
}

/**
 * Calculate date échéance based on date émission and délai de paiement
 * @param {string} dateEmission - Date ISO format (YYYY-MM-DD)
 * @param {string} delaiPaiement - 'immediat', '30_jours', '45_jours', or '60_jours'
 * @returns {string} Date échéance in ISO format (YYYY-MM-DD)
 */
export function calculateDateEcheance(dateEmission, delaiPaiement) {
  if (!dateEmission || !delaiPaiement) return ''

  const daysMap = {
    'immediat': 0,
    '30_jours': 30,
    '45_jours': 45,
    '60_jours': 60
  }

  const daysToAdd = daysMap[delaiPaiement] || 0
  const date = new Date(dateEmission)
  date.setDate(date.getDate() + daysToAdd)

  return date.toISOString().split('T')[0]
}

/**
 * Check if facture is overdue
 * @param {Object} facture - Facture object
 * @returns {boolean} True if overdue
 */
export function isFactureOverdue(facture) {
  if (!facture.date_echeance) return false
  if (facture.statut === 'payee' || facture.statut === 'annulee') return false

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to midnight

  const echeance = new Date(facture.date_echeance)
  echeance.setHours(0, 0, 0, 0)

  return echeance < today
}

/**
 * Calculate days overdue
 * @param {string} dateEcheance - Date échéance ISO format
 * @returns {number} Number of days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(dateEcheance) {
  if (!dateEcheance) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const echeance = new Date(dateEcheance)
  echeance.setHours(0, 0, 0, 0)

  if (echeance >= today) return 0

  const diffTime = today - echeance
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Validate facture form data
 */
export function validateFactureData(data) {
  const errors = {}

  if (!data.type) {
    errors.type = 'Le type est obligatoire'
  }

  if (!data.contact_id) {
    errors.contact_id = 'Le client/fournisseur est obligatoire'
  }

  if (!data.montant || parseFloat(data.montant) <= 0) {
    errors.montant = 'Le montant doit être supérieur à 0'
  }

  if (!data.date_emission) {
    errors.date_emission = 'La date d\'émission est obligatoire'
  }

  if (!data.date_echeance) {
    errors.date_echeance = 'La date d\'échéance est obligatoire'
  }

  if (data.date_emission && data.date_echeance) {
    if (new Date(data.date_echeance) < new Date(data.date_emission)) {
      errors.date_echeance = 'La date d\'échéance doit être >= à la date d\'émission'
    }
  }

  return errors
}
