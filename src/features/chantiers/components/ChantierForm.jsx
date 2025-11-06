/**
 * ChantierForm Component
 * Form for creating/editing a chantier
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import { getAllContacts } from '../../contacts/services/contactsService'
import { getClientDisplayName } from '../utils/chantierHelpers'
import { validatePDFFile, formatFileSize } from '../services/documentsService'

export default function ChantierForm({ chantier, onChange, errors = {}, onFileChange, selectedFile }) {
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [fileError, setFileError] = useState(null)

  // Initial form data
  const formData = chantier || {
    titre: '',
    description: '',
    statut: 'devis',
    client_ids: [],
    date_debut: '',
    date_fin_prevue: '',
    date_fin_reelle: '',
    budget_estime: '',
    cout_reel: '',
    montant_ht: '',
    montant_ttc: '',
    finalisation_95: false,
    plot_manager_access: false,
    adresse_ligne1: '',
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
   * Auto-fill TTC when montant_ht changes (manual modification still allowed)
   */
  useEffect(() => {
    if (formData.montant_ht) {
      const ht = parseFloat(formData.montant_ht)
      if (!isNaN(ht) && ht > 0) {
        const ttc = ht * 1.20 // TVA 20%
        onChange({ ...formData, montant_ttc: ttc.toFixed(2) })
      } else {
        onChange({ ...formData, montant_ttc: '' })
      }
    } else {
      onChange({ ...formData, montant_ttc: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.montant_ht])

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    onChange({ ...formData, [name]: value })
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate PDF
    const validation = validatePDFFile(file)
    if (!validation.valid) {
      setFileError(validation.error)
      return
    }

    setFileError(null)
    onFileChange?.(file)
  }

  /**
   * Handle file removal
   */
  const handleRemoveFile = () => {
    setFileError(null)
    onFileChange?.(null)
  }

  // Options for Statut select
  const statutOptions = useMemo(() => [
    { value: 'devis', label: 'Devis' },
    { value: 'planifie', label: 'Planifié' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'cloture', label: 'Clôturé' }
  ], [])

  // Options for Client select
  const clientOptions = useMemo(() => {
    // Filter out already selected clients
    const selectedIds = formData.client_ids || []
    const availableClients = clients.filter(c => !selectedIds.includes(c.id))

    return availableClients.map(client => ({
      value: client.id,
      label: getClientDisplayName(client)
    }))
  }, [clients, formData.client_ids])

  // Get selected clients details
  const selectedClients = useMemo(() => {
    const selectedIds = formData.client_ids || []
    return selectedIds
      .map(id => clients.find(c => c.id === id))
      .filter(Boolean)
  }, [formData.client_ids, clients])

  // Handle adding a client
  const handleAddClient = (clientId) => {
    if (!clientId) return
    const currentIds = formData.client_ids || []
    if (!currentIds.includes(clientId)) {
      onChange({ ...formData, client_ids: [...currentIds, clientId] })
    }
  }

  // Handle removing a client
  const handleRemoveClient = (clientId) => {
    const currentIds = formData.client_ids || []
    onChange({ ...formData, client_ids: currentIds.filter(id => id !== clientId) })
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
          <Select
            value={formData.statut}
            onChange={(value) => onChange({ ...formData, statut: value })}
            options={statutOptions}
            placeholder="Sélectionner un statut"
          />
          {errors.statut && <p className="mt-1 text-sm text-red-600">{errors.statut}</p>}
        </div>

        {/* Clients */}
        <div>
          <label htmlFor="client_ids" className="block text-sm font-medium text-gray-700 mb-1">
            Clients * {selectedClients.length > 0 && `(${selectedClients.length} sélectionné${selectedClients.length > 1 ? 's' : ''})`}
          </label>

          {/* Selected clients tags */}
          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedClients.map(client => (
                <div
                  key={client.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-800 rounded-lg text-sm"
                >
                  <span className="font-medium">{getClientDisplayName(client)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClient(client.id)}
                    className="hover:bg-primary-200 rounded p-0.5 transition-colors"
                    title="Retirer ce client"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add client select */}
          <SearchableSelect
            value=""
            onChange={handleAddClient}
            options={clientOptions}
            disabled={loadingClients}
            placeholder={loadingClients ? 'Chargement des clients...' : 'Ajouter un client...'}
            searchPlaceholder="Rechercher un client..."
          />
          {errors.client_ids && <p className="mt-1 text-sm text-red-600">{errors.client_ids}</p>}
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
        <h3 className="text-lg font-semibold text-gray-900">Montants</h3>

        {/* Montants HT et TTC du chantier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Montant HT (€) *"
            type="number"
            name="montant_ht"
            value={formData.montant_ht}
            onChange={handleChange}
            error={errors.montant_ht}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />

          <Input
            label="Montant TTC (€)"
            type="number"
            name="montant_ttc"
            value={formData.montant_ttc}
            onChange={handleChange}
            error={errors.montant_ttc}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Checkbox Finalisation 95% */}
        <div className="flex items-center">
          <input
            id="finalisation_95"
            name="finalisation_95"
            type="checkbox"
            checked={formData.finalisation_95 || false}
            onChange={(e) => onChange({ ...formData, finalisation_95: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <label htmlFor="finalisation_95" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
            Ce chantier a une finalisation à 95% (calculée sur montant HT)
          </label>
        </div>

        {/* Checkbox Accès Plot Manager */}
        <div className="flex items-center">
          <input
            id="plot_manager_access"
            name="plot_manager_access"
            type="checkbox"
            checked={formData.plot_manager_access || false}
            onChange={(e) => onChange({ ...formData, plot_manager_access: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <label htmlFor="plot_manager_access" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
            Accès au module Plot Manager
          </label>
        </div>
      </div>

      {/* Adresse du chantier */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Adresse du chantier</h3>
          <p className="text-sm text-gray-600 mt-1">
            Vous pouvez indiquer une adresse complète, seulement un code postal et une ville, ou laisser vide.
          </p>
        </div>

        <Input
          label="Adresse"
          type="text"
          name="adresse_ligne1"
          value={formData.adresse_ligne1}
          onChange={handleChange}
          error={errors.adresse_ligne1}
          placeholder="Numéro et nom de rue"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Code postal"
            type="text"
            name="code_postal"
            value={formData.code_postal}
            onChange={handleChange}
            error={errors.code_postal}
            placeholder="75001"
          />

          <Input
            label="Ville"
            type="text"
            name="ville"
            value={formData.ville}
            onChange={handleChange}
            error={errors.ville}
            placeholder="Paris"
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

      {/* Document PDF (optionnel) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Document PDF (optionnel)</h3>

        {/* File Input */}
        {!selectedFile && (
          <div>
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-700 font-medium">
                  Cliquez pour ajouter un PDF
                </p>
                <p className="text-xs text-gray-500">
                  ou glissez-déposez le fichier ici
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF uniquement · Maximum 10 MB
                </p>
              </div>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            {fileError && (
              <p className="mt-2 text-sm text-red-600">{fileError}</p>
            )}
          </div>
        )}

        {/* Selected File */}
        {selectedFile && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Retirer le fichier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
