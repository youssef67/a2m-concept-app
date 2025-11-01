import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Home, Users, Construction, Euro, LogOut } from 'lucide-react'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

// Configuration des modules
const MODULES = [
  {
    id: 'dashboard',
    label: 'Accueil',
    icon: Home,
    path: '/dashboard/admin',
    roles: ['admin']
  },
  {
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    path: '/dashboard/contacts',
    roles: ['admin']
  },
  {
    id: 'chantiers',
    label: 'Chantiers',
    icon: Construction,
    path: '/dashboard/chantiers',
    roles: ['admin']
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: Euro,
    path: '/dashboard/finances',
    roles: ['admin']
  }
]

export default function Sidebar() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Filtrer les modules selon le rôle de l'utilisateur
  const visibleModules = MODULES.filter(module =>
    module.roles.includes(profile?.role)
  )

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
      {/* Logo section */}
      <div className="px-4 py-6 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <Logo size="sm" />
          <h1 className="text-lg font-bold text-gray-800">A2M Concepts</h1>
        </Link>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {visibleModules.map((module) => {
            const Icon = module.icon
            return (
              <li key={module.id}>
                <NavLink
                  to={module.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[48px] ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">{module.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User menu section */}
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-600 font-semibold text-sm">
                {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
