/**
 * DocumentsModal
 * Modal pour gérer la liste des documents requis d'un chantier
 */

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, FileText } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'

export default function DocumentsModal({
  isOpen,
  onClose,
  chantierTitre,
  initialDocuments = [],
  onSave
}) {
  const [documents, setDocuments] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Initialize documents when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDocuments && initialDocuments.length > 0) {
        // Edit mode: load existing documents
        setDocuments(
          initialDocuments.map((doc) => ({
            nom_document: doc.nom_document
          }))
        )
      } else {
        // Create mode: start with 1 empty document
        setDocuments([{ nom_document: '' }])
      }
      setErrorMessage('')
    }
  }, [isOpen, initialDocuments])

  // Handle nom_document change for a specific document
  const handleNomChange = (index, value) => {
    const newDocuments = [...documents]
    newDocuments[index].nom_document = value
    setDocuments(newDocuments)
    setErrorMessage('')
  }

  // Add a new document
  const handleAddDocument = () => {
    setDocuments([...documents, { nom_document: '' }])
  }

  // Remove a document
  const handleRemoveDocument = (index) => {
    const newDocuments = documents.filter((_, i) => i !== index)
    setDocuments(newDocuments)
    setErrorMessage('')
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    // Filter out empty documents
    const validDocuments = documents.filter(
      (doc) => doc.nom_document && doc.nom_document.trim().length > 0
    )

    // Allow empty list (user can remove all documents)
    setIsSubmitting(true)

    const result = await onSave(validDocuments)

    setIsSubmitting(false)

    if (result && result.success) {
      handleClose()
    } else {
      setErrorMessage(
        result?.error?.message || 'Erreur lors de la sauvegarde des documents'
      )
    }
  }

  // Handle close
  const handleClose = () => {
    setDocuments([])
    setErrorMessage('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Documents requis - ${chantierTitre}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Définissez la liste des noms de documents requis pour ce chantier.
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Documents list */}
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Icon */}
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />

              {/* Document name input */}
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Nom du document (ex: Plan de masse)"
                  value={doc.nom_document}
                  onChange={(e) => handleNomChange(index, e.target.value)}
                  required={false}
                  className="w-full"
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveDocument(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                title="Supprimer ce document"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add document button */}
        <Button
          type="button"
          onClick={handleAddDocument}
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un document</span>
        </Button>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
