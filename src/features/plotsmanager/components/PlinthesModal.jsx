/**
 * PlinthesModal.jsx
 * Modal pour gérer les plinthes d'un appartement
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import { useToast } from '../../../shared/hooks/useToast'

export default function PlinthesModal({
  isOpen,
  onClose,
  plinthes,
  onSave,
  loading
}) {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    quantite_ml: '',
    reference: '',
    fournisseur: '',
    est_commande: false,
    date_commande: ''
  })

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (isOpen) {
      if (plinthes) {
        setFormData({
          quantite_ml: plinthes.quantite_ml || '',
          reference: plinthes.reference || '',
          fournisseur: plinthes.fournisseur || '',
          est_commande: plinthes.est_commande || false,
          date_commande: plinthes.date_commande || ''
        })
      } else {
        // Réinitialiser si pas de données
        setFormData({
          quantite_ml: '',
          reference: '',
          fournisseur: '',
          est_commande: false,
          date_commande: ''
        })
      }
    }
  }, [isOpen, plinthes])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    // Préparer les données
    const dataToSave = {
      quantite_ml: formData.quantite_ml ? parseFloat(formData.quantite_ml) : null,
      reference: formData.reference || null,
      fournisseur: formData.fournisseur || null,
      est_commande: formData.est_commande,
      date_commande: formData.date_commande || null
    }

    const result = await onSave(dataToSave)
    setIsSaving(false)

    if (result.success) {
      showToast('Plinthes enregistrées avec succès', 'success')
      onClose()
    } else {
      showToast(result.error?.message || 'Erreur lors de la sauvegarde', 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion des Plinthes"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantité en ML */}
        <Input
          label="Quantité (mètres linéaires)"
          name="quantite_ml"
          type="number"
          step="0.01"
          min="0"
          value={formData.quantite_ml}
          onChange={handleInputChange}
          placeholder="Ex: 25.50"
        />

        {/* Checkbox Commandé */}
        <div className="flex items-center gap-3">
          <input
            id="est_commande"
            name="est_commande"
            type="checkbox"
            checked={formData.est_commande}
            onChange={handleInputChange}
            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="est_commande" className="text-sm font-medium text-gray-700">
            Commandé
          </label>
        </div>

        {/* Référence, fournisseur et date commande (si commandé) */}
        {formData.est_commande && (
          <>
            <Input
              label="Référence"
              name="reference"
              type="text"
              value={formData.reference}
              onChange={handleInputChange}
              placeholder="Ex: REF-PLINTHE-001"
            />

            <Input
              label="Fournisseur"
              name="fournisseur"
              type="text"
              value={formData.fournisseur}
              onChange={handleInputChange}
              placeholder="Ex: Leroy Merlin, Brico Dépôt..."
            />

            <Input
              label="Date de commande"
              name="date_commande"
              type="date"
              value={formData.date_commande}
              onChange={handleInputChange}
            />
          </>
        )}

        {/* Boutons actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving || loading}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || loading}
            loading={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
