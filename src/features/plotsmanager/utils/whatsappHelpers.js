/**
 * WhatsApp Helpers
 * Fonctions utilitaires pour l'envoi de messages WhatsApp
 */

/**
 * Format a phone number for WhatsApp (French format)
 * @param {string} phone - Phone number (10 digits, may start with 0)
 * @returns {string} - Formatted phone number with country code (33...)
 */
export function formatPhoneForWhatsApp(phone) {
  if (!phone) return ''

  // Remove all non-digit characters
  let formattedPhone = phone.replace(/\D/g, '')

  // If starts with 0, replace with 33
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '33' + formattedPhone.substring(1)
  }

  // If 9 digits, add 33 prefix
  if (formattedPhone.length === 9) {
    formattedPhone = '33' + formattedPhone
  }

  return formattedPhone
}

/**
 * Build WhatsApp message for apartments
 * @param {Array} appartements - Array of apartments with their data
 * @param {Object} documentsDataMap - Map of appartementId -> [{intitule, url}, ...]
 * @returns {string} - Formatted WhatsApp message
 */
export function buildWhatsAppMessage(appartements, documentsDataMap = {}) {
  let message = 'Bonjour,\n\n'
  message += 'Voici les détails des appartements :\n\n'

  appartements.forEach((appt, index) => {
    message += `Appartement concerné : ${appt.nom}\n`

    // Add documents info (multiple documents)
    const documents = documentsDataMap[appt.id]
    if (documents && documents.length > 0) {
      documents.forEach((doc) => {
        message += `📄 ${doc.intitule} : ${doc.url}\n`
      })
    } else {
      message += `📄 Aucun document\n`
    }

    // Add separator between apartments (except last one)
    if (index < appartements.length - 1) {
      message += '\n─────────────────────\n\n'
    }
  })

  message += '\n\nCordialement'

  return message
}

/**
 * Open WhatsApp with pre-filled message
 * @param {string} phone - Phone number (will be formatted)
 * @param {string} message - Message text
 */
export function openWhatsApp(phone, message) {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  const encodedMessage = encodeURIComponent(message)
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

  window.open(whatsappUrl, '_blank')
}

/**
 * Copy message to clipboard
 * @param {string} message - Message to copy
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function copyMessageToClipboard(message) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(message)
      return true
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = message
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }
  } catch (err) {
    console.error('Error copying to clipboard:', err)
    return false
  }
}

/**
 * Get first task with status "a_faire" from apartment tasks
 * @param {Array} taches - Array of tasks
 * @returns {Object|null} - First task with status "a_faire" or null
 */
export function getFirstTacheAFaire(taches) {
  if (!taches || taches.length === 0) return null

  const tachesAFaire = taches
    .filter(t => t.statut === 'a_faire')
    .sort((a, b) => a.ordre - b.ordre)

  return tachesAFaire.length > 0 ? tachesAFaire[0] : null
}

/**
 * Check if appartement has tasks with status "en_cours"
 * @param {Array} taches - Array of tasks
 * @returns {boolean} - True if appartement has tasks in progress
 */
export function hasTasksEnCours(taches) {
  if (!taches || taches.length === 0) return false
  return taches.some(t => t.statut === 'en_cours')
}

/**
 * Get all tasks with status "a_faire" sorted by ordre
 * @param {Array} taches - Array of tasks
 * @returns {Array} - Tasks with status "a_faire" sorted
 */
export function getTachesAFaire(taches) {
  if (!taches || taches.length === 0) return []

  return taches
    .filter(t => t.statut === 'a_faire')
    .sort((a, b) => a.ordre - b.ordre)
}
