/**
 * PlotDetailPage
 * Page de détail d'un plot avec liste des appartements
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Building2, Edit, Trash2, Search } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import Tabs from '../../../shared/components/ui/Tabs'
import CreateAppartementModal from '../components/CreateAppartementModal'
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
  const [appartementToEdit, setAppartementToEdit] = useState(null)
  const [appartementToDelete, setAppartementToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('en_cours')

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

              {/* Right: Action button */}
              <Button
                onClick={() => setIsCreateAppartementModalOpen(true)}
                className="flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Home className="w-5 h-5" />
                <span>Créer un appartement</span>
              </Button>
            </div>

            {/* Description if exists */}
            {plot.description && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">{plot.description}</p>
              </div>
            )}

            {/* Appartements list */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Appartements</h2>

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

                    return (
                      <div
                        key={appartement.id}
                        onClick={() => handleAppartementClick(appartement)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer bg-white"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Home className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">{appartement.nom}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statutConfig.color} flex-shrink-0`}>
                              {statutConfig.label}
                            </span>
                          </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {statut === 'en_cours' && tacheEnCours ? (
                            <span className="text-xs sm:text-sm text-yellow-700 font-medium hidden sm:inline truncate max-w-[200px]" title={tacheEnCours.intitule}>
                              {tacheEnCours.intitule}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600 hidden sm:inline">
                              {appartement.taches_count} {appartement.taches_count <= 1 ? 'tâche' : 'tâches'}
                            </span>
                          )}
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
          </>
        )}
      </div>
    </AppLayout>
  )
}
