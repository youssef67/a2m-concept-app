/**
 * Etage Constants
 * Constantes et helpers pour la gestion des étages d'appartements
 */

/**
 * Generate options for the Etage dropdown
 * @param {number} nombreEtages - Nombre d'étages du plot (par défaut: 10)
 * @returns {Array} Array of {value, label} objects
 */
export function getEtageOptions(nombreEtages = 10) {
  const options = [
    { value: null, label: 'Non spécifié' },
    { value: 0, label: 'Rez-de-chaussée' }
  ]

  // Add floors from 1 to nombreEtages
  for (let i = 1; i <= nombreEtages; i++) {
    options.push({
      value: i,
      label: i === 1 ? '1er étage' : `${i}ème étage`
    })
  }

  return options
}

/**
 * Format etage value for display
 * @param {number|null} etage - Etage number
 * @returns {string} Formatted string
 */
export function formatEtage(etage) {
  if (etage === null || etage === undefined) return 'Non spécifié'
  if (etage === 0) return 'Rez-de-chaussée'
  if (etage === 1) return '1er étage'
  return `${etage}ème étage`
}
