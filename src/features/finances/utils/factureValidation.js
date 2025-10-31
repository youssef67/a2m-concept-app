/**
 * Facture Validation Utils
 * Utility functions for validating factures and paiements
 */

/**
 * Check if a facture can be paid
 * A facture can be paid if its status is 'en_attente' or 'partiellement_payee'
 * @param {Object} facture - Facture object
 * @returns {boolean} True if facture can be paid
 */
export function canFactureBePaid(facture) {
  if (!facture) return false
  return facture.statut === 'en_attente' || facture.statut === 'partiellement_payee'
}

/**
 * Check if a facture can be deleted
 * A facture can only be deleted if its status is 'en_attente' or 'annulee'
 * @param {Object} facture - Facture object
 * @returns {boolean} True if facture can be deleted
 */
export function canFactureBeDeleted(facture) {
  if (!facture) return false
  return facture.statut === 'en_attente' || facture.statut === 'annulee'
}

/**
 * Validate a single payment amount against facture's remaining amount
 * @param {number} montant - Payment amount
 * @param {number} montantRestant - Remaining amount on facture
 * @returns {Object} {valid: boolean, error: string|null}
 */
export function validatePaiementMontant(montant, montantRestant) {
  if (!montant || montant <= 0) {
    return { valid: false, error: 'Le montant doit être supérieur à 0' }
  }

  if (montant > montantRestant) {
    return {
      valid: false,
      error: `Le montant ne peut pas dépasser le montant restant (${montantRestant.toFixed(2)}€)`
    }
  }

  return { valid: true, error: null }
}

/**
 * Validate multiple payment amounts
 * @param {Array} paiementsData - Array of {factureId, montant, montantRestant, factureNumero}
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateMultiplePaiements(paiementsData) {
  const errors = []

  paiementsData.forEach((paiement) => {
    const validation = validatePaiementMontant(paiement.montant, paiement.montantRestant)
    if (!validation.valid) {
      errors.push({
        factureId: paiement.factureId,
        factureNumero: paiement.factureNumero,
        error: validation.error
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check if payment date is valid (not in future)
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Object} {valid: boolean, error: string|null}
 */
export function validatePaiementDate(date) {
  if (!date) {
    return { valid: false, error: 'La date de paiement est obligatoire' }
  }

  const paymentDate = new Date(date)
  paymentDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (paymentDate > today) {
    return { valid: false, error: 'La date de paiement ne peut pas être dans le futur' }
  }

  return { valid: true, error: null }
}

/**
 * Filter factures that can be paid
 * @param {Array} factures - Array of factures
 * @returns {Array} Filtered array of payable factures
 */
export function filterPayableFactures(factures) {
  return factures.filter(canFactureBePaid)
}

/**
 * Filter factures that can be deleted
 * @param {Array} factures - Array of factures
 * @returns {Array} Filtered array of deletable factures
 */
export function filterDeletableFactures(factures) {
  return factures.filter(canFactureBeDeleted)
}
