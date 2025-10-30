import React from 'react'
import { Building2, User, Phone, Mail, MapPin, Users, Edit2 } from 'lucide-react'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import {
  getContactDisplayName,
  getContactEntityTypeLabel,
  getContactEntityTypeBadgeColor,
  getContactTypeLabel,
  formatPhoneNumber,
  formatAddress,
  getPersonFullName
} from '../utils/contactHelpers'

/**
 * Modal pour afficher les détails d'un contact en lecture seule
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Close handler
 * @param {function} onEdit - Edit handler (ouvre la modal d'édition)
 * @param {Object} contact - Contact data
 */
export default function ContactDetailModal({
  isOpen,
  onClose,
  onEdit,
  contact
}) {
  if (!contact) return null

  const displayName = getContactDisplayName(contact)
  const isProfessionnel = contact.contact_type === 'professionnel'
  const entityTypeLabel = getContactEntityTypeLabel(contact.contact_type)
  const entityTypeBadgeColor = getContactEntityTypeBadgeColor(contact.contact_type)
  const typeLabel = getContactTypeLabel(contact.type)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détails du contact"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header avec icon et nom */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
              isProfessionnel
                ? 'bg-orange-100 text-orange-600'
                : 'bg-purple-100 text-purple-600'
            }`}
          >
            {isProfessionnel ? (
              <Building2 className="w-8 h-8" />
            ) : (
              <User className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 break-words mb-2">
              {displayName}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${entityTypeBadgeColor}`}
              >
                {entityTypeLabel}
              </span>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Informations principales */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Informations de contact
          </h3>

          <div className="space-y-3">
            {/* Téléphone */}
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="text-base font-medium text-gray-900">
                  {formatPhoneNumber(contact.phone)}
                </p>
              </div>
            </div>

            {/* Email (pour particulier uniquement) */}
            {!isProfessionnel && contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900 break-all">
                    {contact.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adresse */}
        {contact.address && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-base text-gray-700">
                {formatAddress(contact.address)}
              </p>
            </div>
          </div>
        )}

        {/* Personnes de contact (pour professionnel) */}
        {isProfessionnel && contact.contact_persons && contact.contact_persons.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">
                Personnes de contact ({contact.contact_persons.length})
              </h3>
            </div>
            <div className="space-y-4">
              {contact.contact_persons.map((person) => (
                <div
                  key={person.id}
                  className="bg-gray-50 rounded-lg p-4 space-y-2"
                >
                  <div className="font-semibold text-gray-900">
                    {getPersonFullName(person)}
                    {person.position && (
                      <span className="text-gray-500 font-normal ml-2">
                        - {person.position}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {formatPhoneNumber(person.phone)}
                    </div>
                    <div className="flex items-center gap-2 break-all">
                      <Mail className="w-4 h-4" />
                      {person.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Commentaires</h3>
            <p className="text-base text-gray-700 italic">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Fermer
          </Button>
          <Button
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </Button>
        </div>
      </div>
    </Modal>
  )
}
