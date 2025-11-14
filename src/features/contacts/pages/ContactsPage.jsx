import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import StickyPageHeader from '../../../shared/components/layout/StickyPageHeader'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import Pagination from '../../../shared/components/ui/Pagination'
import ContactCard from '../components/ContactCard'
import ContactModal from '../components/ContactModal'
import ContactDetailModal from '../components/ContactDetailModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useContacts } from '../hooks/useContacts'
import { searchContacts, getContactTypeLabel } from '../utils/contactHelpers'
import { useToast } from '../../../shared/hooks/useToast'

// Nombre de contacts par page
const ITEMS_PER_PAGE = 9

export default function ContactsPage() {
  const navigate = useNavigate()

  // State
  const [activeTab, setActiveTab] = useState('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSousTraitantsOnly, setShowSousTraitantsOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hooks
  const {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact
  } = useContacts()
  const { showToast } = useToast()

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    // Filter by active tab (type)
    let typeFiltered = contacts.filter(contact => contact.type === activeTab)

    // Filter by sous-traitant if checkbox is enabled (only for fournisseurs)
    if (activeTab === 'fournisseur' && showSousTraitantsOnly) {
      typeFiltered = typeFiltered.filter(contact => contact.is_sous_traitant === true)
    }

    // Apply search
    return searchContacts(typeFiltered, searchQuery)
  }, [contacts, activeTab, searchQuery, showSousTraitantsOnly])

  // Calculate pagination
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE)

  // Get contacts for current page
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredContacts.slice(startIndex, endIndex)
  }, [filteredContacts, currentPage])

  // Reset to page 1 when tab, search, or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, showSousTraitantsOnly])

  // Reset sous-traitant filter when switching tabs
  useEffect(() => {
    setShowSousTraitantsOnly(false)
  }, [activeTab])

  // Count contacts by type
  const clientsCount = contacts.filter(c => c.type === 'client').length
  const fournisseursCount = contacts.filter(c => c.type === 'fournisseur').length

  // Tabs configuration
  const tabs = [
    { id: 'client', label: 'Clients', count: clientsCount },
    { id: 'fournisseur', label: 'Fournisseurs', count: fournisseursCount }
  ]

  // Handlers
  const handleAddContact = () => {
    setSelectedContact(null)
    setIsContactModalOpen(true)
  }

  const handleViewContact = (contact) => {
    setSelectedContact(contact)
    setIsDetailModalOpen(true)
  }

  const handleEditContact = (contact) => {
    setSelectedContact(contact)
    setIsContactModalOpen(true)
  }

  const handleDeleteContact = (contact) => {
    setSelectedContact(contact)
    setIsDeleteModalOpen(true)
  }

  const handleContactModalClose = () => {
    setIsContactModalOpen(false)
    setSelectedContact(null)
  }

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false)
    setSelectedContact(null)
  }

  const handleDetailModalEdit = () => {
    setIsDetailModalOpen(false)
    setIsContactModalOpen(true)
  }

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false)
    setSelectedContact(null)
  }

  const handleContactSubmit = async (contactData, addressData, contactPersons) => {
    setIsSubmitting(true)

    try {
      let result
      if (selectedContact) {
        // Update existing contact
        result = await updateContact(
          selectedContact.id,
          contactData,
          addressData,
          contactPersons
        )
        if (result.success) {
          showToast('Contact modifié avec succès', 'success')
          handleContactModalClose()
        }
      } else {
        // Create new contact
        result = await createContact(contactData, addressData, contactPersons)
        if (result.success) {
          showToast('Contact créé avec succès', 'success')
          handleContactModalClose()
        }
      }
    } catch (err) {
      console.error('Error submitting contact:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedContact) return

    setIsSubmitting(true)

    try {
      const result = await deleteContact(selectedContact.id)
      if (result.success) {
        showToast('Contact supprimé avec succès', 'success')
      } else if (result.error) {
        // Check for foreign key constraint violation
        if (result.error.code === '23503') {
          const contactType = selectedContact.type === 'client' ? 'client' : 'fournisseur'
          showToast(
            `Impossible de supprimer ce ${contactType} car il est utilisé dans des chantiers ou des factures. Veuillez d'abord supprimer les éléments associés.`,
            'error'
          )
        } else {
          showToast('Erreur lors de la suppression du contact', 'error')
        }
      }
    } catch {
      showToast('Erreur lors de la suppression du contact', 'error')
    } finally {
      setIsSubmitting(false)
      handleDeleteModalClose()
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {/* Fixed Header */}
        <StickyPageHeader showBackButton={false}>
          {/* Left: Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-xs md:text-sm text-gray-600">
              Gérez vos clients et fournisseurs
            </p>
          </div>

          {/* Right: Create button */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleAddContact}
              className="h-[48px]"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">Nouveau {getContactTypeLabel(activeTab).toLowerCase()}</span>
            </Button>
          </div>
        </StickyPageHeader>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Search bar and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Sous-traitant filter (only visible for fournisseurs) */}
        {activeTab === 'fournisseur' && (
          <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-white">
            <input
              type="checkbox"
              id="filter-sous-traitants"
              checked={showSousTraitantsOnly}
              onChange={(e) => setShowSousTraitantsOnly(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label
              htmlFor="filter-sous-traitants"
              className="text-sm font-medium text-gray-700 whitespace-nowrap cursor-pointer"
            >
              Sous-traitants uniquement
            </label>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Une erreur est survenue lors du chargement des contacts.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Contacts list */}
      {!loading && !error && (
        <>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery
                  ? 'Aucun contact trouvé'
                  : `Aucun ${getContactTypeLabel(activeTab).toLowerCase()}`}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : `Commencez par ajouter votre premier ${getContactTypeLabel(
                      activeTab
                    ).toLowerCase()}`}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                {paginatedContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onView={handleViewContact}
                    onEdit={handleEditContact}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-6"
              />
            </>
          )}
        </>
      )}

      {/* Contact Detail Modal */}
      <ContactDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        onEdit={handleDetailModalEdit}
        contact={selectedContact}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={handleContactModalClose}
        onSubmit={handleContactSubmit}
        contact={selectedContact}
        defaultType={activeTab}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        contact={selectedContact}
        isDeleting={isSubmitting}
      />
      </div>
    </AppLayout>
  )
}
