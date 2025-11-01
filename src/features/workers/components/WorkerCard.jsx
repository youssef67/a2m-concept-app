/**
 * WorkerCard
 * Élément de liste pour afficher un worker
 */

import React from 'react'
import { Edit2, Trash2, Phone, User } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import { getWorkerFullName, formatPhoneNumber } from '../utils/workerHelpers'

export default function WorkerCard({ worker, onEdit, onDelete }) {
  return (
    <div className="bg-white border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Info section */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {getWorkerFullName(worker)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{formatPhoneNumber(worker.phone)}</span>
            </div>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(worker)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(worker)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Supprimer</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
