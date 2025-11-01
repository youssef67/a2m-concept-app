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
