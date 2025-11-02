/**
 * SendWhatsAppModal
 * Modal pour configurer et envoyer des informations d'appartements via WhatsApp
 */

import React, { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import Select from '../../../shared/components/ui/Select'
import { getAllWorkers } from '../../workers/services/workersService'
import { getAppartementDocumentsWithStatus } from '../services/appartementDocumentsService'
import { getDocumentUrl } from '../services/appartementDocumentsService'
import { getFirstTacheAFaire, buildWhatsAppMessage, openWhatsApp } from '../utils/whatsappHelpers'

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  appartements = [],
  chantierId
}) {
  const [workers, setWorkers] = useState([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [documentsMap, setDocumentsMap] = useState({}) // appartementId -> array of documents
  const [selectedDocuments, setSelectedDocuments] = useState({}) // appartementId -> documentId
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Load workers and documents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData()
    } else {
      // Reset state when modal closes
      setSelectedWorkerId('')
      setSelectedDocuments({})
      setError(null)
    }
  }, [isOpen, appartements, chantierId])

  // Load workers and documents for each apartment
  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load workers
      const { data: workersData, error: workersError } = await getAllWorkers(1, 100)
      if (workersError) throw new Error('Erreur lors du chargement des ouvriers')
      setWorkers(workersData || [])

      // Load documents for each apartment
      const docsMap = {}
      await Promise.all(
        appartements.map(async (appt) => {
          const { data, error: docsError } = await getAppartementDocumentsWithStatus(
            appt.id,
            chantierId
          )

          console.log('📄 Documents pour appartement', appt.nom, ':', data)

          if (docsError) {
            console.error('Erreur chargement docs pour', appt.nom, ':', docsError)
            docsMap[appt.id] = []
          } else if (!docsError && data) {
            // Filter only uploaded documents and map to correct structure
            const uploadedDocs = data
              .filter(doc => doc.uploadedFile !== null)
              .map(doc => ({
                id: doc.uploadedFile.id,
                nom_fichier: doc.uploadedFile.nom_fichier,
                storage_path: doc.uploadedFile.storage_path
              }))

            console.log('✅ Documents uploadés pour', appt.nom, ':', uploadedDocs)
            docsMap[appt.id] = uploadedDocs
          } else {
            docsMap[appt.id] = []
          }
        })
      )

      console.log('📦 Documents map final:', docsMap)
      setDocumentsMap(docsMap)

      // Initialize selected documents to empty string (no document selected)
      const initialSelectedDocs = {}
      appartements.forEach(appt => {
        initialSelectedDocs[appt.id] = ''
      })
      setSelectedDocuments(initialSelectedDocs)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle document selection for an apartment
  const handleDocumentChange = (appartementId, documentId) => {
    setSelectedDocuments(prev => ({
      ...prev,
      [appartementId]: documentId === '' ? null : documentId
    }))
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

    setSending(true)
    setError(null)

    try {
      // Build documents map with URLs
      const documentUrlsMap = {}
      await Promise.all(
        appartements.map(async (appt) => {
          const selectedDocId = selectedDocuments[appt.id]
          if (selectedDocId) {
            const docs = documentsMap[appt.id] || []
            const doc = docs.find(d => d.id === selectedDocId)
            if (doc && doc.storage_path) {
              const { data: url } = await getDocumentUrl(doc.storage_path)
              documentUrlsMap[appt.id] = url
            }
          }
        })
      )

      // Build tasks map
      const tachesMap = {}
      appartements.forEach(appt => {
        const tache = getFirstTacheAFaire(appt.taches)
        if (tache) {
          tachesMap[appt.id] = tache.intitule
        }
      })

      // Build message
      const message = buildWhatsAppMessage(appartements, documentUrlsMap, tachesMap)

      // Open WhatsApp
      openWhatsApp(selectedWorker.phone, message)

      // Close modal
      onClose()
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
                    .filter(worker => worker.phone) // Only show workers with phone
                    .map(worker => ({
                      value: worker.id,
                      label: `${worker.first_name} ${worker.last_name} (${worker.phone})`
                    }))}
                  placeholder="Sélectionner un ouvrier..."
                />
              )}
            </div>

            {/* Section 2: Configure Apartments */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                2️⃣ Configurer l&apos;envoi
              </h3>

              <div className="space-y-4">
                {appartements.map(appt => {
                  const tache = getFirstTacheAFaire(appt.taches)
                  const documents = documentsMap[appt.id] || []

                  return (
                    <div
                      key={appt.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      {/* Apartment name */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🏠</span>
                        <h4 className="font-medium text-gray-900">{appt.nom}</h4>
                      </div>

                      {/* Task info */}
                      <div className="flex items-start gap-2 mb-2 text-sm">
                        <span className="text-base">📋</span>
                        <p className="text-gray-700">
                          <span className="font-medium">Prochaine tâche :</span>{' '}
                          {tache ? tache.intitule : 'Aucune tâche à faire'}
                        </p>
                      </div>

                      {/* Document selection */}
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-1">📄</span>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Document :
                          </label>
                          {documents.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">
                              Aucun document disponible
                            </p>
                          ) : (
                            <Select
                              value={selectedDocuments[appt.id] || ''}
                              onChange={(value) => handleDocumentChange(appt.id, value)}
                              options={[
                                { value: '', label: 'Aucun document' },
                                ...documents.map(doc => ({
                                  value: doc.id,
                                  label: doc.nom_fichier
                                }))
                              ]}
                              placeholder="Aucun document"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
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
            disabled={loading || sending || !selectedWorkerId}
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
