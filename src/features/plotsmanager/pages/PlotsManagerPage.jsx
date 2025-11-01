/**
 * PlotsManagerPage
 * Display chantiers with status "en_cours" only
 */

import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Spinner from '../../../shared/components/ui/Spinner'
import PlotCard from '../components/PlotCard'
import { useChantiers } from '../../chantiers/hooks/useChantiers'
import { searchChantiers } from '../../chantiers/utils/chantierHelpers'

export default function PlotsManagerPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch only chantiers with status "en_cours"
  const { chantiers, loading, error } = useChantiers('en_cours')

  // Filter chantiers by search query
  const filteredChantiers = useMemo(() => {
    return searchChantiers(chantiers, searchQuery)
  }, [chantiers, searchQuery])

  // Handle card click - navigate to detail page
  const handlePlotClick = (chantier) => {
    navigate(`/admin/plotsmanager/${chantier.id}`)
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Plots Manager</h1>
          <p className="text-sm text-gray-600 mt-1">Chantiers en cours</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de chantier, client ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Erreur lors du chargement des chantiers. Veuillez réessayer.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Chantiers Grid */}
        {!loading && !error && (
          <>
            {filteredChantiers.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Aucun chantier trouvé pour cette recherche.'
                    : 'Aucun chantier en cours.'}
                </p>
              </div>
            ) : (
              <>
                {/* Grid of plot cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredChantiers.map((chantier) => (
                    <PlotCard
                      key={chantier.id}
                      chantier={chantier}
                      onClick={handlePlotClick}
                    />
                  ))}
                </div>

                {/* Count Info */}
                <div className="text-sm text-gray-600 text-center">
                  {filteredChantiers.length} chantier{filteredChantiers.length > 1 ? 's' : ''} en cours
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
