/**
 * Contact utility functions for formatting, validation, and display
 */

// ============================================
// Display name helpers
// ============================================

/**
 * Get display name for a contact
 * @param {Object} contact - Contact object
 * @returns {string} Display name
 */
export function getContactDisplayName(contact) {
  if (!contact) return ''

  if (contact.contact_type === 'professionnel') {
    return contact.company_name || 'Entreprise sans nom'
  }

  if (contact.contact_type === 'particulier') {
    const firstName = contact.first_name || ''
    const lastName = contact.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Contact sans nom'
  }

  return 'Contact'
}

/**
 * Get full name for a person (contact or contact person)
 * @param {Object} person - Person object with first_name and last_name
 * @returns {string} Full name
 */
export function getPersonFullName(person) {
  if (!person) return ''
  const firstName = person.first_name || ''
  const lastName = person.last_name || ''
  return `${firstName} ${lastName}`.trim() || 'Personne sans nom'
}

// ============================================
// Type and status helpers
// ============================================

/**
 * Get label for contact type
 * @param {string} type - 'client' or 'fournisseur'
 * @returns {string} Label
 */
export function getContactTypeLabel(type) {
  const labels = {
    client: 'Client',
    fournisseur: 'Fournisseur'
  }
  return labels[type] || type
}

/**
 * Get label for contact entity type
 * @param {string} contactType - 'particulier' or 'professionnel'
 * @returns {string} Label
 */
export function getContactEntityTypeLabel(contactType) {
  const labels = {
    particulier: 'Particulier',
    professionnel: 'Professionnel'
  }
  return labels[contactType] || contactType
}

/**
 * Get badge color for contact type
 * @param {string} type - 'client' or 'fournisseur'
 * @returns {string} Tailwind color classes
 */
export function getContactTypeBadgeColor(type) {
  const colors = {
    client: 'bg-blue-100 text-blue-800',
    fournisseur: 'bg-green-100 text-green-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

/**
 * Get badge color for contact entity type
 * @param {string} contactType - 'particulier' or 'professionnel'
 * @returns {string} Tailwind color classes
 */
export function getContactEntityTypeBadgeColor(contactType) {
  const colors = {
    particulier: 'bg-purple-100 text-purple-800',
    professionnel: 'bg-orange-100 text-orange-800'
  }
  return colors[contactType] || 'bg-gray-100 text-gray-800'
}

/**
 * Get label for payment term
 * @param {string} delaiPaiement - 'immediat', '30_jours', '45_jours', or '60_jours'
 * @returns {string} Label
 */
export function getPaymentTermLabel(delaiPaiement) {
  const labels = {
    immediat: 'Immédiat',
    '30_jours': '30 jours',
    '45_jours': '45 jours',
    '60_jours': '60 jours'
  }
  return labels[delaiPaiement] || 'Non spécifié'
}

// ============================================
// Phone number helpers
// ============================================

/**
 * Format phone number to French format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Format to French standard: XX XX XX XX XX
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }

  // If it has country code (+33), format accordingly
  if (cleaned.length === 11 && cleaned.startsWith('33')) {
    const withoutCountryCode = cleaned.substring(2)
    return `+33 ${withoutCountryCode.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`
  }

  // Return as is if format doesn't match
  return phone
}

/**
 * Validate French phone number
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
export function isValidPhoneNumber(phone) {
  if (!phone) return false

  const cleaned = phone.replace(/\D/g, '')

  // French phone: 10 digits starting with 0
  // Or with country code: 11 digits starting with 33
  return (
    (cleaned.length === 10 && cleaned.startsWith('0')) ||
    (cleaned.length === 11 && cleaned.startsWith('33'))
  )
}

/**
 * Normalize phone number for storage (remove spaces and formatting)
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return ''
  return phone.replace(/\s+/g, '')
}

// ============================================
// Address helpers
// ============================================

/**
 * Format address to single line
 * @param {Object} address - Address object
 * @returns {string} Formatted address
 */
export function formatAddress(address) {
  if (!address) return ''

  const parts = [
    address.address_line1,
    address.address_line2,
    address.postal_code,
    address.city,
    address.country !== 'France' ? address.country : null
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Format address to multiple lines
 * @param {Object} address - Address object
 * @returns {Array<string>} Array of address lines
 */
export function formatAddressMultiline(address) {
  if (!address) return []

  const lines = [address.address_line1]

  if (address.address_line2) {
    lines.push(address.address_line2)
  }

  lines.push(`${address.postal_code} ${address.city}`)

  if (address.country && address.country !== 'France') {
    lines.push(address.country)
  }

  return lines.filter(Boolean)
}

// ============================================
// Email validation
// ============================================

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
export function isValidEmail(email) {
  if (!email) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================
// Form data helpers
// ============================================

/**
 * Prepare contact data for API submission
 * @param {Object} formData - Form data
 * @returns {Object} Prepared contact data
 */
export function prepareContactData(formData) {
  const contactData = {
    type: formData.type,
    contact_type: formData.contact_type,
    phone: normalizePhoneNumber(formData.phone),
    email: formData.email || null,
    notes: formData.notes || null,
    delai_paiement: formData.delai_paiement || 'immediat',
    is_sous_traitant: formData.is_sous_traitant || false
  }

  if (formData.contact_type === 'professionnel') {
    contactData.company_name = formData.company_name
  } else {
    contactData.first_name = formData.first_name
    contactData.last_name = formData.last_name
  }

  return contactData
}

/**
 * Prepare address data for API submission
 * @param {Object} addressData - Address form data
 * @returns {Object|null} Prepared address data or null if incomplete
 */
export function prepareAddressData(addressData) {
  if (!addressData || !addressData.address_line1 || !addressData.city || !addressData.postal_code) {
    return null
  }

  return {
    address_line1: addressData.address_line1,
    address_line2: addressData.address_line2 || null,
    city: addressData.city,
    postal_code: addressData.postal_code,
    country: addressData.country || 'France'
  }
}

/**
 * Prepare contact persons data for API submission
 * @param {Array} persons - Contact persons form data
 * @returns {Array} Prepared contact persons data
 */
export function prepareContactPersonsData(persons) {
  if (!Array.isArray(persons) || persons.length === 0) {
    return []
  }

  return persons
    .filter(person =>
      person.first_name &&
      person.last_name &&
      person.phone &&
      person.email
    )
    .map(person => ({
      first_name: person.first_name,
      last_name: person.last_name,
      phone: normalizePhoneNumber(person.phone),
      email: person.email,
      position: person.position || null
    }))
}

// ============================================
// Search and filter helpers
// ============================================

/**
 * Search contacts by query string
 * @param {Array} contacts - Array of contacts
 * @param {string} query - Search query
 * @returns {Array} Filtered contacts
 */
export function searchContacts(contacts, query) {
  if (!query || !query.trim()) return contacts

  const lowerQuery = query.toLowerCase().trim()

  return contacts.filter(contact => {
    // Search in display name
    const displayName = getContactDisplayName(contact).toLowerCase()
    if (displayName.includes(lowerQuery)) return true

    // Search in phone
    if (contact.phone && contact.phone.includes(lowerQuery)) return true

    // Search in email
    if (contact.email && contact.email.toLowerCase().includes(lowerQuery)) return true

    // Search in address
    if (contact.address) {
      const address = formatAddress(contact.address).toLowerCase()
      if (address.includes(lowerQuery)) return true
    }

    // Search in contact persons
    if (contact.contact_persons && contact.contact_persons.length > 0) {
      return contact.contact_persons.some(person => {
        const personName = getPersonFullName(person).toLowerCase()
        return personName.includes(lowerQuery) ||
               (person.email && person.email.toLowerCase().includes(lowerQuery)) ||
               (person.phone && person.phone.includes(lowerQuery))
      })
    }

    return false
  })
}

/**
 * Filter contacts by type
 * @param {Array} contacts - Array of contacts
 * @param {string} type - 'client', 'fournisseur', or 'all'
 * @returns {Array} Filtered contacts
 */
export function filterContactsByType(contacts, type) {
  if (!type || type === 'all') return contacts
  return contacts.filter(contact => contact.type === type)
}

/**
 * Sort contacts by name
 * @param {Array} contacts - Array of contacts
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted contacts
 */
export function sortContactsByName(contacts, order = 'asc') {
  return [...contacts].sort((a, b) => {
    const nameA = getContactDisplayName(a).toLowerCase()
    const nameB = getContactDisplayName(b).toLowerCase()

    if (order === 'asc') {
      return nameA.localeCompare(nameB, 'fr')
    } else {
      return nameB.localeCompare(nameA, 'fr')
    }
  })
}
