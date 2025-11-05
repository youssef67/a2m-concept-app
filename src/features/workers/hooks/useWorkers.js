/**
 * useWorkers Hook
 * Hook personnalisé pour gérer les workers avec pagination
 */

import { useState, useEffect, useCallback } from 'react'
import * as workersService from '../services/workersService'

export function useWorkers(itemsPerPage = 10) {
  const [workers, setWorkers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // Charger les workers pour la page courante
  const fetchWorkers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, count, error } = await workersService.getAllWorkers(currentPage, itemsPerPage)

    if (error) {
      setError(error)
      setWorkers([])
      setTotalCount(0)
    } else {
      setWorkers(data || [])
      setTotalCount(count || 0)
    }

    setLoading(false)
  }, [currentPage, itemsPerPage])

  // Charger les workers au montage et quand la page change
  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

  // Changer de page
  const setPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // Rafraîchir la page courante
  const refetch = useCallback(() => {
    fetchWorkers()
  }, [fetchWorkers])

  // Créer un worker
  const createWorker = useCallback(async (workerData) => {
    const { data, error } = await workersService.createWorker(workerData)

    if (error) {
      return { success: false, error }
    }

    // Recharger la première page après création
    setCurrentPage(1)
    await fetchWorkers()

    return { success: true, data }
  }, [fetchWorkers])

  // Mettre à jour un worker
  const updateWorker = useCallback(async (workerId, workerData) => {
    const { data, error } = await workersService.updateWorker(workerId, workerData)

    if (error) {
      return { success: false, error }
    }

    // Mettre à jour localement
    setWorkers(prevWorkers =>
      prevWorkers.map(worker =>
        worker.id === workerId ? { ...worker, ...data } : worker
      )
    )

    return { success: true, data }
  }, [])

  // Supprimer un worker
  const deleteWorker = useCallback(async (workerId) => {
    const { error } = await workersService.deleteWorker(workerId)

    if (error) {
      return { success: false, error }
    }

    // Si la page actuelle devient vide après suppression, revenir à la page précédente
    const newCount = totalCount - 1
    const newTotalPages = Math.ceil(newCount / itemsPerPage)

    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    } else {
      await fetchWorkers()
    }

    return { success: true }
  }, [totalCount, currentPage, itemsPerPage, fetchWorkers])

  return {
    workers,
    totalCount,
    currentPage,
    totalPages,
    loading,
    error,
    setPage,
    refetch,
    createWorker,
    updateWorker,
    deleteWorker
  }
}
