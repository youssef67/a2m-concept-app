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
import { useToast } from '../../../shared/hooks/useToast'
import { getAllWorkers } from '../../workers/services/workersService'
import { getAppartementDocumentsWithStatus } from '../services/appartementDocumentsService'
import { getDocumentUrl } from '../services/appartementDocumentsService'
import { updateAppartementTacheStatut } from '../services/appartementsService'
import { getFirstTacheAFaire, getTachesAFaire, hasTasksEnCours, buildWhatsAppMessage, openWhatsApp } from '../utils/whatsappHelpers'

export default function SendWhatsAppModal({
  isOpen,
  onClose,
  appartements = [],
  chantierId,
  isEnCoursMode = false,
  onSuccess
}) {
  const { showToast } = useToast()
  const [workers, setWorkers] = useState([])
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [documentsMap, setDocumentsMap] = useState({}) // appartementId -> array of documents
  const [selectedDocuments, setSelectedDocuments] = useState({}) // appartementId -> array of documentIds
  const [selectedTaches, setSelectedTaches] = useState({}) // appartementId -> tacheId (for isEnCoursMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  // Limite de sélection
  const MAX_DOCUMENTS_PER_APPARTEMENT = 3
  const MAX_APPARTEMENTS = 5

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
                nom_document: doc.documentRequis.nom_document,
                storage_path: doc.uploadedFile.storage_path
              }))

            docsMap[appt.id] = uploadedDocs
          } else {
            docsMap[appt.id] = []
          }
        })
      )

      setDocumentsMap(docsMap)

      // Initialize selected documents to empty array (no documents selected)
      const initialSelectedDocs = {}
      appartements.forEach(appt => {
        initialSelectedDocs[appt.id] = []
      })
      setSelectedDocuments(initialSelectedDocs)

      // Initialize selected tasks (for isEnCoursMode only)
      if (isEnCoursMode) {
        const initialSelectedTaches = {}
        appartements.forEach(appt => {
          // If appartement is blocked (has tasks en_cours), don't set default task
          if (!hasTasksEnCours(appt.taches)) {
            const firstTache = getFirstTacheAFaire(appt.taches)
            initialSelectedTaches[appt.id] = firstTache ? firstTache.id : ''
          } else {
            initialSelectedTaches[appt.id] = ''
          }
        })
        setSelectedTaches(initialSelectedTaches)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle document toggle for an apartment (checkbox)
  const handleDocumentToggle = (appartementId, documentId) => {
    setSelectedDocuments(prev => {
      const currentSelection = prev[appartementId] || []
      const isSelected = currentSelection.includes(documentId)

      if (isSelected) {
        // Retirer le document
        return {
          ...prev,
          [appartementId]: currentSelection.filter(id => id !== documentId)
        }
      } else {
        // Ajouter le document si limite non atteinte
        if (currentSelection.length >= MAX_DOCUMENTS_PER_APPARTEMENT) {
          return prev // Ne rien faire si limite atteinte
        }
        return {
          ...prev,
          [appartementId]: [...currentSelection, documentId]
        }
      }
    })
  }

  // Handle task selection for an apartment (for isEnCoursMode)
  const handleTacheChange = (appartementId, tacheId) => {
    setSelectedTaches(prev => ({
      ...prev,
      [appartementId]: tacheId
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

    // Validate maximum appartements
    if (appartements.length > MAX_APPARTEMENTS) {
      setError(`Vous ne pouvez envoyer qu&apos;un maximum de ${MAX_APPARTEMENTS} appartements à la fois. Veuillez réduire votre sélection.`)
      return
    }

    setSending(true)
    setError(null)

    try {
      // Build documents map with URLs and intitules (multiple documents per appartement)
      const documentsDataMap = {}
      await Promise.all(
        appartements.map(async (appt) => {
          const selectedDocIds = selectedDocuments[appt.id] || []
          if (selectedDocIds.length > 0) {
            const docs = documentsMap[appt.id] || []
            const selectedDocs = docs.filter(d => selectedDocIds.includes(d.id))

            // Charger toutes les URLs en parallèle
            const docsWithUrls = await Promise.all(
              selectedDocs.map(async (doc) => {
                const { data: url } = await getDocumentUrl(doc.storage_path)
                return {
                  intitule: doc.nom_document,
                  url: url
                }
              })
            )

            documentsDataMap[appt.id] = docsWithUrls // Array de documents
          }
        })
      )

      // Build tasks map and collect tasks to update
      const tachesMap = {}
      const tachesToUpdate = [] // [{appartementNom, tacheId}]

      // All appartements passed to the modal are already filtered (no blocked ones in isEnCoursMode)
      appartements.forEach(appt => {
        let tache = null

        if (isEnCoursMode) {
          // Use selected task
          const selectedTacheId = selectedTaches[appt.id]
          if (selectedTacheId) {
            tache = appt.taches.find(t => t.id === selectedTacheId)
          }
        } else {
          // Use first task "a_faire" automatically
          tache = getFirstTacheAFaire(appt.taches)
        }

        if (tache) {
          tachesMap[appt.id] = tache.intitule
          tachesToUpdate.push({
            appartementNom: appt.nom,
            tacheId: tache.id
          })
        }
      })

      // Build message
      const message = buildWhatsAppMessage(appartements, documentsDataMap, tachesMap)

      // Open WhatsApp
      openWhatsApp(selectedWorker.phone, message)

      // Close modal immediately
      onClose()

      // Update tasks status to "en_cours" in background
      const failedUpdates = []

      for (const item of tachesToUpdate) {
        const { error: updateError } = await updateAppartementTacheStatut(
          item.tacheId,
          'en_cours'
        )

        if (updateError) {
          console.error(`Erreur mise à jour tâche pour ${item.appartementNom}:`, updateError)
          failedUpdates.push(item.appartementNom)
        }
      }

      // Show notification based on result
      if (failedUpdates.length > 0) {
        showToast(
          `Erreur lors de la mise à jour du statut pour : ${failedUpdates.join(', ')}`,
          'error'
        )
      } else {
        showToast('Message WhatsApp envoyé avec succès', 'success')
        // Call onSuccess to switch to "En cours" tab
        if (onSuccess) {
          onSuccess()
        }
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

        {/* Warning if more than MAX_APPARTEMENTS */}
        {!loading && appartements.length > MAX_APPARTEMENTS && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Attention : Vous avez sélectionné {appartements.length} appartements, mais l&apos;envoi WhatsApp est limité à {MAX_APPARTEMENTS} appartements maximum.
            </p>
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
                  const documents = documentsMap[appt.id] || []
                  const tachesAFaire = getTachesAFaire(appt.taches)

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

                      {/* Task selection (only for isEnCoursMode) */}
                      {isEnCoursMode && (
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-base mt-1">📋</span>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tâche à assigner :
                            </label>
                            <Select
                              value={selectedTaches[appt.id] || ''}
                              onChange={(value) => handleTacheChange(appt.id, value)}
                              options={tachesAFaire.map(tache => ({
                                value: tache.id,
                                label: tache.intitule
                              }))}
                              placeholder="Sélectionner une tâche..."
                            />
                          </div>
                        </div>
                      )}

                      {/* Task info (only for non-isEnCoursMode) */}
                      {!isEnCoursMode && (
                        <div className="flex items-start gap-2 mb-2 text-sm">
                          <span className="text-base">📋</span>
                          <p className="text-gray-700">
                            <span className="font-medium">Prochaine tâche :</span>{' '}
                            {getFirstTacheAFaire(appt.taches)?.intitule || 'Aucune tâche à faire'}
                          </p>
                        </div>
                      )}

                      {/* Document selection (checkboxes - max 3) */}
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-1">📄</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Documents (max {MAX_DOCUMENTS_PER_APPARTEMENT}) :
                            </label>
                            {documents.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {(selectedDocuments[appt.id] || []).length}/{MAX_DOCUMENTS_PER_APPARTEMENT}
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
                                const isSelected = (selectedDocuments[appt.id] || []).includes(doc.id)
                                const isDisabled = !isSelected && (selectedDocuments[appt.id] || []).length >= MAX_DOCUMENTS_PER_APPARTEMENT

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
