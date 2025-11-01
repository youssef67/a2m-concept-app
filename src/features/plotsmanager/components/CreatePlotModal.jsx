/**
 * CreatePlotModal
 * Modal pour créer un plot (immeuble/structure) lié à un chantier
 */

import React, { useState } from 'react'
import { X } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'

export default function CreatePlotModal({ isOpen, onClose, chantierId, chantierTitre }) {
  const [formData, setFormData] = useState({
    nom: '',
    type: 'immeuble',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Type options for Select component
  const typeOptions = [
    { value: 'immeuble', label: 'Immeuble' },
    { value: 'structure', label: 'Structure' },
    { value: 'batiment', label: 'Bâtiment' },
    { value: 'annexe', label: 'Annexe' },
    { value: 'autre', label: 'Autre' }
  ]

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle select change (custom Select component)
  const handleSelectChange = (value) => {
    setFormData(prev => ({
      ...prev,
      type: value
    }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.nom.trim()) {
      alert('Le nom est obligatoire')
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Implémenter l'appel API pour créer le plot
      console.log('Création plot:', {
        ...formData,
        chantierId,
        chantierTitre
      })

      // Simuler l'enregistrement
      await new Promise(resolve => setTimeout(resolve, 500))

      alert('Plot créé avec succès !')
      handleClose()
    } catch (error) {
      console.error('Erreur création plot:', error)
      alert('Erreur lors de la création du plot')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        nom: '',
        type: 'immeuble',
        description: ''
      })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Créer un plot</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Chantier info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Chantier :</strong> {chantierTitre}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du plot */}
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du plot <span className="text-red-500">*</span>
            </label>
            <Input
              id="nom"
              name="nom"
              type="text"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Immeuble A, Structure principale..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.type}
              onChange={handleSelectChange}
              options={typeOptions}
              placeholder="Sélectionner un type"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Description du plot..."
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
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
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Créer le plot
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
