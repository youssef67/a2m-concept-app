/**
 * PlinthesModal.jsx
 * Modal pour gérer les plinthes d'un appartement
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import { useToast } from '../../../shared/hooks/useToast'
import { STATUTS_OPTIONS, STATUTS_PLINTHES } from '../utils/plinthesHelpers'

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
    statut: STATUTS_PLINTHES.NON_COMMANDE,
    est_commande: false,
    date_commande: '',
    date_livraison_prevue: '',
    date_reception: ''
  })

  // Initialiser le formulaire avec les données existantes
  useEffect(() => {
    if (isOpen) {
      if (plinthes) {
        setFormData({
          quantite_ml: plinthes.quantite_ml || '',
          reference: plinthes.reference || '',
          fournisseur: plinthes.fournisseur || '',
          statut: plinthes.statut || STATUTS_PLINTHES.NON_COMMANDE,
          est_commande: plinthes.est_commande || false,
          date_commande: plinthes.date_commande || '',
          date_livraison_prevue: plinthes.date_livraison_prevue || '',
          date_reception: plinthes.date_reception || ''
        })
      } else {
        // Réinitialiser si pas de données
        setFormData({
          quantite_ml: '',
          reference: '',
          fournisseur: '',
          statut: STATUTS_PLINTHES.NON_COMMANDE,
          est_commande: false,
          date_commande: '',
          date_livraison_prevue: '',
          date_reception: ''
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
      statut: formData.statut,
      est_commande: formData.est_commande,
      date_commande: formData.date_commande || null,
      date_livraison_prevue: formData.date_livraison_prevue || null,
      date_reception: formData.date_reception || null
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

        {/* Statut */}
        <div>
          <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
            Statut de la commande
          </label>
          <select
            id="statut"
            name="statut"
            value={formData.statut}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {STATUTS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Référence et fournisseur (si commandé) */}
        {formData.statut !== STATUTS_PLINTHES.NON_COMMANDE && (
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

        {/* Date livraison prévue (si en cours de livraison) */}
        {formData.statut === STATUTS_PLINTHES.EN_COURS_LIVRAISON && (
          <Input
            label="Date de livraison prévue"
            name="date_livraison_prevue"
            type="date"
            value={formData.date_livraison_prevue}
            onChange={handleInputChange}
          />
        )}

        {/* Date réception (si sur site) */}
        {formData.statut === STATUTS_PLINTHES.SUR_SITE && (
          <Input
            label="Date de réception"
            name="date_reception"
            type="date"
            value={formData.date_reception}
            onChange={handleInputChange}
          />
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
