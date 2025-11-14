/**
 * plinthesHelpers.js
 * Utilitaires pour la gestion des plinthes (badges, statuts)
 */

import {
  ShoppingCart,
  Package,
  Truck,
  CheckCircle
} from 'lucide-react'

// ============================================
// CONSTANTES
// ============================================

/**
 * Statuts possibles pour les plinthes
 */
export const STATUTS_PLINTHES = {
  NON_COMMANDE: 'non_commande',
  COMMANDE_EFFECTUEE: 'commande_effectuee',
  EN_COURS_LIVRAISON: 'en_cours_livraison',
  SUR_SITE: 'sur_site'
}

/**
 * Options pour le select de statut
 */
export const STATUTS_OPTIONS = [
  { value: STATUTS_PLINTHES.NON_COMMANDE, label: 'Non commandé' },
  { value: STATUTS_PLINTHES.COMMANDE_EFFECTUEE, label: 'Commandé' },
  { value: STATUTS_PLINTHES.EN_COURS_LIVRAISON, label: 'En cours de livraison' },
  { value: STATUTS_PLINTHES.SUR_SITE, label: 'Sur site' }
]

// ============================================
// CONFIGURATION VISUELLE DES BADGES
// ============================================

/**
 * Obtenir la configuration visuelle d'un statut de plinthes
 * @param {string} statut - Statut des plinthes
 * @returns {Object} - Configuration (label, couleurs, icône)
 */
export function getPlinthesStatutConfig(statut) {
  const configs = {
    [STATUTS_PLINTHES.NON_COMMANDE]: {
      label: 'Non commandé',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800',
      badgeColor: 'bg-gray-500',
      icon: ShoppingCart,
      iconColor: 'text-gray-600'
    },
    [STATUTS_PLINTHES.COMMANDE_EFFECTUEE]: {
      label: 'Commandé',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      badgeColor: 'bg-blue-500',
      icon: Package,
      iconColor: 'text-blue-600'
    },
    [STATUTS_PLINTHES.EN_COURS_LIVRAISON]: {
      label: 'En livraison',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      badgeColor: 'bg-yellow-500',
      icon: Truck,
      iconColor: 'text-yellow-600'
    },
    [STATUTS_PLINTHES.SUR_SITE]: {
      label: 'Sur site',
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      badgeColor: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    }
  }

  return configs[statut] || configs[STATUTS_PLINTHES.NON_COMMANDE]
}

/**
 * Obtenir le label d'un statut
 * @param {string} statut - Statut des plinthes
 * @returns {string} - Label du statut
 */
export function getStatutLabel(statut) {
  const config = getPlinthesStatutConfig(statut)
  return config.label
}

// ============================================
// FORMATAGE DES DATES
// ============================================

/**
 * Formater une date pour affichage
 * @param {string|Date} dateString - Date à formater
 * @returns {string} - Date formatée
 */
export function formatDatePlinthes(dateString) {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return '-'
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  } catch (err) {
    console.error('[formatDatePlinthes] Error:', err)
    return '-'
  }
}
