/**
 * PlotDetailPage
 * Page de détail d'un chantier (plot) avec actions
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, ListTodo } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import CreatePlotModal from '../components/CreatePlotModal'
import { getChantierById } from '../../chantiers/services/chantiersService'

export default function PlotDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [chantier, setChantier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreatePlotModalOpen, setIsCreatePlotModalOpen] = useState(false)

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

  // Handle navigation to tasks page
  const handleNavigateToTasks = () => {
    navigate(`/admin/plotsmanager/${id}/taches`)
  }

  // Handle back button
  const handleBack = () => {
    navigate('/admin/plotsmanager')
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
                  onClick={() => setIsCreatePlotModalOpen(true)}
                  className="flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Créer un plot</span>
                </Button>

                <Button
                  onClick={handleNavigateToTasks}
                  variant="secondary"
                  className="flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <ListTodo className="w-5 h-5" />
                  <span>Tâches</span>
                </Button>
              </div>
            </div>

            {/* Modal for creating plot (immeuble/structure) */}
            <CreatePlotModal
              isOpen={isCreatePlotModalOpen}
              onClose={() => setIsCreatePlotModalOpen(false)}
              chantierId={id}
              chantierTitre={chantier.titre}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
