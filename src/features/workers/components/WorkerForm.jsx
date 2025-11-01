/**
 * WorkerForm
 * Formulaire de saisie pour créer/modifier un worker
 */

import React from 'react'
import { formatPhoneNumber } from '../utils/workerHelpers'

export default function WorkerForm({ formData, onChange, errors }) {
  const handlePhoneChange = (e) => {
    const value = e.target.value
    // Permettre seulement les chiffres et espaces
    const cleaned = value.replace(/[^\d\s]/g, '')
    onChange({ ...formData, phone: cleaned })
  }

  const handlePhoneBlur = (e) => {
    // Formater le téléphone au blur
    const formatted = formatPhoneNumber(formData.phone)
    onChange({ ...formData, phone: formatted })
  }

  return (
    <div className="space-y-4">
      {/* Prénom */}
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
          Prénom <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name || ''}
          onChange={(e) => onChange({ ...formData, first_name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] text-base ${
            errors?.first_name
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="Ex: Jean"
          required
        />
        {errors?.first_name && (
          <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
        )}
      </div>

      {/* Nom */}
      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name || ''}
          onChange={(e) => onChange({ ...formData, last_name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] text-base ${
            errors?.last_name
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="Ex: Dupont"
          required
        />
        {errors?.last_name && (
          <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone || ''}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] text-base ${
            errors?.phone
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
          }`}
          placeholder="Ex: 06 12 34 56 78"
          required
        />
        {errors?.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Format: 10 chiffres</p>
      </div>
    </div>
  )
}
