/**
 * WorkerModal
 * Modal pour créer ou modifier un worker
 */

import React, { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import WorkerForm from './WorkerForm'
import { isValidPhoneNumber, prepareWorkerData } from '../utils/workerHelpers'

export default function WorkerModal({ isOpen, onClose, onSubmit, worker, isSubmitting }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})

  // Initialiser le formulaire avec les données du worker (mode édition)
  useEffect(() => {
    if (worker) {
      setFormData({
        first_name: worker.first_name || '',
        last_name: worker.last_name || '',
        phone: worker.phone || ''
      })
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: ''
      })
    }
    setErrors({})
  }, [worker, isOpen])

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {}

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Le prénom est obligatoire'
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Le nom est obligatoire'
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Le téléphone est obligatoire'
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Le téléphone doit contenir 10 chiffres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const cleanedData = prepareWorkerData(formData)
    onSubmit(cleanedData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={worker ? 'Modifier le travailleur' : 'Ajouter un travailleur'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <WorkerForm
          formData={formData}
          onChange={setFormData}
          errors={errors}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 min-h-[44px]"
          >
            {isSubmitting ? 'Enregistrement...' : worker ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
