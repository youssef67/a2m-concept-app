/**
 * livraisonHelpers.js
 * Utilitaires pour la gestion des livraisons (badges, dates, calculs)
 */

import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  PackageCheck
} from 'lucide-react'

// ============================================
// CONSTANTES
// ============================================

/**
 * Statuts possibles pour une livraison
 */
export const STATUTS_LIVRAISON = {
  NON_COMMANDE: 'non_commande',
  COMMANDE_EFFECTUEE: 'commande_effectuee',
  EN_COURS_LIVRAISON: 'en_cours_livraison',
  COMMANDE_DISPONIBLE: 'commande_disponible',
  COMMANDE_SUR_SITE: 'commande_sur_site',
  COMMANDE_INCOMPLETE: 'commande_incomplete'
}

/**
 * Options pour le select de statut
 */
export const STATUTS_OPTIONS = [
  { value: STATUTS_LIVRAISON.NON_COMMANDE, label: 'Non commandé' },
  { value: STATUTS_LIVRAISON.COMMANDE_EFFECTUEE, label: 'Commande effectuée' },
  { value: STATUTS_LIVRAISON.COMMANDE_DISPONIBLE, label: 'Commande disponible' },
  { value: STATUTS_LIVRAISON.EN_COURS_LIVRAISON, label: 'En cours de livraison' },
  { value: STATUTS_LIVRAISON.COMMANDE_SUR_SITE, label: 'Commande sur site' },
  { value: STATUTS_LIVRAISON.COMMANDE_INCOMPLETE, label: 'Commande incomplète' }
]

// ============================================
// CONFIGURATION VISUELLE DES BADGES
// ============================================

/**
 * Obtenir la configuration visuelle d'un statut de livraison
 * @param {string} statut - Statut de la livraison
 * @returns {Object} - Configuration (label, couleurs, icône)
 */
export function getLivraisonStatutConfig(statut) {
  const configs = {
    [STATUTS_LIVRAISON.NON_COMMANDE]: {
      label: 'Non commandé',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      badgeColor: 'bg-orange-500',
      icon: ShoppingCart,
      iconColor: 'text-orange-600'
    },
    [STATUTS_LIVRAISON.COMMANDE_EFFECTUEE]: {
      label: 'Commandé',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      badgeColor: 'bg-blue-500',
      icon: Package,
      iconColor: 'text-blue-600'
    },
    [STATUTS_LIVRAISON.EN_COURS_LIVRAISON]: {
      label: 'En livraison',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-500',
      icon: Truck,
      iconColor: 'text-yellow-600'
    },
    [STATUTS_LIVRAISON.COMMANDE_DISPONIBLE]: {
      label: 'Disponible',
      color: 'bg-teal-100 text-teal-800 border-teal-200',
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-800',
      badgeColor: 'bg-teal-500',
      icon: PackageCheck,
      iconColor: 'text-teal-600'
    },
    [STATUTS_LIVRAISON.COMMANDE_SUR_SITE]: {
      label: 'Sur site',
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    [STATUTS_LIVRAISON.COMMANDE_INCOMPLETE]: {
      label: 'Incomplète',
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      badgeColor: 'bg-red-500',
      icon: AlertTriangle,
      iconColor: 'text-red-600'
    }
  }

  return configs[statut] || configs[STATUTS_LIVRAISON.NON_COMMANDE]
}

/**
 * Obtenir le label d'un statut
 * @param {string} statut - Statut de la livraison
 * @returns {string} - Label du statut
 */
export function getStatutLabel(statut) {
  const config = getLivraisonStatutConfig(statut)
  return config.label
}

// ============================================
// CALCUL DES JOURS DE RETARD
// ============================================

/**
 * Calculer les jours de retard d'une livraison
 * @param {Object} livraison - Objet livraison avec statut et date_livraison_prevue
 * @returns {number} - Nombre de jours de retard (0 si pas de retard)
 */
export function getJoursRetard(livraison) {
  if (!livraison) return 0

  // Calcul uniquement pour les livraisons en cours
  if (
    livraison.statut === STATUTS_LIVRAISON.EN_COURS_LIVRAISON &&
    livraison.date_livraison_prevue
  ) {
    const datePrevue = new Date(livraison.date_livraison_prevue)
    const aujourdhui = new Date()

    // Mettre à minuit pour comparer juste les dates
    datePrevue.setHours(0, 0, 0, 0)
    aujourdhui.setHours(0, 0, 0, 0)

    if (aujourdhui > datePrevue) {
      const diffTime = aujourdhui - datePrevue
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
  }

  return 0
}

/**
 * Vérifier si une livraison est en retard
 * @param {Object} livraison - Objet livraison
 * @returns {boolean} - true si en retard
 */
export function isLivraisonEnRetard(livraison) {
  return getJoursRetard(livraison) > 0
}

// ============================================
// FORMATAGE DES DATES
// ============================================

/**
 * Formater une date pour affichage
 * @param {string|Date} dateString - Date à formater
 * @param {string} format - Format ('short', 'long', 'medium')
 * @returns {string} - Date formatée
 */
export function formatDateLivraison(dateString, format = 'long') {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return '-'
    }

    const formats = {
      short: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      },
      medium: {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      },
      long: {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    }

    return new Intl.DateTimeFormat('fr-FR', formats[format] || formats.long).format(date)
  } catch (err) {
    console.error('[formatDateLivraison] Error:', err)
    return '-'
  }
}

/**
 * Formater une date avec heure pour l'historique
 * @param {string|Date} dateString - Date à formater
 * @returns {string} - Date formatée avec heure
 */
export function formatDateHistorique(dateString) {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (err) {
    console.error('[formatDateHistorique] Error:', err)
    return '-'
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Obtenir les champs requis pour un statut donné
 * @param {string} statut - Statut de la livraison
 * @returns {Array<string>} - Liste des champs requis
 */
export function getRequiredFieldsForStatut(statut) {
  const requiredFields = {
    [STATUTS_LIVRAISON.NON_COMMANDE]: [],
    [STATUTS_LIVRAISON.COMMANDE_EFFECTUEE]: ['date_commande'],
    [STATUTS_LIVRAISON.EN_COURS_LIVRAISON]: ['date_livraison_prevue'],
    [STATUTS_LIVRAISON.COMMANDE_DISPONIBLE]: [],
    [STATUTS_LIVRAISON.COMMANDE_SUR_SITE]: ['date_reception'],
    [STATUTS_LIVRAISON.COMMANDE_INCOMPLETE]: ['date_reception', 'note_incomplete']
  }

  return requiredFields[statut] || []
}

/**
 * Valider les données d'un formulaire de mise à jour de statut
 * @param {string} statut - Statut sélectionné
 * @param {Object} formData - Données du formulaire
 * @returns {{valid: boolean, errors: Object}} - Résultat de la validation
 */
export function validateStatutForm(statut, formData) {
  const errors = {}
  const requiredFields = getRequiredFieldsForStatut(statut)

  requiredFields.forEach(field => {
    if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
      errors[field] = 'Ce champ est obligatoire'
    }
  })

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============================================
// BADGE LABEL AVEC RETARD
// ============================================

/**
 * Obtenir le label du badge avec indication de retard si applicable
 * @param {Object} livraison - Objet livraison
 * @returns {string} - Label du badge
 */
export function getBadgeLabel(livraison) {
  if (!livraison) return 'Non commandé'

  const config = getLivraisonStatutConfig(livraison.statut)
  const joursRetard = getJoursRetard(livraison)

  if (joursRetard > 0) {
    return `${config.label} - ${joursRetard}j retard`
  }

  return config.label
}
