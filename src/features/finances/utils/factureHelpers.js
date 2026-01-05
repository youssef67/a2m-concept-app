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

    // Search in lot
    if (facture.lot?.toLowerCase().includes(lowerQuery)) return true

    // Search in chantier titre
    if (facture.chantier?.titre?.toLowerCase().includes(lowerQuery)) return true

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
  if (facture.exclue_calculs === true) return false

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
 * Calculate TTC from HT
 * @param {number} montantHT - Montant HT
 * @param {number} tauxTVA - Taux de TVA (default 20)
 * @returns {number} Montant TTC
 */
export function calculateTTC(montantHT, tauxTVA = 20) {
  if (!montantHT || montantHT <= 0) return 0
  return montantHT * (1 + tauxTVA / 100)
}

/**
 * Calculate retenue de garantie from HT
 * @param {number} montantHT - Montant HT
 * @returns {number} Montant retenue (5% du HT)
 */
export function calculateRetenue(montantHT) {
  if (!montantHT || montantHT <= 0) return 0
  return montantHT * 0.05
}

/**
 * Calculate prorata from HT
 * @param {number} montantHT - Montant HT
 * @returns {number} Montant prorata (2% du HT)
 */
export function calculateProrata(montantHT) {
  if (!montantHT || montantHT <= 0) return 0
  return montantHT * 0.02
}

/**
 * Get montant à afficher (TTC si TVA applicable, sinon HT - déductions)
 * @param {Object} facture - Facture object
 * @returns {number} Montant à afficher
 */
export function getMontantAPayer(facture) {
  if (!facture) return 0

  // Fournisseur : toujours TTC
  if (facture.type === 'fournisseur') {
    return facture.montant_ttc || facture.montant || 0
  }

  // Client : TTC si TVA applicable, sinon HT - déductions
  if (facture.tva_applicable) {
    return facture.montant_ttc || facture.montant || 0
  } else {
    // Pour factures sans TVA: HT - déductions
    const ht = facture.montant_ht || facture.montant || 0
    const totalDeductions = calculateTotalDeductions(facture.deductions || [])
    return ht - totalDeductions
  }
}

/**
 * Get montant label for display
 * @param {Object} facture - Facture object
 * @returns {string} Label to display (HT/TTC)
 */
export function getMontantLabel(facture) {
  if (!facture) return 'Montant'

  // Fournisseur : toujours TTC
  if (facture.type === 'fournisseur') {
    return 'TTC'
  }

  // Client : TTC si TVA, HT si auto-liquidation
  return facture.tva_applicable ? 'TTC' : 'HT'
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

/**
 * Check if facture should be excluded from calculations
 * @param {Object} facture - Facture object
 * @returns {boolean} True if excluded
 */
export function isFactureExclue(facture) {
  return facture?.exclue_calculs === true
}

/**
 * Filter out excluded factures from array
 * @param {Array} factures - Array of factures
 * @returns {Array} Filtered factures (non-excluded only)
 */
export function filterFacturesNonExclues(factures) {
  if (!Array.isArray(factures)) return []
  return factures.filter(f => !isFactureExclue(f))
}

/**
 * Validate the format of a client invoice number
 * @param {string} numeroFacture - Invoice number to validate
 * @param {boolean} isEditing - If true, skip year validation (for existing invoices)
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateNumeroFacture(numeroFacture, isEditing = false) {
  // If empty, valid (auto-generation)
  if (!numeroFacture || numeroFacture.trim() === '') {
    return { valid: true, error: null }
  }

  // Expected format: FAC/C-YYYY-NNNNN
  const regex = /^FAC\/C-\d{4}-\d{5}$/

  if (!regex.test(numeroFacture)) {
    return {
      valid: false,
      error: 'Format invalide. Attendu : FAC/C-YYYY-NNNNN (ex: FAC/C-2025-00123)'
    }
  }

  // Check that year is current year only for NEW invoices
  // Skip this check when editing existing invoices
  if (!isEditing) {
    const year = parseInt(numeroFacture.split('-')[1], 10)
    const currentYear = new Date().getFullYear()

    if (year !== currentYear) {
      return {
        valid: false,
        error: `L'année doit être ${currentYear} (année courante)`
      }
    }
  }

  return { valid: true, error: null }
}

/**
 * Calculate total deductions from array of deductions
 * @param {Array} deductions - Array of deduction objects with montant property
 * @returns {number} Total montant of all deductions
 */
export function calculateTotalDeductions(deductions) {
  if (!deductions || deductions.length === 0) return 0
  return deductions.reduce((total, ded) => total + (parseFloat(ded.montant) || 0), 0)
}

/**
 * Calculate deduction amount based on percentage and base montant HT
 * @param {number} montantHT - Base montant HT
 * @param {number} pourcentage - Percentage to apply
 * @returns {number} Calculated deduction amount
 */
export function calculateDeductionMontant(montantHT, pourcentage) {
  if (!montantHT || montantHT <= 0 || !pourcentage || pourcentage <= 0) return 0
  return montantHT * (pourcentage / 100)
}

/**
 * Get mode de paiement label
 * @param {string} mode - 'prelevement' or 'virement'
 * @returns {string} Label to display
 */
export function getModePaiementLabel(mode) {
  const labels = {
    prelevement: 'Prélèvement',
    virement: 'Virement'
  }
  return labels[mode] || null
}

/**
 * Get mode de paiement color (Tailwind classes)
 * @param {string} mode - 'prelevement' or 'virement'
 * @returns {string} Tailwind color class
 */
export function getModePaiementColor(mode) {
  const colors = {
    prelevement: 'text-blue-600',
    virement: 'text-orange-600'
  }
  return colors[mode] || ''
}

/**
 * Get mode de paiement background color (Tailwind classes)
 * @param {string} mode - 'prelevement' or 'virement'
 * @returns {string} Tailwind background color class
 */
export function getModePaiementBgColor(mode) {
  const colors = {
    prelevement: 'bg-blue-100 text-blue-700',
    virement: 'bg-orange-100 text-orange-700'
  }
  return colors[mode] || ''
}
