import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import Button from '../ui/Button'
import Logo from '../ui/Logo'

export default function Header() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h1 className="text-xl font-bold text-gray-800">A2M Concepts</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-800">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="min-h-[40px]"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
