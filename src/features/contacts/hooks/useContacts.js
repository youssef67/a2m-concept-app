import { useState, useEffect, useCallback } from 'react'
import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  addContactPerson,
  updateContactPerson,
  deleteContactPerson
} from '../services/contactsService'

/**
 * Custom hook for managing contacts
 * @param {string} type - Optional filter by type: 'client' or 'fournisseur'
 */
export function useContacts(type = null) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await getAllContacts(type)

    if (fetchError) {
      setError(fetchError)
      setContacts([])
    } else {
      setContacts(data || [])
    }

    setLoading(false)
  }, [type])

  // Load contacts on mount and when type changes
  useEffect(() => {
    fetchContacts()
  }, [type, fetchContacts])

  // Create new contact
  const handleCreateContact = async (contactData, addressData = null, contactPersons = []) => {
    setError(null)

    const { data, error: createError } = await createContact(
      contactData,
      addressData,
      contactPersons
    )

    if (createError) {
      setError(createError)
      return { success: false, error: createError }
    }

    // Add new contact to state
    setContacts(prev => [data, ...prev])

    return { success: true, data }
  }

  // Update existing contact
  const handleUpdateContact = async (contactId, contactData, addressData = null, contactPersons = null) => {
    setError(null)

    const { data, error: updateError } = await updateContact(
      contactId,
      contactData,
      addressData,
      contactPersons
    )

    if (updateError) {
      setError(updateError)
      return { success: false, error: updateError }
    }

    // Update contact in state
    setContacts(prev =>
      prev.map(contact => contact.id === contactId ? data : contact)
    )

    return { success: true, data }
  }

  // Delete contact
  const handleDeleteContact = async (contactId) => {
    const { success, error: deleteError } = await deleteContact(contactId)

    if (!success) {
      // Don't set global error state - error is handled in UI with toast
      return { success: false, error: deleteError }
    }

    // Remove contact from state
    setContacts(prev => prev.filter(contact => contact.id !== contactId))

    return { success: true }
  }

  // Get single contact by ID
  const getContact = async (contactId) => {
    setError(null)

    const { data, error: fetchError } = await getContactById(contactId)

    if (fetchError) {
      setError(fetchError)
      return { data: null, error: fetchError }
    }

    return { data, error: null }
  }

  // Add contact person to professionnel contact
  const handleAddContactPerson = async (contactId, personData) => {
    setError(null)

    const { data, error: addError } = await addContactPerson(contactId, personData)

    if (addError) {
      setError(addError)
      return { success: false, error: addError }
    }

    // Update contact in state to include new person
    setContacts(prev =>
      prev.map(contact => {
        if (contact.id === contactId) {
          return {
            ...contact,
            contact_persons: [...(contact.contact_persons || []), data]
          }
        }
        return contact
      })
    )

    return { success: true, data }
  }

  // Update contact person
  const handleUpdateContactPerson = async (personId, personData) => {
    setError(null)

    const { data, error: updateError } = await updateContactPerson(personId, personData)

    if (updateError) {
      setError(updateError)
      return { success: false, error: updateError }
    }

    // Update person in state
    setContacts(prev =>
      prev.map(contact => ({
        ...contact,
        contact_persons: contact.contact_persons?.map(person =>
          person.id === personId ? data : person
        )
      }))
    )

    return { success: true, data }
  }

  // Delete contact person
  const handleDeleteContactPerson = async (personId, contactId) => {
    setError(null)

    const { success, error: deleteError } = await deleteContactPerson(personId)

    if (!success) {
      setError(deleteError)
      return { success: false, error: deleteError }
    }

    // Remove person from state
    setContacts(prev =>
      prev.map(contact => {
        if (contact.id === contactId) {
          return {
            ...contact,
            contact_persons: contact.contact_persons?.filter(person => person.id !== personId)
          }
        }
        return contact
      })
    )

    return { success: true }
  }

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact: handleCreateContact,
    updateContact: handleUpdateContact,
    deleteContact: handleDeleteContact,
    getContact,
    addContactPerson: handleAddContactPerson,
    updateContactPerson: handleUpdateContactPerson,
    deleteContactPerson: handleDeleteContactPerson
  }
}
