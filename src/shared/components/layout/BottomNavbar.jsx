import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, Construction, Euro, Settings } from 'lucide-react'
import { useAuth } from '../../../features/auth/hooks/useAuth'

// Configuration des modules (identique à Sidebar)
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
  },
  {
    id: 'tools',
    label: 'Outils',
    icon: Settings,
    path: '/dashboard/tools',
    roles: ['admin']
  }
]

export default function BottomNavbar() {
  const { profile } = useAuth()

  // Filtrer les modules selon le rôle de l'utilisateur
  const visibleModules = MODULES.filter(module =>
    module.roles.includes(profile?.role)
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-full bg-white border-t border-gray-200 shadow-lg z-30 overflow-x-hidden">
      <ul className="flex items-center justify-between h-16">
        {visibleModules.map((module) => {
          const Icon = module.icon
          return (
            <li key={module.id} className="flex-1">
              <NavLink
                to={module.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors min-h-[56px] ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="text-xs font-medium">{module.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
