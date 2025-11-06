/**
 * FacturesPage - Main finances page with tabs
 * MVP version with simplified UI
 */

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Euro, Plus, Search, FileText, Calendar, User, Paperclip, Upload, Download, Trash2, Eye, MoreVertical, Edit, Trash, CreditCard, ChevronDown, Settings, AlertCircle, XCircle, Building2, StickyNote, CheckCircle } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import SubTabs from '../../../shared/components/ui/SubTabs'
import Select from '../../../shared/components/ui/Select'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import Pagination from '../../../shared/components/ui/Pagination'
import Spinner from '../../../shared/components/ui/Spinner'
import Alert from '../../../shared/components/ui/Alert'
import Modal from '../../../shared/components/ui/Modal'
import PaiementModal from '../components/PaiementModal'
import BulkActionsToolbar from '../components/BulkActionsToolbar'
import MultiPaiementModal from '../components/MultiPaiementModal'
import DeleteMultipleModal from '../components/DeleteMultipleModal'
import DeleteFactureModal from '../components/DeleteFactureModal'
import MarquerPayeModal from '../components/MarquerPayeModal'
import { useFactures } from '../hooks/useFactures'
import { useContacts } from '../hooks/useContacts'
import { useDocuments } from '../hooks/useDocuments'
import { useChantiers } from '../../chantiers/hooks/useChantiers'
import { getChantierById, updateChantierPaiementStatus } from '../../chantiers/services/chantiersService'
import { useToast } from '../../../shared/hooks/useToast'
import {
  formatDate,
  formatCurrency,
  getContactDisplayName,
  searchFactures,
  calculateDateEcheance,
  isFactureOverdue,
  calculateDaysOverdue,
  calculateTTC,
  calculateRetenue,
  calculateProrata,
  getMontantAPayer,
  getMontantLabel,
  validateNumeroFacture
} from '../utils/factureHelpers'
import {
  getClientDisplayName as getChantierClientName,
  getStatutLabel as getChantierStatutLabel,
  getStatutColor as getChantierStatutColor,
  calculateFinalisation95,
  chantierHasRetenueGarantie,
  calculateTotalRetenuesGarantie,
  formatCurrency as formatChantierCurrency,
  formatDate as formatChantierDate,
  calculateEcheanceFinalisation95,
  calculateEcheanceRetenues,
  isEcheancePassee
} from '../../chantiers/utils/chantierHelpers'
import { canFactureBePaid, canFactureBeDeleted } from '../utils/factureValidation'

export default function FacturesPage() {
  // State
  const [activeTab, setActiveTab] = useState('en_attente') // Renamed from activeStatut to handle both factures and chantiers
  const [activeType, setActiveType] = useState('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContactFilter, setSelectedContactFilter] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
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

  // Delete single facture modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [factureToDelete, setFactureToDelete] = useState(null)

  // Marquer comme payé modal (Fin de chantier)
  const [isMarquerPayeModalOpen, setIsMarquerPayeModalOpen] = useState(false)
  const [selectedChantierForPaiement, setSelectedChantierForPaiement] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  // Form controlled states for auto-calculation
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedChantierId, setSelectedChantierId] = useState('')
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0])
  const [dateEcheance, setDateEcheance] = useState('')
  const [lot, setLot] = useState('')

  // TVA states
  const [factureType, setFactureType] = useState('client')
  const [factureStatut, setFactureStatut] = useState('en_attente')
  const [tvaApplicable, setTvaApplicable] = useState(false)
  const [montantHT, setMontantHT] = useState('')
  const [montantTTC, setMontantTTC] = useState('')

  // Retenue de garantie states
  const [retenueGarantie, setRetenueGarantie] = useState(false)
  const [montantRetenue, setMontantRetenue] = useState('')

  // Prorata states
  const [prorataApplicable, setProrataApplicable] = useState(false)
  const [montantProrata, setMontantProrata] = useState('')

  // Finalisation 95% states
  const [exclueFinalization, setExclueFinalization] = useState(false)
  const [chantierLie, setChantierLie] = useState(null)

  // Exclusion calculs states
  const [exclueCalculs, setExclueCalculs] = useState(false)
  const [raisonExclusion, setRaisonExclusion] = useState('')

  // Numero facture state (editable for clients)
  const [numeroFacture, setNumeroFacture] = useState('')

  // Hooks
  const { factures, loading, error, createFacture, updateFacture, deleteFacture, deleteMultipleFactures, refreshFactures } = useFactures()
  const { contacts } = useContacts()
  const { chantiers, refetch: refetchChantiers } = useChantiers()
  const { documents, loading: docsLoading, uploading, upload, download, remove } = useDocuments(selectedFacture?.id)
  const { showToast } = useToast()

  // Calculate chantiers count per contact (EN COURS only)
  const contactsWithChantiersCount = useMemo(() => {
    return contacts.map(contact => {
      const chantiersEnCoursCount = chantiers.filter(
        ch => ch.clients?.some(client => client.id === contact.id) && ch.statut === 'en_cours'
      ).length

      return {
        ...contact,
        chantiersCount: chantiersEnCoursCount
      }
    })
  }, [contacts, chantiers])

  // Sort contacts: with chantiers first (DESC), then without chantiers
  const sortedContacts = useMemo(() => {
    return [...contactsWithChantiersCount].sort((a, b) => {
      // Contacts with chantiers come first
      if (a.chantiersCount > 0 && b.chantiersCount === 0) return -1
      if (a.chantiersCount === 0 && b.chantiersCount > 0) return 1

      // Sort by count DESC for contacts with chantiers
      return b.chantiersCount - a.chantiersCount
    })
  }, [contactsWithChantiersCount])

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

  // Reset chantier when contact changes (except during edit initialization)
  React.useEffect(() => {
    if (isModalOpen && !editingFacture) {
      setSelectedChantierId('')
    }
  }, [selectedContactId, isModalOpen, editingFacture])

  // Auto-calculate TTC when montantHT, TVA, retenue or prorata changes (clients only)
  React.useEffect(() => {
    if (factureType === 'client' && tvaApplicable && montantHT) {
      const ht = parseFloat(montantHT)
      if (!isNaN(ht) && ht > 0) {
        let baseCalcul = ht

        // Déduire la retenue de garantie si applicable (utilise le montant saisi)
        if (retenueGarantie && montantRetenue) {
          const retenue = parseFloat(montantRetenue)
          if (!isNaN(retenue)) {
            baseCalcul -= retenue
          }
        }

        // Déduire le prorata si applicable (utilise le montant saisi)
        if (prorataApplicable && montantProrata) {
          const prorata = parseFloat(montantProrata)
          if (!isNaN(prorata)) {
            baseCalcul -= prorata
          }
        }

        // Appliquer la TVA sur la base calculée
        const ttc = calculateTTC(baseCalcul, 20)
        setMontantTTC(ttc.toFixed(2))
      } else {
        setMontantTTC('')
      }
    } else {
      setMontantTTC('')
    }
  }, [montantHT, tvaApplicable, factureType, retenueGarantie, montantRetenue, prorataApplicable, montantProrata])

  // Auto-calculate retenue when montantHT or retenueGarantie changes (clients only)
  React.useEffect(() => {
    if (factureType === 'client' && retenueGarantie && montantHT) {
      const ht = parseFloat(montantHT)
      if (!isNaN(ht) && ht > 0) {
        const retenue = calculateRetenue(ht)
        setMontantRetenue(retenue.toFixed(2))
      } else {
        setMontantRetenue('')
      }
    } else {
      setMontantRetenue('')
    }
  }, [montantHT, retenueGarantie, factureType])

  // Auto-calculate prorata when montantHT or prorataApplicable changes (clients only)
  React.useEffect(() => {
    if (factureType === 'client' && prorataApplicable && montantHT) {
      const ht = parseFloat(montantHT)
      if (!isNaN(ht) && ht > 0) {
        const prorata = calculateProrata(ht)
        setMontantProrata(prorata.toFixed(2))
      } else {
        setMontantProrata('')
      }
    } else {
      setMontantProrata('')
    }
  }, [montantHT, prorataApplicable, factureType])

  // Load chantier lié when selectedChantierId changes
  React.useEffect(() => {
    if (selectedChantierId) {
      getChantierById(selectedChantierId).then(({ data, error }) => {
        if (!error && data) {
          setChantierLie(data)
        } else {
          setChantierLie(null)
        }
      })
    } else {
      setChantierLie(null)
    }
  }, [selectedChantierId])

  // Tabs configuration with counts - Niveau 1 : Statut + Fin de chantier
  const statutTabs = useMemo(() => {
    const allTabs = [
      {
        id: 'en_attente',
        label: 'En attente',
        count: factures.filter(f => f.statut === 'en_attente').length
      },
      {
        id: 'partiellement_payee',
        label: 'Partiellement payées',
        count: factures.filter(f => f.statut === 'partiellement_payee').length
      },
      {
        id: 'payee',
        label: 'Payées',
        count: factures.filter(f => f.statut === 'payee').length
      },
      {
        id: 'annulee',
        label: 'Annulées',
        count: factures.filter(f => f.statut === 'annulee').length
      }
    ]

    // Ajouter "Fin de chantier" UNIQUEMENT pour les clients
    if (activeType === 'client') {
      allTabs.push({
        id: 'fin_chantier',
        label: 'Fin de chantier',
        count: chantiers.filter(c => {
          if (c.statut !== 'cloture') return false
          const hasFinalisation95 = c.finalisation_95
          const hasRetenue = chantierHasRetenueGarantie(c.id, factures)
          return hasFinalisation95 || hasRetenue
        }).length
      })
    }

    return allTabs
  }, [factures, chantiers, activeType])

  // Tabs configuration with counts - Niveau 2 : Type (basé sur statut actif)
  const typeTabs = useMemo(() => {
    const statutFiltered = factures.filter(f => f.statut === activeTab)

    return [
      {
        id: 'client',
        label: 'Clients',
        count: statutFiltered.filter(f => f.type === 'client').length
      },
      {
        id: 'fournisseur',
        label: 'Fournisseurs',
        count: statutFiltered.filter(f => f.type === 'fournisseur').length
      }
    ]
  }, [factures, activeTab])

  // Available contacts filtered by current type
  const availableContacts = useMemo(() => {
    return contacts.filter(c => c.type === activeType)
  }, [contacts, activeType])

  // Contact filter options for Select component
  const contactFilterOptions = useMemo(() => {
    const allOption = {
      value: '',
      label: activeType === 'client' ? 'Tous les clients' : 'Tous les fournisseurs'
    }

    const contactOptions = availableContacts.map(contact => ({
      value: contact.id,
      label: getContactDisplayName(contact)
    }))

    return [allOption, ...contactOptions]
  }, [availableContacts, activeType])

  // Calculate overdue count (for button badge)
  const overdueCount = useMemo(() => {
    const statutFiltered = factures.filter(f => f.statut === activeTab)
    const typeFiltered = statutFiltered.filter(f => f.type === activeType)
    return typeFiltered.filter(f => isFactureOverdue(f)).length
  }, [factures, activeTab, activeType])

  // Filter and search factures
  const filteredFactures = useMemo(() => {
    // 1. Filtrer par statut
    const statutFiltered = factures.filter(facture => facture.statut === activeTab)

    // 2. Filtrer par type
    const typeFiltered = statutFiltered.filter(facture => facture.type === activeType)

    // 3. Filtrer par factures en retard (si activé)
    const overdueFiltered = showOverdueOnly
      ? typeFiltered.filter(facture => isFactureOverdue(facture))
      : typeFiltered

    // 4. Filtrer par contact (si un contact est sélectionné)
    const contactFiltered = selectedContactFilter
      ? overdueFiltered.filter(facture => facture.contact_id === selectedContactFilter)
      : overdueFiltered

    // 5. Appliquer la recherche
    const searched = searchFactures(contactFiltered, searchQuery)

    // 6. Trier par numéro de facture (du plus élevé au plus bas)
    return searched.sort((a, b) => {
      const numA = parseInt(a.numero_facture.split('-').pop(), 10) || 0
      const numB = parseInt(b.numero_facture.split('-').pop(), 10) || 0
      return numB - numA // Tri décroissant
    })
  }, [factures, activeTab, activeType, showOverdueOnly, selectedContactFilter, searchQuery])

  // Filter and search chantiers (for "Fin de chantier" tab)
  const filteredChantiers = useMemo(() => {
    if (activeTab !== 'fin_chantier') return []

    // 1. Filter: (finalisation_95 OR hasRetenueGarantie) AND statut = 'cloture'
    // AND au moins un paiement applicable non payé
    const finChantiers = chantiers.filter(c => {
      if (c.statut !== 'cloture') return false

      const hasFinalisation95 = c.finalisation_95
      const hasRetenue = chantierHasRetenueGarantie(c.id, factures)

      // Le chantier doit avoir au moins une finalisation ou retenue
      if (!hasFinalisation95 && !hasRetenue) return false

      // Vérifier si au moins un paiement applicable n'est pas payé
      const finalisationNonPayee = hasFinalisation95 && !c.finalisation_95_payee
      const retenueNonPayee = hasRetenue && !c.retenue_garantie_payee

      // Afficher seulement si au moins un paiement applicable n'est pas payé
      return finalisationNonPayee || retenueNonPayee
    })

    // 2. Apply search query
    if (!searchQuery.trim()) return finChantiers

    const lowerQuery = searchQuery.toLowerCase()
    return finChantiers.filter(chantier => {
      const clientName = chantier.client?.contact_type === 'professionnel'
        ? chantier.client?.company_name || ''
        : `${chantier.client?.first_name || ''} ${chantier.client?.last_name || ''}`.trim()

      return chantier.titre?.toLowerCase().includes(lowerQuery) ||
             clientName.toLowerCase().includes(lowerQuery) ||
             chantier.montant_ht?.toString().includes(lowerQuery)
    })
  }, [activeTab, chantiers, factures, searchQuery])

  // Pagination logic for factures
  const paginatedFactures = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredFactures.slice(startIndex, endIndex)
  }, [filteredFactures, currentPage, ITEMS_PER_PAGE])

  // Pagination logic for chantiers
  const paginatedChantiers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredChantiers.slice(startIndex, endIndex)
  }, [filteredChantiers, currentPage, ITEMS_PER_PAGE])

  const totalPages = activeTab === 'fin_chantier'
    ? Math.ceil(filteredChantiers.length / ITEMS_PER_PAGE)
    : Math.ceil(filteredFactures.length / ITEMS_PER_PAGE)

  // Clear all filters function
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedContactFilter('')
    setShowOverdueOnly(false)
  }

  // Reset contact filter when type changes
  useEffect(() => {
    setSelectedContactFilter('')
  }, [activeType])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, activeType, selectedContactFilter, searchQuery, showOverdueOnly])

  // Redirect if on "fin_chantier" tab with type "fournisseur"
  useEffect(() => {
    if (activeTab === 'fin_chantier' && activeType === 'fournisseur') {
      setActiveTab('en_attente')
    }
  }, [activeType, activeTab])

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

    const currentType = formData.get('type')

    // Construire les données selon le type de facture
    const data = {
      type: currentType,
      contact_id: formData.get('contact_id'),
      chantier_id: formData.get('chantier_id') || null,
      lot: formData.get('lot') || null,
      date_emission: formData.get('date_emission'),
      date_echeance: formData.get('date_echeance'),
      statut: formData.get('statut') || 'en_attente',
      notes: formData.get('notes') || null,
      // Champs TVA
      montant_ht: null,
      montant_ttc: null,
      tva_applicable: false,
      taux_tva: 20.00,
      // Champ retenue de garantie
      retenue_garantie: false,
      // Champ prorata
      prorata_applicable: false,
      // Champ exclue de finalisation
      exclue_finalisation: false,
      // Champs exclusion des calculs
      exclue_calculs: false,
      raison_exclusion: null,
      // Numero facture (for clients, optional - auto-generated if empty)
      numero_facture: null
    }

    // Gérer le numero facture (clients only)
    if (currentType === 'client') {
      const numeroFromForm = formData.get('numero_facture')
      data.numero_facture = numeroFromForm && numeroFromForm.trim() !== '' ? numeroFromForm.trim() : null
    }

    // Gérer l'exclusion des calculs (commun aux deux types)
    data.exclue_calculs = formData.get('exclue_calculs') === 'on'
    data.raison_exclusion = data.exclue_calculs ? (formData.get('raison_exclusion') || null) : null

    if (currentType === 'fournisseur') {
      // Fournisseur: toujours TTC, pas de retenue ni prorata ni exclusion finalisation
      data.montant_ttc = parseFloat(formData.get('montant_ttc'))
      data.tva_applicable = true
      data.retenue_garantie = false
      data.prorata_applicable = false
      data.exclue_finalisation = false
    } else {
      // Client: HT avec ou sans TVA, avec ou sans retenue, avec ou sans prorata, avec ou sans exclusion finalisation
      data.montant_ht = parseFloat(formData.get('montant_ht'))
      data.tva_applicable = formData.get('tva_applicable') === 'on'
      data.retenue_garantie = formData.get('retenue_garantie') === 'on'
      data.prorata_applicable = formData.get('prorata_applicable') === 'on'
      data.exclue_finalisation = formData.get('exclue_finalisation') === 'on'

      if (data.tva_applicable) {
        data.montant_ttc = parseFloat(formData.get('montant_ttc'))
      }

      // Enregistrer les montants de retenue et prorata (manuels ou calculés)
      if (data.retenue_garantie) {
        data.montant_retenue = parseFloat(montantRetenue) || 0
      } else {
        data.montant_retenue = 0
      }

      if (data.prorata_applicable) {
        data.montant_prorata = parseFloat(montantProrata) || 0
      } else {
        data.montant_prorata = 0
      }
    }

    // Garder l'ancien champ montant pour compatibilité (deprecated)
    data.montant = data.tva_applicable ? data.montant_ttc : data.montant_ht

    // Validation basique
    if (!data.type || !data.contact_id) {
      showToast('Le type et le contact sont obligatoires', 'error')
      return
    }

    if ((!data.montant_ht && currentType === 'client') || (!data.montant_ttc && currentType === 'fournisseur')) {
      showToast('Le montant est obligatoire', 'error')
      return
    }

    if (!data.date_emission || !data.date_echeance) {
      showToast('Les dates sont obligatoires', 'error')
      return
    }

    // Validation numero facture (for clients only)
    if (currentType === 'client' && data.numero_facture) {
      const validation = validateNumeroFacture(data.numero_facture)
      if (!validation.valid) {
        showToast(validation.error, 'error')
        return
      }
    }

    // Validation exclusion des calculs
    if (data.exclue_calculs && (!data.raison_exclusion || data.raison_exclusion.trim() === '')) {
      showToast('La raison de l\'exclusion est obligatoire', 'error')
      return
    }

    let result
    if (editingFacture) {
      result = await updateFacture(editingFacture.id, data)
    } else {
      result = await createFacture(data)
    }

    if (result.success) {
      // Show success toast with numero facture if it's a new client invoice
      let successMessage = editingFacture ? 'Facture modifiée avec succès' : 'Facture créée avec succès'

      if (!editingFacture && currentType === 'client' && result.data?.numero_facture) {
        successMessage = `Facture créée avec succès : ${result.data.numero_facture}`
      }

      showToast(successMessage, 'success')
      setIsModalOpen(false)
      setEditingFacture(null)
    } else {
      showToast('Erreur lors de l\'enregistrement', 'error')
    }
  }

  /**
   * Open delete confirmation modal
   */
  const handleDelete = (factureId) => {
    const facture = factures.find(f => f.id === factureId)
    if (facture) {
      setFactureToDelete(facture)
      setIsDeleteModalOpen(true)
    }
  }

  /**
   * Confirm and execute delete
   */
  const handleConfirmDelete = async (factureId) => {
    const result = await deleteFacture(factureId)

    if (result.success) {
      showToast('Facture supprimée avec succès', 'success')
      setIsDeleteModalOpen(false)
      setFactureToDelete(null)
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
    setSelectedChantierId(facture.chantier_id || '')
    setLot(facture.lot || '')
    setDateEmission(facture.date_emission || new Date().toISOString().split('T')[0])
    setDateEcheance(facture.date_echeance || '')
    setFactureStatut(facture.statut || 'en_attente')
    // Initialize TVA states
    setFactureType(facture.type || 'client')
    setTvaApplicable(facture.tva_applicable || false)
    setMontantHT(facture.montant_ht?.toString() || facture.montant?.toString() || '')
    setMontantTTC(facture.montant_ttc?.toString() || '')
    // Initialize retenue states
    setRetenueGarantie(facture.retenue_garantie || false)
    setMontantRetenue(facture.retenue_garantie && facture.montant_ht ? calculateRetenue(facture.montant_ht).toFixed(2) : '')
    // Initialize prorata states
    setProrataApplicable(facture.prorata_applicable || false)
    setMontantProrata(facture.prorata_applicable && facture.montant_ht ? calculateProrata(facture.montant_ht).toFixed(2) : '')
    // Initialize finalisation states
    setExclueFinalization(facture.exclue_finalisation || false)
    // Initialize exclusion calculs states
    setExclueCalculs(facture.exclue_calculs || false)
    setRaisonExclusion(facture.raison_exclusion || '')
    // Initialize numero facture (for clients only)
    setNumeroFacture(facture.numero_facture || '')
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
    setSelectedChantierId('')
    setLot('')
    setDateEmission(new Date().toISOString().split('T')[0])
    setDateEcheance('')
    setFactureStatut('en_attente')
    // Reset TVA states
    setFactureType(activeType)
    setTvaApplicable(false)
    setMontantHT('')
    setMontantTTC('')
    // Reset retenue states
    setRetenueGarantie(false)
    setMontantRetenue('')
    // Reset prorata states
    setProrataApplicable(false)
    setMontantProrata('')
    // Reset finalisation states
    setExclueFinalization(false)
    // Reset exclusion calculs states
    setExclueCalculs(false)
    setRaisonExclusion('')
    // Reset numero facture
    setNumeroFacture('')
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

  /**
   * Handle open marquer payé modal
   */
  const handleOpenMarquerPaye = (chantier) => {
    setSelectedChantierForPaiement(chantier)
    setIsMarquerPayeModalOpen(true)
  }

  /**
   * Handle confirm marquer payé
   */
  const handleConfirmMarquerPaye = async (chantierId, paymentStatus) => {
    const result = await updateChantierPaiementStatus(chantierId, paymentStatus)

    if (result.error) {
      showToast('Erreur lors de la mise à jour du statut de paiement', 'error')
    } else {
      showToast('Statut de paiement mis à jour avec succès', 'success')
      // Refresh chantiers to update the display immediately
      refetchChantiers()
    }
  }

  /**
   * Get empty state message based on active tab and search query
   */
  const getEmptyStateMessage = (tab, searchQuery) => {
    if (searchQuery) {
      return tab === 'fin_chantier' ? 'Aucun chantier trouvé' : 'Aucune facture trouvée'
    }

    if (tab === 'fin_chantier') {
      return 'Aucun chantier en fin de chantier'
    }

    // Messages pour les factures selon le statut
    const statutMessages = {
      'en_attente': 'Aucune facture en attente',
      'partiellement_payee': 'Aucune facture partiellement payée',
      'payee': 'Aucune facture payée',
      'annulee': 'Aucune facture annulée'
    }

    return statutMessages[tab] || 'Aucune facture'
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

        {/* Tabs - Niveau 1 : Statut */}
        <Tabs tabs={statutTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tabs - Niveau 2 : Type (masqué pour Fin de chantier) */}
        {activeTab !== 'fin_chantier' && (
          <SubTabs tabs={typeTabs} activeTab={activeType} onChange={setActiveType} />
        )}

        {/* Search Bar and Filters */}
        <div className="flex flex-col gap-3">
          {/* Search Bar - Full width on all screens */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
            />
          </div>

          {/* Filters Row - Contact Filter, Overdue Button, Clear Button (masqué pour Fin de chantier) */}
          {activeTab !== 'fin_chantier' ? (
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Contact Filter */}
              <div className="flex-1">
                <Select
                  value={selectedContactFilter}
                  onChange={setSelectedContactFilter}
                  options={contactFilterOptions}
                  placeholder={activeType === 'client' ? 'Tous les clients' : 'Tous les fournisseurs'}
                />
              </div>

              {/* Overdue Filter Button */}
              <button
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className={`
                  h-12 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap
                  ${showOverdueOnly
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <AlertCircle className="w-5 h-5" />
                <span>En retard</span>
                {overdueCount > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${showOverdueOnly ? 'bg-red-800 text-white' : 'bg-red-100 text-red-800'}
                  `}>
                    {overdueCount}
                  </span>
                )}
              </button>

              {/* Clear Filters Button */}
              <button
                onClick={handleClearFilters}
                disabled={!searchQuery && !selectedContactFilter && !showOverdueOnly}
                className={`
                  h-12 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap
                  ${(!searchQuery && !selectedContactFilter && !showOverdueOnly)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <XCircle className="w-5 h-5" />
                <span>Effacer</span>
              </button>
            </div>
          ) : (
            /* Clear Search Button for Fin de chantier tab */
            searchQuery && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="h-12 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Effacer</span>
                </button>
              </div>
            )
          )}
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

        {/* Empty State - Factures */}
        {!loading && !error && activeTab !== 'fin_chantier' && filteredFactures.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {getEmptyStateMessage(activeTab, searchQuery)}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre première facture'}
            </p>
          </div>
        )}

        {/* Empty State - Chantiers */}
        {!loading && !error && activeTab === 'fin_chantier' && filteredChantiers.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {getEmptyStateMessage(activeTab, searchQuery)}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Les chantiers en fin de chantier apparaîtront ici'}
            </p>
          </div>
        )}

        {/* Factures List */}
        {!loading && !error && activeTab !== 'fin_chantier' && filteredFactures.length > 0 && (
          <div className="space-y-4">
            {paginatedFactures.map(facture => (
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
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {facture.type === 'client' ? facture.numero_facture : getContactDisplayName(facture.contact)}
                            </h3>
                            {/* Badge indicateur de notes */}
                            {facture.notes && facture.notes.trim() !== '' && (
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0" title="A des notes">
                                <StickyNote className="w-4 h-4 text-amber-600" />
                              </div>
                            )}
                            {/* Badge facture exclue */}
                            {facture.exclue_calculs && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium" title="Exclue des calculs">
                                <XCircle className="w-3 h-3" />
                                <span>Exclue</span>
                              </div>
                            )}
                          </div>
                          {facture.type === 'client' && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>{getContactDisplayName(facture.contact)}</span>
                            </div>
                          )}
                          {facture.chantier && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Building2 className="w-4 h-4" />
                              <span className="truncate">{facture.chantier.titre}</span>
                            </div>
                          )}
                          {facture.lot && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <span className="text-xs text-gray-500">Lot:</span>
                              <span className="truncate">{facture.lot}</span>
                            </div>
                          )}
                          {facture.exclue_calculs && facture.raison_exclusion && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              <span className="font-medium">Raison de l&apos;exclusion:</span> {facture.raison_exclusion}
                            </div>
                          )}
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

                    {/* Badge de retard */}
                    {isFactureOverdue(facture) && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>
                          En retard de {calculateDaysOverdue(facture.date_echeance)} {calculateDaysOverdue(facture.date_echeance) === 1 ? 'jour' : 'jours'}
                        </span>
                      </div>
                    )}

                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(getMontantAPayer(facture))}
                    </div>
                    <div className="text-xs text-gray-500 -mt-1 flex items-center gap-2 flex-wrap">
                      <span>
                        Montant {getMontantLabel(facture)}
                        {facture.type === 'client' && !facture.tva_applicable && (
                          <span className="ml-1 text-gray-400">(Auto-liquidation)</span>
                        )}
                      </span>
                      {facture.type === 'client' && facture.retenue_garantie && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Retenue 5%
                        </span>
                      )}
                      {facture.type === 'client' && facture.prorata_applicable && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Prorata 2%
                        </span>
                      )}
                    </div>

                    {/* Payment Progress - Always shown per Option A */}
                    {facture.montant_paye !== undefined && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          {formatCurrency(facture.montant_paye || 0)}
                        </span>
                        {' payé sur '}
                        <span className="font-medium">
                          {formatCurrency(getMontantAPayer(facture))}
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

        {/* Chantiers List (Fin de chantier tab) */}
        {!loading && !error && activeTab === 'fin_chantier' && filteredChantiers.length > 0 && (
          <div className="space-y-4">
            {paginatedChantiers.map(chantier => (
              <div
                key={chantier.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4">
                  {/* Header: Titre et Statut */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {chantier.titre}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <User className="w-4 h-4" />
                        <span>{getChantierClientName(chantier.client)}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getChantierStatutColor(chantier.statut)}`}>
                      {getChantierStatutLabel(chantier.statut)}
                    </span>
                  </div>

                  {/* Montant HT du chantier */}
                  <div>
                    <p className="text-sm text-gray-500">Montant HT du chantier</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatChantierCurrency(chantier.montant_ht)}
                    </p>
                  </div>

                  {/* Montants à finaliser */}
                  <div className="border-t border-gray-200 pt-3 space-y-3">
                    {/* Finalisation 95% */}
                    {chantier.finalisation_95 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              Finalisation 95%
                            </span>
                            {chantier.finalisation_95_payee && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Payé
                              </span>
                            )}
                          </div>
                          <span className={`text-lg font-semibold text-blue-900 ${chantier.finalisation_95_payee ? 'line-through opacity-60' : ''}`}>
                            {formatChantierCurrency(calculateFinalisation95(chantier.montant_ht))}
                          </span>
                        </div>
                        {/* Date échéance finalisation */}
                        {chantier.date_fin_reelle && (
                          <div className="flex items-center gap-2 text-sm pl-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={chantier.finalisation_95_payee ? 'text-gray-400 line-through' : 'text-gray-600'}>
                              Échéance : {formatChantierDate(calculateEcheanceFinalisation95(chantier.date_fin_reelle))}
                              {!chantier.finalisation_95_payee && isEcheancePassee(calculateEcheanceFinalisation95(chantier.date_fin_reelle)) && " (dépassée)"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Retenues de garantie */}
                    {chantierHasRetenueGarantie(chantier.id, factures) && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                              Retenues de garantie
                            </span>
                            {chantier.retenue_garantie_payee && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Payé
                              </span>
                            )}
                          </div>
                          <span className={`text-lg font-semibold text-orange-900 ${chantier.retenue_garantie_payee ? 'line-through opacity-60' : ''}`}>
                            {formatChantierCurrency(calculateTotalRetenuesGarantie(chantier.id, factures))}
                          </span>
                        </div>
                        {/* Date échéance retenues */}
                        {chantier.date_fin_reelle && (
                          <div className="flex items-center gap-2 text-sm pl-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={chantier.retenue_garantie_payee ? 'text-gray-400 line-through' : 'text-gray-600'}>
                              Échéance : {formatChantierDate(calculateEcheanceRetenues(chantier.date_fin_reelle))}
                              {!chantier.retenue_garantie_payee && isEcheancePassee(calculateEcheanceRetenues(chantier.date_fin_reelle)) && " (dépassée)"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Total à finaliser */}
                    {(chantier.finalisation_95 || chantierHasRetenueGarantie(chantier.id, factures)) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-700">Total à finaliser</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatChantierCurrency(
                            (chantier.finalisation_95 ? calculateFinalisation95(chantier.montant_ht) : 0) +
                            calculateTotalRetenuesGarantie(chantier.id, factures)
                          )}
                        </span>
                      </div>
                    )}

                    {/* Bouton Marquer comme payé */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenMarquerPaye(chantier)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Marquer comme payé</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && ((activeTab !== 'fin_chantier' && filteredFactures.length > 0) || (activeTab === 'fin_chantier' && filteredChantiers.length > 0)) && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
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
              <Select
                value={factureType}
                onChange={setFactureType}
                options={[
                  { value: 'client', label: 'Client' },
                  { value: 'fournisseur', label: 'Fournisseur' }
                ]}
                disabled={!!editingFacture}
                placeholder="Sélectionner un type"
              />
              {/* Hidden input to submit type */}
              <input type="hidden" name="type" value={factureType} />
            </div>

            {/* Numero Facture (clients only) */}
            {factureType === 'client' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de facture (optionnel)
                </label>
                <input
                  type="text"
                  name="numero_facture"
                  value={numeroFacture}
                  onChange={(e) => setNumeroFacture(e.target.value)}
                  placeholder={`FAC/C-${new Date().getFullYear()}-NNNNN`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Laissez vide pour générer automatiquement
                </p>
              </div>
            )}

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeType === 'client' ? 'Client' : 'Fournisseur'} *
              </label>
              <SearchableSelect
                value={selectedContactId}
                onChange={setSelectedContactId}
                options={sortedContacts
                  .filter(c => c.type === (editingFacture?.type || activeType))
                  .map(contact => ({
                    value: contact.id,
                    label: getContactDisplayName(contact),
                    subtitle: contact.type === 'client'
                      ? `${contact.chantiersCount} chantier${contact.chantiersCount > 1 ? 's' : ''} en cours`
                      : undefined
                  }))}
                placeholder="Sélectionner..."
                searchPlaceholder="Rechercher..."
              />
              <input type="hidden" name="contact_id" value={selectedContactId} />
            </div>

            {/* Chantier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chantier *
              </label>
              <Select
                value={selectedChantierId}
                onChange={setSelectedChantierId}
                disabled={!selectedContactId}
                options={(() => {
                  if (!selectedContactId) {
                    return [{ value: '', label: 'Sélectionner d\'abord un contact' }]
                  }

                  const currentType = editingFacture?.type || activeType
                  const filteredChantiers = chantiers
                    .filter(ch => {
                      const matchesClient = currentType === 'client'
                        ? ch.clients?.some(client => client.id === selectedContactId)
                        : true
                      return matchesClient && ch.statut === 'en_cours'
                    })
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

                  const placeholderLabel = filteredChantiers.length === 0
                    ? (currentType === 'client' ? 'Aucun chantier en cours pour ce client' : 'Aucun chantier en cours')
                    : 'Sélectionner un chantier...'

                  return [
                    { value: '', label: placeholderLabel },
                    ...filteredChantiers.map(chantier => ({
                      value: chantier.id,
                      label: chantier.titre
                    }))
                  ]
                })()}
                placeholder={!selectedContactId ? 'Sélectionner d\'abord un contact' : 'Sélectionner un chantier...'}
              />
              <input type="hidden" name="chantier_id" value={selectedChantierId} />
            </div>

            {/* Lot */}
            <div>
              <label htmlFor="lot" className="block text-sm font-medium text-gray-700 mb-2">
                Lot
              </label>
              <input
                type="text"
                id="lot"
                name="lot"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                placeholder="Ex: Lot 1, A1, Bâtiment Nord..."
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Montant - Logique conditionnelle selon type */}
            {factureType === 'fournisseur' ? (
              /* FOURNISSEUR: Montant TTC uniquement */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant TTC *
                </label>
                <div className="relative">
                  <input
                    name="montant_ttc"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={montantTTC}
                    onChange={(e) => setMontantTTC(e.target.value)}
                    placeholder="1200.00"
                    className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    €
                  </span>
                </div>
              </div>
            ) : (
              /* CLIENT: Montant HT + checkbox TVA + (optionnel) TTC */
              <div className="space-y-4">
                {/* Montant HT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant HT *
                  </label>
                  <div className="relative">
                    <input
                      name="montant_ht"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={montantHT}
                      onChange={(e) => setMontantHT(e.target.value)}
                      placeholder="1000.00"
                      className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      €
                    </span>
                  </div>
                </div>

                {/* Checkbox TVA */}
                <div className="flex items-center">
                  <input
                    id="tva_applicable"
                    name="tva_applicable"
                    type="checkbox"
                    checked={tvaApplicable}
                    onChange={(e) => setTvaApplicable(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="tva_applicable" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    TVA à 20%
                  </label>
                </div>

                {/* Montant TTC (pré-rempli si TVA cochée, modifiable manuellement) */}
                {tvaApplicable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant TTC (€)
                    </label>
                    <div className="relative">
                      <input
                        name="montant_ttc"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={montantTTC}
                        onChange={(e) => setMontantTTC(e.target.value)}
                        placeholder="1200.00"
                        className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        €
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkbox Retenue de garantie */}
                <div className="flex items-center">
                  <input
                    id="retenue_garantie"
                    name="retenue_garantie"
                    type="checkbox"
                    checked={retenueGarantie}
                    onChange={(e) => setRetenueGarantie(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="retenue_garantie" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    Retenue de garantie (5%)
                  </label>
                </div>

                {/* Montant Retenue (pré-rempli si checkbox cochée, modifiable manuellement) */}
                {retenueGarantie && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant retenue (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={montantRetenue}
                        onChange={(e) => setMontantRetenue(e.target.value)}
                        placeholder="50.00"
                        className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        €
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkbox Prorata */}
                <div className="flex items-center">
                  <input
                    id="prorata_applicable"
                    name="prorata_applicable"
                    type="checkbox"
                    checked={prorataApplicable}
                    onChange={(e) => setProrataApplicable(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor="prorata_applicable" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    Prorata (2%)
                  </label>
                </div>

                {/* Montant Prorata (pré-rempli si checkbox cochée, modifiable manuellement) */}
                {prorataApplicable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant prorata (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={montantProrata}
                        onChange={(e) => setMontantProrata(e.target.value)}
                        placeholder="20.00"
                        className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        €
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkbox Exclure de la finalisation (si chantier avec finalisation_95) */}
                {chantierLie?.finalisation_95 && (
                  <div className="flex items-center">
                    <input
                      id="exclue_finalisation"
                      name="exclue_finalisation"
                      type="checkbox"
                      checked={exclueFinalization}
                      onChange={(e) => setExclueFinalization(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="exclue_finalisation" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                      Exclure cette facture du calcul de finalisation 95%
                    </label>
                  </div>
                )}
              </div>
            )}

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
              <Select
                value={factureStatut}
                onChange={setFactureStatut}
                options={[
                  { value: 'en_attente', label: 'En attente' },
                  { value: 'payee', label: 'Payée' },
                  { value: 'annulee', label: 'Annulée' }
                ]}
                placeholder="Sélectionner un statut"
              />
              <input type="hidden" name="statut" value={factureStatut} />
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

            {/* Exclusion des calculs */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-start">
                <input
                  id="exclue_calculs"
                  name="exclue_calculs"
                  type="checkbox"
                  checked={exclueCalculs}
                  onChange={(e) => setExclueCalculs(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mt-0.5"
                />
                <label htmlFor="exclue_calculs" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                  Exclure cette facture de tous les calculs (dashboard, totaux)
                </label>
              </div>

              {exclueCalculs && (
                <div>
                  <label htmlFor="raison_exclusion" className="block text-sm font-medium text-gray-700 mb-2">
                    Raison de l&apos;exclusion *
                  </label>
                  <textarea
                    id="raison_exclusion"
                    name="raison_exclusion"
                    value={raisonExclusion}
                    onChange={(e) => setRaisonExclusion(e.target.value)}
                    rows={3}
                    required={exclueCalculs}
                    placeholder="Ex: Facture de test, Avoir, Erreur de saisie..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Cette facture sera ignorée dans tous les calculs de totaux et statistiques.
                  </p>
                </div>
              )}
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
          title={`Documents - ${selectedFacture?.type === 'client' ? selectedFacture?.numero_facture : getContactDisplayName(selectedFacture?.contact) || ''}`}
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
          onDelete={deleteMultipleFactures}
        />

        {/* Modal Delete Single Facture */}
        <DeleteFactureModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setFactureToDelete(null)
          }}
          facture={factureToDelete}
          onConfirm={handleConfirmDelete}
        />

        {/* Modal Marquer comme payé (Fin de chantier) */}
        <MarquerPayeModal
          isOpen={isMarquerPayeModalOpen}
          onClose={() => {
            setIsMarquerPayeModalOpen(false)
            setSelectedChantierForPaiement(null)
          }}
          chantier={selectedChantierForPaiement}
          hasFinalisation95={selectedChantierForPaiement?.finalisation_95 || false}
          hasRetenueGarantie={selectedChantierForPaiement ? chantierHasRetenueGarantie(selectedChantierForPaiement.id, factures) : false}
          onConfirm={handleConfirmMarquerPaye}
        />
      </div>
    </AppLayout>
  )
}
