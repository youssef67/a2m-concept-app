/**
 * AppartementDetailPage
 * Page de détail d'un appartement avec liste des tâches héritées
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Circle, Clock, FileText, Plus, Ruler, StickyNote, Package } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import StickyPageHeader from '../../../shared/components/layout/StickyPageHeader'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import Select from '../../../shared/components/ui/Select'
import Tabs from '../../../shared/components/ui/Tabs'
import { getAppartementById } from '../services/appartementsService'
import { useAppartementTaches } from '../hooks/useAppartements'
import { useAppartementDocuments } from '../hooks/useAppartementDocuments'
import { useAppartementNotes } from '../hooks/useAppartementNotes'
import { useAppartementPlinthes } from '../hooks/useAppartementPlinthes'
import AppartementDocumentUploadModal from '../components/AppartementDocumentUploadModal'
import AppartementNotesTab from '../components/AppartementNotesTab'
import AppartementLivraisonTab from '../components/AppartementLivraisonTab'
import PlinthesModal from '../components/PlinthesModal'
import NoteFormModal from '../components/NoteFormModal'
import LivraisonFormModal from '../components/LivraisonFormModal'
import DocumentFilesList from '../components/DocumentFilesList'
import { useAppartementLivraison } from '../hooks/useAppartementLivraison'
import { useToast } from '../../../shared/hooks/useToast'

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
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  const [appartement, setAppartement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tabs state - initialize with URL parameter if present
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'taches')

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocumentRequisId, setSelectedDocumentRequisId] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Taches hook
  const { taches, loading: tachesLoading, loadTaches, updateTacheStatut } = useAppartementTaches(appartementId)

  // Documents hook
  const {
    documentsWithStatus,
    stats: documentsStats,
    loading: documentsLoading,
    loadDocuments,
    uploadDocument
  } = useAppartementDocuments(appartementId, chantierId)

  // Notes hook
  const {
    notes,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    addPhotos,
    deletePhoto
  } = useAppartementNotes(appartementId)

  // Livraisons hook
  const {
    livraisons,
    loading: livraisonsLoading,
    loadLivraisons,
    createLivraison,
    updateStatut,
    uploadPhoto,
    deletePhoto: deleteLivraisonPhoto
  } = useAppartementLivraison(appartementId)

  // Plinthes hook
  const { plinthes, loading: plinthesLoading, loadPlinthes, savePlinthes } = useAppartementPlinthes(appartementId)
  const [isPlinthesModalOpen, setIsPlinthesModalOpen] = useState(false)

  // Modal states managed at page level
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [isLivraisonModalOpen, setIsLivraisonModalOpen] = useState(false)

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
        setError('Lot introuvable')
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

  // Load documents data
  useEffect(() => {
    if (appartementId && chantierId) {
      loadDocuments()
    }
  }, [appartementId, chantierId, loadDocuments])

  // Load notes data
  useEffect(() => {
    if (appartementId) {
      loadNotes()
    }
  }, [appartementId, loadNotes])

  // Load livraisons data
  useEffect(() => {
    if (appartementId) {
      loadLivraisons()
    }
  }, [appartementId, loadLivraisons])

  // Load plinthes data
  useEffect(() => {
    if (appartementId) {
      loadPlinthes()
    }
  }, [appartementId, loadPlinthes])

  // Synchronize activeTab with URL parameter when appartement changes
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    } else {
      // Reset to default 'taches' if no tab parameter
      setActiveTab('taches')
    }
  }, [appartementId, searchParams])

  // Handle back button
  const handleBack = () => {
    // Try to get returnUrl (new method with filters)
    const returnUrl = searchParams.get('returnUrl')
    if (returnUrl) {
      navigate(decodeURIComponent(returnUrl))
      return
    }

    // Fallback to fromTab (old method for compatibility)
    const fromTab = searchParams.get('fromTab')
    if (fromTab) {
      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}?activeTab=${fromTab}`)
    } else {
      navigate(`/admin/plotsmanager/${chantierId}/plot/${plotId}`)
    }
  }

  // Handle status change
  const handleStatusChange = async (tacheId, newStatus) => {
    const result = await updateTacheStatut(tacheId, newStatus)
    if (!result.success) {
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  // Handle open upload modal
  const handleOpenUploadModal = (documentRequisId = null) => {
    setSelectedDocumentRequisId(documentRequisId)
    setIsUploadModalOpen(true)
  }

  // Handle close upload modal
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setSelectedDocumentRequisId(null)
  }

  // Handle upload document
  const handleUploadDocument = async (documentRequisId, file) => {
    setUploading(true)
    const result = await uploadDocument(documentRequisId, file)
    setUploading(false)
    return result
  }

  // Navbar action handlers - ouvrent les modals sans changer d'onglet
  const handleOpenNoteModal = () => {
    setIsNoteModalOpen(true)
  }

  const handleOpenLivraisonModal = () => {
    setIsLivraisonModalOpen(true)
  }

  const handleOpenPlinthesModal = () => {
    setIsPlinthesModalOpen(true)
  }

  // Note handlers
  const handleSaveNote = async (contenu, photoFiles = []) => {
    const result = await createNote(contenu, photoFiles)
    if (result.success) {
      setIsNoteModalOpen(false)
      setActiveTab('notes') // Basculer sur l'onglet notes après création
      // createNote() recharge déjà les notes automatiquement
      showToast('Note créée avec succès', 'success')
    } else {
      showToast('Erreur lors de la création de la note', 'error')
    }
    return result
  }

  // Livraison handlers
  const handleSaveLivraison = async (nomLivraison, statut, type, extraData) => {
    const result = await createLivraison(nomLivraison, statut, type, extraData)
    if (result.success) {
      setIsLivraisonModalOpen(false)
      setActiveTab('livraison') // Basculer sur l'onglet livraison après création
      showToast('Livraison créée avec succès', 'success')
    } else {
      showToast('Erreur lors de la création de la livraison', 'error')
    }
    return result
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

  // Determine available tabs - always show all tabs including "Tâches"
  const availableTabs = useMemo(() => {
    return [
      { id: 'taches', label: 'Tâches', count: `${tachesStats.terminee}/${tachesStats.total}` },
      { id: 'documents', label: 'Documents', count: `${documentsStats.uploaded}/${documentsStats.total}` },
      { id: 'notes', label: 'Notes', count: notes.length },
      { id: 'livraison', label: 'Livraison' }
    ]
  }, [tachesStats.terminee, tachesStats.total, documentsStats.uploaded, documentsStats.total, notes.length])


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
            {/* Fixed Action Navbar */}
            <StickyPageHeader onBack={handleBack}>
              {/* Left: Appartement name */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{appartement.nom}</h1>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Ajouter une note */}
                <Button
                  variant="primary"
                  onClick={handleOpenNoteModal}
                  className="min-h-[44px]"
                  title="Ajouter une note"
                >
                  <StickyNote className="w-5 h-5" />
                  <span className="hidden md:inline">Ajouter une note</span>
                </Button>

                {/* Nouvelle livraison */}
                <Button
                  variant="primary"
                  onClick={handleOpenLivraisonModal}
                  className="min-h-[44px]"
                  title="Nouvelle livraison"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden md:inline">Nouvelle livraison</span>
                </Button>

                {/* Plinthes */}
                <Button
                  variant="primary"
                  onClick={handleOpenPlinthesModal}
                  className="min-h-[44px]"
                  title="Plinthes"
                >
                  <Ruler className="w-5 h-5" />
                  <span className="hidden md:inline">Plinthes</span>
                </Button>
              </div>
            </StickyPageHeader>

            {/* Tabs */}
            <div className="mb-6">
              <Tabs
                tabs={availableTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
              />
            </div>

            {/* Tab Content */}
            <div>
              {/* Taches Tab */}
              {activeTab === 'taches' && (
                <div>
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

              {tachesLoading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}

              {!tachesLoading && taches.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Aucune tâche pour ce lot</p>
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
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div>
                  {/* Add document button */}
                  <div className="mb-4">
                    <Button
                      onClick={() => handleOpenUploadModal()}
                      className="flex items-center gap-2 min-h-[44px]"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ajouter un document</span>
                    </Button>
                  </div>

                  {documentsLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="md" />
                    </div>
                  )}

                  {!documentsLoading && documentsWithStatus.length === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Aucun document requis pour ce chantier</p>
                    </div>
                  )}

                  {!documentsLoading && documentsWithStatus.length > 0 && (
                    <div className="space-y-3">
                      {documentsWithStatus.map(({ documentRequis, uploadedFiles }) => (
                        <div
                          key={documentRequis.id}
                          className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                          {/* Document name */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-medium text-gray-900">{documentRequis.nom_document}</h3>
                                  {documentRequis.obligatoire && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                      OBLIGATOIRE
                                    </span>
                                  )}
                                </div>
                                {uploadedFiles.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {uploadedFiles.length} fichier{uploadedFiles.length > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Add button - always visible */}
                            <Button
                              size="sm"
                              onClick={() => handleOpenUploadModal(documentRequis.id)}
                              className="flex-shrink-0"
                              title="Ajouter un fichier"
                            >
                              <Plus className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* Uploaded files list */}
                          {uploadedFiles.length > 0 ? (
                            <div className="ml-8">
                              <DocumentFilesList
                                files={uploadedFiles}
                                onFileDeleted={loadDocuments}
                              />
                            </div>
                          ) : (
                            <div className="ml-8">
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-sm text-yellow-800">⚠️ Aucun fichier uploadé</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <AppartementNotesTab
                  appartement={appartement}
                  notes={notes}
                  loading={false}
                  error={null}
                  updateNote={updateNote}
                  deleteNote={deleteNote}
                  addPhotos={addPhotos}
                  deletePhoto={deletePhoto}
                />
              )}

              {/* Livraison Tab */}
              {activeTab === 'livraison' && (
                <AppartementLivraisonTab
                  appartement={appartement}
                  plinthes={plinthes}
                  loading={plinthesLoading}
                  onOpenPlinthesModal={() => setIsPlinthesModalOpen(true)}
                />
              )}
            </div>

            {/* Upload Modal */}
            <AppartementDocumentUploadModal
              isOpen={isUploadModalOpen}
              onClose={handleCloseUploadModal}
              onUpload={handleUploadDocument}
              uploading={uploading}
              documentsRequis={documentsWithStatus.map(d => d.documentRequis)}
              selectedDocumentRequisId={selectedDocumentRequisId}
            />

            {/* Plinthes Modal */}
            <PlinthesModal
              isOpen={isPlinthesModalOpen}
              onClose={() => setIsPlinthesModalOpen(false)}
              plinthes={plinthes}
              onSave={savePlinthes}
              loading={plinthesLoading}
            />

            {/* Note Form Modal */}
            <NoteFormModal
              isOpen={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              onSave={handleSaveNote}
              onDeletePhoto={deletePhoto}
              onAddPhotos={addPhotos}
              initialNote={null}
              appartementNom={appartement.nom}
            />

            {/* Livraison Form Modal */}
            <LivraisonFormModal
              isOpen={isLivraisonModalOpen}
              onClose={() => setIsLivraisonModalOpen(false)}
              livraison={null}
              appartement={appartement}
              onUpdate={updateStatut}
              onUploadPhoto={uploadPhoto}
              onCreate={handleSaveLivraison}
              onSuccess={() => {
                setIsLivraisonModalOpen(false)
                setActiveTab('livraison')
              }}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
