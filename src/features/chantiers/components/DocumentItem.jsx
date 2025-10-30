/**
 * DocumentItem Component
 * Display a single document with download and delete actions
 */

import React from 'react'
import { FileText, Download, Trash2 } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import { formatFileSize } from '../services/documentsService'
import { formatDate } from '../utils/chantierHelpers'

export default function DocumentItem({ document, onDownload, onDelete }) {
  if (!document) return null

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-red-600" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {document.nom_fichier}
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(document.taille_fichier)} · {formatDate(document.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          onClick={() => onDownload(document)}
          className="h-10 px-3"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          onClick={() => onDelete(document)}
          className="h-10 px-3 text-red-600 hover:bg-red-50 hover:border-red-300"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
