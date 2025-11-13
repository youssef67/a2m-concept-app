/**
 * LivraisonFormModal.jsx
 * Modal pour mettre à jour le statut de livraison avec champs conditionnels
 */

import React, { useState, useEffect } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Select from '../../../shared/components/ui/Select'
import Input from '../../../shared/components/ui/Input'
import CameraCapture from './CameraCapture'
import { useToast } from '../../../shared/hooks/useToast'
import {
  STATUTS_OPTIONS,
  STATUTS_LIVRAISON,
  validateStatutForm
} from '../utils/livraisonHelpers'

export default function LivraisonFormModal({
  isOpen,
  onClose,
  livraison,
  appartement,
  onUpdate,
  onUploadPhoto,
  // eslint-disable-next-line no-unused-vars
  onDeletePhoto,
  onSuccess
}) {
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    statut: STATUTS_LIVRAISON.NON_COMMANDE,
    date_commande: '',
    fournisseur: '',
    numero_commande: '',
    date_livraison_prevue: '',
    date_reception: '',
    note_incomplete: ''
  })

  const [newPhotoFiles, setNewPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (isOpen && livraison) {
      setFormData({
        statut: livraison.statut || STATUTS_LIVRAISON.NON_COMMANDE,
        date_commande: livraison.date_commande || '',
        fournisseur: livraison.fournisseur || '',
        numero_commande: livraison.numero_commande || '',
        date_livraison_prevue: livraison.date_livraison_prevue || '',
        date_reception: livraison.date_reception || '',
        note_incomplete: livraison.note_incomplete || ''
      })

      setNewPhotoFiles([])
      setPhotoPreviews([])
      setValidationErrors({})
    }
  }, [isOpen, livraison])

  // Charger les photos existantes si commande incomplète
  useEffect(() => {
    if (isOpen && livraison && livraison.statut === STATUTS_LIVRAISON.COMMANDE_INCOMPLETE) {
      loadExistingPhotos()
    }
  }, [isOpen, livraison])

  const loadExistingPhotos = async () => {
    // Cette fonctionnalité sera implémentée si nécessaire
    // Pour l'instant, les photos existantes seront gérées via le hook
  }

  // Gérer changement de statut
  const handleStatutChange = (value) => {
    setFormData(prev => ({ ...prev, statut: value }))
    setValidationErrors({})
  }

  // Gérer changement de champ
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Gérer sélection fichier photo
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Ajouter aux fichiers existants
    const newFiles = [...newPhotoFiles, ...files]
    setNewPhotoFiles(newFiles)

    // Créer previews
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, { file, url: reader.result }])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

  // Gérer suppression photo (nouveau)
  const handleRemoveNewPhoto = (index) => {
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Gérer capture caméra
  const handleCameraCapture = (file) => {
    setNewPhotoFiles(prev => [...prev, file])

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreviews(prev => [...prev, { file, url: reader.result }])
    }
    reader.readAsDataURL(file)
  }

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    const validation = validateStatutForm(formData.statut, formData)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      showToast('Veuillez remplir tous les champs obligatoires', 'error')
      return
    }

    setIsSubmitting(true)
    setValidationErrors({})

    try {
      // Préparer les données de mise à jour
      const updateData = {
        statut: formData.statut
      }

      // Ne mettre à jour que les champs qui ont une valeur (persister les données)
      if (formData.date_commande) {
        updateData.date_commande = formData.date_commande
      }
      if (formData.fournisseur) {
        updateData.fournisseur = formData.fournisseur
      }
      if (formData.numero_commande) {
        updateData.numero_commande = formData.numero_commande
      }
      if (formData.date_livraison_prevue) {
        updateData.date_livraison_prevue = formData.date_livraison_prevue
      }
      if (formData.date_reception) {
        updateData.date_reception = formData.date_reception
      }
      if (formData.note_incomplete) {
        updateData.note_incomplete = formData.note_incomplete
      }

      // Mettre à jour le statut
      const result = await onUpdate(updateData)

      if (!result.success) {
        showToast(result.error?.message || 'Erreur lors de la mise à jour du statut', 'error')
        setIsSubmitting(false)
        return
      }

      // Upload des photos si commande incomplète
      if (formData.statut === STATUTS_LIVRAISON.COMMANDE_INCOMPLETE && newPhotoFiles.length > 0) {
        let uploadErrors = 0

        for (const file of newPhotoFiles) {
          const uploadResult = await onUploadPhoto(file)
          if (!uploadResult.success) {
            uploadErrors++
          }
        }

        if (uploadErrors > 0) {
          showToast(
            `Statut mis à jour. ${uploadErrors} photo(s) n'ont pas pu être uploadées`,
            'warning'
          )
        } else {
          showToast('Statut mis à jour avec succès', 'success')
        }
      } else {
        showToast('Statut mis à jour avec succès', 'success')
      }

      // Appeler onSuccess pour fermer et rafraîchir
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('[LivraisonFormModal] Submit error:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fermer le modal
  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Mettre à jour la livraison"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Info appartement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Lot :</strong> {appartement.nom}
            </p>
          </div>

          {/* Sélection statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.statut}
              onChange={handleStatutChange}
              options={STATUTS_OPTIONS}
              disabled={isSubmitting}
            />
          </div>

          {/* Informations de commande - Toujours visible */}
          <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Informations de commande</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de commande
                {formData.statut === STATUTS_LIVRAISON.COMMANDE_EFFECTUEE && (
                  <span className="text-red-500"> *</span>
                )}
              </label>
              <Input
                type="date"
                value={formData.date_commande}
                onChange={(e) => handleFieldChange('date_commande', e.target.value)}
                disabled={isSubmitting}
              />
              {validationErrors.date_commande && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.date_commande}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fournisseur
              </label>
              <Input
                type="text"
                value={formData.fournisseur}
                onChange={(e) => handleFieldChange('fournisseur', e.target.value)}
                placeholder="Ex: ABC Matériaux"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de commande
              </label>
              <Input
                type="text"
                value={formData.numero_commande}
                onChange={(e) => handleFieldChange('numero_commande', e.target.value)}
                placeholder="Ex: CMD-12345"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Champs conditionnels selon statut */}

          {/* EN COURS DE LIVRAISON */}
          {formData.statut === STATUTS_LIVRAISON.EN_COURS_LIVRAISON && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de livraison prévue <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date_livraison_prevue}
                  onChange={(e) => handleFieldChange('date_livraison_prevue', e.target.value)}
                  disabled={isSubmitting}
                />
                {validationErrors.date_livraison_prevue && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.date_livraison_prevue}</p>
                )}
              </div>
            </div>
          )}

          {/* COMMANDE SUR SITE */}
          {formData.statut === STATUTS_LIVRAISON.COMMANDE_SUR_SITE && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de réception <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date_reception}
                  onChange={(e) => handleFieldChange('date_reception', e.target.value)}
                  disabled={isSubmitting}
                />
                {validationErrors.date_reception && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.date_reception}</p>
                )}
              </div>
            </div>
          )}

          {/* COMMANDE INCOMPLÈTE */}
          {formData.statut === STATUTS_LIVRAISON.COMMANDE_INCOMPLETE && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de réception <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date_reception}
                  onChange={(e) => handleFieldChange('date_reception', e.target.value)}
                  disabled={isSubmitting}
                />
                {validationErrors.date_reception && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.date_reception}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.note_incomplete}
                  onChange={(e) => handleFieldChange('note_incomplete', e.target.value)}
                  placeholder="Décrivez ce qui manque..."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {validationErrors.note_incomplete && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.note_incomplete}</p>
                )}
              </div>

              {/* Upload photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos - {photoPreviews.length} photo{photoPreviews.length > 1 ? 's' : ''}
                </label>

                {/* Boutons upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors min-h-[56px] disabled:opacity-50"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-sm font-medium">Prendre une photo</span>
                  </button>

                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 hover:border-primary-600 hover:bg-gray-50 text-gray-700 rounded-lg cursor-pointer transition-colors min-h-[56px]">
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-sm font-medium">Galerie</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                    multiple
                  />
                </div>

                {/* Previews photos */}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {photoPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg overflow-hidden border-2 border-green-500"
                      >
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewPhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                          title="Supprimer"
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  Formats: JPEG, PNG, WebP (max 10 MB par photo)
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  )
}
