/**
 * Etage Constants
 * Constantes et helpers pour la gestion des étages d'appartements
 */

/**
 * Generate options for the Etage dropdown
 * @returns {Array} Array of {value, label} objects
 */
export function getEtageOptions() {
  const options = [
    { value: null, label: 'Non spécifié' },
    { value: 0, label: 'Rez-de-chaussée' }
  ]

  // Add floors 1-10
  for (let i = 1; i <= 10; i++) {
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
