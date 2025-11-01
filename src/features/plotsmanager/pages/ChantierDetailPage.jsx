/**
 * ChantierDetailPage
 * Page de détail d'un chantier avec liste des plots
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, FileText } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import CreatePlotModal from '../components/CreatePlotModal'
import TachesModal from '../components/TachesModal'
import PlotCardDisplay from '../components/PlotCardDisplay'
import { getChantierById } from '../../chantiers/services/chantiersService'
import { useTaches } from '../hooks/useTaches'
import { usePlots } from '../hooks/usePlots'

export default function ChantierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [chantier, setChantier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreatePlotModalOpen, setIsCreatePlotModalOpen] = useState(false)
  const [isTachesModalOpen, setIsTachesModalOpen] = useState(false)
  const [plotToEdit, setPlotToEdit] = useState(null)
  const [plotToDelete, setPlotToDelete] = useState(null)

  // Taches hook
  const { taches, loading: tachesLoading, loadTaches, saveTaches } = useTaches(id)

  // Plots hook
  const { plots, loading: plotsLoading, loadPlots, deletePlot } = usePlots(id)

  // Load chantier data
  useEffect(() => {
    async function loadChantier() {
      if (!id) {
        setError('ID du chantier manquant')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await getChantierById(id)

      if (fetchError || !data) {
        setError('Chantier introuvable')
        setChantier(null)
      } else {
        setChantier(data)
      }

      setLoading(false)
    }

    loadChantier()
  }, [id])

  // Load taches data
  useEffect(() => {
    if (id) {
      loadTaches()
    }
  }, [id, loadTaches])

  // Load plots data
  useEffect(() => {
    if (id) {
      loadPlots()
    }
  }, [id, loadPlots])

  // Handle back button
  const handleBack = () => {
    navigate('/admin/plotsmanager')
  }

  // Handle plot click
  const handlePlotClick = (plot) => {
    navigate(`/admin/plotsmanager/${id}/plot/${plot.id}`)
  }

  // Handle open create plot modal
  const handleOpenCreatePlotModal = () => {
    setPlotToEdit(null)
    setIsCreatePlotModalOpen(true)
  }

  // Handle plot creation success
  const handlePlotCreated = () => {
    loadPlots()
  }

  // Handle plot edit
  const handleEditPlot = (plot) => {
    setPlotToEdit(plot)
    setIsCreatePlotModalOpen(true)
  }

  // Handle plot delete - open confirm modal
  const handleDeletePlot = (plot) => {
    setPlotToDelete(plot)
  }

  // Confirm plot deletion
  const confirmDeletePlot = async () => {
    if (!plotToDelete) return

    const result = await deletePlot(plotToDelete.id)
    if (result.success) {
      loadPlots()
    } else {
      alert('Erreur lors de la suppression du plot')
    }
    setPlotToDelete(null)
  }

  // Handle modal close
  const handleClosePlotModal = () => {
    setIsCreatePlotModalOpen(false)
    setPlotToEdit(null)
  }

  // Handle taches modal
  const handleOpenTachesModal = () => {
    setIsTachesModalOpen(true)
  }

  const handleSaveTaches = async (tachesData) => {
    const result = await saveTaches(tachesData)
    return result
  }

  // Determine button label and icon based on taches existence
  const hasTaches = taches && taches.length > 0
  const tachesButtonLabel = hasTaches ? 'Modifier les tâches' : 'Créer des tâches'

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
        {!loading && !error && chantier && (
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
                <h1 className="text-2xl font-bold text-gray-900">{chantier.titre}</h1>
              </div>

              {/* Right: Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={handleOpenCreatePlotModal}
                  className="flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Créer un plot</span>
                </Button>

                <Button
                  onClick={handleOpenTachesModal}
                  variant={hasTaches ? 'secondary' : 'primary'}
                  className="flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <FileText className="w-5 h-5" />
                  <span>{tachesButtonLabel}</span>
                </Button>
              </div>
            </div>

            {/* Plots grid */}
            <div className="mt-6">
              {plotsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}

              {!plotsLoading && plots.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun plot créé pour ce chantier</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliquez sur "Créer un plot" pour commencer
                  </p>
                </div>
              )}

              {!plotsLoading && plots.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plots.map((plot) => (
                    <PlotCardDisplay
                      key={plot.id}
                      plot={plot}
                      appartementCount={0}
                      onClick={handlePlotClick}
                      onEdit={handleEditPlot}
                      onDelete={handleDeletePlot}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Modal for creating/editing plot (immeuble/structure) */}
            <CreatePlotModal
              isOpen={isCreatePlotModalOpen}
              onClose={handleClosePlotModal}
              chantierId={id}
              chantierTitre={chantier.titre}
              plotToEdit={plotToEdit}
              onSuccess={handlePlotCreated}
            />

            {/* Modal for managing taches */}
            <TachesModal
              isOpen={isTachesModalOpen}
              onClose={() => setIsTachesModalOpen(false)}
              chantierId={id}
              chantierTitre={chantier.titre}
              initialTaches={taches}
              onSave={handleSaveTaches}
            />

            {/* Confirm delete modal */}
            <ConfirmModal
              isOpen={!!plotToDelete}
              onClose={() => setPlotToDelete(null)}
              onConfirm={confirmDeletePlot}
              title="Supprimer le plot"
              message={`Êtes-vous sûr de vouloir supprimer le plot "${plotToDelete?.nom}" ? Cette action est irréversible.`}
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
