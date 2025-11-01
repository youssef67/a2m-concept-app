/**
 * ToolsPage
 * Page outils (vide pour l'instant)
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import AppLayout from '../../../shared/components/layout/AppLayout'
import Button from '../../../shared/components/ui/Button'

export default function ToolsPage() {
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Outils</h1>
          <Button
            onClick={() => navigate('/dashboard/workers')}
            className="flex items-center gap-2 min-h-[44px]"
          >
            <Users className="w-5 h-5" />
            <span>Liste de contacts</span>
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
