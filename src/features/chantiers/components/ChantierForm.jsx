/**
 * ChantierForm Component
 * Form for creating/editing a chantier
 */

import React, { useState, useEffect } from 'react'
import Input from '../../../shared/components/ui/Input'
import { getAllContacts } from '../../contacts/services/contactsService'
import { getClientDisplayName } from '../utils/chantierHelpers'

export default function ChantierForm({ chantier, onChange, errors = {} }) {
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)

  // Initial form data
  const formData = chantier || {
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
  }

  /**
   * Load clients (type='client' only)
   */
  useEffect(() => {
    async function loadClients() {
      setLoadingClients(true)
      const { data, error } = await getAllContacts('client')

      if (!error && data) {
        setClients(data)
      }

      setLoadingClients(false)
    }

    loadClients()
  }, [])

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    onChange({ ...formData, [name]: value })
  }

  return (
    <div className="space-y-6">
      {/* Informations principales */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Informations principales</h3>

        {/* Titre */}
        <Input
          label="Titre du chantier *"
          type="text"
          name="titre"
          value={formData.titre}
          onChange={handleChange}
          error={errors.titre}
          placeholder="Ex: Rénovation appartement"
          required
        />

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Décrivez le chantier..."
          />
        </div>

        {/* Statut */}
        <div>
          <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
            Statut *
          </label>
          <select
            id="statut"
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="devis">Devis</option>
            <option value="planifie">Planifié</option>
            <option value="en_cours">En cours</option>
          </select>
          {errors.statut && <p className="mt-1 text-sm text-red-600">{errors.statut}</p>}
        </div>

        {/* Client */}
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
            Client *
          </label>
          <select
            id="client_id"
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            disabled={loadingClients}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
            required
          >
            <option value="">
              {loadingClients ? 'Chargement des clients...' : 'Sélectionner un client'}
            </option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {getClientDisplayName(client)}
              </option>
            ))}
          </select>
          {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de début"
            type="date"
            name="date_debut"
            value={formData.date_debut}
            onChange={handleChange}
          />

          <Input
            label="Date de fin prévue"
            type="date"
            name="date_fin_prevue"
            value={formData.date_fin_prevue}
            onChange={handleChange}
            error={errors.date_fin_prevue}
          />
        </div>

        {formData.statut === 'en_cours' && (
          <Input
            label="Date de fin réelle"
            type="date"
            name="date_fin_reelle"
            value={formData.date_fin_reelle}
            onChange={handleChange}
          />
        )}
      </div>

      {/* Financier */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget</h3>

        <Input
          label="Budget (€)"
          type="number"
          name="budget_estime"
          value={formData.budget_estime}
          onChange={handleChange}
          error={errors.budget_estime}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>

      {/* Adresse du chantier */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Adresse du chantier</h3>

        <Input
          label="Adresse (ligne 1) *"
          type="text"
          name="adresse_ligne1"
          value={formData.adresse_ligne1}
          onChange={handleChange}
          error={errors.adresse_ligne1}
          placeholder="Numéro et nom de rue"
          required
        />

        <Input
          label="Adresse (ligne 2)"
          type="text"
          name="adresse_ligne2"
          value={formData.adresse_ligne2}
          onChange={handleChange}
          placeholder="Complément d'adresse"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Code postal *"
            type="text"
            name="code_postal"
            value={formData.code_postal}
            onChange={handleChange}
            error={errors.code_postal}
            placeholder="75001"
            required
          />

          <Input
            label="Ville *"
            type="text"
            name="ville"
            value={formData.ville}
            onChange={handleChange}
            error={errors.ville}
            placeholder="Paris"
            required
          />
        </div>

        <Input
          label="Pays"
          type="text"
          name="pays"
          value={formData.pays}
          onChange={handleChange}
          placeholder="France"
        />
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes additionnelles
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Informations complémentaires..."
          />
        </div>
      </div>
    </div>
  )
}
