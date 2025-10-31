/**
 * FacturesPage - Main finances page with tabs
 * MVP version with simplified UI
 */

import React, { useState, useMemo, useRef } from 'react'
import { Euro, Plus, Search, FileText, Calendar, User, Paperclip, Upload, Download, Trash2, Eye, MoreVertical, Edit, Trash, CreditCard, ChevronDown, Settings } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import Spinner from '../../../shared/components/ui/Spinner'
import Alert from '../../../shared/components/ui/Alert'
import Modal from '../../../shared/components/ui/Modal'
import PaiementModal from '../components/PaiementModal'
import BulkActionsToolbar from '../components/BulkActionsToolbar'
import MultiPaiementModal from '../components/MultiPaiementModal'
import DeleteMultipleModal from '../components/DeleteMultipleModal'
import { useFactures } from '../hooks/useFactures'
import { useContacts } from '../hooks/useContacts'
import { useDocuments } from '../hooks/useDocuments'
import { useToast } from '../../../shared/hooks/useToast'
import {
  formatDate,
  formatCurrency,
  getStatutLabel,
  getStatutColor,
  getContactDisplayName,
  searchFactures,
  validateFactureData,
  calculateDateEcheance
} from '../utils/factureHelpers'
import { canFactureBePaid, canFactureBeDeleted } from '../utils/factureValidation'

export default function FacturesPage() {
  // State
  const [activeTab, setActiveTab] = useState('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFacture, setEditingFacture] = useState(null)
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState(null)
  const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false)
  const [selectedPaiementFacture, setSelectedPaiementFacture] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const fileInputRef = useRef(null)

  // Bulk actions states
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedFactureIds, setSelectedFactureIds] = useState(new Set())
  const [isMultiPaiementModalOpen, setIsMultiPaiementModalOpen] = useState(false)
  const [isDeleteMultipleModalOpen, setIsDeleteMultipleModalOpen] = useState(false)
  const [showBulkMenu, setShowBulkMenu] = useState(false)

  // Form controlled states for auto-calculation
  const [selectedContactId, setSelectedContactId] = useState('')
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0])
  const [dateEcheance, setDateEcheance] = useState('')

  // Hooks
  const { factures, loading, error, createFacture, updateFacture, deleteFacture, deleteMultipleFactures, refreshFactures } = useFactures()
  const { contacts } = useContacts()
  const { documents, loading: docsLoading, uploading, upload, download, remove } = useDocuments(selectedFacture?.id)
  const { showToast } = useToast()

  // Auto-calculate date échéance when contact or date émission changes
  React.useEffect(() => {
    if (selectedContactId && dateEmission && isModalOpen && !editingFacture) {
      const contact = contacts.find(c => c.id === selectedContactId)
      if (contact?.delai_paiement) {
        const calculatedDate = calculateDateEcheance(dateEmission, contact.delai_paiement)
        setDateEcheance(calculatedDate)
      }
    }
  }, [selectedContactId, dateEmission, contacts, isModalOpen, editingFacture])

  // Tabs configuration with counts
  const tabs = useMemo(() => {
    return [
      {
        id: 'client',
        label: 'Clients',
        count: factures.filter(f => f.type === 'client').length
      },
      {
        id: 'fournisseur',
        label: 'Fournisseurs',
        count: factures.filter(f => f.type === 'fournisseur').length
      }
    ]
  }, [factures])

  // Filter and search factures
  const filteredFactures = useMemo(() => {
    const typeFiltered = factures.filter(facture => facture.type === activeTab)
    return searchFactures(typeFiltered, searchQuery)
  }, [factures, activeTab, searchQuery])

  // Get selected factures objects
  const selectedFactures = useMemo(() => {
    return filteredFactures.filter(f => selectedFactureIds.has(f.id))
  }, [filteredFactures, selectedFactureIds])

  // Check if selection has payable/deletable factures
  const hasPayableSelection = useMemo(() => {
    return selectedFactures.some(canFactureBePaid)
  }, [selectedFactures])

  const hasDeletableSelection = useMemo(() => {
    return selectedFactures.some(canFactureBeDeleted)
  }, [selectedFactures])

  /**
   * Bulk actions handlers
   */
  const toggleSelectionMode = (mode) => {
    if (mode === 'pay' || mode === 'delete') {
      setSelectionMode(true)
    } else {
      setSelectionMode(false)
      clearSelection()
    }
  }

  const toggleFactureSelection = (factureId) => {
    setSelectedFactureIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(factureId)) {
        newSet.delete(factureId)
      } else {
        newSet.add(factureId)
      }
      return newSet
    })
  }

  const selectAllFactures = () => {
    const allIds = new Set(filteredFactures.map(f => f.id))
    setSelectedFactureIds(allIds)
  }

  const clearSelection = () => {
    setSelectedFactureIds(new Set())
    setSelectionMode(false)
  }

  const handleBulkPay = () => {
    if (selectedFactures.length < 2) {
      showToast('Veuillez sélectionner au moins 2 factures pour effectuer un paiement multiple', 'error')
      return
    }
    setIsMultiPaiementModalOpen(true)
  }

  const handleBulkDelete = () => {
    if (selectedFactures.length === 0) {
      showToast('Veuillez sélectionner au moins 1 facture à supprimer', 'error')
      return
    }

    // Check if all selected factures can be deleted
    const nonDeletableFactures = selectedFactures.filter(f => !canFactureBeDeleted(f))

    if (nonDeletableFactures.length > 0) {
      const nonDeletableStatuts = nonDeletableFactures.map(f => {
        if (f.statut === 'payee') return 'payée'
        if (f.statut === 'partiellement_payee') return 'partiellement payée'
        return f.statut
      })

      const message = nonDeletableFactures.length === 1
        ? `La facture ${nonDeletableFactures[0].numero_facture} est ${nonDeletableStatuts[0]} et ne peut pas être supprimée. Seules les factures en attente ou annulées peuvent être supprimées.`
        : `${nonDeletableFactures.length} facture(s) sélectionnée(s) ne peuvent pas être supprimées (statut: payée ou partiellement payée). Seules les factures en attente ou annulées peuvent être supprimées.`

      showToast(message, 'error')
      return
    }

    setIsDeleteMultipleModalOpen(true)
  }

  /**
   * Handle create/edit facture
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const data = {
      type: formData.get('type'),
      contact_id: formData.get('contact_id'),
      montant: parseFloat(formData.get('montant')),
      date_emission: formData.get('date_emission'),
      date_echeance: formData.get('date_echeance'),
      statut: formData.get('statut') || 'en_attente',
      notes: formData.get('notes') || null
    }

    // Validation
    const errors = validateFactureData(data)
    if (Object.keys(errors).length > 0) {
      showToast(Object.values(errors)[0], 'error')
      return
    }

    let result
    if (editingFacture) {
      result = await updateFacture(editingFacture.id, data)
    } else {
      result = await createFacture(data)
    }

    if (result.success) {
      showToast(
        editingFacture ? 'Facture modifiée avec succès' : 'Facture créée avec succès',
        'success'
      )
      setIsModalOpen(false)
      setEditingFacture(null)
    } else {
      showToast('Erreur lors de l\'enregistrement', 'error')
    }
  }

  /**
   * Handle delete facture
   */
  const handleDelete = async (factureId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    const result = await deleteFacture(factureId)

    if (result.success) {
      showToast('Facture supprimée avec succès', 'success')
    } else {
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  /**
   * Open modal for editing
   */
  const handleEdit = (facture) => {
    setEditingFacture(facture)
    // Initialize form states with existing facture data
    setSelectedContactId(facture.contact_id || '')
    setDateEmission(facture.date_emission || new Date().toISOString().split('T')[0])
    setDateEcheance(facture.date_echeance || '')
    setFormKey(prev => prev + 1)
    setIsModalOpen(true)
  }

  /**
   * Open modal for creation
   */
  const handleCreate = () => {
    setEditingFacture(null)
    // Reset form states for new facture
    setSelectedContactId('')
    setDateEmission(new Date().toISOString().split('T')[0])
    setDateEcheance('')
    setFormKey(prev => prev + 1)
    setIsModalOpen(true)
  }

  /**
   * Open documents modal
   */
  const handleViewDocuments = (facture) => {
    setSelectedFacture(facture)
    setIsDocumentsModalOpen(true)
  }

  /**
   * Open payment modal
   */
  const handleOpenPaiement = (facture) => {
    setSelectedPaiementFacture(facture)
    setIsPaiementModalOpen(true)
  }

  /**
   * Handle payment change (refresh factures to update status and amounts)
   */
  const handlePaiementChange = () => {
    refreshFactures()
  }

  /**
   * Handle multi-payment success
   */
  const handleMultiPaiementSuccess = (result) => {
    showToast(result.message, result.hasErrors ? 'warning' : 'success')
    refreshFactures()
    clearSelection()
  }

  /**
   * Handle multi-delete success
   */
  const handleMultiDeleteSuccess = (result) => {
    showToast(result.message, result.hasErrors ? 'warning' : 'success')
    refreshFactures()
    clearSelection()
  }

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await upload(file)

    if (result.success) {
      showToast('Document ajouté avec succès', 'success')
    } else {
      showToast(result.error || 'Erreur lors de l\'upload', 'error')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Handle view document inline (open in new tab)
   */
  const handleViewDocument = async (doc) => {
    const result = await download(doc.storage_path)

    if (result.success && result.url) {
      // Open PDF in new tab for inline viewing
      window.open(result.url, '_blank')
    } else {
      showToast(result.error || 'Erreur lors de l\'ouverture du document', 'error')
    }
  }

  /**
   * Handle document download (force download)
   */
  const handleDownload = async (doc) => {
    const result = await download(doc.storage_path)

    if (result.success && result.url) {
      // Force download instead of inline view
      const link = document.createElement('a')
      link.href = result.url
      link.download = doc.nom_original
      link.click()
    } else {
      showToast(result.error || 'Erreur lors du téléchargement', 'error')
    }
  }

  /**
   * Handle document delete
   */
  const handleDeleteDocument = async (doc) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return

    const result = await remove(doc.id, doc.storage_path)

    if (result.success) {
      showToast('Document supprimé avec succès', 'success')
    } else {
      showToast(result.error || 'Erreur lors de la suppression', 'error')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Euro className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Finances</h1>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              onClick={handleCreate}
              className="flex-1 sm:flex-none"
            >
              <Plus className="w-5 h-5" />
              <span className="ml-2">Nouvelle facture</span>
            </Button>

            {/* Bulk Actions Menu */}
            <div className="relative flex-1 sm:flex-none">
              <Button
                variant="outline"
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="w-full"
              >
                <Settings className="w-5 h-5" />
                <span className="ml-2">Actions multiples</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>

              {showBulkMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowBulkMenu(false)}
                  />

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <button
                      onClick={() => {
                        toggleSelectionMode('pay')
                        setShowBulkMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700 font-medium">Payer plusieurs</span>
                    </button>
                    <button
                      onClick={() => {
                        toggleSelectionMode('delete')
                        setShowBulkMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700 font-medium">Supprimer plusieurs</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          />
        </div>

        {/* Bulk Actions Toolbar */}
        {selectionMode && (
          <BulkActionsToolbar
            selectedCount={selectedFactureIds.size}
            totalCount={filteredFactures.length}
            onSelectAll={selectAllFactures}
            onCancel={clearSelection}
            onPay={handleBulkPay}
            onDelete={handleBulkDelete}
            hasPayableSelection={hasPayableSelection}
            hasDeletableSelection={hasDeletableSelection}
          />
        )}

        {/* Error State */}
        {error && (
          <Alert variant="error">
            Une erreur est survenue lors du chargement des factures.
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredFactures.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery
                ? 'Aucune facture trouvée'
                : `Aucune facture ${activeTab === 'client' ? 'client' : 'fournisseur'}`}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre première facture'}
            </p>
          </div>
        )}

        {/* Factures List */}
        {!loading && !error && filteredFactures.length > 0 && (
          <div className="space-y-4">
            {filteredFactures.map(facture => (
              <div
                key={facture.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  {/* Checkbox in selection mode */}
                  {selectionMode && (
                    <div className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={selectedFactureIds.has(facture.id)}
                        onChange={() => toggleFactureSelection(facture.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Facture content */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left: Main info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {facture.numero_facture}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>{getContactDisplayName(facture.contact)}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatutColor(facture.statut)}`}>
                            {getStatutLabel(facture.statut)}
                          </span>
                        </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Émission: {formatDate(facture.date_emission)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Échéance: {formatDate(facture.date_echeance)}</span>
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(facture.montant)}
                    </div>

                    {/* Payment Progress - Always shown per Option A */}
                    {facture.montant_paye !== undefined && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          {formatCurrency(facture.montant_paye || 0)}
                        </span>
                        {' payé sur '}
                        <span className="font-medium">
                          {formatCurrency(facture.montant)}
                        </span>
                        {facture.montant_restant > 0 && (
                          <span className="text-orange-600 ml-2">
                            (reste: {formatCurrency(facture.montant_restant)})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewDocuments(facture)}
                      className="flex-1 md:flex-none"
                    >
                      <Paperclip className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Documents</span>
                    </Button>

                    {/* Paiement button - Only shown if en_attente or partiellement_payee */}
                    {(facture.statut === 'en_attente' || facture.statut === 'partiellement_payee') && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenPaiement(facture)}
                        className="flex-1 md:flex-none"
                      >
                        <CreditCard className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Paiement</span>
                      </Button>
                    )}

                    {/* Menu dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === facture.id ? null : facture.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Plus d'actions"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>

                      {/* Dropdown menu */}
                      {openMenuId === facture.id && (
                        <>
                          {/* Backdrop pour fermer le menu */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />

                          {/* Menu items */}
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => {
                                handleEdit(facture)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(facture.id)
                                setOpenMenuId(null)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash className="w-4 h-4" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create/Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingFacture(null)
          }}
          title={editingFacture ? 'Modifier la facture' : 'Nouvelle facture'}
          size="lg"
        >
          <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                required
                defaultValue={editingFacture?.type || activeTab}
                disabled={!!editingFacture}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
              </select>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeTab === 'client' ? 'Client' : 'Fournisseur'} *
              </label>
              <select
                name="contact_id"
                required
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {contacts
                  .filter(c => c.type === (editingFacture?.type || activeTab))
                  .map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {getContactDisplayName(contact)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant de la facture *
              </label>
              <div className="relative">
                <input
                  name="montant"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={editingFacture?.montant || ''}
                  placeholder="1000.00"
                  className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  €
                </span>
              </div>
            </div>

            {/* Date émission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d&apos;émission de la facture *
              </label>
              <input
                name="date_emission"
                type="date"
                required
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date échéance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d&apos;échéance de la facture *
              </label>
              <input
                name="date_echeance"
                type="date"
                required
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="statut"
                defaultValue={editingFacture?.statut || 'en_attente'}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en_attente">En attente</option>
                <option value="payee">Payée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                defaultValue={editingFacture?.notes || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Notes additionnelles..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingFacture(null)
                }}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingFacture ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Documents */}
        <Modal
          isOpen={isDocumentsModalOpen}
          onClose={() => {
            setIsDocumentsModalOpen(false)
            setSelectedFacture(null)
          }}
          title={`Documents - ${selectedFacture?.numero_facture || ''}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Upload section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                <Upload className="w-5 h-5 mr-2" />
                {uploading ? 'Upload en cours...' : 'Ajouter un PDF'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Formats acceptés: PDF uniquement (max 10 MB)
              </p>
            </div>

            {/* Documents list */}
            {docsLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {!docsLoading && documents.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Aucun document pour cette facture</p>
              </div>
            )}

            {!docsLoading && documents.length > 0 && (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.nom_original}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(doc.taille_fichier / 1024).toFixed(1)} KB • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir le PDF"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Close button */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDocumentsModalOpen(false)
                  setSelectedFacture(null)
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Paiement */}
        <PaiementModal
          isOpen={isPaiementModalOpen}
          onClose={() => {
            setIsPaiementModalOpen(false)
            setSelectedPaiementFacture(null)
          }}
          facture={selectedPaiementFacture}
          onPaiementChange={handlePaiementChange}
        />

        {/* Modal Multi-Paiement */}
        <MultiPaiementModal
          isOpen={isMultiPaiementModalOpen}
          onClose={() => {
            setIsMultiPaiementModalOpen(false)
          }}
          factures={selectedFactures.filter(canFactureBePaid)}
          onSuccess={handleMultiPaiementSuccess}
        />

        {/* Modal Delete Multiple */}
        <DeleteMultipleModal
          isOpen={isDeleteMultipleModalOpen}
          onClose={() => {
            setIsDeleteMultipleModalOpen(false)
          }}
          factures={selectedFactures}
          onSuccess={handleMultiDeleteSuccess}
        />
      </div>
    </AppLayout>
  )
}
