import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Users, Construction, User, LogOut } from 'lucide-react'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import Button from '../ui/Button'

// Configuration des modules (identique à Sidebar)
const MODULES = [
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
  }
]

export default function BottomNavbar() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Filtrer les modules selon le rôle de l'utilisateur
  const visibleModules = MODULES.filter(module =>
    module.roles.includes(profile?.role)
  )

  return (
    <>
      {/* User menu modal (mobile) */}
      {showUserMenu && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowUserMenu(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-semibold text-base">
                  {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-800 truncate">
                  {profile?.full_name || profile?.email}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {profile?.role}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 min-h-[48px]"
            >
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bottom navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <ul className="flex items-center justify-around h-16 px-2">
          {visibleModules.map((module) => {
            const Icon = module.icon
            return (
              <li key={module.id} className="flex-1">
                <NavLink
                  to={module.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors min-h-[56px] ${
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

          {/* User menu button */}
          <li className="flex-1">
            <button
              onClick={() => setShowUserMenu(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors min-h-[56px] w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <User className="w-6 h-6 flex-shrink-0" />
              <span className="text-xs font-medium">Profil</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
