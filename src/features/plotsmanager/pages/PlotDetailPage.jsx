/**
 * PlotDetailPage
 * Page de détail d'un plot avec liste des appartements
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Building2 } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import CreateAppartementModal from '../components/CreateAppartementModal'
import { getPlotById } from '../services/plotsService'
import { useAppartements } from '../hooks/useAppartements'

export default function PlotDetailPage() {
  const { chantierId, plotId } = useParams()
  const navigate = useNavigate()

  const [plot, setPlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateAppartementModalOpen, setIsCreateAppartementModalOpen] = useState(false)

  // Appartements hook
  const { appartements, loading: appartementsLoading, loadAppartements } = useAppartements(plotId, chantierId)

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
                    Cliquez sur "Créer un appartement" pour commencer
                  </p>
                </div>
              )}

              {!appartementsLoading && appartements.length > 0 && (
                <div className="space-y-3">
                  {appartements.map((appartement) => (
                    <div
                      key={appartement.id}
                      onClick={() => handleAppartementClick(appartement)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">{appartement.nom}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {appartement.taches_count} {appartement.taches_count <= 1 ? 'tâche' : 'tâches'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal for creating appartement */}
            <CreateAppartementModal
              isOpen={isCreateAppartementModalOpen}
              onClose={() => setIsCreateAppartementModalOpen(false)}
              plotId={plotId}
              chantierId={chantierId}
              plotNom={plot.nom}
              onSuccess={handleAppartementCreated}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
