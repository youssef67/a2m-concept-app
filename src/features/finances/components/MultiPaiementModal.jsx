import React, { useState, useMemo } from 'react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import { FileText, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../utils/factureHelpers'
import { validatePaiementMontant, validatePaiementDate } from '../utils/factureValidation'
import { createMultiplePaiements } from '../services/batchPaiementsService'

/**
 * Modal for paying multiple factures at once
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {Array} factures - Selected factures to pay
 * @param {function} onSuccess - Success callback
 */
export default function MultiPaiementModal({
  isOpen,
  onClose,
  factures = [],
  onSuccess
}) {
  // Form data state - données par facture
  const [montants, setMontants] = useState({})
  const [datesPaiement, setDatesPaiement] = useState({})
  const [references, setReferences] = useState({})

  // Validation and submission states
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionErrors, setSubmissionErrors] = useState([])

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMontants({})
      // Initialize dates with today's date for each facture
      const initialDates = {}
      factures.forEach(f => {
        initialDates[f.id] = new Date().toISOString().split('T')[0]
      })
      setDatesPaiement(initialDates)
      setReferences({})
      setValidationErrors({})
      setSubmissionErrors([])
    }
  }, [isOpen, factures])

  // Calculate total to pay
  const totalAPayer = useMemo(() => {
    return Object.values(montants).reduce((sum, m) => sum + (parseFloat(m) || 0), 0)
  }, [montants])

  // Handle montant change for a facture
  const handleMontantChange = (factureId, value) => {
    setMontants(prev => ({
      ...prev,
      [factureId]: value
    }))

    // Clear validation error for this facture
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`${factureId}_montant`]
      return newErrors
    })
  }

  // Handle date change for a facture
  const handleDateChange = (factureId, value) => {
    setDatesPaiement(prev => ({
      ...prev,
      [factureId]: value
    }))

    // Clear validation error for this facture
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`${factureId}_date`]
      return newErrors
    })
  }

  // Handle reference change for a facture
  const handleReferenceChange = (factureId, value) => {
    setReferences(prev => ({
      ...prev,
      [factureId]: value
    }))
  }

  // Validate all fields before submission
  const validateForm = () => {
    const errors = {}
    let isValid = true

    // Validate each facture
    factures.forEach(facture => {
      // Validate montant
      const montant = parseFloat(montants[facture.id])
      if (!montant || isNaN(montant)) {
        errors[`${facture.id}_montant`] = 'Le montant est obligatoire'
        isValid = false
      } else {
        const validation = validatePaiementMontant(montant, facture.montant_restant)
        if (!validation.valid) {
          errors[`${facture.id}_montant`] = validation.error
          isValid = false
        }
      }

      // Validate date
      const date = datesPaiement[facture.id]
      const dateValidation = validatePaiementDate(date)
      if (!dateValidation.valid) {
        errors[`${facture.id}_date`] = dateValidation.error
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmissionErrors([])

    try {
      // Prepare paiements data with individual dates and references
      const paiementsData = factures.map(facture => ({
        factureId: facture.id,
        factureNumero: facture.numero_facture,
        montant: parseFloat(montants[facture.id]),
        montantRestant: facture.montant_restant,
        date_paiement: datesPaiement[facture.id],
        reference: references[facture.id] || null,
        notes: null
      }))

      // Create paiements
      const result = await createMultiplePaiements(paiementsData)

      if (result.success) {
        // All paiements created successfully
        onSuccess({
          message: `${result.created.length} paiement(s) créé(s) avec succès`,
          created: result.created.length,
          total: factures.length
        })
        onClose()
      } else if (result.created.length > 0) {
        // Partial success
        setSubmissionErrors(result.errors)
        onSuccess({
          message: `${result.created.length} sur ${factures.length} paiement(s) créé(s)`,
          created: result.created.length,
          total: factures.length,
          hasErrors: true
        })
      } else {
        // All failed
        setSubmissionErrors(result.errors)
      }
    } catch (error) {
      console.error('Error submitting multi-paiement:', error)
      setSubmissionErrors([{ error: 'Une erreur est survenue lors de la création des paiements' }])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Paiement de ${factures.length} facture(s)`}
      size="xl"
      closeOnBackdropClick={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Submission errors */}
        {submissionErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-2">
                  Erreurs lors de la création
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {submissionErrors.map((err, index) => (
                    <li key={index}>
                      {err.factureNumero ? `${err.factureNumero}: ` : ''}
                      {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Factures list with montant inputs */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {factures.map(facture => (
            <div
              key={facture.id}
              className="bg-gray-50 rounded-lg p-4 space-y-3"
            >
              {/* Facture info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {facture.numero_facture}
                    </div>
                    <div className="text-sm text-gray-600">
                      Reste à payer: {formatCurrency(facture.montant_restant)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Montant input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Montant du paiement *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleMontantChange(facture.id, facture.montant_restant.toString())}
                    disabled={isSubmitting}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                  >
                    Paiement total ({formatCurrency(facture.montant_restant)})
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={montants[facture.id] || ''}
                    onChange={(e) => handleMontantChange(facture.id, e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full h-12 px-4 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      validationErrors[`${facture.id}_montant`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    €
                  </span>
                </div>
                {validationErrors[`${facture.id}_montant`] && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors[`${facture.id}_montant`]}
                  </p>
                )}
              </div>

              {/* Date paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de paiement *
                </label>
                <input
                  type="date"
                  value={datesPaiement[facture.id] || ''}
                  onChange={(e) => handleDateChange(facture.id, e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors[`${facture.id}_date`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors[`${facture.id}_date`] && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors[`${facture.id}_date`]}
                  </p>
                )}
              </div>

              {/* Reference bancaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence bancaire
                </label>
                <input
                  type="text"
                  value={references[facture.id] || ''}
                  onChange={(e) => handleReferenceChange(facture.id, e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Numéro de virement, référence..."
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Résumé</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total à enregistrer:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(totalAPayer)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre de paiements:</span>
              <span className="font-semibold text-gray-900">{factures.length}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || factures.length === 0}
          >
            Valider le paiement
          </Button>
        </div>
      </form>
    </Modal>
  )
}
