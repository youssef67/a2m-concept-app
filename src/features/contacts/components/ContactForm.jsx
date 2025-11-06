import React from 'react'
import { Plus, X } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import Select from '../../../shared/components/ui/Select'

/**
 * Contact form with all fields
 * Supports both particulier and professionnel types
 */
export default function ContactForm({
  formData,
  setFormData,
  errors,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
  defaultType = 'client'
}) {
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }))
  }

  const handleAddContactPerson = () => {
    setFormData(prev => ({
      ...prev,
      contact_persons: [
        ...prev.contact_persons,
        {
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          position: ''
        }
      ]
    }))
  }

  const handleRemoveContactPerson = (index) => {
    setFormData(prev => ({
      ...prev,
      contact_persons: prev.contact_persons.filter((_, i) => i !== index)
    }))
  }

  const handleContactPersonChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contact_persons: prev.contact_persons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const isProfessionnel = formData.contact_type === 'professionnel'
  const isParticulier = formData.contact_type === 'particulier'
  const isFournisseur = defaultType === 'fournisseur'

  // Handler pour le changement de catégorie
  const handleContactTypeChange = (newContactType) => {
    if (newContactType === 'particulier') {
      // Forcer le type à "client" pour les particuliers
      setFormData(prev => ({
        ...prev,
        contact_type: 'particulier',
        type: 'client'
      }))
    } else {
      handleChange('contact_type', newContactType)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-6"
    >
      {/* Type selection */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de contact *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('type', 'client')}
                disabled={isParticulier || isFournisseur}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  formData.type === 'client'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : isParticulier || isFournisseur
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'fournisseur')}
                disabled={isParticulier}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  formData.type === 'fournisseur'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : isParticulier
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Fournisseur
              </button>
            </div>
            {errors.type && (
              <p className="text-red-600 text-sm mt-1">{errors.type}</p>
            )}
            {isParticulier && (
              <p className="text-xs text-gray-500 mt-1">
                Un particulier est automatiquement défini comme client
              </p>
            )}
            {isFournisseur && (
              <p className="text-xs text-gray-500 mt-1">
                Un fournisseur est automatiquement défini comme professionnel
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleContactTypeChange('particulier')}
                disabled={isFournisseur}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  formData.contact_type === 'particulier'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : isFournisseur
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Particulier
              </button>
              <button
                type="button"
                onClick={() => handleChange('contact_type', 'professionnel')}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                  formData.contact_type === 'professionnel'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Professionnel
              </button>
            </div>
            {errors.contact_type && (
              <p className="text-red-600 text-sm mt-1">{errors.contact_type}</p>
            )}
          </div>
        </div>
      )}

      {/* Main contact info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Informations principales
        </h3>

        {isProfessionnel ? (
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l&apos;entreprise *
            </label>
            <input
              type="text"
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.company_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nom de l&apos;entreprise"
              disabled={isSubmitting}
            />
            {errors.company_name && (
              <p className="text-red-600 text-sm mt-1">{errors.company_name}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Prénom"
                disabled={isSubmitting}
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nom"
                disabled={isSubmitting}
              />
              {errors.last_name && (
                <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="06 12 34 56 78"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          {!isProfessionnel && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="email@exemple.fr"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Adresse</h3>

        <div>
          <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse ligne 1
          </label>
          <input
            type="text"
            id="address_line1"
            value={formData.address.address_line1}
            onChange={(e) => handleAddressChange('address_line1', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Numéro et nom de rue"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse ligne 2
          </label>
          <input
            type="text"
            id="address_line2"
            value={formData.address.address_line2}
            onChange={(e) => handleAddressChange('address_line2', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Complément d'adresse (optionnel)"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <input
              type="text"
              id="postal_code"
              value={formData.address.postal_code}
              onChange={(e) => handleAddressChange('postal_code', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="75001"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              id="city"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Paris"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Pays
            </label>
            <input
              type="text"
              id="country"
              value={formData.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="France"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Payment terms */}
      <div>
        <label htmlFor="delai_paiement" className="block text-sm font-medium text-gray-700 mb-1">
          Délai de paiement
        </label>
        <Select
          value={formData.delai_paiement || 'immediat'}
          onChange={(value) => handleChange('delai_paiement', value)}
          options={[
            { value: 'immediat', label: 'Immédiat' },
            { value: '30_jours', label: '30 jours' },
            { value: '45_jours', label: '45 jours' },
            { value: '60_jours', label: '60 jours' }
          ]}
          disabled={isSubmitting}
          placeholder="Délai de paiement"
        />
      </div>

      {/* Sous-traitant checkbox (for fournisseur only) */}
      {formData.type === 'fournisseur' && (
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="is_sous_traitant"
              checked={formData.is_sous_traitant || false}
              onChange={(e) => handleChange('is_sous_traitant', e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="is_sous_traitant" className="text-sm font-medium text-gray-700">
              Sous-traitant
            </label>
            <p className="text-xs text-gray-500">
              Cochez cette case si ce fournisseur est un sous-traitant
            </p>
          </div>
        </div>
      )}

      {/* Contact persons (for professionnel) */}
      {isProfessionnel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Personnes de contact
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddContactPerson}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une personne
            </Button>
          </div>

          {formData.contact_persons.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Aucune personne de contact. Ajoutez-en une ci-dessus.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.contact_persons.map((person, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Personne {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveContactPerson(index)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={person.first_name}
                        onChange={(e) =>
                          handleContactPersonChange(index, 'first_name', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Prénom"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={person.last_name}
                        onChange={(e) =>
                          handleContactPersonChange(index, 'last_name', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Nom"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={person.phone}
                        onChange={(e) =>
                          handleContactPersonChange(index, 'phone', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="06 12 34 56 78"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={person.email}
                        onChange={(e) =>
                          handleContactPersonChange(index, 'email', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="email@exemple.fr"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poste / Fonction
                    </label>
                    <input
                      type="text"
                      value={person.position}
                      onChange={(e) =>
                        handleContactPersonChange(index, 'position', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Ex: Responsable achats"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Commentaires
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Notes ou commentaires additionnels..."
          disabled={isSubmitting}
        />
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
