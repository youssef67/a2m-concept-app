import { supabase } from '../../../lib/supabaseClient'

/**
 * Contacts Service - CRUD operations for contacts, addresses, and contact persons
 */

// ============================================
// CONTACTS - Main CRUD operations
// ============================================

/**
 * Get all contacts with their addresses
 * @param {string} type - Filter by type: 'client', 'fournisseur', or null for all
 * @returns {Promise<{data: Array, error: Object}>}
 */
export async function getAllContacts(type = null) {
  try {
    let query = supabase
      .from('contacts')
      .select(`
        *,
        address:contact_addresses(*),
        contact_persons(*)
      `)
      .order('created_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return { data: null, error }
  }
}

/**
 * Get a single contact by ID with all related data
 * @param {string} contactId - Contact UUID
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function getContactById(contactId) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        address:contact_addresses(*),
        contact_persons(*)
      `)
      .eq('id', contactId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching contact:', error)
    return { data: null, error }
  }
}

/**
 * Create a new contact with optional address and contact persons
 * @param {Object} contactData - Contact data
 * @param {Object} addressData - Address data (optional)
 * @param {Array} contactPersons - Array of contact persons (optional, for professionnel)
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function createContact(contactData, addressData = null, contactPersons = []) {
  try {
    // 1. Create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (contactError) throw contactError

    // 2. Create address if provided
    if (addressData) {
      const { error: addressError } = await supabase
        .from('contact_addresses')
        .insert({
          contact_id: contact.id,
          ...addressData
        })

      if (addressError) throw addressError
    }

    // 3. Create contact persons if provided (for professionnel)
    if (contactPersons.length > 0) {
      const personsToInsert = contactPersons.map(person => ({
        contact_id: contact.id,
        ...person
      }))

      const { error: personsError } = await supabase
        .from('contact_persons')
        .insert(personsToInsert)

      if (personsError) throw personsError
    }

    // 4. Fetch complete contact data
    return await getContactById(contact.id)
  } catch (error) {
    console.error('Error creating contact:', error)
    return { data: null, error }
  }
}

/**
 * Update a contact and related data
 * @param {string} contactId - Contact UUID
 * @param {Object} contactData - Updated contact data
 * @param {Object} addressData - Updated address data (optional)
 * @param {Array} contactPersons - Updated array of contact persons (optional)
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function updateContact(contactId, contactData, addressData = null, contactPersons = null) {
  try {
    // 1. Update contact
    const { error: contactError } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', contactId)

    if (contactError) throw contactError

    // 2. Update or create address if provided
    if (addressData) {
      // Check if address exists
      const { data: existingAddress } = await supabase
        .from('contact_addresses')
        .select('id')
        .eq('contact_id', contactId)
        .single()

      if (existingAddress) {
        // Update existing address
        const { error: addressError } = await supabase
          .from('contact_addresses')
          .update(addressData)
          .eq('contact_id', contactId)

        if (addressError) throw addressError
      } else {
        // Create new address
        const { error: addressError } = await supabase
          .from('contact_addresses')
          .insert({
            contact_id: contactId,
            ...addressData
          })

        if (addressError) throw addressError
      }
    }

    // 3. Update contact persons if provided
    if (contactPersons !== null) {
      // Delete existing contact persons
      const { error: deleteError } = await supabase
        .from('contact_persons')
        .delete()
        .eq('contact_id', contactId)

      if (deleteError) throw deleteError

      // Insert new contact persons
      if (contactPersons.length > 0) {
        const personsToInsert = contactPersons.map(person => ({
          contact_id: contactId,
          ...person
        }))

        const { error: personsError } = await supabase
          .from('contact_persons')
          .insert(personsToInsert)

        if (personsError) throw personsError
      }
    }

    // 4. Fetch updated contact data
    return await getContactById(contactId)
  } catch (error) {
    console.error('Error updating contact:', error)
    return { data: null, error }
  }
}

/**
 * Delete a contact (cascade deletes address and contact persons)
 * @param {string} contactId - Contact UUID
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export async function deleteContact(contactId) {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    // Return error without logging (handled in UI)
    return { success: false, error }
  }
}

// ============================================
// CONTACT PERSONS - Additional operations
// ============================================

/**
 * Add a contact person to a professionnel contact
 * @param {string} contactId - Contact UUID
 * @param {Object} personData - Contact person data
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function addContactPerson(contactId, personData) {
  try {
    const { data, error } = await supabase
      .from('contact_persons')
      .insert({
        contact_id: contactId,
        ...personData
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error adding contact person:', error)
    return { data: null, error }
  }
}

/**
 * Update a contact person
 * @param {string} personId - Contact person UUID
 * @param {Object} personData - Updated person data
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function updateContactPerson(personId, personData) {
  try {
    const { data, error } = await supabase
      .from('contact_persons')
      .update(personData)
      .eq('id', personId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating contact person:', error)
    return { data: null, error }
  }
}

/**
 * Delete a contact person
 * @param {string} personId - Contact person UUID
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export async function deleteContactPerson(personId) {
  try {
    const { error } = await supabase
      .from('contact_persons')
      .delete()
      .eq('id', personId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting contact person:', error)
    return { success: false, error }
  }
}
