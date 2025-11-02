/**
 * PlotDetailPage
 * Page de détail d'un plot avec liste des appartements
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Building2, Edit, Trash2, Search, ChevronDown, CheckCircle, AlertTriangle, MessageCircle, X } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import Modal from '../../../shared/components/ui/Modal'
import Tabs from '../../../shared/components/ui/Tabs'
import CreateAppartementModal from '../components/CreateAppartementModal'
import CreateMultipleAppartementsModal from '../components/CreateMultipleAppartementsModal'
import SendWhatsAppModal from '../components/SendWhatsAppModal'
import { getPlotById } from '../services/plotsService'
import { useAppartements } from '../hooks/useAppartements'
import {
  searchAppartements,
  filterAppartementsByStatut,
  calculateAppartementStatut,
  getStatutConfig,
  getTasksEnCours
} from '../utils/appartementHelpers'

export default function PlotDetailPage() {
  const { chantierId, plotId } = useParams()
  const navigate = useNavigate()

  const [plot, setPlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateAppartementModalOpen, setIsCreateAppartementModalOpen] = useState(false)
  const [isCreateMultipleModalOpen, setIsCreateMultipleModalOpen] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [appartementToEdit, setAppartementToEdit] = useState(null)
  const [appartementToDelete, setAppartementToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('en_cours')
  const [creationResult, setCreationResult] = useState(null)
  const [showResultModal, setShowResultModal] = useState(false)

  // WhatsApp selection states
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedAppartements, setSelectedAppartements] = useState(new Set())
  const [isSendWhatsAppModalOpen, setIsSendWhatsAppModalOpen] = useState(false)

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

  // Filter appartements based on search query and status
  const filteredBySearch = useMemo(() => {
    return searchAppartements(appartements, searchQuery)
  }, [appartements, searchQuery])

  const filteredByStatut = useMemo(() => {
    return filterAppartementsByStatut(filteredBySearch, activeTab)
  }, [filteredBySearch, activeTab])

  const filteredAppartements = filteredByStatut

  // Calculate stats for tabs
  const stats = useMemo(() => ({
    en_attente: filterAppartementsByStatut(appartements, 'en_attente').length,
    en_cours: filterAppartementsByStatut(appartements, 'en_cours').length,
    pret: filterAppartementsByStatut(appartements, 'pret').length,
    finalise: filterAppartementsByStatut(appartements, 'finalise').length
  }), [appartements])

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
    navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}/appartement/${appartement.id}`)
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

  // Get selected appartements data
  const selectedAppartementsData = useMemo(() => {
    return appartements.filter(appt => selectedAppartements.has(appt.id))
  }, [appartements, selectedAppartements])

  // Reset selection mode when changing tabs
  useEffect(() => {
    if (activeTab !== 'pret') {
      setIsSelectionMode(false)
      setSelectedAppartements(new Set())
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
                {/* WhatsApp button - only in "Prêt" tab */}
                {!appartementsLoading && activeTab === 'pret' && stats.pret > 0 && !isSelectionMode && (
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

              {/* Search Bar */}
              {!appartementsLoading && appartements.length > 0 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un appartement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base"
                  />
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
                    const isSelected = selectedAppartements.has(appartement.id)

                    return (
                      <div
                        key={appartement.id}
                        onClick={() => {
                          if (isSelectionMode) {
                            handleToggleAppartementSelection(appartement.id)
                          } else {
                            handleAppartementClick(appartement)
                          }
                        }}
                        className={`border rounded-lg p-4 transition-all cursor-pointer bg-white ${
                          isSelectionMode && isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-500 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          {/* Main row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Checkbox in selection mode */}
                              {isSelectionMode && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleAppartementSelection(appartement.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded flex-shrink-0"
                                />
                              )}
                              <Home className="w-5 h-5 text-gray-600 flex-shrink-0" />
                              <span className="font-medium text-gray-900 truncate">{appartement.nom}</span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statutConfig.color} flex-shrink-0`}>
                                {statutConfig.label}
                              </span>
                            </div>
                            {!isSelectionMode && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm text-gray-600 hidden sm:inline">
                                  {appartement.taches_count} {appartement.taches_count <= 1 ? 'tâche' : 'tâches'}
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

            {/* WhatsApp Modal */}
            <SendWhatsAppModal
              isOpen={isSendWhatsAppModalOpen}
              onClose={handleCloseWhatsAppModal}
              appartements={selectedAppartementsData}
              chantierId={chantierId}
            />

            {/* Selection Mode Actions - Fixed Bottom Bar */}
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
          </>
        )}
      </div>
    </AppLayout>
  )
}
