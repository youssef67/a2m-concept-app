import { createContext, useState, useEffect, useRef } from 'react'
import { authService } from '../../features/auth/services/authService'
import { waitForSupabaseReady } from '../../lib/supabaseClient'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const lastUserIdRef = useRef(null)

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    let subscription = null
    let isFirstCheck = true

    // Wait for Supabase client to be ready before setting up listener
    const initializeAuth = async () => {
      try {
        await waitForSupabaseReady()

        // Listen to auth changes - this will also fire for initial session
        const { data: sub } = authService.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return

          // Only fetch profile if user actually changed (not just a URL change)
          const currentUserId = newSession?.user?.id
          const userIdChanged = currentUserId !== lastUserIdRef.current

          setSession(newSession)
          setUser(newSession?.user || null)

          if (newSession?.user && userIdChanged) {
            lastUserIdRef.current = currentUserId

            // Wait for Supabase to update auth headers
            await new Promise(resolve => setTimeout(resolve, 300))

            const { data, error } = await authService.getProfileById(newSession.user.id)

            if (mounted && !error && data) {
              setProfile(data)
            } else if (error) {
              console.error('[AuthContext] Failed to fetch profile:', error)
            }
          } else if (!newSession?.user) {
            lastUserIdRef.current = null
            if (mounted) {
              setProfile(null)
            }
          }

          // Set loading to false after first auth check
          if (mounted && isFirstCheck) {
            setLoading(false)
            isFirstCheck = false
          }
        })

        subscription = sub
      } catch (error) {
        console.error('[AuthContext] Initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Start initialization
    initializeAuth()

    // Cleanup
    return () => {
      mounted = false
      if (subscription?.subscription) {
        subscription.subscription.unsubscribe()
      }
    }
  }, [])

  // Login
  const login = async (email, password) => {
    const { user: loggedInUser, error } = await authService.signIn(email, password)

    if (!error && loggedInUser) {
      // Don't set anything here - let onAuthStateChange handle it
      return { error: null }
    }

    return { error }
  }

  // Logout
  const logout = async () => {
    const { error } = await authService.signOut()

    if (!error) {
      setUser(null)
      setSession(null)
      setProfile(null)
    }

    return { error }
  }

  // Computed values
  const isAuthenticated = !!user
  const isAdmin = profile?.role === 'admin'
  const isViewer = profile?.role === 'viewer'

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    isViewer,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
