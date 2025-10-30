/**
 * ChantiersPage - Main chantiers page with tabs
 * Display chantiers in tabs: En cours, Planifié, Devis
 */

import React, { useState, useMemo } from 'react'
import { Construction, Plus, Search } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import Spinner from '../../../shared/components/ui/Spinner'
import Alert from '../../../shared/components/ui/Alert'
import ChantierCard from '../components/ChantierCard'
import ChantierModal from '../components/ChantierModal'
import ChantierDetailModal from '../components/ChantierDetailModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useChantiers } from '../hooks/useChantiers'
import { searchChantiers } from '../utils/chantierHelpers'

export default function ChantiersPage() {
  // State
  const [activeTab, setActiveTab] = useState('en_cours')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedChantier, setSelectedChantier] = useState(null)

  // Hook
  const { chantiers, loading, error, createChantier, updateChantier, deleteChantier } = useChantiers()

  // Tabs configuration with counts
  const tabs = useMemo(() => {
    return [
      {
        id: 'en_cours',
        label: 'En cours',
        count: chantiers.filter(c => c.statut === 'en_cours').length
      },
      {
        id: 'planifie',
        label: 'Planifié',
        count: chantiers.filter(c => c.statut === 'planifie').length
      },
      {
        id: 'devis',
        label: 'Devis',
        count: chantiers.filter(c => c.statut === 'devis').length
      }
    ]
  }, [chantiers])

  // Filter and search chantiers
  const filteredChantiers = useMemo(() => {
    // Filter by active tab (statut)
    const statusFiltered = chantiers.filter(chantier => chantier.statut === activeTab)

    // Apply search query
    return searchChantiers(statusFiltered, searchQuery)
  }, [chantiers, activeTab, searchQuery])

  /**
   * Handle create chantier
   */
  const handleCreate = async (chantierData) => {
    const result = await createChantier(chantierData)
    return result
  }

  /**
   * Handle update chantier
   */
  const handleUpdate = async (chantierData) => {
    const result = await updateChantier(selectedChantier.id, chantierData)
    return result
  }

  /**
   * Handle delete chantier
   */
  const handleDelete = async (chantierId) => {
    const result = await deleteChantier(chantierId)
    return result
  }

  /**
   * Handle update statut (quick change from detail modal)
   */
  const handleUpdateStatut = async (chantierId, data) => {
    const result = await updateChantier(chantierId, data)
    return result
  }

  /**
   * Handle view chantier details
   */
  const handleView = (chantier) => {
    setSelectedChantier(chantier)
    setIsDetailModalOpen(true)
  }

  /**
   * Handle edit chantier
   */
  const handleEdit = (chantier) => {
    setSelectedChantier(chantier)
    setIsEditModalOpen(true)
  }

  /**
   * Handle delete confirmation
   */
  const handleDeleteClick = (chantier) => {
    setSelectedChantier(chantier)
    setIsDeleteModalOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Construction className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Chantiers</h1>
          </div>

          <Button
            onClick={() => {
              setSelectedChantier(null)
              setIsCreateModalOpen(true)
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="ml-2">Nouveau chantier</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un chantier par titre, client ou ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          />
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="error">
            Une erreur est survenue lors du chargement des chantiers.
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredChantiers.length === 0 && (
          <div className="text-center py-12">
            <Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery
                ? 'Aucun chantier trouvé'
                : `Aucun chantier ${activeTab === 'en_cours' ? 'en cours' : activeTab === 'planifie' ? 'planifié' : 'en devis'}`}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre premier chantier'}
            </p>
          </div>
        )}

        {/* Chantiers Grid */}
        {!loading && !error && filteredChantiers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChantiers.map(chantier => (
              <ChantierCard
                key={chantier.id}
                chantier={chantier}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <ChantierModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          chantier={null}
          onSubmit={handleCreate}
        />

        <ChantierModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          chantier={selectedChantier}
          onSubmit={handleUpdate}
        />

        <ChantierDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          chantier={selectedChantier}
          onEdit={handleEdit}
          onUpdateStatut={handleUpdateStatut}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          chantier={selectedChantier}
          onConfirm={handleDelete}
        />
      </div>
    </AppLayout>
  )
}
