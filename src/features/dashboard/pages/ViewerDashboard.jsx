import { useAuth } from '../../auth/hooks/useAuth'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../../../shared/components/ui/Card'

export default function ViewerDashboard() {
  const { profile } = useAuth()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue, {profile?.full_name || profile?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Visualisation des données
            </h3>
            <p className="text-gray-600">
              Accédez aux données et tableaux de bord en lecture seule.
            </p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Interaction limitée
            </h3>
            <p className="text-gray-600">
              Vous pouvez consulter et interagir avec les données disponibles.
            </p>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Vos informations
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email :</span> {profile?.email}</p>
            <p><span className="font-medium">Rôle :</span> <span className="capitalize">{profile?.role}</span></p>
          </div>
        </Card>

        <Card className="bg-blue-50 border border-blue-200">
          <p className="text-blue-800 text-sm">
            ℹ️ Votre accès est limité à la consultation. Pour plus de fonctionnalités, contactez un administrateur.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  )
}
