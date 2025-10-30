import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import Spinner from '../ui/Spinner'

export default function RoleProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If user doesn't have the required role, redirect to their dashboard
  if (profile?.role !== requiredRole) {
    const redirectPath = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/viewer'
    return <Navigate to={redirectPath} replace />
  }

  return children
}
