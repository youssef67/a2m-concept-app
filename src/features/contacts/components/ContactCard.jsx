import React from 'react'
import { Building2, User, Phone, Mail, MapPin, Edit2, Trash2, Users, StickyNote } from 'lucide-react'
import Card from '../../../shared/components/ui/Card'
import Button from '../../../shared/components/ui/Button'
import {
  getContactDisplayName,
  getContactEntityTypeLabel,
  getContactEntityTypeBadgeColor,
  formatPhoneNumber,
  formatAddress,
  getPersonFullName
} from '../utils/contactHelpers'

/**
 * Card component to display a single contact
 * @param {Object} contact - Contact data
 * @param {function} onView - View details handler
 * @param {function} onEdit - Edit handler
 * @param {function} onDelete - Delete handler
 */
export default function ContactCard({ contact, onView, onEdit, onDelete }) {
  const displayName = getContactDisplayName(contact)
  const isProfessionnel = contact.contact_type === 'professionnel'
  const entityTypeLabel = getContactEntityTypeLabel(contact.contact_type)
  const entityTypeBadgeColor = getContactEntityTypeBadgeColor(contact.contact_type)

  return (
    <Card className="hover:shadow-lg transition-all h-full cursor-pointer" onClick={() => onView(contact)}>
      <div className="flex flex-col gap-4 h-full">
        {/* Header with name and badges */}
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isProfessionnel
                ? 'bg-orange-100 text-orange-600'
                : 'bg-purple-100 text-purple-600'
            }`}
          >
            {isProfessionnel ? (
              <Building2 className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 break-words">
              {displayName}
            </h3>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${entityTypeBadgeColor}`}
            >
              {entityTypeLabel}
            </span>
          </div>
          {/* Badge indicateur de notes */}
          {contact.notes && contact.notes.trim() !== '' && (
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0" title="A des notes">
              <StickyNote className="w-4 h-4 text-amber-600" />
            </div>
          )}
        </div>

        {/* Contact details */}
        <div className="space-y-2 flex-1">
          {/* Phone */}
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm">{formatPhoneNumber(contact.phone)}</span>
          </div>

          {/* Email (for particulier only) */}
          {!isProfessionnel && contact.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm truncate">{contact.email}</span>
            </div>
          )}

          {/* Address */}
          {contact.address && (
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{formatAddress(contact.address)}</span>
            </div>
          )}

          {/* Contact persons (for professionnel) */}
          {isProfessionnel && contact.contact_persons && contact.contact_persons.length > 0 && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Personnes de contact ({contact.contact_persons.length})
                </span>
              </div>
              <div className="pl-6 space-y-2">
                {contact.contact_persons.map((person) => (
                  <div key={person.id} className="text-sm text-gray-600">
                    <div className="font-medium text-gray-900">
                      {getPersonFullName(person)}
                      {person.position && (
                        <span className="text-gray-500 font-normal ml-2">
                          - {person.position}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {formatPhoneNumber(person.phone)}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" />
                        {person.email}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600 italic">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(contact)
            }}
            className="flex items-center justify-center gap-1 px-2 sm:px-3 min-w-[44px]"
          >
            <Edit2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Modifier</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(contact)
            }}
            className="flex items-center justify-center gap-1 px-2 sm:px-3 min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Supprimer</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}
