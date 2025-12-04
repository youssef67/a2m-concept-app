import React from 'react'
import { FileText, User, Calendar, CreditCard, AlertTriangle, Edit2, ArrowDownCircle, Send } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import {
  formatCurrency,
  formatDate,
  getStatutLabel,
  getStatutColor,
  getContactDisplayName,
  getModePaiementLabel
} from '../utils/factureHelpers'

/**
 * Modal pour afficher les détails d'une facture en lecture seule
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {function} onEdit - Edit handler (ouvre la modal d'édition)
 * @param {function} onPaiement - Paiement handler (ouvre la modal de paiement)
 * @param {Object} facture - Facture data
 */
export default function FactureDetailModal({
  isOpen,
  onClose,
  onEdit,
  onPaiement,
  facture
}) {
  if (!facture) return null

  const contactName = getContactDisplayName(facture.contact)
  const statutLabel = getStatutLabel(facture.statut)
  const statutColor = getStatutColor(facture.statut)

  // Calcul du montant à payer et progression
  const montantAPayer = facture.montant_ttc || facture.montant || 0
  const montantPaye = facture.montant_paye || 0
  const montantRestant = facture.montant_restant || (montantAPayer - montantPaye)
  const progressionPaiement = montantAPayer > 0 ? (montantPaye / montantAPayer) * 100 : 0

  // Vérifier si la facture est en retard
  const isOverdue = facture.statut !== 'payee' &&
                    facture.statut !== 'annulee' &&
                    facture.date_echeance &&
                    new Date(facture.date_echeance) < new Date()

  // Peut-on enregistrer un paiement ?
  const canPay = facture.statut === 'en_attente' || facture.statut === 'partiellement_payee'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails de la facture"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header avec numéro et statut */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-100 text-primary-600">
            <FileText className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 break-words mb-2">
              {facture.numero_facture || 'Facture sans numéro'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statutColor}`}>
                {statutLabel}
              </span>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                facture.type === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {facture.type === 'client' ? 'Client' : 'Fournisseur'}
              </span>
              {/* Mode de paiement badge (fournisseurs only, not sous-traitants) */}
              {facture.type === 'fournisseur' && !facture.contact?.is_sous_traitant && facture.mode_paiement && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  facture.mode_paiement === 'prelevement'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {facture.mode_paiement === 'prelevement' ? (
                    <ArrowDownCircle className="w-3 h-3" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {getModePaiementLabel(facture.mode_paiement)}
                </span>
              )}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  En retard
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-base font-medium text-gray-900">{contactName}</p>
              {facture.chantier && (
                <p className="text-sm text-gray-500">
                  Chantier : {facture.chantier.titre}
                  {facture.lot && ` - Lot : ${facture.lot}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Émission</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(facture.date_emission)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm text-gray-500">Échéance</p>
                <p className={`text-base font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(facture.date_echeance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Montants</h3>

          {/* Montant TTC */}
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-500">Montant TTC</p>
              <p className="text-xl font-bold text-primary-600">
                {formatCurrency(montantAPayer)}
              </p>
            </div>
          </div>

          {/* Progression paiement */}
          {facture.statut !== 'annulee' && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payé : {formatCurrency(montantPaye)}</span>
                <span className="font-medium text-gray-900">Reste : {formatCurrency(montantRestant)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    progressionPaiement >= 100 ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(progressionPaiement, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                {progressionPaiement.toFixed(0)}% payé
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Fermer
          </Button>
          {canPay && (
            <Button
              variant="outline"
              onClick={onPaiement}
              className="w-full sm:w-auto"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Paiement
            </Button>
          )}
          <Button
            onClick={onEdit}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </Button>
        </div>
      </div>
    </Modal>
  )
}
