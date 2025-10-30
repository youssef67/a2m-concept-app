/**
 * FacturesPage - Main finances page with tabs
 * MVP version with simplified UI
 */

import React, { useState, useMemo } from 'react'
import { Euro, Plus, Search, FileText, Calendar, User } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'
import Tabs from '../../../shared/components/ui/Tabs'
import Spinner from '../../../shared/components/ui/Spinner'
import Alert from '../../../shared/components/ui/Alert'
import Modal from '../../../shared/components/ui/Modal'
import Input from '../../../shared/components/ui/Input'
import { useFactures } from '../hooks/useFactures'
import { useContacts } from '../hooks/useContacts'
import { useToast } from '../../../shared/hooks/useToast'
import {
  formatDate,
  formatCurrency,
  getStatutLabel,
  getStatutColor,
  getContactDisplayName,
  searchFactures,
  validateFactureData
} from '../utils/factureHelpers'

export default function FacturesPage() {
  // State
  const [activeTab, setActiveTab] = useState('client')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFacture, setEditingFacture] = useState(null)

  // Hooks
  const { factures, loading, error, createFacture, updateFacture, deleteFacture } = useFactures()
  const { contacts } = useContacts()
  const { showToast } = useToast()

  // Tabs configuration with counts
  const tabs = useMemo(() => {
    return [
      {
        id: 'client',
        label: 'Clients',
        count: factures.filter(f => f.type === 'client').length
      },
      {
        id: 'fournisseur',
        label: 'Fournisseurs',
        count: factures.filter(f => f.type === 'fournisseur').length
      }
    ]
  }, [factures])

  // Filter and search factures
  const filteredFactures = useMemo(() => {
    const typeFiltered = factures.filter(facture => facture.type === activeTab)
    return searchFactures(typeFiltered, searchQuery)
  }, [factures, activeTab, searchQuery])

  /**
   * Handle create/edit facture
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const data = {
      type: formData.get('type'),
      contact_id: formData.get('contact_id'),
      montant: parseFloat(formData.get('montant')),
      date_emission: formData.get('date_emission'),
      date_echeance: formData.get('date_echeance'),
      statut: formData.get('statut') || 'en_attente',
      notes: formData.get('notes') || null
    }

    // Validation
    const errors = validateFactureData(data)
    if (Object.keys(errors).length > 0) {
      showToast(Object.values(errors)[0], 'error')
      return
    }

    let result
    if (editingFacture) {
      result = await updateFacture(editingFacture.id, data)
    } else {
      result = await createFacture(data)
    }

    if (result.success) {
      showToast(
        editingFacture ? 'Facture modifiée avec succès' : 'Facture créée avec succès',
        'success'
      )
      setIsModalOpen(false)
      setEditingFacture(null)
    } else {
      showToast('Erreur lors de l\'enregistrement', 'error')
    }
  }

  /**
   * Handle delete facture
   */
  const handleDelete = async (factureId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    const result = await deleteFacture(factureId)

    if (result.success) {
      showToast('Facture supprimée avec succès', 'success')
    } else {
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  /**
   * Open modal for editing
   */
  const handleEdit = (facture) => {
    setEditingFacture(facture)
    setIsModalOpen(true)
  }

  /**
   * Open modal for creation
   */
  const handleCreate = () => {
    setEditingFacture(null)
    setIsModalOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Euro className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Finances</h1>
          </div>

          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="ml-2">Nouvelle facture</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          />
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="error">
            Une erreur est survenue lors du chargement des factures.
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredFactures.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery
                ? 'Aucune facture trouvée'
                : `Aucune facture ${activeTab === 'client' ? 'client' : 'fournisseur'}`}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre première facture'}
            </p>
          </div>
        )}

        {/* Factures List */}
        {!loading && !error && filteredFactures.length > 0 && (
          <div className="space-y-4">
            {filteredFactures.map(facture => (
              <div
                key={facture.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left: Main info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {facture.numero_facture}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User className="w-4 h-4" />
                          <span>{getContactDisplayName(facture.contact)}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatutColor(facture.statut)}`}>
                        {getStatutLabel(facture.statut)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Émission: {formatDate(facture.date_emission)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Échéance: {formatDate(facture.date_echeance)}</span>
                      </div>
                    </div>

                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(facture.montant)}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(facture)}
                      className="flex-1 md:flex-none"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(facture.id)}
                      className="flex-1 md:flex-none text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create/Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingFacture(null)
          }}
          title={editingFacture ? 'Modifier la facture' : 'Nouvelle facture'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                required
                defaultValue={editingFacture?.type || activeTab}
                disabled={!!editingFacture}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="client">Client</option>
                <option value="fournisseur">Fournisseur</option>
              </select>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeTab === 'client' ? 'Client' : 'Fournisseur'} *
              </label>
              <select
                name="contact_id"
                required
                defaultValue={editingFacture?.contact_id || ''}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {contacts
                  .filter(c => c.type === (editingFacture?.type || activeTab))
                  .map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {getContactDisplayName(contact)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Montant */}
            <Input
              label="Montant (EUR) *"
              name="montant"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={editingFacture?.montant || ''}
              placeholder="1000.00"
            />

            {/* Date émission */}
            <Input
              label="Date d'émission *"
              name="date_emission"
              type="date"
              required
              defaultValue={editingFacture?.date_emission || ''}
            />

            {/* Date échéance */}
            <Input
              label="Date d'échéance *"
              name="date_echeance"
              type="date"
              required
              defaultValue={editingFacture?.date_echeance || ''}
            />

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                name="statut"
                defaultValue={editingFacture?.statut || 'en_attente'}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en_attente">En attente</option>
                <option value="payee">Payée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                defaultValue={editingFacture?.notes || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Notes additionnelles..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingFacture(null)
                }}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingFacture ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  )
}
