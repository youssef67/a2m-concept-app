/**
 * PlotDetailPage
 * Page de détail d'un plot avec liste des appartements
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Home, Building2, Edit, Trash2, Search, ChevronDown, CheckCircle, AlertTriangle, MessageCircle, X, XCircle, FileCheck, ListOrdered } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import Modal from '../../../shared/components/ui/Modal'
import Tabs from '../../../shared/components/ui/Tabs'
import Select from '../../../shared/components/ui/Select'
import CreateAppartementModal from '../components/CreateAppartementModal'
import CreateMultipleAppartementsModal from '../components/CreateMultipleAppartementsModal'
import SendWhatsAppModal from '../components/SendWhatsAppModal'
import ExceptionalWhatsAppModal from '../components/ExceptionalWhatsAppModal'
import { getPlotById } from '../services/plotsService'
import { validateAppartements, invalidateAppartements } from '../services/appartementsService'
import { getTachesByChantier } from '../services/tachesService'
import { useAppartements } from '../hooks/useAppartements'
import { useToast } from '../../../shared/hooks/useToast'
import {
  searchAppartements,
  filterAppartementsByStatut,
  calculateAppartementStatut,
  getStatutConfig,
  getTasksEnCours
} from '../utils/appartementHelpers'
import { hasTasksEnCours } from '../utils/whatsappHelpers'
import { formatEtage } from '../utils/etageConstants'

export default function PlotDetailPage() {
  const { chantierId, plotId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize active tab from URL parameter or default to 'en_cours'
  const initialTab = searchParams.get('activeTab') || 'en_cours'

  const [plot, setPlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateAppartementModalOpen, setIsCreateAppartementModalOpen] = useState(false)
  const [isCreateMultipleModalOpen, setIsCreateMultipleModalOpen] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [appartementToEdit, setAppartementToEdit] = useState(null)
  const [appartementToDelete, setAppartementToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showOnlyWithAllDocuments, setShowOnlyWithAllDocuments] = useState(false)
  const [sortByTaskCompletion, setSortByTaskCompletion] = useState(false)
  const [selectedTacheFilter, setSelectedTacheFilter] = useState('') // '' = toutes, sinon tacheId
  const [chantierTaches, setChantierTaches] = useState([]) // Liste des tâches du chantier
  const [creationResult, setCreationResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)

  // WhatsApp selection states (for "Prêt" tab)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedAppartements, setSelectedAppartements] = useState(new Set())
  const [isSendWhatsAppModalOpen, setIsSendWhatsAppModalOpen] = useState(false)

  // WhatsApp selection states (for "En cours" tab)
  const [isWhatsAppSelectionEnCours, setIsWhatsAppSelectionEnCours] = useState(false)
  const [selectedForWhatsAppEnCours, setSelectedForWhatsAppEnCours] = useState(new Set())
  const [isSendWhatsAppEnCoursModalOpen, setIsSendWhatsAppEnCoursModalOpen] = useState(false)
  const [isExceptionalWhatsAppModalOpen, setIsExceptionalWhatsAppModalOpen] = useState(false)

  // Validation/Invalidation selection states
  const [isValidationMode, setIsValidationMode] = useState(false)
  const [isInvalidationMode, setIsInvalidationMode] = useState(false)
  const [selectedForValidation, setSelectedForValidation] = useState(new Set())
  const [selectedForInvalidation, setSelectedForInvalidation] = useState(new Set())
  const [showValidationConfirm, setShowValidationConfirm] = useState(false)
  const [showInvalidationConfirm, setShowInvalidationConfirm] = useState(false)

  // Toast hook
  const { showToast } = useToast()

  // Appartements hook
  const { appartements, loading: appartementsLoading, loadAppartements, deleteAppartement } = useAppartements(plotId, chantierId)

  // Load plot data
  useEffect(() => {
    async function loadPlot() {
      if (!plotId) {
        setError('ID du plot manquant')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await getPlotById(plotId)

      if (fetchError || !data) {
        setError('Plot introuvable')
        setPlot(null)
      } else {
        setPlot(data)
      }

      setLoading(false)
    }

    loadPlot()
  }, [plotId])

  // Load appartements data
  useEffect(() => {
    if (plotId) {
      loadAppartements()
    }
  }, [plotId, loadAppartements])

  // Load chantier taches
  useEffect(() => {
    async function loadChantierTaches() {
      if (!chantierId) return

      const { data, error } = await getTachesByChantier(chantierId)
      if (!error && data) {
        setChantierTaches(data)
      }
    }

    loadChantierTaches()
  }, [chantierId])

  // Clean up activeTab URL parameter after reading it
  useEffect(() => {
    const activeTabParam = searchParams.get('activeTab')
    if (activeTabParam) {
      // Remove the parameter from URL without triggering a navigation
      searchParams.delete('activeTab')
      setSearchParams(searchParams, { replace: true })
    }
  }, []) // Run only once on mount

  // Filter appartements based on search query and status
  const filteredBySearch = useMemo(() => {
    return searchAppartements(appartements, searchQuery)
  }, [appartements, searchQuery])

  const filteredByDocuments = useMemo(() => {
    if (!showOnlyWithAllDocuments) return filteredBySearch

    return filteredBySearch.filter(appt => {
      return appt.documents_uploaded_count === appt.documents_required_count &&
             appt.documents_required_count > 0
    })
  }, [filteredBySearch, showOnlyWithAllDocuments])

  const filteredByTache = useMemo(() => {
    if (!selectedTacheFilter) return filteredByDocuments // Pas de filtre

    // Filtrer les appartements qui ont la tâche sélectionnée avec statut "terminee"
    return filteredByDocuments.filter(appt => {
      return appt.taches?.some(t =>
        t.chantier_tache_id === selectedTacheFilter && t.statut === 'terminee'
      )
    })
  }, [filteredByDocuments, selectedTacheFilter])

  const filteredByStatut = useMemo(() => {
    return filterAppartementsByStatut(filteredByTache, activeTab)
  }, [filteredByTache, activeTab])

  const sortedAppartements = useMemo(() => {
    if (!sortByTaskCompletion) return filteredByStatut

    // Sort by task completion percentage (descending)
    return [...filteredByStatut].sort((a, b) => {
      const aCompleted = (a.taches || []).filter(t => t.statut === 'terminee').length
      const aTotal = a.taches_count || 0
      const aPercentage = aTotal > 0 ? (aCompleted / aTotal) : 0

      const bCompleted = (b.taches || []).filter(t => t.statut === 'terminee').length
      const bTotal = b.taches_count || 0
      const bPercentage = bTotal > 0 ? (bCompleted / bTotal) : 0

      return bPercentage - aPercentage // Descending order
    })
  }, [filteredByStatut, sortByTaskCompletion])

  const filteredAppartements = sortedAppartements

  // Calculate stats for tabs
  const stats = useMemo(() => ({
    en_attente: filterAppartementsByStatut(appartements, 'en_attente').length,
    en_cours: filterAppartementsByStatut(appartements, 'en_cours').length,
    pret: filterAppartementsByStatut(appartements, 'pret').length,
    finalise: filterAppartementsByStatut(appartements, 'finalise').length
  }), [appartements])

  // Prepare taches options with count of appartements that completed each tache
  const tachesOptions = useMemo(() => {
    if (!chantierTaches || chantierTaches.length === 0) return []

    return chantierTaches.map(tache => {
      // Count appartements that have this tache with statut "terminee"
      const count = appartements.filter(appt =>
        appt.taches?.some(t => t.chantier_tache_id === tache.id && t.statut === 'terminee')
      ).length

      return {
        value: tache.id,
        label: `${tache.intitule} (${count})`
      }
    })
  }, [chantierTaches, appartements])

  // Check if at least one "en_attente" appartement has all documents
  const hasAppartementsWithAllDocuments = useMemo(() => {
    const appartementsEnAttente = filterAppartementsByStatut(appartements, 'en_attente')
    return appartementsEnAttente.some(appt =>
      appt.documents_uploaded_count === appt.documents_required_count &&
      appt.documents_required_count > 0
    )
  }, [appartements])

  // Get existing appartement names for duplicate validation
  const existingAppartementNames = useMemo(() => {
    return appartements.map(appt => appt.nom)
  }, [appartements])

  // Handle back button
  const handleBack = () => {
    navigate(`/admin/plotsmanager/${chantierId}`)
  }

  // Handle appartement click
  const handleAppartementClick = (appartement) => {
    // Pass current tab in URL to remember it on back navigation
    // If in "en_attente" tab, open directly in Documents tab
    // If in "en_cours" tab, open directly in Taches tab
    if (activeTab === 'en_attente') {
      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartement.id}?tab=documents&fromTab=${activeTab}`)
    } else if (activeTab === 'en_cours') {
      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartement.id}?tab=taches&fromTab=${activeTab}`)
    } else {
      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartement.id}?fromTab=${activeTab}`)
    }
  }

  // Handle appartement creation success
  const handleAppartementCreated = () => {
    loadAppartements()
  }

  // Handle multiple appartements creation success
  const handleMultipleAppartementsCreated = (result) => {
    loadAppartements()
    setCreationResult(result)
    setShowResultModal(true)
  }

  // Handle appartement edit
  const handleEditAppartement = (e, appartement) => {
    e.stopPropagation() // Prevent navigation to appartement detail
    setAppartementToEdit(appartement)
    setIsCreateAppartementModalOpen(true)
  }

  // Handle appartement delete - open confirm modal
  const handleDeleteAppartement = (e, appartement) => {
    e.stopPropagation() // Prevent navigation to appartement detail
    setAppartementToDelete(appartement)
  }

  // Confirm appartement deletion
  const confirmDeleteAppartement = async () => {
    if (!appartementToDelete) return

    const result = await deleteAppartement(appartementToDelete.id)
    if (result.success) {
      loadAppartements()
    } else {
      alert('Erreur lors de la suppression de l\'appartement')
    }
    setAppartementToDelete(null)
  }

  // Handle modal close
  const handleCloseAppartementModal = () => {
    setIsCreateAppartementModalOpen(false)
    setAppartementToEdit(null)
  }

  // WhatsApp handlers
  const handleStartWhatsAppSelection = () => {
    setIsSelectionMode(true)
    setSelectedAppartements(new Set())
  }

  const handleCancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedAppartements(new Set())
  }

  const handleToggleAppartementSelection = (appartementId) => {
    setSelectedAppartements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appartementId)) {
        newSet.delete(appartementId)
      } else {
        newSet.add(appartementId)
      }
      return newSet
    })
  }

  const handleContinueToWhatsApp = () => {
    if (selectedAppartements.size === 0) {
      alert('Veuillez sélectionner au moins un appartement')
      return
    }
    setIsSendWhatsAppModalOpen(true)
  }

  const handleCloseWhatsAppModal = () => {
    setIsSendWhatsAppModalOpen(false)
    setIsSelectionMode(false)
    setSelectedAppartements(new Set())
  }

  // WhatsApp handlers for "En cours" tab
  const handleStartWhatsAppSelectionEnCours = () => {
    setIsWhatsAppSelectionEnCours(true)
    setSelectedForWhatsAppEnCours(new Set())
  }

  const handleCancelWhatsAppSelectionEnCours = () => {
    setIsWhatsAppSelectionEnCours(false)
    setSelectedForWhatsAppEnCours(new Set())
  }

  const handleToggleWhatsAppEnCoursSelection = (appartementId) => {
    setSelectedForWhatsAppEnCours(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appartementId)) {
        newSet.delete(appartementId)
      } else {
        newSet.add(appartementId)
      }
      return newSet
    })
  }

  const handleContinueToWhatsAppEnCours = () => {
    if (selectedForWhatsAppEnCours.size === 0) {
      showToast('Veuillez sélectionner au moins un appartement', 'error')
      return
    }

    // Vérifier qu'au moins un appartement OK existe (sans tâches en cours)
    const validAppartements = appartements
      .filter(appt => selectedForWhatsAppEnCours.has(appt.id))
      .filter(appt => !hasTasksEnCours(appt.taches))

    if (validAppartements.length === 0) {
      showToast('Aucun appartement sélectionné ne peut être envoyé (tous ont des tâches en cours)', 'error')
      return
    }

    setIsSendWhatsAppEnCoursModalOpen(true)
  }

  const handleCloseWhatsAppEnCoursModal = () => {
    setIsSendWhatsAppEnCoursModalOpen(false)
    setIsWhatsAppSelectionEnCours(false)
    setSelectedForWhatsAppEnCours(new Set())
  }

  // Validation handlers
  const handleStartValidation = () => {
    setIsValidationMode(true)
    setSelectedForValidation(new Set())
  }

  const handleCancelValidation = () => {
    setIsValidationMode(false)
    setSelectedForValidation(new Set())
  }

  const handleToggleValidationSelection = (appartementId) => {
    setSelectedForValidation(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appartementId)) {
        newSet.delete(appartementId)
      } else {
        newSet.add(appartementId)
      }
      return newSet
    })
  }

  const handleContinueToValidation = () => {
    if (selectedForValidation.size === 0) {
      showToast('Veuillez sélectionner au moins un appartement', 'error')
      return
    }
    setShowValidationConfirm(true)
  }

  const confirmValidation = async () => {
    const ids = Array.from(selectedForValidation)
    const result = await validateAppartements(ids)

    if (result.success) {
      showToast(`${result.updated} appartement(s) validé(s) avec succès`, 'success')
      setIsValidationMode(false)
      setSelectedForValidation(new Set())
      setShowValidationConfirm(false)
      loadAppartements()
      setActiveTab('pret') // Switch to "Prêt" tab
    } else {
      showToast('Erreur lors de la validation', 'error')
      setShowValidationConfirm(false)
    }
  }

  // Invalidation handlers
  const handleStartInvalidation = () => {
    setIsInvalidationMode(true)
    setSelectedForInvalidation(new Set())
  }

  const handleCancelInvalidation = () => {
    setIsInvalidationMode(false)
    setSelectedForInvalidation(new Set())
  }

  const handleToggleInvalidationSelection = (appartementId) => {
    setSelectedForInvalidation(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appartementId)) {
        newSet.delete(appartementId)
      } else {
        newSet.add(appartementId)
      }
      return newSet
    })
  }

  const handleContinueToInvalidation = () => {
    if (selectedForInvalidation.size === 0) {
      showToast('Veuillez sélectionner au moins un appartement', 'error')
      return
    }
    setShowInvalidationConfirm(true)
  }

  const confirmInvalidation = async () => {
    const ids = Array.from(selectedForInvalidation)
    const result = await invalidateAppartements(ids)

    if (result.success) {
      showToast(`${result.updated} appartement(s) invalidé(s) avec succès`, 'success')
      setIsInvalidationMode(false)
      setSelectedForInvalidation(new Set())
      setShowInvalidationConfirm(false)
      loadAppartements()
      setActiveTab('en_attente') // Switch to "En attente" tab
    } else {
      showToast('Erreur lors de l\'invalidation', 'error')
      setShowInvalidationConfirm(false)
    }
  }

  // Documents filter handlers
  const handleToggleDocumentsFilter = () => {
    setShowOnlyWithAllDocuments(prev => !prev)
  }

  // Task sort handlers
  const handleToggleTaskSort = () => {
    setSortByTaskCompletion(prev => !prev)
  }

  const handleClearAllFilters = () => {
    setSearchQuery('')
    // Only clear documents filter if in "en_attente" tab
    if (activeTab === 'en_attente') {
      setShowOnlyWithAllDocuments(false)
    }
    // Only clear task sort and tache filter if in "en_cours" tab
    if (activeTab === 'en_cours') {
      setSortByTaskCompletion(false)
      setSelectedTacheFilter('')
    }
  }

  // Get selected appartements data
  const selectedAppartementsData = useMemo(() => {
    return appartements.filter(appt => selectedAppartements.has(appt.id))
  }, [appartements, selectedAppartements])

  // Get selected appartements data for "En cours" WhatsApp
  const selectedAppartementsEnCoursData = useMemo(() => {
    return appartements
      .filter(appt => selectedForWhatsAppEnCours.has(appt.id))
      .filter(appt => !hasTasksEnCours(appt.taches)) // Exclure les appartements avec tâches en cours
  }, [appartements, selectedForWhatsAppEnCours])

  // Reset selection modes when changing tabs
  useEffect(() => {
    // Reset WhatsApp selection mode (for "Prêt" tab)
    if (activeTab !== 'pret') {
      setIsSelectionMode(false)
      setSelectedAppartements(new Set())
    }
    // Reset WhatsApp selection mode (for "En cours" tab)
    if (activeTab !== 'en_cours') {
      setIsWhatsAppSelectionEnCours(false)
      setSelectedForWhatsAppEnCours(new Set())
    }
    // Reset validation mode
    if (activeTab !== 'en_attente') {
      setIsValidationMode(false)
      setSelectedForValidation(new Set())
      // Reset documents filter when leaving "en_attente" tab
      setShowOnlyWithAllDocuments(false)
    }
    // Reset invalidation mode
    if (activeTab !== 'pret') {
      setIsInvalidationMode(false)
      setSelectedForInvalidation(new Set())
    }
    // Reset task sort when leaving "en_cours" tab
    if (activeTab !== 'en_cours') {
      setSortByTaskCompletion(false)
    }
  }, [activeTab])

  // Type labels
  const TYPE_LABELS = {
    immeuble: 'Immeuble',
    structure: 'Structure',
    batiment: 'Bâtiment',
    annexe: 'Annexe',
    autre: 'Autre'
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
            <Button onClick={handleBack} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4" />
              <span className="ml-2">Retour</span>
            </Button>
          </div>
        )}

        {/* Success State */}
        {!loading && !error && plot && (
          <>
            {/* Header with title and action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Left: Back button + Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Retour"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{plot.nom}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Building2 className="w-4 h-4" />
                    <span>{TYPE_LABELS[plot.type] || plot.type}</span>
                  </div>
                </div>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2">
                {/* Validation button - only in "En attente" tab */}
                {!appartementsLoading && activeTab === 'en_attente' && stats.en_attente > 0 && !isValidationMode && (
                  <Button
                    onClick={handleStartValidation}
                    variant="secondary"
                    className="flex items-center gap-2 min-h-[44px]"
                    title="Valider appartement(s)"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Valider appartement(s)</span>
                  </Button>
                )}

                {/* Invalidation button - only in "Prêt" tab */}
                {!appartementsLoading && activeTab === 'pret' && stats.pret > 0 && !isInvalidationMode && !isSelectionMode && (
                  <Button
                    onClick={handleStartInvalidation}
                    variant="secondary"
                    className="flex items-center gap-2 min-h-[44px]"
                    title="Invalider appartement(s)"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Invalider appartement(s)</span>
                  </Button>
                )}

                {/* WhatsApp button - only in "Prêt" tab */}
                {!appartementsLoading && activeTab === 'pret' && stats.pret > 0 && !isSelectionMode && !isInvalidationMode && (
                  <Button
                    onClick={handleStartWhatsAppSelection}
                    variant="secondary"
                    className="flex items-center gap-2 min-h-[44px]"
                    title="Envoyer par WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Envoyer par WhatsApp</span>
                  </Button>
                )}

                {/* WhatsApp button - only in "En cours" tab */}
                {!appartementsLoading && activeTab === 'en_cours' && stats.en_cours > 0 && !isWhatsAppSelectionEnCours && (
                  <Button
                    onClick={handleStartWhatsAppSelectionEnCours}
                    variant="secondary"
                    className="flex items-center gap-2 min-h-[44px]"
                    title="Envoyer par WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Envoyer par WhatsApp</span>
                  </Button>
                )}

                {/* Exceptional WhatsApp button - only in "En cours" tab */}
                {!appartementsLoading && activeTab === 'en_cours' && stats.en_cours > 0 && !isWhatsAppSelectionEnCours && (
                  <Button
                    onClick={() => setIsExceptionalWhatsAppModalOpen(true)}
                    variant="secondary"
                    className="flex items-center gap-2 min-h-[44px]"
                    title="Envoi exceptionnel"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Envoi exceptionnel</span>
                  </Button>
                )}

                {/* Create button with dropdown */}
                <div className="relative">
                  <Button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Home className="w-5 h-5" />
                    <span>Créer appartement(s)</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>

                  {showCreateMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCreateMenu(false)}
                      />

                      {/* Dropdown menu */}
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <button
                          onClick={() => {
                            setIsCreateAppartementModalOpen(true)
                            setShowCreateMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Home className="w-5 h-5 text-primary-600" />
                          <span className="text-gray-700 font-medium">Créer un appartement</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsCreateMultipleModalOpen(true)
                            setShowCreateMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Building2 className="w-5 h-5 text-primary-600" />
                          <span className="text-gray-700 font-medium">Créer plusieurs appartements</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description if exists */}
            {plot.description && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">{plot.description}</p>
              </div>
            )}

            {/* Appartements list */}
            <div className="mt-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Appartements</h2>
              </div>

              {/* Tabs */}
              {!appartementsLoading && appartements.length > 0 && (
                <div className="mb-4">
                  <Tabs
                    tabs={[
                      { id: 'en_cours', label: 'En cours', count: stats.en_cours },
                      { id: 'en_attente', label: 'En attente', count: stats.en_attente },
                      { id: 'pret', label: 'Prêt', count: stats.pret },
                      { id: 'finalise', label: 'Finalisé', count: stats.finalise }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                  />
                </div>
              )}

              {/* Search Bar and filters */}
              {!appartementsLoading && appartements.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un appartement..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base"
                    />
                  </div>

                  {/* Documents filter button - only in "En attente" tab and if at least one appt has all documents */}
                  {activeTab === 'en_attente' && stats.en_attente > 0 && hasAppartementsWithAllDocuments && !isValidationMode && (
                    <button
                      onClick={handleToggleDocumentsFilter}
                      className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors min-h-[44px] whitespace-nowrap ${
                        showOnlyWithAllDocuments
                          ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Afficher uniquement les appartements avec tous les documents"
                    >
                      <FileCheck className="w-5 h-5" />
                      <span className="text-sm">Documents complets</span>
                    </button>
                  )}

                  {/* Task sort button - only in "En cours" tab and if there are appartements */}
                  {activeTab === 'en_cours' && stats.en_cours > 0 && (
                    <button
                      onClick={handleToggleTaskSort}
                      className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors min-h-[44px] whitespace-nowrap ${
                        sortByTaskCompletion
                          ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Trier par progression des tâches"
                    >
                      <ListOrdered className="w-5 h-5" />
                      <span className="text-sm">Trier par tâches</span>
                    </button>
                  )}

                  {/* Tache filter - only in "En cours" tab and if there are taches */}
                  {activeTab === 'en_cours' && stats.en_cours > 0 && tachesOptions.length > 0 && (
                    <div className="min-w-[200px]">
                      <Select
                        value={selectedTacheFilter}
                        onChange={setSelectedTacheFilter}
                        options={[
                          { value: '', label: 'Toutes les tâches' },
                          ...tachesOptions
                        ]}
                        placeholder="Toutes les tâches"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Clear filters button */}
              {!appartementsLoading && appartements.length > 0 && (searchQuery !== '' || (activeTab === 'en_attente' && showOnlyWithAllDocuments) || (activeTab === 'en_cours' && (sortByTaskCompletion || selectedTacheFilter !== ''))) && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleClearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                    title="Effacer les filtres"
                  >
                    <X className="w-4 h-4" />
                    <span>Effacer les filtres</span>
                  </button>
                </div>
              )}

              {appartementsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}

              {!appartementsLoading && appartements.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun appartement créé pour ce plot</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliquez sur « Créer un appartement » pour commencer
                  </p>
                </div>
              )}

              {/* No results - search or tab specific */}
              {!appartementsLoading && appartements.length > 0 && filteredAppartements.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  {searchQuery ? (
                    <p className="text-gray-600">
                      Aucun appartement {activeTab === 'en_attente' ? 'en attente' : activeTab === 'en_cours' ? 'en cours' : activeTab === 'pret' ? 'prêt' : 'finalisé'} trouvé pour &quot;{searchQuery}&quot;
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      {activeTab === 'en_attente' && 'Aucun appartement en attente'}
                      {activeTab === 'en_cours' && 'Aucun appartement en cours'}
                      {activeTab === 'pret' && 'Aucun appartement prêt'}
                      {activeTab === 'finalise' && 'Aucun appartement finalisé'}
                    </p>
                  )}
                </div>
              )}

              {!appartementsLoading && filteredAppartements.length > 0 && (
                <div className="space-y-3">
                  {filteredAppartements.map((appartement) => {
                    const statut = calculateAppartementStatut(appartement)
                    const statutConfig = getStatutConfig(statut)
                    const tachesEnCours = getTasksEnCours(appartement)
                    const tacheEnCours = tachesEnCours.length > 0 ? tachesEnCours[0] : null

                    // Calculate completed tasks count
                    const tachesTerminees = (appartement.taches || []).filter(t => t.statut === 'terminee').length
                    const totalTaches = appartement.taches_count || 0

                    // Determine which selection mode is active and which set to use
                    const inAnySelectionMode = isSelectionMode || isValidationMode || isInvalidationMode || isWhatsAppSelectionEnCours
                    let isSelected = false
                    let toggleHandler = null

                    // Check if appartement is blocked for WhatsApp (has tasks in progress)
                    const isBlockedForWhatsApp = isWhatsAppSelectionEnCours && hasTasksEnCours(appartement.taches)

                    if (isSelectionMode) {
                      isSelected = selectedAppartements.has(appartement.id)
                      toggleHandler = handleToggleAppartementSelection
                    } else if (isValidationMode) {
                      isSelected = selectedForValidation.has(appartement.id)
                      toggleHandler = handleToggleValidationSelection
                    } else if (isInvalidationMode) {
                      isSelected = selectedForInvalidation.has(appartement.id)
                      toggleHandler = handleToggleInvalidationSelection
                    } else if (isWhatsAppSelectionEnCours) {
                      isSelected = selectedForWhatsAppEnCours.has(appartement.id)
                      toggleHandler = handleToggleWhatsAppEnCoursSelection
                    }

                    return (
                      <div
                        key={appartement.id}
                        onClick={() => {
                          // Don't allow selection if blocked for WhatsApp
                          if (isBlockedForWhatsApp) return

                          if (inAnySelectionMode && toggleHandler) {
                            toggleHandler(appartement.id)
                          } else {
                            handleAppartementClick(appartement)
                          }
                        }}
                        className={`border rounded-lg p-4 transition-all bg-white ${
                          isBlockedForWhatsApp
                            ? 'border-gray-200 opacity-60 cursor-not-allowed'
                            : inAnySelectionMode && isSelected
                            ? 'border-primary-500 bg-primary-50 cursor-pointer'
                            : 'border-gray-200 hover:border-primary-500 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Main row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Checkbox in any selection mode */}
                              {inAnySelectionMode && toggleHandler && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isBlockedForWhatsApp}
                                  onChange={() => toggleHandler(appartement.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              )}
                              <Home className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">
                                    {appartement.nom}
                                    {appartement.etage !== null && appartement.etage !== undefined && (
                                      <span className="text-gray-500 font-normal"> • {formatEtage(appartement.etage)}</span>
                                    )}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statutConfig.color} flex-shrink-0`}>
                                    {statutConfig.label}
                                  </span>
                                </div>
                                {/* Warning message for blocked appartements */}
                                {isBlockedForWhatsApp && (
                                  <p className="text-xs text-red-600 font-medium">
                                    ⚠️ Impossible de sélectionner : une tâche est en cours
                                  </p>
                                )}
                              </div>
                            </div>
                            {!inAnySelectionMode && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Desktop: show full text */}
                                <span className="text-sm text-gray-600 hidden sm:inline">
                                  {activeTab === 'en_attente'
                                    ? `${appartement.documents_uploaded_count || 0}/${appartement.documents_required_count || 0} documents`
                                    : `${tachesTerminees}/${totalTaches} ${totalTaches <= 1 ? 'tâche' : 'tâches'}`
                                  }
                                </span>
                                {/* Mobile: show compact version */}
                                <span className="text-sm text-gray-600 sm:hidden">
                                  {activeTab === 'en_attente'
                                    ? `${appartement.documents_uploaded_count || 0}/${appartement.documents_required_count || 0}`
                                    : `${tachesTerminees}/${totalTaches}`
                                  }
                                </span>
                                <button
                                  onClick={(e) => handleEditAppartement(e, appartement)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteAppartement(e, appartement)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Task intitule row (only for en_cours) */}
                          {statut === 'en_cours' && tacheEnCours && (
                            <div className="ml-8 text-xs sm:text-sm text-yellow-700 font-medium truncate" title={tacheEnCours.intitule}>
                              📋 {tacheEnCours.intitule}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal for creating/editing appartement */}
            <CreateAppartementModal
              isOpen={isCreateAppartementModalOpen}
              onClose={handleCloseAppartementModal}
              plotId={plotId}
              chantierId={chantierId}
              plotNom={plot.nom}
              appartementToEdit={appartementToEdit}
              onSuccess={handleAppartementCreated}
            />

            {/* Modal for creating multiple appartements */}
            <CreateMultipleAppartementsModal
              isOpen={isCreateMultipleModalOpen}
              onClose={() => setIsCreateMultipleModalOpen(false)}
              plotId={plotId}
              chantierId={chantierId}
              plotNom={plot.nom}
              existingAppartementNames={existingAppartementNames}
              onSuccess={handleMultipleAppartementsCreated}
            />

            {/* Confirm delete modal */}
            <ConfirmModal
              isOpen={!!appartementToDelete}
              onClose={() => setAppartementToDelete(null)}
              onConfirm={confirmDeleteAppartement}
              title="Supprimer l'appartement"
              message={`Êtes-vous sûr de vouloir supprimer l'appartement « ${appartementToDelete?.nom} » ? Cette action est irréversible.`}
              confirmLabel="Supprimer"
              cancelLabel="Annuler"
              variant="danger"
            />

            {/* Creation result modal */}
            <Modal
              isOpen={showResultModal}
              onClose={() => {
                setShowResultModal(false)
                setCreationResult(null)
              }}
              size="md"
              title="Résultat de la création"
            >
              {creationResult && (
                <div className="space-y-4">
                  {/* Icon and main message */}
                  <div className="flex flex-col items-center text-center">
                    {creationResult.failed === 0 ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Création réussie !
                        </h3>
                        <p className="text-gray-600">
                          {creationResult.created} appartement{creationResult.created > 1 ? 's ont été créés' : ' a été créé'} avec succès.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                          <AlertTriangle className="w-10 h-10 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Création partielle
                        </h3>
                        <p className="text-gray-600">
                          {creationResult.created} appartement{creationResult.created > 1 ? 's créés' : ' créé'} avec succès,{' '}
                          {creationResult.failed} échec{creationResult.failed > 1 ? 's' : ''}.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Appartements créés :</span>
                      <span className="text-sm font-semibold text-green-600">{creationResult.created}</span>
                    </div>
                    {creationResult.failed > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Échecs :</span>
                        <span className="text-sm font-semibold text-red-600">{creationResult.failed}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <span className="text-sm font-medium text-gray-900">Total :</span>
                      <span className="text-sm font-bold text-gray-900">{creationResult.total}</span>
                    </div>
                  </div>

                  {/* Errors list if any */}
                  {creationResult.failed > 0 && creationResult.errors && creationResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-800 mb-2">Détails des erreurs :</h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {creationResult.errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Close button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => {
                        setShowResultModal(false)
                        setCreationResult(null)
                      }}
                      className="min-w-[120px]"
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}
            </Modal>

            {/* WhatsApp Modal (for "Prêt" tab) */}
            <SendWhatsAppModal
              isOpen={isSendWhatsAppModalOpen}
              onClose={handleCloseWhatsAppModal}
              appartements={selectedAppartementsData}
              chantierId={chantierId}
              onSuccess={() => {
                // Switch to "En cours" tab
                setActiveTab('en_cours')
                // Reload appartements to reflect status changes
                loadAppartements()
              }}
            />

            {/* WhatsApp Modal (for "En cours" tab) */}
            <SendWhatsAppModal
              isOpen={isSendWhatsAppEnCoursModalOpen}
              onClose={handleCloseWhatsAppEnCoursModal}
              appartements={selectedAppartementsEnCoursData}
              chantierId={chantierId}
              isEnCoursMode={true}
              onSuccess={() => {
                // Reload appartements to reflect status changes
                loadAppartements()
              }}
            />

            {/* Exceptional WhatsApp Modal */}
            <ExceptionalWhatsAppModal
              isOpen={isExceptionalWhatsAppModalOpen}
              onClose={() => setIsExceptionalWhatsAppModalOpen(false)}
              appartements={filterAppartementsByStatut(appartements, 'en_cours')}
              chantierId={chantierId}
            />

            {/* Selection Mode Actions - Fixed Bottom Bar (for "Prêt" tab) */}
            {isSelectionMode && (
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-16 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 py-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Left: Selection count */}
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-600">
                        {selectedAppartements.size} appartement{selectedAppartements.size > 1 ? 's sélectionné' : ' sélectionné'}{selectedAppartements.size > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleCancelSelection}
                        variant="secondary"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </Button>
                      <Button
                        onClick={handleContinueToWhatsApp}
                        disabled={selectedAppartements.size === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Continuer ({selectedAppartements.size})</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Selection Mode Actions - Fixed Bottom Bar (for "En cours" tab) */}
            {isWhatsAppSelectionEnCours && (
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-16 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 py-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Left: Selection count */}
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-600">
                        {selectedForWhatsAppEnCours.size} appartement{selectedForWhatsAppEnCours.size > 1 ? 's sélectionné' : ' sélectionné'}{selectedForWhatsAppEnCours.size > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleCancelWhatsAppSelectionEnCours}
                        variant="secondary"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </Button>
                      <Button
                        onClick={handleContinueToWhatsAppEnCours}
                        disabled={selectedForWhatsAppEnCours.size === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Continuer ({selectedForWhatsAppEnCours.size})</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Mode Actions - Fixed Bottom Bar */}
            {isValidationMode && (
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-16 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 py-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Left: Selection count */}
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-600">
                        {selectedForValidation.size} appartement{selectedForValidation.size > 1 ? 's sélectionné' : ' sélectionné'}{selectedForValidation.size > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleCancelValidation}
                        variant="secondary"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </Button>
                      <Button
                        onClick={handleContinueToValidation}
                        disabled={selectedForValidation.size === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Valider ({selectedForValidation.size})</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invalidation Mode Actions - Fixed Bottom Bar */}
            {isInvalidationMode && (
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-16 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 py-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Left: Selection count */}
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-600">
                        {selectedForInvalidation.size} appartement{selectedForInvalidation.size > 1 ? 's sélectionné' : ' sélectionné'}{selectedForInvalidation.size > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleCancelInvalidation}
                        variant="secondary"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Annuler</span>
                      </Button>
                      <Button
                        onClick={handleContinueToInvalidation}
                        disabled={selectedForInvalidation.size === 0}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Invalider ({selectedForInvalidation.size})</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmModal
              isOpen={showValidationConfirm}
              onClose={() => setShowValidationConfirm(false)}
              onConfirm={confirmValidation}
              title="Valider les appartements"
              message={`Êtes-vous sûr de vouloir valider ${selectedForValidation.size} appartement(s) ? Ils passeront dans l'onglet 'Prêt'.`}
              confirmLabel="Valider"
              cancelLabel="Annuler"
              variant="warning"
            />

            <ConfirmModal
              isOpen={showInvalidationConfirm}
              onClose={() => setShowInvalidationConfirm(false)}
              onConfirm={confirmInvalidation}
              title="Invalider les appartements"
              message={`Êtes-vous sûr de vouloir invalider ${selectedForInvalidation.size} appartement(s) ? Ils reviendront dans l'onglet 'En attente'.`}
              confirmLabel="Invalider"
              cancelLabel="Annuler"
              variant="warning"
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
