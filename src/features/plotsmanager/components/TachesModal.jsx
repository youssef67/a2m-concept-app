/**
 * TachesModal
 * Modal pour gérer les tâches d'un chantier (création et modification en batch)
 */

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'

// Status options for Select component
const STATUS_OPTIONS = [
  { value: 'a_faire', label: 'À faire' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminée' }
]

// SortableItem component for draggable task rows
function SortableItem({
  id,
  tache,
  index,
  onIntituleChange,
  onStatutChange,
  onRemove,
  isSubmitting,
  canRemove
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-lg"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="p-2 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing self-start sm:self-auto"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5 text-gray-400" />
      </button>

      {/* Intitule input */}
      <div className="flex-1">
        <Input
          type="text"
          value={tache.intitule}
          onChange={(e) => onIntituleChange(index, e.target.value)}
          placeholder={`Tâche ${index + 1}`}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Status select */}
      <div className="w-full sm:w-40">
        <Select
          value={tache.statut}
          onChange={(value) => onStatutChange(index, value)}
          options={STATUS_OPTIONS}
          placeholder="Statut"
        />
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={isSubmitting || !canRemove}
        className="p-3 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        title={!canRemove ? 'Au moins une tâche est requise' : 'Supprimer'}
      >
        <Trash2 className="w-5 h-5 text-red-600" />
      </button>
    </div>
  )
}

export default function TachesModal({
  isOpen,
  onClose,
  // eslint-disable-next-line no-unused-vars
  chantierId,
  chantierTitre,
  initialTaches = [],
  onSave
}) {
  const [taches, setTaches] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Initialize taches when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTaches && initialTaches.length > 0) {
        // Edit mode: load existing taches
        setTaches(
          initialTaches.map((t) => ({
            intitule: t.intitule,
            statut: t.statut || 'a_faire'
          }))
        )
      } else {
        // Create mode: start with 1 empty task
        setTaches([{ intitule: '', statut: 'a_faire' }])
      }
      setErrorMessage('')
    }
  }, [isOpen, initialTaches])

  // Handle intitule change for a specific task
  const handleIntituleChange = (index, value) => {
    const newTaches = [...taches]
    newTaches[index].intitule = value
    setTaches(newTaches)
    setErrorMessage('')
  }

  // Handle statut change for a specific task
  const handleStatutChange = (index, value) => {
    const newTaches = [...taches]
    newTaches[index].statut = value
    setTaches(newTaches)
  }

  // Add a new task
  const handleAddTache = () => {
    setTaches([...taches, { intitule: '', statut: 'a_faire' }])
  }

  // Remove a task (disabled if only 1 task)
  const handleRemoveTache = (index) => {
    if (taches.length <= 1) {
      setErrorMessage('Au moins une tâche est requise')
      return
    }
    const newTaches = taches.filter((_, i) => i !== index)
    setTaches(newTaches)
    setErrorMessage('')
  }

  // Handle drag end event
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTaches((items) => {
        const oldIndex = items.findIndex((_, i) => i === active.id)
        const newIndex = items.findIndex((_, i) => i === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Validate and submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate: at least 1 task
    if (taches.length === 0) {
      setErrorMessage('Au moins une tâche est requise')
      return
    }

    // Validate: all tasks must have intitule
    const hasEmptyIntitule = taches.some((t) => !t.intitule || t.intitule.trim().length === 0)
    if (hasEmptyIntitule) {
      setErrorMessage('Toutes les tâches doivent avoir un intitulé')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const result = await onSave(taches)

      if (result.success) {
        handleClose()
      } else {
        setErrorMessage(result.error?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Error saving taches:', error)
      setErrorMessage('Erreur lors de la sauvegarde des tâches')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setTaches([])
      setErrorMessage('')
      onClose()
    }
  }

  const isEditMode = initialTaches && initialTaches.length > 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={isEditMode ? 'Modifier les tâches' : 'Créer des tâches'}
    >
      <div>
        {/* Chantier info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Chantier :</strong> {chantierTitre}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tasks list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Tâches <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddTache}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-sm py-2 px-3"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </Button>
            </div>

            {/* Task rows with drag & drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={taches.map((_, index) => index)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {taches.map((tache, index) => (
                    <SortableItem
                      key={index}
                      id={index}
                      tache={tache}
                      index={index}
                      onIntituleChange={handleIntituleChange}
                      onStatutChange={handleStatutChange}
                      onRemove={handleRemoveTache}
                      isSubmitting={isSubmitting}
                      canRemove={taches.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Helper text */}
            <p className="text-xs text-gray-600">
              Au moins une tâche est requise. Les tâches seront communes à tous les plots du
              chantier.
            </p>
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
              {isEditMode ? 'Enregistrer' : 'Créer les tâches'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
