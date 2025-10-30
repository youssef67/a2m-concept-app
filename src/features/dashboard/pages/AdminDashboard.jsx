import React from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../../../shared/components/ui/Card'

export default function AdminDashboard() {
  const { profile } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue, {profile?.full_name || profile?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Accès complet
            </h3>
            <p className="text-gray-600">
              Vous avez accès à toutes les fonctionnalités de l&apos;application.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Gestion des utilisateurs
            </h3>
            <p className="text-gray-600">
              Créez et gérez les utilisateurs via le dashboard Supabase.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Configuration
            </h3>
            <p className="text-gray-600">
              Accédez aux paramètres et à la configuration de l&apos;application.
            </p>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Informations
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email :</span> {profile?.email}</p>
            <p><span className="font-medium">Rôle :</span> <span className="capitalize">{profile?.role}</span></p>
            <p><span className="font-medium">Créé le :</span> {new Date(profile?.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
