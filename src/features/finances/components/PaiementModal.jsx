/**
 * PaiementModal - Modal for managing facture payments
 */

import React, { useState } from 'react'
import { CreditCard, Trash2, Edit, X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Spinner from '../../../shared/components/ui/Spinner'
import { usePaiements } from '../hooks/usePaiements'
import { useToast } from '../../../shared/hooks/useToast'
import { formatCurrency, formatDate } from '../utils/factureHelpers'

export default function PaiementModal({ isOpen, onClose, facture, onPaiementChange }) {
  const { showToast } = useToast()
  const { paiements, loading, montantPaye, montantRestant, createPaiement, updatePaiement, deletePaiement } = usePaiements(
    facture?.id,
    facture?.montant
  )

  const [showForm, setShowForm] = useState(false)
  const [typePaiement, setTypePaiement] = useState('total') // 'total' or 'partiel'
  const [editingPaiement, setEditingPaiement] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0])
  const [montantPartiel, setMontantPartiel] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  /**
   * Handle form submit (create or update paiement)
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Si paiement total, utiliser montantRestant automatiquement
    const montant = typePaiement === 'total' && !editingPaiement
      ? montantRestant
      : parseFloat(montantPartiel)

    // Validation
    if (!montant || montant <= 0) {
      showToast('Le montant doit être supérieur à 0', 'error')
      return
    }

    if (typePaiement === 'partiel' && montant > montantRestant) {
      showToast(`Le montant ne peut pas dépasser ${formatCurrency(montantRestant)}`, 'error')
      return
    }

    if (!datePaiement) {
      showToast('La date de paiement est obligatoire', 'error')
      return
    }

    if (new Date(datePaiement) > new Date()) {
      showToast('La date de paiement ne peut pas être dans le futur', 'error')
      return
    }

    const paiementData = {
      montant,
      date_paiement: datePaiement,
      reference: reference.trim() || null,
      notes: notes.trim() || null
    }

    let result
    if (editingPaiement) {
      result = await updatePaiement(editingPaiement.id, paiementData)
    } else {
      result = await createPaiement(paiementData)
    }

    if (result.success) {
      showToast(
        editingPaiement ? 'Paiement modifié avec succès' : 'Paiement enregistré avec succès',
        'success'
      )
      setShowForm(false)
      setEditingPaiement(null)
      setTypePaiement('total')
      setDatePaiement(new Date().toISOString().split('T')[0])
      setMontantPartiel('')
      setReference('')
      setNotes('')

      // Notify parent to refresh factures list
      if (onPaiementChange) {
        onPaiementChange()
      }
    } else {
      showToast(result.error || 'Erreur lors de l\'enregistrement', 'error')
    }
  }

  /**
   * Handle delete paiement
   */
  const handleDelete = async (paiement) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return

    const result = await deletePaiement(paiement.id)

    if (result.success) {
      showToast('Paiement supprimé avec succès', 'success')

      // Notify parent to refresh factures list
      if (onPaiementChange) {
        onPaiementChange()
      }
    } else {
      showToast(result.error || 'Erreur lors de la suppression', 'error')
    }
  }

  /**
   * Handle edit paiement
   */
  const handleEdit = (paiement) => {
    setEditingPaiement(paiement)
    setTypePaiement('partiel') // Always use partiel for editing
    setDatePaiement(paiement.date_paiement)
    setMontantPartiel(paiement.montant.toString())
    setReference(paiement.reference || '')
    setNotes(paiement.notes || '')
    setFormKey(prev => prev + 1)
    setShowForm(true)
  }

  /**
   * Cancel form
   */
  const handleCancelForm = () => {
    setShowForm(false)
    setEditingPaiement(null)
    setTypePaiement('total')
    setDatePaiement(new Date().toISOString().split('T')[0])
    setMontantPartiel('')
    setReference('')
    setNotes('')
  }

  /**
   * Calculate progress percentage
   */
  const progressPercentage = facture?.montant > 0
    ? Math.min((montantPaye / facture.montant) * 100, 100)
    : 0

  if (!facture) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Paiement - ${facture.numero_facture}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Summary Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            État du paiement
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Montant total :</span>
              <span className="font-semibold text-gray-900">{formatCurrency(facture.montant)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Montant payé :</span>
              <span className="font-semibold text-green-600">{formatCurrency(montantPaye)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Reste à payer :</span>
              <span className="font-semibold text-orange-600">{formatCurrency(montantRestant)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progression</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add Payment Button */}
        {!showForm && montantRestant > 0 && (
          <Button
            onClick={() => {
              setDatePaiement(new Date().toISOString().split('T')[0])
              setFormKey(prev => prev + 1)
              setShowForm(true)
            }}
            className="w-full"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Ajouter un paiement
          </Button>
        )}

        {/* Payment Form */}
        {showForm && (
          <form
            key={`paiement-form-${formKey}`}
            onSubmit={handleSubmit}
            className="border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">
                {editingPaiement ? 'Modifier le paiement' : 'Nouveau paiement'}
              </h4>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type de paiement - Only show if not editing */}
            {!editingPaiement && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de paiement
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type_paiement"
                      value="total"
                      checked={typePaiement === 'total'}
                      onChange={(e) => setTypePaiement(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Paiement total</span>
                      <span className="text-sm text-gray-600 ml-2">({formatCurrency(montantRestant)})</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="type_paiement"
                      value="partiel"
                      checked={typePaiement === 'partiel'}
                      onChange={(e) => setTypePaiement(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-900">Paiement partiel</span>
                  </label>
                </div>
              </div>
            )}

            {/* Montant - Only show input for partiel or editing */}
            {(typePaiement === 'partiel' || editingPaiement) ? (
              <Input
                label={`Montant * ${typePaiement === 'partiel' ? `(max ${formatCurrency(montantRestant)})` : ''}`}
                name="montant"
                type="number"
                step="0.01"
                min="0.01"
                max={typePaiement === 'partiel' ? montantRestant : undefined}
                required
                value={montantPartiel}
                onChange={(e) => setMontantPartiel(e.target.value)}
                placeholder="0.00"
              />
            ) : (
              /* Afficher juste l'info pour paiement total */
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant du paiement
                </label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(montantRestant)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Le montant restant sera payé en totalité
                </p>
              </div>
            )}

            {/* Date paiement */}
            <div>
              <Input
                label="Date de paiement *"
                name="date_paiement"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
              />
              {!editingPaiement && (
                <p className="text-xs text-gray-500 mt-1">
                  Date du jour pré-remplie automatiquement
                </p>
              )}
            </div>

            {/* Référence */}
            <Input
              label="Référence (optionnel)"
              name="reference"
              type="text"
              placeholder="Ex: Référence virement"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                name="notes"
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Notes additionnelles..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelForm}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingPaiement ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        )}

        {/* Historique des paiements */}
        {paiements.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Historique des paiements ({paiements.length})
            </h4>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {!loading && (
              <div className="space-y-3">
                {paiements.map((paiement) => (
                  <div
                    key={paiement.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrency(paiement.montant)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(paiement.date_paiement)}
                        </span>
                      </div>
                      {paiement.reference && (
                        <p className="text-sm text-gray-600 mt-1">
                          Réf: {paiement.reference}
                        </p>
                      )}
                      {paiement.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {paiement.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(paiement)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(paiement)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
