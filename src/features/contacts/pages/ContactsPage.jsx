import React from 'react'
import { Users } from 'lucide-react'
import Card from '../../../shared/components/ui/Card'

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Contacts</h1>
      </div>

      <Card>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Module Contacts
          </h2>
          <p className="text-gray-600">
            Cette fonctionnalité sera bientôt disponible.
          </p>
        </div>
      </Card>
    </div>
  )
}
