/**
 * ExceptionalWhatsAppModal
 * Modal pour envoi exceptionnel WhatsApp avec recherche d'appartement intégrée
 */

import React, { useState, useEffect } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import Select from '../../../shared/components/ui/Select'
import { useToast } from '../../../shared/hooks/useToast'
import { getAllWorkers } from '../../workers/services/workersService'
import { getAppartementDocumentsWithStatus } from '../services/appartementDocumentsService'
import { getDocumentUrl } from '../services/appartementDocumentsService'
import { buildWhatsAppMessage, openWhatsApp } from '../utils/whatsappHelpers'

export default function ExceptionalWhatsAppModal({
  isOpen,
  onClose,
  appartements = [],
  chantierId
}) {
  const { showToast } = useToast()
  const [workers, setWorkers] = useState([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAppartementId, setSelectedAppartementId] = useState('')
  const [documentsMap, setDocumentsMap] = useState({}) // appartementId -> array of documents
  const [selectedDocuments, setSelectedDocuments] = useState([]) // array of documentIds (max 3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Constantes
  const MAX_DOCUMENTS = 3

  // Load workers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWorkers()
    } else {
      // Reset state when modal closes
      setSelectedWorkerId('')
      setSearchQuery('')
      setSelectedAppartementId('')
      setDocumentsMap({})
      setSelectedDocuments([])
      setError(null)
    }
  }, [isOpen])

  // Load documents when appartement is selected
  useEffect(() => {
    if (selectedAppartementId) {
      loadAppartementDocuments(selectedAppartementId)
    } else {
      setDocumentsMap({})
      setSelectedDocuments([])
    }
  }, [selectedAppartementId])

  // Load workers
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

  // Load documents for selected appartement
  const loadAppartementDocuments = async (appartementId) => {
    try {
      const { data, error: docsError } = await getAppartementDocumentsWithStatus(
        appartementId,
        chantierId
      )

      if (docsError) {
        console.error('Erreur chargement docs:', docsError)
        setDocumentsMap({})
      } else if (data) {
        // Filter only uploaded documents
        const uploadedDocs = data
          .filter(doc => doc.uploadedFile !== null)
          .map(doc => ({
            id: doc.uploadedFile.id,
            nom_fichier: doc.uploadedFile.nom_fichier,
            nom_document: doc.documentRequis.nom_document,
            storage_path: doc.uploadedFile.storage_path
          }))

        setDocumentsMap({ [appartementId]: uploadedDocs })
      } else {
        setDocumentsMap({})
      }
    } catch (err) {
      console.error('Error loading documents:', err)
      setDocumentsMap({})
    }
  }

  // Filter appartements by search query
  const filteredAppartements = appartements.filter(appt =>
    appt.nom.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle appartement selection
  const handleSelectAppartement = (appartementId) => {
    setSelectedAppartementId(appartementId)
    setSelectedDocuments([]) // Reset documents when changing appartement
  }

  // Handle document toggle
  const handleDocumentToggle = (documentId) => {
    setSelectedDocuments(prev => {
      const isSelected = prev.includes(documentId)

      if (isSelected) {
        return prev.filter(id => id !== documentId)
      } else {
        if (prev.length >= MAX_DOCUMENTS) {
          return prev // Ne rien faire si limite atteinte
        }
        return [...prev, documentId]
      }
    })
  }

  // Get selected appartement
  const selectedAppartement = appartements.find(appt => appt.id === selectedAppartementId)

  // Get tâche en cours for selected appartement
  const getTacheEnCours = () => {
    if (!selectedAppartement) return null
    return selectedAppartement.taches?.find(t => t.statut === 'en_cours') || null
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
      setError('L&apos;ouvrier sélectionné n&apos;a pas de numéro de téléphone')
      return
    }

    // Validate appartement selection
    if (!selectedAppartementId) {
      setError('Veuillez sélectionner un appartement')
      return
    }

    setSending(true)
    setError(null)

    try {
      // Build documents map with URLs
      const documentsDataMap = {}
      const docs = documentsMap[selectedAppartementId] || []
      const selectedDocs = docs.filter(d => selectedDocuments.includes(d.id))

      if (selectedDocs.length > 0) {
        const docsWithUrls = await Promise.all(
          selectedDocs.map(async (doc) => {
            const { data: url } = await getDocumentUrl(doc.storage_path)
            return {
              intitule: doc.nom_document,
              url: url
            }
          })
        )
        documentsDataMap[selectedAppartementId] = docsWithUrls
      }

      // Build tasks map
      const tachesMap = {}
      const tacheEnCours = getTacheEnCours()
      if (tacheEnCours) {
        tachesMap[selectedAppartementId] = tacheEnCours.intitule
      }

      // Build message
      const message = buildWhatsAppMessage([selectedAppartement], documentsDataMap, tachesMap)

      // Open WhatsApp
      openWhatsApp(selectedWorker.phone, message)

      // Close modal immediately
      onClose()

      // Show success message
      showToast('Message WhatsApp envoyé avec succès', 'success')
    } catch (err) {
      console.error('Error sending WhatsApp:', err)
      setError('Erreur lors de la préparation du message')
    } finally {
      setSending(false)
    }
  }

  // Get documents for selected appartement
  const documents = documentsMap[selectedAppartementId] || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Envoi exceptionnel WhatsApp"
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

            {/* Section 2: Search and Select Appartement */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                2️⃣ Rechercher un appartement
              </h3>

              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un appartement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] text-base"
                />
              </div>

              {/* Appartements List */}
              {appartements.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Aucun appartement disponible</p>
                </div>
              ) : filteredAppartements.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Aucun appartement trouvé pour &quot;{searchQuery}&quot;
                  </p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                  {filteredAppartements.map(appt => (
                    <label
                      key={appt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedAppartementId === appt.id
                          ? 'bg-primary-50 border-primary-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="appartement"
                        checked={selectedAppartementId === appt.id}
                        onChange={() => handleSelectAppartement(appt.id)}
                        className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className={`text-base flex-1 ${selectedAppartementId === appt.id ? 'text-primary-900 font-medium' : 'text-gray-900'}`}>
                        {appt.nom}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Documents (only if appartement selected) */}
            {selectedAppartementId && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    3️⃣ Documents (max {MAX_DOCUMENTS})
                  </h3>
                  {documents.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {selectedDocuments.length}/{MAX_DOCUMENTS}
                    </span>
                  )}
                </div>

                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Aucun document disponible
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => {
                      const isSelected = selectedDocuments.includes(doc.id)
                      const isDisabled = !isSelected && selectedDocuments.length >= MAX_DOCUMENTS

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
                            onChange={() => handleDocumentToggle(doc.id)}
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
            )}

            {/* Section 4: Tâche en cours (only if appartement selected) */}
            {selectedAppartementId && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  4️⃣ Tâche en cours
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {getTacheEnCours()?.intitule || 'Aucune tâche en cours'}
                  </p>
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
            onClick={handleSend}
            disabled={loading || sending || !selectedWorkerId || !selectedAppartementId}
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
