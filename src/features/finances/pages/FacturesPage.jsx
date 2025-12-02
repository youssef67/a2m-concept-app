/**
 * FacturesPage - Main finances page with tabs
 * MVP version with simplified UI
 */

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Euro, Plus, Search, FileText, Calendar, User, Paperclip, Upload, Download, Trash2, Eye, MoreVertical, Edit, Trash, CreditCard, ChevronDown, Settings, AlertCircle, XCircle, Building2, StickyNote, CheckCircle } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import StickyPageHeader from '../../../shared/components/layout/StickyPageHeader'
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
import FactureDetailModal from '../components/FactureDetailModal'
import NotesModal from '../components/NotesModal'
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
  validateNumeroFacture,
  calculateTotalDeductions,
  calculateDeductionMontant
} from '../utils/factureHelpers'
import { formatNumeroContact, getPaymentTermLabel } from '../../contacts/utils/contactHelpers'
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
import { uploadDocument, deleteDocument, downloadDocument } from '../services/documentService'

// Predefined deduction types
const DEDUCTION_TYPES = [
  { id: 'retenue', label: 'Retenue de garantie', pourcentage: 5.00 },
  { id: 'prorata', label: 'Prorata', pourcentage: 2.00 },
  { id: 'autre', label: 'Autre (personnalisé)', pourcentage: null }
]

export default function FacturesPage() {
  const navigate = useNavigate()

  // State
  const [activeTab, setActiveTab] = useState('tous') // Renamed from activeStatut to handle both factures and chantiers
  const [activeType, setActiveType] = useState('client')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContactFilter, setSelectedContactFilter] = useState('')
  const [selectedChantierFilter, setSelectedChantierFilter] = useState('')
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
  const initialDateEmissionRef = useRef(null) // Track initial date emission in edit mode

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

  // Detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDetailFacture, setSelectedDetailFacture] = useState(null)

  // PDF viewer modal state
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false)
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null)
  const [pdfViewerTitle, setPdfViewerTitle] = useState('')
  const [openPdfMenuId, setOpenPdfMenuId] = useState(null)
  const pdfInputRef = useRef(null)
  const [pdfUploadFactureId, setPdfUploadFactureId] = useState(null)

  // Notes modal state
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [selectedNotesFacture, setSelectedNotesFacture] = useState(null)

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
  const [montantApresDeductions, setMontantApresDeductions] = useState('')

  // Retenue de garantie states (legacy - kept for compatibility)
  const [retenueGarantie, setRetenueGarantie] = useState(false)
  const [montantRetenue, setMontantRetenue] = useState('')

  // Prorata states (legacy - kept for compatibility)
  const [prorataApplicable, setProrataApplicable] = useState(false)
  const [montantProrata, setMontantProrata] = useState('')

  // Deductions flexibles states (new system)
  const [deductions, setDeductions] = useState([])
  const [selectedDeductionType, setSelectedDeductionType] = useState('')
  const [customIntitule, setCustomIntitule] = useState('')
  const [pourcentageDeduction, setPourcentageDeduction] = useState('')
  const [montantDeduction, setMontantDeduction] = useState('')

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
  const [searchParams] = useSearchParams()

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

  // Apply filters from URL query params on mount
  useEffect(() => {
    const tab = searchParams.get('tab')
    const type = searchParams.get('type')
    const overdue = searchParams.get('overdue')

    if (tab && ['en_attente', 'partiellement_payee', 'payee', 'annulee', 'fin_chantier'].includes(tab)) {
      setActiveTab(tab)
    }
    if (type && ['client', 'fournisseur'].includes(type)) {
      setActiveType(type)
    }
    if (overdue === 'true') {
      setShowOverdueOnly(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array = run only on mount

  // Track initial date emission when opening edit modal
  React.useEffect(() => {
    if (editingFacture && isModalOpen) {
      initialDateEmissionRef.current = editingFacture.date_emission
    } else if (!isModalOpen) {
      initialDateEmissionRef.current = null
    }
  }, [editingFacture, isModalOpen])

  // Reset chantier when contact changes (except during edit initialization)
  React.useEffect(() => {
    if (isModalOpen && !editingFacture) {
      setSelectedChantierId('')
    }
  }, [selectedContactId, isModalOpen, editingFacture])

  // Auto-calculate TTC when montantHT, TVA, or deductions change (clients only)
  React.useEffect(() => {
    if (factureType === 'client' && tvaApplicable && montantHT) {
      const ht = parseFloat(montantHT)
      if (!isNaN(ht) && ht > 0) {
        let baseCalcul = ht

        // Déduire le total des déductions
        const totalDeductions = calculateTotalDeductions(deductions)
        baseCalcul -= totalDeductions

        // Legacy: Déduire la retenue de garantie si applicable (pour compatibilité)
        if (retenueGarantie && montantRetenue) {
          const retenue = parseFloat(montantRetenue)
          if (!isNaN(retenue)) {
            baseCalcul -= retenue
          }
        }

        // Legacy: Déduire le prorata si applicable (pour compatibilité)
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
  }, [montantHT, tvaApplicable, factureType, retenueGarantie, montantRetenue, prorataApplicable, montantProrata, deductions])

  // Auto-calculate montant après déductions for factures sans TVA (clients only)
  React.useEffect(() => {
    if (factureType === 'client' && !tvaApplicable && montantHT && deductions.length > 0) {
      const ht = parseFloat(montantHT)
      if (!isNaN(ht) && ht > 0) {
        const totalDeductions = calculateTotalDeductions(deductions)
        const montantNet = ht - totalDeductions
        setMontantApresDeductions(montantNet.toFixed(2))
      } else {
        setMontantApresDeductions('')
      }
    } else {
      setMontantApresDeductions('')
    }
  }, [montantHT, tvaApplicable, factureType, deductions])

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
        id: 'tous',
        label: 'Tous',
        count: factures.filter(f => f.statut !== 'annulee').length
      },
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
    // Pour l'onglet "Tous", on exclut les factures annulées
    const statutFiltered = activeTab === 'tous'
      ? factures.filter(f => f.statut !== 'annulee')
      : factures.filter(f => f.statut === activeTab)

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

  // Contact filter options for SearchableSelect component
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

  // Chantier filter options for SearchableSelect component
  const chantierFilterOptions = useMemo(() => {
    const allOption = {
      value: '',
      label: 'Tous les chantiers'
    }

    // Get unique chantiers from factures of the current type
    const uniqueChantierIds = new Set()
    const chantierOptions = []

    factures
      .filter(f => f.type === activeType && f.chantier)
      .forEach(f => {
        if (!uniqueChantierIds.has(f.chantier.id)) {
          uniqueChantierIds.add(f.chantier.id)
          chantierOptions.push({
            value: f.chantier.id,
            label: f.chantier.titre
          })
        }
      })

    // Sort by label
    chantierOptions.sort((a, b) => a.label.localeCompare(b.label, 'fr'))

    return [allOption, ...chantierOptions]
  }, [factures, activeType])

  // Calculate overdue count (for button badge)
  const overdueCount = useMemo(() => {
    // Pour l'onglet "Tous", on exclut les factures annulées
    const statutFiltered = activeTab === 'tous'
      ? factures.filter(f => f.statut !== 'annulee')
      : factures.filter(f => f.statut === activeTab)
    const typeFiltered = statutFiltered.filter(f => f.type === activeType)
    return typeFiltered.filter(f => isFactureOverdue(f)).length
  }, [factures, activeTab, activeType])

  // Filter and search factures
  const filteredFactures = useMemo(() => {
    // 1. Filtrer par statut (pour "Tous", exclure les annulées)
    const statutFiltered = activeTab === 'tous'
      ? factures.filter(facture => facture.statut !== 'annulee')
      : factures.filter(facture => facture.statut === activeTab)

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

    // 5. Filtrer par chantier (si un chantier est sélectionné)
    const chantierFiltered = selectedChantierFilter
      ? contactFiltered.filter(facture => facture.chantier?.id === selectedChantierFilter)
      : contactFiltered

    // 6. Appliquer la recherche
    const searched = searchFactures(chantierFiltered, searchQuery)

    // 7. Trier par numéro de facture (du plus élevé au plus bas)
    return searched.sort((a, b) => {
      const numA = a.numero_facture ? parseInt(a.numero_facture.split('-').pop(), 10) || 0 : 0
      const numB = b.numero_facture ? parseInt(b.numero_facture.split('-').pop(), 10) || 0 : 0
      return numB - numA // Tri décroissant
    })
  }, [factures, activeTab, activeType, showOverdueOnly, selectedContactFilter, selectedChantierFilter, searchQuery])

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

  // Auto-calculate deduction amount when percentage or montantHT changes
  React.useEffect(() => {
    if (pourcentageDeduction && montantHT) {
      const ht = parseFloat(montantHT)
      const pourcent = parseFloat(pourcentageDeduction)
      if (!isNaN(ht) && ht > 0 && !isNaN(pourcent) && pourcent > 0) {
        const montant = calculateDeductionMontant(ht, pourcent)
        setMontantDeduction(montant.toFixed(2))
      } else {
        setMontantDeduction('')
      }
    } else {
      setMontantDeduction('')
    }
  }, [pourcentageDeduction, montantHT])

  /**
   * Handle deduction type selection
   */
  const handleDeductionTypeChange = (value) => {
    setSelectedDeductionType(value)

    // Find the selected type details
    const selectedType = DEDUCTION_TYPES.find(t => t.id === value)

    if (selectedType) {
      if (selectedType.pourcentage !== null) {
        // Predefined deduction: auto-fill percentage
        setPourcentageDeduction(selectedType.pourcentage.toString())
        setCustomIntitule('') // Not needed for predefined
      } else {
        // Custom deduction: clear percentage, user will enter
        setPourcentageDeduction('')
        setCustomIntitule('')
      }
    }
  }

  /**
   * Handle add deduction to list
   */
  const handleAddDeduction = () => {
    // Validation
    if (!selectedDeductionType) {
      showToast('Veuillez sélectionner un type de déduction', 'error')
      return
    }

    let intitule = ''
    if (selectedDeductionType === 'autre') {
      if (!customIntitule || customIntitule.trim() === '') {
        showToast('Veuillez saisir un intitulé pour la déduction personnalisée', 'error')
        return
      }
      intitule = customIntitule.trim()
    } else {
      const selectedType = DEDUCTION_TYPES.find(t => t.id === selectedDeductionType)
      intitule = selectedType?.label || ''
    }

    if (!pourcentageDeduction || parseFloat(pourcentageDeduction) <= 0) {
      showToast('Veuillez saisir un pourcentage valide', 'error')
      return
    }

    if (!montantDeduction || parseFloat(montantDeduction) <= 0) {
      showToast('Le montant de la déduction doit être supérieur à zéro', 'error')
      return
    }

    // Add deduction to list
    const newDeduction = {
      id: Date.now(), // Temporary ID for UI
      intitule,
      pourcentage: parseFloat(pourcentageDeduction),
      montant: parseFloat(montantDeduction)
    }

    setDeductions([...deductions, newDeduction])

    // Reset form
    setSelectedDeductionType('')
    setCustomIntitule('')
    setPourcentageDeduction('')
    setMontantDeduction('')
  }

  /**
   * Handle remove deduction from list
   */
  const handleRemoveDeduction = (deductionId) => {
    setDeductions(deductions.filter(d => d.id !== deductionId))
  }

  // Clear all filters function
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedContactFilter('')
    setSelectedChantierFilter('')
    setShowOverdueOnly(false)
  }

  // Reset contact and chantier filters when type changes
  useEffect(() => {
    setSelectedContactFilter('')
    setSelectedChantierFilter('')
  }, [activeType])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, activeType, selectedContactFilter, selectedChantierFilter, searchQuery, showOverdueOnly])

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
      result = await updateFacture(editingFacture.id, data, deductions)
    } else {
      result = await createFacture(data, deductions)
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
      // Display specific error message from service
      showToast(result.error || 'Erreur lors de l\'enregistrement', 'error')
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
    // Initialize deductions (new system)
    setDeductions(facture.deductions || [])
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
    setMontantApresDeductions('')
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
    // Reset deductions (new system)
    setDeductions([])
    setSelectedDeductionType('')
    setCustomIntitule('')
    setPourcentageDeduction('')
    setMontantDeduction('')
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
   * Open detail modal
   */
  const handleOpenDetail = (facture) => {
    setSelectedDetailFacture(facture)
    setIsDetailModalOpen(true)
  }

  /**
   * Close detail modal and open edit form
   */
  const handleDetailToEdit = () => {
    const facture = selectedDetailFacture
    setIsDetailModalOpen(false)
    setSelectedDetailFacture(null)
    handleEdit(facture)
  }

  /**
   * Close detail modal and open payment modal
   */
  const handleDetailToPaiement = () => {
    const facture = selectedDetailFacture
    setIsDetailModalOpen(false)
    setSelectedDetailFacture(null)
    handleOpenPaiement(facture)
  }

  /**
   * View PDF in modal
   */
  const handleViewPdf = async (facture) => {
    if (!facture.document) return
    setOpenPdfMenuId(null)

    const { success, url, error } = await downloadDocument(facture.document.storage_path)
    if (success && url) {
      setPdfViewerUrl(url)
      setPdfViewerTitle(facture.document.nom_original || 'Document PDF')
      setIsPdfViewerOpen(true)
    } else {
      showToast(error || 'Erreur lors de l\'ouverture du PDF', 'error')
    }
  }

  /**
   * Trigger PDF upload for a facture
   */
  const handleAddPdf = (factureId) => {
    setPdfUploadFactureId(factureId)
    setOpenPdfMenuId(null)
    pdfInputRef.current?.click()
  }

  /**
   * Handle PDF file selection (add or replace)
   */
  const handlePdfFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !pdfUploadFactureId) return

    // Find the facture
    const facture = factures.find(f => f.id === pdfUploadFactureId)

    // If there's an existing document, delete it first
    if (facture?.document) {
      const { success: deleteSuccess, error: deleteError } = await deleteDocument(facture.document.id, facture.document.storage_path)
      if (!deleteSuccess) {
        showToast(deleteError || 'Erreur lors du remplacement du PDF', 'error')
        e.target.value = ''
        setPdfUploadFactureId(null)
        return
      }
    }

    // Upload the new PDF
    const { success, error } = await uploadDocument(pdfUploadFactureId, file)
    if (success) {
      showToast(facture?.document ? 'PDF remplacé avec succès' : 'PDF ajouté avec succès', 'success')
      refreshFactures()
    } else {
      showToast(error || 'Erreur lors de l\'upload du PDF', 'error')
    }

    e.target.value = ''
    setPdfUploadFactureId(null)
  }

  /**
   * Delete PDF from facture
   */
  const handleDeletePdf = async (facture) => {
    if (!facture.document) return
    setOpenPdfMenuId(null)

    const { success, error } = await deleteDocument(facture.document.id, facture.document.storage_path)
    if (success) {
      showToast('PDF supprimé avec succès', 'success')
      refreshFactures()
    } else {
      showToast(error || 'Erreur lors de la suppression du PDF', 'error')
    }
  }

  /**
   * Open notes modal for a facture
   */
  const handleOpenNotes = (facture) => {
    setSelectedNotesFacture(facture)
    setIsNotesModalOpen(true)
  }

  /**
   * Handle notes change (refresh factures to update notes count)
   */
  const handleNotesChange = () => {
    refreshFactures()
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
      <div className="p-4 md:p-6">
        {/* Fixed Header */}
        <StickyPageHeader showBackButton={false}>
          {/* Left: Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Finances</h1>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleCreate}
              className="h-[48px]"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">Nouvelle facture</span>
            </Button>

            {/* Bulk Actions Menu */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="h-[48px]"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline ml-2">Actions multiples</span>
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
        </StickyPageHeader>

        {/* Tabs - Niveau 1 : Statut */}
        <div className="mb-6">
          <Tabs tabs={statutTabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tabs - Niveau 2 : Type (masqué pour Fin de chantier) */}
        {activeTab !== 'fin_chantier' && (
          <div className="mb-6">
            <SubTabs tabs={typeTabs} activeTab={activeType} onChange={setActiveType} />
          </div>
        )}

        {/* Search Bar and Filters */}
        <div className="flex flex-col gap-3 mb-6">
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

          {/* Filters Row - Contact Filter, Chantier Filter, Overdue Button, Clear Button (masqué pour Fin de chantier) */}
          {activeTab !== 'fin_chantier' ? (
            <div className="flex flex-col gap-3">
              {/* First row: Contact and Chantier filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Contact Filter with search */}
                <SearchableSelect
                  value={selectedContactFilter}
                  onChange={setSelectedContactFilter}
                  options={contactFilterOptions}
                  placeholder={activeType === 'client' ? 'Tous les clients' : 'Tous les fournisseurs'}
                  searchPlaceholder="Rechercher un contact..."
                />

                {/* Chantier Filter with search */}
                <SearchableSelect
                  value={selectedChantierFilter}
                  onChange={setSelectedChantierFilter}
                  options={chantierFilterOptions}
                  placeholder="Tous les chantiers"
                  searchPlaceholder="Rechercher un chantier..."
                />
              </div>

              {/* Second row: Overdue and Clear buttons */}
              <div className="flex flex-row gap-3 md:justify-start">
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
                  disabled={!searchQuery && !selectedContactFilter && !selectedChantierFilter && !showOverdueOnly}
                  className={`
                    h-12 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap
                    ${(!searchQuery && !selectedContactFilter && !selectedChantierFilter && !showOverdueOnly)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <XCircle className="w-5 h-5" />
                  <span>Effacer</span>
                </button>
              </div>
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
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => handleOpenDetail(facture)}
              >
                {/* Notes indicator - top right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenNotes(facture)
                  }}
                  className={`
                    absolute top-3 right-3 p-2 rounded-lg transition-colors
                    ${facture.notes_count > 0
                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  title={facture.notes_count > 0 ? `${facture.notes_count} note(s)` : 'Ajouter une note'}
                >
                  <StickyNote className="w-5 h-5" />
                  {facture.notes_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                      {facture.notes_count}
                    </span>
                  )}
                </button>

                <div className="flex gap-3 pr-12">
                  {/* Checkbox in selection mode */}
                  {selectionMode && (
                    <div className="flex items-start pt-1" onClick={(e) => e.stopPropagation()}>
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
                              {facture.type === 'client' ? (
                                facture.numero_facture
                              ) : (
                                <>
                                  {getContactDisplayName(facture.contact)}
                                  {facture.contact?.numero_contact && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                      ({formatNumeroContact(facture.contact.numero_contact)})
                                    </span>
                                  )}
                                </>
                              )}
                            </h3>
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
                              <span>
                                {getContactDisplayName(facture.contact)}
                                {facture.contact?.numero_contact && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({formatNumeroContact(facture.contact.numero_contact)})
                                  </span>
                                )}
                              </span>
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
                      {facture.type === 'client' && facture.deductions?.length > 0 && (
                        facture.deductions.map((deduction) => (
                          <span
                            key={deduction.id}
                            className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {deduction.intitule} {deduction.pourcentage}%
                          </span>
                        ))
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
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* PDF Button with dropdown menu */}
                    {facture.document ? (
                      <div className="relative">
                        <button
                          onClick={() => setOpenPdfMenuId(openPdfMenuId === facture.id ? null : facture.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                          title="PDF attaché"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden md:inline">PDF</span>
                        </button>

                        {/* PDF Dropdown menu */}
                        {openPdfMenuId === facture.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenPdfMenuId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => handleViewPdf(facture)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Voir</span>
                              </button>
                              <button
                                onClick={() => handleAddPdf(facture.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Remplacer</span>
                              </button>
                              <button
                                onClick={() => handleDeletePdf(facture)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleAddPdf(facture.id)}
                        className="flex-1 md:flex-none"
                        title="Ajouter un PDF"
                      >
                        <Upload className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Ajouter PDF</span>
                      </Button>
                    )}

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

                {/* Montant après déductions (factures sans TVA avec déductions) */}
                {!tvaApplicable && montantApresDeductions && deductions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant après déductions (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={montantApresDeductions}
                        readOnly
                        disabled
                        className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed font-medium"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        €
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Calculé automatiquement : HT - déductions
                    </p>
                  </div>
                )}

                {/* Déductions flexibles (nouveau système) */}
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700">Déductions (optionnel)</h4>

                  {/* Liste des déductions ajoutées */}
                  {deductions.length > 0 && (
                    <div className="space-y-2">
                      {deductions.map((deduction) => (
                        <div key={deduction.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{deduction.intitule}</span>
                              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full">
                                {deduction.pourcentage}%
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {formatCurrency(deduction.montant)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeduction(deduction.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulaire d'ajout de déduction */}
                  <div className="space-y-3">
                    {/* Type de déduction */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de déduction
                      </label>
                      <SearchableSelect
                        value={selectedDeductionType}
                        onChange={handleDeductionTypeChange}
                        options={DEDUCTION_TYPES.map(type => ({
                          value: type.id,
                          label: type.label
                        }))}
                        placeholder="Sélectionner un type..."
                      />
                    </div>

                    {/* Intitulé personnalisé (si "Autre" sélectionné) */}
                    {selectedDeductionType === 'autre' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Intitulé personnalisé
                        </label>
                        <input
                          type="text"
                          value={customIntitule}
                          onChange={(e) => setCustomIntitule(e.target.value)}
                          placeholder="Ex: Pénalités de retard"
                          className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Pourcentage et montant (sur la même ligne en desktop) */}
                    {selectedDeductionType && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pourcentage (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={pourcentageDeduction}
                            onChange={(e) => setPourcentageDeduction(e.target.value)}
                            placeholder="5.00"
                            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Montant (€)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={montantDeduction}
                              onChange={(e) => setMontantDeduction(e.target.value)}
                              placeholder="50.00"
                              className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                              €
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bouton Ajouter */}
                    {selectedDeductionType && (
                      <button
                        type="button"
                        onClick={handleAddDeduction}
                        className="w-full h-10 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Ajouter la déduction
                      </button>
                    )}
                  </div>
                </div>

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
              {/* Indication du délai de paiement du contact */}
              {selectedContactId && (() => {
                const contact = contacts.find(c => c.id === selectedContactId)
                if (contact?.delai_paiement) {
                  return (
                    <p className="mt-1 text-sm text-gray-500">
                      Délai de paiement du contact : <span className="font-medium text-primary-600">{getPaymentTermLabel(contact.delai_paiement)}</span>
                    </p>
                  )
                }
                return null
              })()}
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

        {/* Modal Détail Facture */}
        <FactureDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedDetailFacture(null)
          }}
          facture={selectedDetailFacture}
          onEdit={handleDetailToEdit}
          onPaiement={handleDetailToPaiement}
        />

        {/* Hidden PDF input for upload */}
        <input
          type="file"
          ref={pdfInputRef}
          onChange={handlePdfFileChange}
          accept="application/pdf"
          className="hidden"
        />

        {/* PDF Viewer Modal */}
        <Modal
          isOpen={isPdfViewerOpen}
          onClose={() => {
            setIsPdfViewerOpen(false)
            setPdfViewerUrl(null)
            setPdfViewerTitle('')
          }}
          title={pdfViewerTitle}
          size="xl"
        >
          <div className="w-full h-[70vh]">
            {pdfViewerUrl && (
              <iframe
                src={pdfViewerUrl}
                title={pdfViewerTitle}
                className="w-full h-full border-0 rounded-lg"
              />
            )}
          </div>
        </Modal>

        {/* Notes Modal */}
        <NotesModal
          isOpen={isNotesModalOpen}
          onClose={() => {
            setIsNotesModalOpen(false)
            setSelectedNotesFacture(null)
          }}
          facture={selectedNotesFacture}
          onNotesChange={handleNotesChange}
        />
      </div>
    </AppLayout>
  )
}
