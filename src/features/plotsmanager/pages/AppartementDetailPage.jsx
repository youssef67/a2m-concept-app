/**
 * AppartementDetailPage
 * Page de détail d'un appartement avec liste des tâches héritées
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import Select from '../../../shared/components/ui/Select'
import { getAppartementById } from '../services/appartementsService'
import { useAppartementTaches } from '../hooks/useAppartements'

// Status options
const STATUS_OPTIONS = [
  { value: 'a_faire', label: 'À faire' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' }
]

// Status icons and colors
const STATUS_CONFIG = {
  a_faire: {
    icon: Circle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  en_cours: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  terminee: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
}

export default function AppartementDetailPage() {
  const { chantierId, plotId, appartementId } = useParams()
  const navigate = useNavigate()

  const [appartement, setAppartement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Taches hook
  const { taches, loading: tachesLoading, loadTaches, updateTacheStatut } = useAppartementTaches(appartementId)

  // Load appartement data
  useEffect(() => {
    async function loadAppartement() {
      if (!appartementId) {
        setError('ID de l\'appartement manquant')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await getAppartementById(appartementId)

      if (fetchError || !data) {
        setError('Appartement introuvable')
        setAppartement(null)
      } else {
        setAppartement(data)
      }

      setLoading(false)
    }

    loadAppartement()
  }, [appartementId])

  // Load taches data
  useEffect(() => {
    if (appartementId) {
      loadTaches()
    }
  }, [appartementId, loadTaches])

  // Handle back button
  const handleBack = () => {
    navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}`)
  }

  // Handle status change
  const handleStatusChange = async (tacheId, newStatus) => {
    const result = await updateTacheStatut(tacheId, newStatus)
    if (!result.success) {
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  // Calculate stats
  const tachesStats = {
    total: taches.length,
    a_faire: taches.filter(t => t.statut === 'a_faire').length,
    en_cours: taches.filter(t => t.statut === 'en_cours').length,
    terminee: taches.filter(t => t.statut === 'terminee').length
  }

  const progressPercentage = tachesStats.total > 0
    ? Math.round((tachesStats.terminee / tachesStats.total) * 100)
    : 0

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
        {!loading && !error && appartement && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{appartement.nom}</h1>
            </div>

            {/* Progress Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Progression</h2>
                <span className="text-2xl font-bold text-primary-600">{progressPercentage}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-400">{tachesStats.a_faire}</p>
                  <p className="text-xs text-gray-600">À faire</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{tachesStats.en_cours}</p>
                  <p className="text-xs text-gray-600">En cours</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{tachesStats.terminee}</p>
                  <p className="text-xs text-gray-600">Terminées</p>
                </div>
              </div>
            </div>

            {/* Taches list */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tâches</h2>

              {tachesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}

              {!tachesLoading && taches.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Aucune tâche pour cet appartement</p>
                </div>
              )}

              {!tachesLoading && taches.length > 0 && (
                <div className="space-y-3">
                  {taches.map((tache) => {
                    const config = STATUS_CONFIG[tache.statut]
                    const StatusIcon = config.icon

                    return (
                      <div
                        key={tache.id}
                        className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-4`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Status icon and task name */}
                          <div className="flex items-center gap-3 flex-1">
                            <StatusIcon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
                            <span className="font-medium text-gray-900">{tache.intitule}</span>
                          </div>

                          {/* Status selector */}
                          <div className="w-full sm:w-48">
                            <Select
                              value={tache.statut}
                              onChange={(value) => handleStatusChange(tache.id, value)}
                              options={STATUS_OPTIONS}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
