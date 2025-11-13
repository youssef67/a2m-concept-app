/**
 * PlotDetailPage
 * Page de détail d'un plot avec liste des appartements
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Home, Building2, Edit, Trash2, Search, ChevronDown, AlertTriangle, X, FileText, BadgeCheck, MoreVertical, Check, CheckCircle } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import Modal from '../../../shared/components/ui/Modal'
import Tabs from '../../../shared/components/ui/Tabs'
import Select from '../../../shared/components/ui/Select'
import Dropdown, { DropdownItem } from '../../../shared/components/ui/Dropdown'
import Pagination from '../../../shared/components/ui/Pagination'
import Tooltip from '../../../shared/components/ui/Tooltip'
import CreateAppartementModal from '../components/CreateAppartementModal'
import CreateMultipleAppartementsModal from '../components/CreateMultipleAppartementsModal'
import { getPlotById } from '../services/plotsService'
import { useAppartements } from '../hooks/useAppartements'
import { usePlots } from '../hooks/usePlots'
import { useToast } from '../../../shared/hooks/useToast'
import {
  searchAppartements,
  filterAppartementsByStatut,
  filterAppartementsByEtage,
  filterAppartementsByLivraison,
  sortAppartementsAlphabetically,
  calculateAppartementStatut,
  getStatutConfig,
  getTasksEnCours
} from '../utils/appartementHelpers'
import { formatEtage } from '../utils/etageConstants'
import { getLivraisonStatutConfig, STATUTS_OPTIONS } from '../utils/livraisonHelpers'

// Nombre de lots par page
const ITEMS_PER_PAGE = 10

export default function PlotDetailPage() {
  const { chantierId, plotId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize active tab from URL parameter or default to 'tous'
  const initialTab = searchParams.get('activeTab') || 'tous'

  const [plot, setPlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateAppartementModalOpen, setIsCreateAppartementModalOpen] = useState(false)
  const [isCreateMultipleModalOpen, setIsCreateMultipleModalOpen] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [appartementToEdit, setAppartementToEdit] = useState(null)
  const [appartementToDelete, setAppartementToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedEtageFilter, setSelectedEtageFilter] = useState(searchParams.get('etage') || '') // '' = tous, null = non spécifié, 0-10 = étage
  const [selectedLivraisonFilter, setSelectedLivraisonFilter] = useState(searchParams.get('livraison') || '') // '' = tous, string = statut livraison
  const [showOnlyTMA, setShowOnlyTMA] = useState(searchParams.get('tma') === 'true') // Filtre pour afficher uniquement les appartements avec TMA
  const [showDocumentsManquants, setShowDocumentsManquants] = useState(searchParams.get('docs') === 'true') // Filtre pour documents obligatoires manquants
  const [creationResult, setCreationResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)

  // Appartements hook
  const { appartements, loading: appartementsLoading, loadAppartements, deleteAppartement } = useAppartements(plotId, chantierId)

  // Plots hook (pour la navigation entre plots)
  const { plots, loadPlots: loadAllPlots } = usePlots(chantierId)

  // Toast notifications
  const { showToast } = useToast()

  // État pour le dropdown du titre
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false)
  const titleDropdownRef = useRef(null)

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

  // Load all plots for navigation
  useEffect(() => {
    if (chantierId) {
      loadAllPlots()
    }
  }, [chantierId, loadAllPlots])

  // Synchronize filters with URL
  useEffect(() => {
    const params = new URLSearchParams()

    if (activeTab && activeTab !== 'tous') params.set('activeTab', activeTab)
    if (searchQuery) params.set('search', searchQuery)
    if (selectedEtageFilter) params.set('etage', selectedEtageFilter)
    if (selectedLivraisonFilter) params.set('livraison', selectedLivraisonFilter)
    if (showOnlyTMA) params.set('tma', 'true')
    if (showDocumentsManquants) params.set('docs', 'true')
    if (currentPage > 1) params.set('page', currentPage.toString())

    setSearchParams(params, { replace: true })
  }, [activeTab, searchQuery, selectedEtageFilter, selectedLivraisonFilter, showOnlyTMA, showDocumentsManquants, currentPage, setSearchParams])

  // Close title dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target)) {
        setIsTitleDropdownOpen(false)
      }
    }

    if (isTitleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isTitleDropdownOpen])

  // Filter appartements based on search query and status
  const filteredBySearch = useMemo(() => {
    return searchAppartements(appartements, searchQuery)
  }, [appartements, searchQuery])

  const filteredByTMA = useMemo(() => {
    if (!showOnlyTMA) return filteredBySearch
    return filteredBySearch.filter(appt => appt.has_tma)
  }, [filteredBySearch, showOnlyTMA])

  const filteredByDocuments = useMemo(() => {
    if (!showDocumentsManquants || activeTab !== 'tous') return filteredByTMA
    // Filter appartements with missing obligatoire documents (only in "Tous" tab)
    return filteredByTMA.filter(appt => appt.missing_obligatoire_documents)
  }, [filteredByTMA, showDocumentsManquants, activeTab])

  const filteredByLivraison = useMemo(() => {
    return filterAppartementsByLivraison(filteredByDocuments, selectedLivraisonFilter)
  }, [filteredByDocuments, selectedLivraisonFilter])

  const filteredByEtage = useMemo(() => {
    return filterAppartementsByEtage(filteredByLivraison, selectedEtageFilter)
  }, [filteredByLivraison, selectedEtageFilter])

  const filteredByStatut = useMemo(() => {
    if (activeTab === 'tous') return filteredByEtage
    // Pour "en_cours" et "finalise", utiliser le filtre standard
    return filterAppartementsByStatut(filteredByEtage, activeTab)
  }, [filteredByEtage, activeTab])

  const sortedAppartements = useMemo(() => {
    // Tri alphabétique par défaut pour tous les onglets
    return sortAppartementsAlphabetically(filteredByStatut)
  }, [filteredByStatut])

  const filteredAppartements = sortedAppartements

  // Calculate pagination
  const totalPages = Math.ceil(sortedAppartements.length / ITEMS_PER_PAGE)

  // Get appartements for current page
  const paginatedAppartements = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return sortedAppartements.slice(startIndex, endIndex)
  }, [sortedAppartements, currentPage])

  // Calculate stats for tabs
  const stats = useMemo(() => {
    const en_attente = filterAppartementsByStatut(appartements, 'en_attente').length
    const en_cours = filterAppartementsByStatut(appartements, 'en_cours').length
    return {
      en_attente,
      en_cours,
      pret: filterAppartementsByStatut(appartements, 'pret').length,
      finalise: filterAppartementsByStatut(appartements, 'finalise').length
    }
  }, [appartements])


  // Generate etage options based on existing appartements
  const etageOptions = useMemo(() => {
    // Extract unique etages from appartements
    const uniqueEtages = new Set()
    appartements.forEach(appt => {
      if (appt.etage !== undefined) {
        uniqueEtages.add(appt.etage)
      }
    })

    // Convert to array and sort
    const etagesArray = Array.from(uniqueEtages).sort((a, b) => {
      // null first, then 0 (RdC), then 1, 2, 3...
      if (a === null) return -1
      if (b === null) return 1
      return a - b
    })

    // Generate options with labels
    return etagesArray.map(etage => ({
      value: etage,
      label: formatEtage(etage)
    }))
  }, [appartements])

  // Get existing appartement names for duplicate validation
  const existingAppartementNames = useMemo(() => {
    return appartements.map(appt => appt.nom)
  }, [appartements])

  // Options pour le dropdown de navigation entre plots (format simplifié)
  const plotsOptions = useMemo(() => {
    return plots.map(p => ({
      value: p.id,
      label: `${p.nom} • ${p.appartements_count} lot${p.appartements_count > 1 ? 's' : ''}`
    }))
  }, [plots])

  // Helper function to build return URL with all current filters
  const buildReturnUrl = () => {
    const returnParams = new URLSearchParams()
    if (activeTab && activeTab !== 'tous') returnParams.set('activeTab', activeTab)
    if (searchQuery) returnParams.set('search', searchQuery)
    if (selectedEtageFilter) returnParams.set('etage', selectedEtageFilter)
    if (selectedLivraisonFilter) returnParams.set('livraison', selectedLivraisonFilter)
    if (showOnlyTMA) returnParams.set('tma', 'true')
    if (showDocumentsManquants) returnParams.set('docs', 'true')
    if (currentPage > 1) returnParams.set('page', currentPage.toString())

    return `/admin/plotsmanager/${chantierId}/plot/${plotId}?${returnParams.toString()}`
  }

  // Handle back button
  const handleBack = () => {
    navigate(`/admin/plotsmanager/${chantierId}`)
  }

  // Handle plot change (navigation entre plots)
  const handlePlotChange = (newPlotId) => {
    if (newPlotId && newPlotId !== plotId) {
      navigate(`/admin/plotsmanager/${chantierId}/plot/${newPlotId}`)
    }
  }

  // Handle appartement click
  const handleAppartementClick = (appartement) => {
    const appartementId = appartement.id
    const returnUrl = buildReturnUrl()

    const targetParams = new URLSearchParams()
    if (activeTab === 'en_cours') targetParams.set('tab', 'taches')
    targetParams.set('returnUrl', encodeURIComponent(returnUrl))

    navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartementId}?${targetParams.toString()}`)
  }

  // Handle appartement creation success
  const handleAppartementCreated = (createdAppartement) => {
    loadAppartements()

    // Redirect to created appartement's tasks tab (only on creation, not edit)
    if (createdAppartement && createdAppartement.id && !appartementToEdit) {
      const returnUrl = buildReturnUrl()
      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${createdAppartement.id}?tab=taches&returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }

  // Handle multiple appartements creation success
  const handleMultipleAppartementsCreated = (result) => {
    loadAppartements()

    // If there are errors, show result modal
    if (result.failed > 0) {
      setCreationResult(result)
      setShowResultModal(true)
    }

    // Redirect to first created appartement if any
    if (result.data && result.data.length > 0) {
      const firstAppartement = result.data[0]
      const returnUrl = buildReturnUrl()

      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${firstAppartement.id}?tab=taches&returnUrl=${encodeURIComponent(returnUrl)}`)
    }
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
      showToast('Lot supprimé avec succès', 'success')
      loadAppartements()
    } else {
      showToast('Erreur lors de la suppression du lot', 'error')
    }
    setAppartementToDelete(null)
  }

  // Handle modal close
  const handleCloseAppartementModal = () => {
    setIsCreateAppartementModalOpen(false)
    setAppartementToEdit(null)
  }

  // TMA filter handlers
  const handleToggleTMAFilter = () => {
    setShowOnlyTMA(prev => !prev)
  }

  // Documents filter handler
  const handleToggleDocumentsFilter = () => {
    setShowDocumentsManquants(prev => !prev)
  }

  const handleClearAllFilters = () => {
    setSearchQuery('')
    setShowOnlyTMA(false) // TMA filter is visible on all tabs
    // Only clear documents filter if in "en_attente" tab
    if (activeTab === 'en_attente') {
      setShowDocumentsManquants(false)
    }
    // Only clear etage and livraison filters if in "tous" tab
    if (activeTab === 'tous') {
      setSelectedEtageFilter('')
      setSelectedLivraisonFilter('')
      setShowDocumentsManquants(false)
    }
  }


  // Reset selection modes when changing tabs
  useEffect(() => {
    // Reset documents filter when leaving "en_attente" tab
    if (activeTab !== 'en_attente') {
      setShowDocumentsManquants(false)
    }
    // Reset etage and livraison filters when leaving "tous" tab
    if (activeTab !== 'tous') {
      setSelectedEtageFilter('')
      setSelectedLivraisonFilter('')
    }
    // Reset TMA filter on tab change (filter is visible on all tabs)
    setShowOnlyTMA(false)
  }, [activeTab])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeTab, showOnlyTMA, showDocumentsManquants, selectedEtageFilter, selectedLivraisonFilter])

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
            <div className="mb-6">
              {/* Title row with dropdown navigation */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Retour"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* Title-Dropdown Hybrid */}
                <div className="flex-1 relative" ref={titleDropdownRef}>
                  {plots.length > 1 ? (
                    <>
                      {/* Clickable title button */}
                      <button
                        onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                        className="text-left w-full group"
                      >
                        <div className="flex items-center gap-2">
                          <h1 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {plot.nom}
                          </h1>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-500 transition-all group-hover:text-primary-600 ${
                              isTitleDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Building2 className="w-4 h-4" />
                          <span>{TYPE_LABELS[plot.type] || plot.type}</span>
                        </div>
                      </button>

                      {/* Dropdown menu */}
                      {isTitleDropdownOpen && (
                        <>
                          {/* Backdrop sombre */}
                          <div
                            className="fixed inset-0 bg-black/40 z-40 md:bg-transparent md:z-auto"
                            onClick={() => setIsTitleDropdownOpen(false)}
                          />

                          {/* Options list with animation */}
                          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[280px] max-w-md animate-in slide-in-from-top-2 duration-200">
                            {plotsOptions.map((option) => {
                              const isSelected = option.value === plotId

                              return (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    handlePlotChange(option.value)
                                    setIsTitleDropdownOpen(false)
                                  }}
                                  className={`
                                    w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between first:rounded-t-lg last:rounded-b-lg
                                    ${isSelected ? 'bg-primary-50 text-primary-700' : 'text-gray-900'}
                                  `}
                                >
                                  <span className="text-base font-medium">{option.label}</span>
                                  {isSelected && <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    /* Si un seul plot, affichage normal sans dropdown */
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{plot.nom}</h1>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Building2 className="w-4 h-4" />
                        <span>{TYPE_LABELS[plot.type] || plot.type}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Action buttons row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Create button with dropdown */}
                <div className="relative">
                  <Button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px]"
                    title="Créer lot(s)"
                  >
                    <Home className="w-5 h-5" />
                    <span className="hidden sm:inline">Créer lot(s)</span>
                    <ChevronDown className="w-4 h-4 ml-1 hidden sm:inline" />
                  </Button>

                  {showCreateMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCreateMenu(false)}
                      />

                      {/* Dropdown menu */}
                      <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <button
                          onClick={() => {
                            setIsCreateAppartementModalOpen(true)
                            setShowCreateMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Home className="w-5 h-5 text-primary-600" />
                          <span className="text-gray-700 font-medium">Créer un lot</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsCreateMultipleModalOpen(true)
                            setShowCreateMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <Building2 className="w-5 h-5 text-primary-600" />
                          <span className="text-gray-700 font-medium">Créer plusieurs lots</span>
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
              {/* Tabs */}
              {!appartementsLoading && appartements.length > 0 && (
                <div className="mb-4">
                  <Tabs
                    tabs={[
                      { id: 'tous', label: 'Tous', count: appartements.length },
                      { id: 'en_cours', label: 'En cours', count: stats.en_cours },
                      { id: 'finalise', label: 'Finalisé', count: stats.finalise }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                  />
                </div>
              )}

              {/* Search Bar and filters */}
              {!appartementsLoading && appartements.length > 0 && (
                <div className="space-y-2 mb-4">
                  {/* Search bar */}
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un lot..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base"
                    />
                  </div>

                  {/* Filters row */}
                  <div className="flex flex-col md:flex-row gap-2">
                    {/* TMA filter button - visible on all tabs */}
                    <button
                      onClick={handleToggleTMAFilter}
                      className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors min-h-[44px] whitespace-nowrap ${
                        showOnlyTMA
                          ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Afficher uniquement les lots avec TMA"
                    >
                      <BadgeCheck className="w-5 h-5" />
                      <span className="text-sm">Avec TMA</span>
                    </button>

                    {/* Documents filter button - only in "Tous" tab */}
                    {activeTab === 'tous' && appartements.length > 0 && (
                      <button
                        onClick={handleToggleDocumentsFilter}
                        className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors min-h-[44px] whitespace-nowrap ${
                          showDocumentsManquants
                            ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        title="Afficher uniquement les lots avec documents manquants"
                      >
                        <FileText className="w-5 h-5" />
                        <span className="text-sm">Documents manquants</span>
                      </button>
                    )}

                    {/* Livraison filter - only in "Tous" tab */}
                    {activeTab === 'tous' && appartements.length > 0 && (
                      <div className="min-w-[200px]">
                        <Select
                          value={selectedLivraisonFilter}
                          onChange={setSelectedLivraisonFilter}
                          options={[
                            { value: '', label: 'Tous les statuts' },
                            ...STATUTS_OPTIONS.map(opt => ({
                              value: opt.value,
                              label: opt.label
                            }))
                          ]}
                          placeholder="Tous les statuts"
                        />
                      </div>
                    )}

                    {/* Etage filter - only in "Tous" tab */}
                    {activeTab === 'tous' && appartements.length > 0 && etageOptions.length > 0 && (
                      <div className="min-w-[200px]">
                        <Select
                          value={selectedEtageFilter}
                          onChange={setSelectedEtageFilter}
                          options={[
                            { value: '', label: 'Tous les étages' },
                            ...etageOptions
                          ]}
                          placeholder="Tous les étages"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clear filters button */}
              {!appartementsLoading && appartements.length > 0 && (searchQuery !== '' || showOnlyTMA || (activeTab === 'tous' && showDocumentsManquants) || (activeTab === 'tous' && selectedEtageFilter !== '') || (activeTab === 'tous' && selectedLivraisonFilter !== '')) && (
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
                  <p className="text-gray-600">Aucun lot créé pour ce plot</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliquez sur « Créer un lot » pour commencer
                  </p>
                </div>
              )}

              {/* No results - search or tab specific */}
              {!appartementsLoading && appartements.length > 0 && filteredAppartements.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  {searchQuery ? (
                    <p className="text-gray-600">
                      Aucun lot {activeTab === 'tous' ? '' : activeTab === 'en_attente' ? 'en attente' : activeTab === 'en_cours' ? 'en cours' : activeTab === 'pret' ? 'prêt' : 'finalisé'} trouvé pour &quot;{searchQuery}&quot;
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      {activeTab === 'tous' && 'Aucun lot'}
                      {activeTab === 'en_attente' && 'Aucun lot en attente'}
                      {activeTab === 'en_cours' && 'Aucun lot en cours'}
                      {activeTab === 'pret' && 'Aucun lot prêt'}
                      {activeTab === 'finalise' && 'Aucun lot finalisé'}
                    </p>
                  )}
                </div>
              )}

              {!appartementsLoading && filteredAppartements.length > 0 && (
                <div className="space-y-3">
                  {paginatedAppartements.map((appartement) => {
                    const statut = calculateAppartementStatut(appartement)
                    const statutConfig = getStatutConfig(statut)
                    const tachesEnCours = getTasksEnCours(appartement)
                    const tacheEnCours = tachesEnCours.length > 0 ? tachesEnCours[0] : null

                    // Calculate completed tasks count
                    const tachesTerminees = (appartement.taches || []).filter(t => t.statut === 'terminee').length
                    const totalTaches = appartement.taches_count || 0

                    // Get livraison configuration
                    const livraisonStatut = appartement.livraison_statut || 'non_commande'
                    const livraisonJoursRetard = appartement.livraison_jours_retard || 0
                    const livraisonConfig = getLivraisonStatutConfig(livraisonStatut)
                    const livraisonLabel = livraisonJoursRetard > 0
                      ? `${livraisonConfig.label} - ${livraisonJoursRetard}j retard`
                      : livraisonConfig.label


                    return (
                      <div
                        key={appartement.id}
                        onClick={() => handleAppartementClick(appartement)}
                        className="border rounded-lg p-4 transition-all bg-white border-gray-200 hover:border-primary-500 hover:shadow-md cursor-pointer overflow-visible"
                      >
                        <div className="flex flex-col gap-3 overflow-visible">
                          {/* Ligne 1 : Nom + Étage */}
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 text-base">
                              {appartement.nom}
                              {appartement.etage !== null && appartement.etage !== undefined && (
                                <span className="text-gray-500 font-normal"> • {formatEtage(appartement.etage)}</span>
                              )}
                            </span>
                          </div>

                          {/* Ligne 2 : Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {appartement.has_tma && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                                TMA
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutConfig.color}`}>
                              {statutConfig.label}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${livraisonConfig.color}`}>
                              {livraisonLabel}
                            </span>
                            {appartement.missing_obligatoire_documents && (
                              <Tooltip content={appartement.missing_obligatoire_documents_list} position="top">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 cursor-help">
                                  <AlertTriangle className="w-3 h-3" />
                                  Docs manquants
                                </span>
                              </Tooltip>
                            )}
                          </div>

                          {/* Task intitule (only for en_cours) */}
                          {statut === 'en_cours' && tacheEnCours && (
                            <div className="text-xs sm:text-sm text-yellow-700 font-medium truncate" title={tacheEnCours.intitule}>
                              📋 {tacheEnCours.intitule}
                            </div>
                          )}

                          {/* Ligne 3 : Compteur + Badge notes + Actions */}
                          <div className="flex items-center justify-between">
                              {/* Compteur */}
                              <span className="text-sm text-gray-600">
                                {activeTab === 'en_attente'
                                  ? `${appartement.documents_uploaded_count || 0}/${appartement.documents_required_count || 0} documents`
                                  : `${tachesTerminees}/${totalTaches} ${totalTaches <= 1 ? 'tâche' : 'tâches'}`
                                }
                              </span>

                              <div className="flex items-center gap-2">
                                {/* Badge notes (si > 0) */}
                                {appartement.notes_count > 0 && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {appartement.notes_count}
                                  </span>
                                )}

                                {/* Mobile: Menu kebab */}
                                <div className="sm:hidden">
                                  <Dropdown
                                    trigger={
                                      <button
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        title="Actions"
                                      >
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                      </button>
                                    }
                                    align="right"
                                  >
                                    <DropdownItem
                                      onClick={(e) => handleEditAppartement(e, appartement)}
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Modifier</span>
                                    </DropdownItem>
                                    {appartement.notes_count > 0 && (
                                      <DropdownItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const returnUrl = buildReturnUrl()
                                          navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartement.id}?tab=notes&returnUrl=${encodeURIComponent(returnUrl)}`)
                                        }}
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>Voir les notes ({appartement.notes_count})</span>
                                      </DropdownItem>
                                    )}
                                    <DropdownItem
                                      onClick={(e) => handleDeleteAppartement(e, appartement)}
                                      danger
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Supprimer</span>
                                    </DropdownItem>
                                  </Dropdown>
                                </div>

                                {/* Desktop: Boutons visibles */}
                                <div className="hidden sm:flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleEditAppartement(e, appartement)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    title="Modifier"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  {appartement.notes_count > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const returnUrl = buildReturnUrl()
                                        navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartement.id}?tab=notes&returnUrl=${encodeURIComponent(returnUrl)}`)
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                      title={`Voir les notes (${appartement.notes_count})`}
                                    >
                                      <FileText className="w-5 h-5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteAppartement(e, appartement)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {!appartementsLoading && paginatedAppartements.length > 0 && totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
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
              plotNombreEtages={plot.nombre_etages}
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
              plotNombreEtages={plot.nombre_etages}
              existingAppartementNames={existingAppartementNames}
              onSuccess={handleMultipleAppartementsCreated}
            />

            {/* Confirm delete modal */}
            <ConfirmModal
              isOpen={!!appartementToDelete}
              onClose={() => setAppartementToDelete(null)}
              onConfirm={confirmDeleteAppartement}
              title="Supprimer le lot"
              message={`Êtes-vous sûr de vouloir supprimer le lot « ${appartementToDelete?.nom} » ? Cette action est irréversible.`}
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
                      <span className="text-sm text-gray-600">Lots créés :</span>
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


          </>
        )}
      </div>
    </AppLayout>
  )
}
