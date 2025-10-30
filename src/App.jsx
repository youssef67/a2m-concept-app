import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './shared/contexts/AuthContext'
import { useAuth } from './features/auth/hooks/useAuth'

// Pages
import LoginPage from './features/auth/pages/LoginPage'
import AdminDashboard from './features/dashboard/pages/AdminDashboard'
import ViewerDashboard from './features/dashboard/pages/ViewerDashboard'
import ContactsPage from './features/contacts/pages/ContactsPage'
import ChantiersPage from './features/chantiers/pages/ChantiersPage'

// Route protection
import RoleProtectedRoute from './shared/components/routing/RoleProtectedRoute'
import Spinner from './shared/components/ui/Spinner'

// Home redirect component
function HomeRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

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

  return <Navigate to={isAdmin ? '/dashboard/admin' : '/dashboard/viewer'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes with role-based access */}
          <Route
            path="/dashboard/admin"
            element={
              <RoleProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard/viewer"
            element={
              <RoleProtectedRoute requiredRole="viewer">
                <ViewerDashboard />
              </RoleProtectedRoute>
            }
          />

          {/* Module routes - Admin only */}
          <Route
            path="/dashboard/contacts"
            element={
              <RoleProtectedRoute requiredRole="admin">
                <ContactsPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/dashboard/chantiers"
            element={
              <RoleProtectedRoute requiredRole="admin">
                <ChantiersPage />
              </RoleProtectedRoute>
            }
          />

          {/* Home redirect */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
