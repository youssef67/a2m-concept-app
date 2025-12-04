import React from 'react'
import { Building2, User, Phone, Mail, ChevronRight, Edit2, Trash2, StickyNote } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import {
  getContactDisplayName,
  getContactEntityTypeLabel,
  getContactEntityTypeBadgeColor,
  formatPhoneNumber,
  formatNumeroContact
} from '../utils/contactHelpers'

/**
 * List item component to display a single contact in compact format
 * @param {Object} contact - Contact data
 * @param {function} onView - View details handler
 * @param {function} onEdit - Edit handler
 * @param {function} onDelete - Delete handler
 */
export default function ContactListItem({ contact, onView, onEdit, onDelete }) {
  const displayName = getContactDisplayName(contact)
  const isProfessionnel = contact.contact_type === 'professionnel'
  const entityTypeLabel = getContactEntityTypeLabel(contact.contact_type)
  const entityTypeBadgeColor = getContactEntityTypeBadgeColor(contact.contact_type)

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
      onClick={() => onView(contact)}
    >
      <div className="flex items-center gap-3 p-3 md:p-4">
        {/* Avatar */}
        <div
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            isProfessionnel
              ? 'bg-orange-100 text-orange-600'
              : 'bg-purple-100 text-purple-600'
          }`}
        >
          {isProfessionnel ? (
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <User className="w-5 h-5 md:w-6 md:h-6" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name and badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${entityTypeBadgeColor}`}
            >
              {entityTypeLabel}
            </span>
            {contact.numero_contact && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {formatNumeroContact(contact.numero_contact)}
              </span>
            )}
            {contact.type === 'fournisseur' && contact.is_sous_traitant && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Sous-traitant
              </span>
            )}
            {/* Notes indicator */}
            {contact.notes && contact.notes.trim() !== '' && (
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0" title="A des notes">
                <StickyNote className="w-3 h-3 text-amber-600" />
              </div>
            )}
          </div>

          {/* Contact info - mobile shows phone only, desktop shows phone + email */}
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
            {/* Phone */}
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{formatPhoneNumber(contact.phone)}</span>
            </div>

            {/* Email - desktop only */}
            {contact.email && (
              <div className="hidden md:flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{contact.email}</span>
              </div>
            )}

            {/* Show first contact person email for professionnel */}
            {isProfessionnel && contact.contact_persons && contact.contact_persons.length > 0 && contact.contact_persons[0].email && (
              <div className="hidden md:flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{contact.contact_persons[0].email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions - Desktop: buttons, Mobile: chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(contact)
              }}
              className="flex items-center justify-center gap-1 px-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(contact)
              }}
              className="flex items-center justify-center gap-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile chevron */}
          <ChevronRight className="w-5 h-5 text-gray-400 md:hidden" />
        </div>
      </div>
    </div>
  )
}
