/**
 * SendWhatsAppModal
 * Modal pour rechercher, sélectionner des lots et envoyer des documents via WhatsApp
 */

import React, { useState, useEffect } from 'react'
import { MessageCircle, Search, X, Clipboard } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import Select from '../../../shared/components/ui/Select'
import { useToast } from '../../../shared/hooks/useToast'
import { getAllWorkers } from '../../workers/services/workersService'
import { getAppartementDocumentsWithStatus, getDocumentUrl } from '../services/appartementDocumentsService'
import { buildWhatsAppMessage, openWhatsApp, copyMessageToClipboard } from '../utils/whatsappHelpers'

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  appartements = [],
  chantierId,
  onSuccess
}) {
  const { showToast } = useToast()
  const [workers, setWorkers] = useState([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppartements, setSelectedAppartements] = useState([]) // Array of appartement objects
  const [documentsMap, setDocumentsMap] = useState({}) // appartementId -> array of documents
  const [selectedDocuments, setSelectedDocuments] = useState({}) // appartementId -> array of documentIds
  const [loading, setLoading] = useState(false)
  const [loadingDocuments, setLoadingDocuments] = useState({}) // appartementId -> boolean
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Constantes
  const MAX_DOCUMENTS_PER_APPARTEMENT = 3
  const MAX_APPARTEMENTS = 5

  // Load workers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWorkers()
    } else {
      // Reset state when modal closes
      setSelectedWorkerId('')
      setSearchQuery('')
      setSelectedAppartements([])
      setDocumentsMap({})
      setSelectedDocuments({})
      setError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const loadWorkers = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: workersData, error: workersError } = await getAllWorkers(1, 100)
      if (workersError) throw new Error('Erreur lors du chargement des ouvriers')
      setWorkers(workersData || [])
    } catch (err) {
      console.error('Error loading workers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter appartements based on search query
  const filteredAppartements = appartements.filter(appt =>
    appt.nom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter out already selected appartements from search results
  const searchResults = filteredAppartements.filter(appt =>
    !selectedAppartements.some(selected => selected.id === appt.id)
  )

  // Handle appartement selection from search results
  const handleSelectAppartement = async (appartement) => {
    if (selectedAppartements.length >= MAX_APPARTEMENTS) return

    // Add to selected appartements
    setSelectedAppartements(prev => [...prev, appartement])

    // Clear search
    setSearchQuery('')

    // Load documents for this appartement
    setLoadingDocuments(prev => ({ ...prev, [appartement.id]: true }))

    try {
      const { data, error: docsError } = await getAppartementDocumentsWithStatus(
        appartement.id,
        chantierId
      )

      if (docsError) {
        console.error('Erreur chargement docs pour', appartement.nom, ':', docsError)
        setDocumentsMap(prev => ({ ...prev, [appartement.id]: [] }))
      } else if (data) {
        const uploadedDocs = data
          .filter(doc => doc.uploadedFiles && doc.uploadedFiles.length > 0)
          .flatMap(doc =>
            doc.uploadedFiles.map(uploadedFile => ({
              id: uploadedFile.id,
              nom_fichier: uploadedFile.nom_fichier,
              nom_document: doc.documentRequis.nom_document,
              storage_path: uploadedFile.storage_path
            }))
          )

        setDocumentsMap(prev => ({ ...prev, [appartement.id]: uploadedDocs }))
      } else {
        setDocumentsMap(prev => ({ ...prev, [appartement.id]: [] }))
      }

      // Initialize selected documents for this appartement
      setSelectedDocuments(prev => ({ ...prev, [appartement.id]: [] }))
    } catch (err) {
      console.error('Error loading documents:', err)
      setDocumentsMap(prev => ({ ...prev, [appartement.id]: [] }))
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [appartement.id]: false }))
    }
  }

  // Handle appartement removal
  const handleRemoveAppartement = (appartementId) => {
    setSelectedAppartements(prev => prev.filter(appt => appt.id !== appartementId))
    setDocumentsMap(prev => {
      const newMap = { ...prev }
      delete newMap[appartementId]
      return newMap
    })
    setSelectedDocuments(prev => {
      const newDocs = { ...prev }
      delete newDocs[appartementId]
      return newDocs
    })
  }

  // Handle document toggle
  const handleDocumentToggle = (appartementId, documentId) => {
    setSelectedDocuments(prev => {
      const currentSelection = prev[appartementId] || []
      const isSelected = currentSelection.includes(documentId)

      if (isSelected) {
        return {
          ...prev,
          [appartementId]: currentSelection.filter(id => id !== documentId)
        }
      } else {
        if (currentSelection.length >= MAX_DOCUMENTS_PER_APPARTEMENT) {
          return prev
        }
        return {
          ...prev,
          [appartementId]: [...currentSelection, documentId]
        }
      }
    })
  }

  // Handle copy message button click
  const handleCopyMessage = async () => {
    // Validate appartement selection
    if (selectedAppartements.length === 0) {
      setError('Veuillez sélectionner au moins un lot')
      return
    }

    setError(null)

    try {
      // Build documents map with URLs
      const documentsDataMap = {}
      await Promise.all(
        selectedAppartements.map(async (appt) => {
          const selectedDocIds = selectedDocuments[appt.id] || []
          if (selectedDocIds.length > 0) {
            const docs = documentsMap[appt.id] || []
            const selectedDocs = docs.filter(d => selectedDocIds.includes(d.id))

            const docsWithUrls = await Promise.all(
              selectedDocs.map(async (doc) => {
                const { data: url } = await getDocumentUrl(doc.storage_path)
                return {
                  intitule: doc.nom_document,
                  url: url
                }
              })
            )

            documentsDataMap[appt.id] = docsWithUrls
          }
        })
      )

      // Build message (without tasks)
      const message = buildWhatsAppMessage(selectedAppartements, documentsDataMap)

      // Copy to clipboard
      const success = await copyMessageToClipboard(message)

      if (success) {
        showToast('Message copié dans le presse-papier', 'success')
      } else {
        throw new Error('Échec de la copie')
      }
    } catch (err) {
      console.error('Error copying message:', err)
      setError('Erreur lors de la copie du message')
    }
  }

  // Handle send button click
  const handleSend = async () => {
    // Validate worker selection
    if (!selectedWorkerId) {
      setError('Veuillez sélectionner un ouvrier')
      return
    }

    const selectedWorker = workers.find(w => w.id === selectedWorkerId)
    if (!selectedWorker || !selectedWorker.phone) {
      setError('L\'ouvrier sélectionné n\'a pas de numéro de téléphone')
      return
    }

    // Validate appartement selection
    if (selectedAppartements.length === 0) {
      setError('Veuillez sélectionner au moins un lot')
      return
    }

    setSending(true)
    setError(null)

    try {
      // Build documents map with URLs
      const documentsDataMap = {}
      await Promise.all(
        selectedAppartements.map(async (appt) => {
          const selectedDocIds = selectedDocuments[appt.id] || []
          if (selectedDocIds.length > 0) {
            const docs = documentsMap[appt.id] || []
            const selectedDocs = docs.filter(d => selectedDocIds.includes(d.id))

            const docsWithUrls = await Promise.all(
              selectedDocs.map(async (doc) => {
                const { data: url } = await getDocumentUrl(doc.storage_path)
                return {
                  intitule: doc.nom_document,
                  url: url
                }
              })
            )

            documentsDataMap[appt.id] = docsWithUrls
          }
        })
      )

      // Build message (without tasks)
      const message = buildWhatsAppMessage(selectedAppartements, documentsDataMap)

      // Open WhatsApp
      openWhatsApp(selectedWorker.phone, message)

      // Close modal immediately
      onClose()

      // Show success message
      showToast('Message WhatsApp envoyé avec succès', 'success')

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error sending WhatsApp:', err)
      setError('Erreur lors de la préparation du message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Envoyer par WhatsApp"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Section 1: Select Worker */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                1️⃣ Sélectionner un ouvrier
              </h3>

              {workers.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Aucun ouvrier disponible</p>
                </div>
              ) : (
                <Select
                  value={selectedWorkerId || ''}
                  onChange={(value) => setSelectedWorkerId(value)}
                  options={workers
                    .filter(worker => worker.phone)
                    .map(worker => ({
                      value: worker.id,
                      label: `${worker.first_name} ${worker.last_name} (${worker.phone})`
                    }))}
                  placeholder="Sélectionner un ouvrier..."
                />
              )}
            </div>

            {/* Section 2: Search and Select Lots */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                2️⃣ Rechercher et sélectionner des lots ({selectedAppartements.length}/{MAX_APPARTEMENTS})
              </h3>

              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un lot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={selectedAppartements.length >= MAX_APPARTEMENTS}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Warning if max reached */}
              {selectedAppartements.length >= MAX_APPARTEMENTS && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ Limite atteinte ({MAX_APPARTEMENTS}/{MAX_APPARTEMENTS}). Retirez un lot pour en ajouter un autre.
                  </p>
                </div>
              )}

              {/* Search Results */}
              {searchQuery && searchResults.length > 0 && selectedAppartements.length < MAX_APPARTEMENTS && (
                <div className="border border-gray-200 rounded-lg p-2 mb-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-500 px-2 py-1">Résultats de recherche :</p>
                  <div className="space-y-1">
                    {searchResults.map(appt => (
                      <button
                        key={appt.id}
                        onClick={() => handleSelectAppartement(appt)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-base text-gray-900">{appt.nom}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && selectedAppartements.length < MAX_APPARTEMENTS && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-center">
                  <p className="text-sm text-gray-600">
                    Aucun lot trouvé pour &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Section 3: Selected Lots */}
            {selectedAppartements.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  3️⃣ Lots sélectionnés ({selectedAppartements.length}/{MAX_APPARTEMENTS})
                </h3>

                <div className="space-y-3">
                  {selectedAppartements.map(appt => {
                    const documents = documentsMap[appt.id] || []
                    const isLoadingDocs = loadingDocuments[appt.id]
                    const selectedDocIds = selectedDocuments[appt.id] || []

                    return (
                      <div
                        key={appt.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        {/* Appartement header with remove button */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏠</span>
                            <h4 className="font-medium text-gray-900">{appt.nom}</h4>
                          </div>
                          <button
                            onClick={() => handleRemoveAppartement(appt.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                            title="Retirer ce lot"
                          >
                            <X className="w-5 h-5 text-red-600" />
                          </button>
                        </div>

                        {/* Documents section */}
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-1">📄</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Documents (max {MAX_DOCUMENTS_PER_APPARTEMENT}) :
                              </label>
                              {documents.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {selectedDocIds.length}/{MAX_DOCUMENTS_PER_APPARTEMENT}
                                </span>
                              )}
                            </div>

                            {isLoadingDocs ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Spinner size="sm" />
                                <span>Chargement des documents...</span>
                              </div>
                            ) : documents.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">
                                Aucun document disponible
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {documents.map(doc => {
                                  const isSelected = selectedDocIds.includes(doc.id)
                                  const isDisabled = !isSelected && selectedDocIds.length >= MAX_DOCUMENTS_PER_APPARTEMENT

                                  return (
                                    <label
                                      key={doc.id}
                                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-primary-50 border-primary-300'
                                          : isDisabled
                                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                                          : 'bg-white border-gray-200 hover:bg-gray-50'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onChange={() => handleDocumentToggle(appt.id, doc.id)}
                                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                                      />
                                      <span className={`text-base flex-1 ${isSelected ? 'text-primary-900 font-medium' : 'text-gray-900'}`}>
                                        {doc.nom_document}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 pb-52 md:pb-0 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={sending}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyMessage}
            disabled={loading || selectedAppartements.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Clipboard className="w-5 h-5" />
            <span className="hidden sm:inline">Copier le message</span>
            <span className="sm:hidden">Copier</span>
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={loading || sending || !selectedWorkerId || selectedAppartements.length === 0}
            loading={sending}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Envoyer sur WhatsApp</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
