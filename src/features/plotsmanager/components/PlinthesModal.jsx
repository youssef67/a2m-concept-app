/**
 * PlinthesModal.jsx
 * Modal pour gérer les plinthes d'un appartement (multi-pièces)
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import ConfirmModal from '../../../shared/components/ui/ConfirmModal'
import { useToast } from '../../../shared/hooks/useToast'
import { STATUTS_OPTIONS, STATUTS_PLINTHES, PIECES_OPTIONS } from '../utils/plinthesHelpers'
import { Edit2, Trash2, Plus } from 'lucide-react'

export default function PlinthesModal({
  isOpen,
  onClose,
  plinthes, // Array de configurations
  onSave, // onSave(piece, data)
  onDelete, // onDelete(piece)
  loading
}) {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState('list') // 'list' | 'form'
  const [pieceToDelete, setPieceToDelete] = useState(null)
  const [editingPiece, setEditingPiece] = useState(null) // null = création, string = édition

  const [formData, setFormData] = useState({
    piece: '',
    piece_custom: '',
    quantite_ml: '',
    reference: '',
    fournisseur: '',
    statut: STATUTS_PLINTHES.NON_COMMANDE,
    est_commande: false,
    date_commande: '',
    date_livraison_prevue: '',
    date_reception: ''
  })

  // Réinitialiser le mode quand on ouvre/ferme le modal
  useEffect(() => {
    if (isOpen) {
      setMode('list')
      setEditingPiece(null)
    }
  }, [isOpen])

  // Ouvrir le formulaire en mode création
  const handleAddPiece = () => {
    setEditingPiece(null)
    setFormData({
      piece: '',
      piece_custom: '',
      quantite_ml: '',
      reference: '',
      fournisseur: '',
      statut: STATUTS_PLINTHES.NON_COMMANDE,
      est_commande: false,
      date_commande: '',
      date_livraison_prevue: '',
      date_reception: ''
    })
    setMode('form')
  }

  // Ouvrir le formulaire en mode édition
  const handleEditPiece = (plinthesData) => {
    setEditingPiece(plinthesData.piece)
    setFormData({
      piece: PIECES_OPTIONS.some(opt => opt.value === plinthesData.piece) ? plinthesData.piece : 'custom',
      piece_custom: PIECES_OPTIONS.some(opt => opt.value === plinthesData.piece) ? '' : plinthesData.piece,
      quantite_ml: plinthesData.quantite_ml || '',
      reference: plinthesData.reference || '',
      fournisseur: plinthesData.fournisseur || '',
      statut: plinthesData.statut || STATUTS_PLINTHES.NON_COMMANDE,
      est_commande: plinthesData.est_commande || false,
      date_commande: plinthesData.date_commande || '',
      date_livraison_prevue: plinthesData.date_livraison_prevue || '',
      date_reception: plinthesData.date_reception || ''
    })
    setMode('form')
  }

  // Retour à la liste
  const handleCancelForm = () => {
    setMode('list')
    setEditingPiece(null)
  }

  // Gérer le changement de valeur du formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    // Déterminer le nom de la pièce
    const pieceName = formData.piece === 'custom' ? formData.piece_custom.trim() : formData.piece

    if (!pieceName) {
      showToast('Veuillez sélectionner ou saisir un nom de pièce', 'error')
      setIsSaving(false)
      return
    }

    // Vérifier si la pièce existe déjà (seulement en mode création)
    if (!editingPiece && plinthes.some(p => p.piece === pieceName)) {
      showToast('Une configuration existe déjà pour cette pièce', 'error')
      setIsSaving(false)
      return
    }

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

    const result = await onSave(pieceName, dataToSave)
    setIsSaving(false)

    if (result.success) {
      showToast('Plinthes enregistrées avec succès', 'success')
      onClose() // Fermer le modal après sauvegarde
    } else {
      showToast(result.error?.message || 'Erreur lors de la sauvegarde', 'error')
    }
  }

  // Demander confirmation de suppression
  const handleDeleteClick = (piece) => {
    setPieceToDelete(piece)
  }

  // Confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!pieceToDelete) return

    const result = await onDelete(pieceToDelete)
    if (result.success) {
      showToast('Configuration supprimée avec succès', 'success')
    } else {
      showToast(result.error?.message || 'Erreur lors de la suppression', 'error')
    }
    setPieceToDelete(null)
  }

  // Obtenir le statut label
  const getStatutLabel = (statut) => {
    const option = STATUTS_OPTIONS.find(opt => opt.value === statut)
    return option ? option.label : statut
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestion des Plinthes"
        size="lg"
      >
        {/* MODE LISTE */}
        {mode === 'list' && (
          <div className="space-y-4">
            {plinthes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune configuration de plinthes définie</p>
                <p className="text-sm mt-1">Cliquez sur "Ajouter une pièce" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plinthes.map((plinthesData) => (
                  <div
                    key={plinthesData.piece}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900 mb-2">
                          {plinthesData.piece}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Quantité:</span>{' '}
                            <span className="font-medium">
                              {plinthesData.quantite_ml ? `${plinthesData.quantite_ml} ML` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Référence:</span>{' '}
                            <span className="font-medium">{plinthesData.reference || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Fournisseur:</span>{' '}
                            <span className="font-medium">{plinthesData.fournisseur || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Statut:</span>{' '}
                            <span className="font-medium">{getStatutLabel(plinthesData.statut)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditPiece(plinthesData)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(plinthesData.piece)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton ajouter */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="primary"
                onClick={handleAddPiece}
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une pièce
              </Button>
            </div>
          </div>
        )}

        {/* MODE FORMULAIRE */}
        {mode === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sélection de la pièce */}
            <div>
              <label htmlFor="piece" className="block text-sm font-medium text-gray-700 mb-1">
                Pièce *
              </label>
              <select
                id="piece"
                name="piece"
                value={formData.piece}
                onChange={handleInputChange}
                disabled={!!editingPiece}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                required
              >
                <option value="">Sélectionner une pièce</option>
                {PIECES_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Saisie personnalisée si "Autre" */}
            {formData.piece === 'custom' && (
              <Input
                label="Nom de la pièce *"
                name="piece_custom"
                type="text"
                value={formData.piece_custom}
                onChange={handleInputChange}
                placeholder="Ex: Dressing, Bureau..."
                required
              />
            )}

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
                onClick={handleCancelForm}
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
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={!!pieceToDelete}
        onClose={() => setPieceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer cette configuration"
        message={`Êtes-vous sûr de vouloir supprimer la configuration des plinthes pour "${pieceToDelete}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </>
  )
}
