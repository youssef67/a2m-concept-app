/**
 * ChantierModal Component
 * Modal for creating/editing a chantier
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Alert from '../../../shared/components/ui/Alert'
import ChantierForm from './ChantierForm'
import { validateChantierData, prepareChantierData } from '../utils/chantierHelpers'
import { uploadDocument } from '../services/documentsService'

export default function ChantierModal({ isOpen, onClose, chantier, onSubmit }) {
  const [formData, setFormData] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const isEditMode = !!chantier

  /**
   * Initialize form data when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      if (chantier) {
        // Edit mode: pre-fill with chantier data
        setFormData({
          titre: chantier.titre || '',
          description: chantier.description || '',
          statut: chantier.statut || 'devis',
          client_id: chantier.client_id || '',
          date_debut: chantier.date_debut || '',
          date_fin_prevue: chantier.date_fin_prevue || '',
          date_fin_reelle: chantier.date_fin_reelle || '',
          budget_estime: chantier.budget_estime || '',
          cout_reel: chantier.cout_reel || '',
          adresse_ligne1: chantier.adresse_ligne1 || '',
          adresse_ligne2: chantier.adresse_ligne2 || '',
          ville: chantier.ville || '',
          code_postal: chantier.code_postal || '',
          pays: chantier.pays || 'France',
          notes: chantier.notes || ''
        })
      } else {
        // Create mode: empty form
        setFormData({
          titre: '',
          description: '',
          statut: 'devis',
          client_id: '',
          date_debut: '',
          date_fin_prevue: '',
          date_fin_reelle: '',
          budget_estime: '',
          cout_reel: '',
          adresse_ligne1: '',
          adresse_ligne2: '',
          ville: '',
          code_postal: '',
          pays: 'France',
          notes: ''
        })
      }
      setErrors({})
      setErrorMessage(null)
      setSelectedFile(null)
    }
  }, [isOpen, chantier])

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate
    const validation = validateChantierData(formData)

    if (!validation.valid) {
      setErrors(validation.errors)
      setErrorMessage('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    // Prepare data
    const preparedData = prepareChantierData(formData)

    // Submit
    setLoading(true)
    setErrorMessage(null)

    try {
      // STEP 1: Create chantier
      const result = await onSubmit(preparedData)

      if (!result || !result.success) {
        // Error creating chantier
        setErrorMessage(result?.error?.message || 'Une erreur est survenue lors de l\'enregistrement')
        return
      }

      const createdChantier = result.data

      // STEP 2: Upload PDF if file is selected
      if (selectedFile && createdChantier) {
        const uploadResult = await uploadDocument(createdChantier.id, selectedFile)

        if (uploadResult.error) {
          // PDF upload failed, but chantier is created
          console.warn('PDF upload failed:', uploadResult.error)
          // Show warning but still close modal (Option A)
          alert('Chantier créé avec succès, mais le PDF n\'a pas pu être uploadé. Vous pouvez l\'ajouter depuis les détails du chantier.')
        }
      }

      // Success: close modal
      handleClose()
    } catch (error) {
      console.error('Error submitting chantier:', error)
      setErrorMessage('Une erreur est survenue lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!loading) {
      setFormData(null)
      setErrors({})
      setErrorMessage(null)
      setSelectedFile(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Modifier le chantier' : 'Nouveau chantier'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="error" className="mb-6">
            {errorMessage}
          </Alert>
        )}

        {/* Form */}
        {formData && (
          <ChantierForm
            chantier={formData}
            onChange={setFormData}
            errors={errors}
            onFileChange={setSelectedFile}
            selectedFile={selectedFile}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Annuler
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {isEditMode ? 'Enregistrer' : 'Créer le chantier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
