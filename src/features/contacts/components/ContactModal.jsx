import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import ContactForm from './ContactForm'
import { prepareContactData, prepareAddressData, prepareContactPersonsData } from '../utils/contactHelpers'

/**
 * Modal for creating or editing a contact
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {function} onSubmit - Submit handler
 * @param {Object} contact - Contact data for editing (null for creating)
 * @param {string} defaultType - Default type ('client' or 'fournisseur')
 * @param {boolean} isSubmitting - Whether form is submitting
 */
export default function ContactModal({
  isOpen,
  onClose,
  onSubmit,
  contact = null,
  defaultType = 'client',
  isSubmitting = false
}) {
  const [formData, setFormData] = useState(null)
  const [errors, setErrors] = useState({})

  // Initialize form data when modal opens or contact changes
  useEffect(() => {
    if (isOpen) {
      if (contact) {
        // Editing existing contact
        setFormData({
          type: contact.type,
          contact_type: contact.contact_type,
          company_name: contact.company_name || '',
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          notes: contact.notes || '',
          delai_paiement: contact.delai_paiement || 'immediat',
          address: contact.address ? {
            address_line1: contact.address.address_line1 || '',
            address_line2: contact.address.address_line2 || '',
            city: contact.address.city || '',
            postal_code: contact.address.postal_code || '',
            country: contact.address.country || 'France'
          } : {
            address_line1: '',
            address_line2: '',
            city: '',
            postal_code: '',
            country: 'France'
          },
          contact_persons: contact.contact_persons || []
        })
      } else {
        // Creating new contact
        // Professionnel par défaut pour tous les contacts
        const initialContactType = 'professionnel'

        setFormData({
          type: defaultType,
          contact_type: initialContactType,
          company_name: '',
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          notes: '',
          delai_paiement: 'immediat',
          address: {
            address_line1: '',
            address_line2: '',
            city: '',
            postal_code: '',
            country: 'France'
          },
          contact_persons: []
        })
      }
      setErrors({})
    }
  }, [isOpen, contact, defaultType])

  const handleSubmit = async () => {
    if (!formData) return

    // Validate form
    const newErrors = validateForm(formData)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Prepare data for API
    const contactData = prepareContactData(formData)
    const addressData = prepareAddressData(formData.address)
    const contactPersons = formData.contact_type === 'professionnel'
      ? prepareContactPersonsData(formData.contact_persons)
      : []

    // Call submit handler
    await onSubmit(contactData, addressData, contactPersons)
  }

  const validateForm = (data) => {
    const errors = {}

    // Type validation
    if (!data.type) {
      errors.type = 'Type requis'
    }

    if (!data.contact_type) {
      errors.contact_type = 'Type de contact requis'
    }

    // Professionnel validation
    if (data.contact_type === 'professionnel') {
      if (!data.company_name || !data.company_name.trim()) {
        errors.company_name = 'Nom de l\'entreprise requis'
      }
    }

    // Particulier validation
    if (data.contact_type === 'particulier') {
      if (!data.first_name || !data.first_name.trim()) {
        errors.first_name = 'Prénom requis'
      }
      if (!data.last_name || !data.last_name.trim()) {
        errors.last_name = 'Nom requis'
      }
    }

    return errors
  }

  const modalTitle = contact
    ? 'Modifier le contact'
    : `Nouveau ${defaultType === 'client' ? 'client' : 'fournisseur'}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      closeOnBackdropClick={!isSubmitting}
    >
      {formData && (
        <ContactForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          isEditing={!!contact}
          defaultType={defaultType}
        />
      )}
    </Modal>
  )
}
