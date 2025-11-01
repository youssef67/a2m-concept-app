/**
 * WorkersPage
 * Page de gestion des travailleurs avec CRUD et pagination
 */

import React, { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import Pagination from '../../../shared/components/ui/Pagination'
import WorkerCard from '../components/WorkerCard'
import WorkerModal from '../components/WorkerModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useWorkers } from '../hooks/useWorkers'
import { useToast } from '../../../shared/hooks/useToast'
import { searchWorkers } from '../utils/workerHelpers'

export default function WorkersPage() {
  const { showToast } = useToast()
  const {
    workers,
    totalCount,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    createWorker,
    updateWorker,
    deleteWorker
  } = useWorkers(10)

  const [searchQuery, setSearchQuery] = useState('')
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrer les workers par recherche (côté client)
  const filteredWorkers = useMemo(() => {
    return searchWorkers(workers, searchQuery)
  }, [workers, searchQuery])

  // Handlers
  const handleAddWorker = () => {
    setSelectedWorker(null)
    setIsWorkerModalOpen(true)
  }

  const handleEditWorker = (worker) => {
    setSelectedWorker(worker)
    setIsWorkerModalOpen(true)
  }

  const handleDeleteWorker = (worker) => {
    setSelectedWorker(worker)
    setIsDeleteModalOpen(true)
  }

  const handleWorkerSubmit = async (workerData) => {
    setIsSubmitting(true)

    try {
      let result

      if (selectedWorker) {
        // Mode modification
        result = await updateWorker(selectedWorker.id, workerData)
      } else {
        // Mode création
        result = await createWorker(workerData)
      }

      if (result.success) {
        showToast(
          selectedWorker
            ? 'Travailleur modifié avec succès'
            : 'Travailleur ajouté avec succès',
          'success'
        )
        setIsWorkerModalOpen(false)
        setSelectedWorker(null)
      } else {
        showToast(
          result.error?.message || 'Une erreur est survenue',
          'error'
        )
      }
    } catch (err) {
      showToast('Une erreur inattendue est survenue', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedWorker) return

    setIsSubmitting(true)

    try {
      const result = await deleteWorker(selectedWorker.id)

      if (result.success) {
        showToast('Travailleur supprimé avec succès', 'success')
        setIsDeleteModalOpen(false)
        setSelectedWorker(null)
      } else {
        showToast(
          result.error?.message || 'Impossible de supprimer ce travailleur',
          'error'
        )
      }
    } catch (err) {
      showToast('Une erreur inattendue est survenue', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Liste de contacts</h1>
          <Button
            onClick={handleAddWorker}
            className="flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un contact</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou téléphone..."
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
              Erreur lors du chargement des travailleurs. Veuillez réessayer.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Workers List */}
        {!loading && !error && (
          <>
            {filteredWorkers.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Aucun travailleur trouvé pour cette recherche.'
                    : 'Aucun travailleur enregistré. Ajoutez-en un pour commencer.'}
                </p>
              </div>
            ) : (
              <>
                {/* Liste verticale */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
                  {filteredWorkers.map((worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      onEdit={handleEditWorker}
                      onDelete={handleDeleteWorker}
                    />
                  ))}
                </div>

                {/* Count Info */}
                <div className="text-sm text-gray-600 text-center mb-4">
                  {totalCount} travailleur{totalCount > 1 ? 's' : ''} au total
                </div>

                {/* Pagination */}
                {!searchQuery && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Modals */}
        <WorkerModal
          isOpen={isWorkerModalOpen}
          onClose={() => {
            setIsWorkerModalOpen(false)
            setSelectedWorker(null)
          }}
          onSubmit={handleWorkerSubmit}
          worker={selectedWorker}
          isSubmitting={isSubmitting}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setSelectedWorker(null)
          }}
          onConfirm={handleDeleteConfirm}
          worker={selectedWorker}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  )
}
