import React, { createContext, useState, useEffect, useRef } from 'react'
import { authService } from '../../features/auth/services/authService'
import { waitForSupabaseReady } from '../../lib/supabaseClient'
import { logger } from '../utils/logger'

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

          logger.log('[AuthContext] Auth event:', event, 'Session:', !!newSession)

          // Handle TOKEN_REFRESHED with failure
          if (event === 'TOKEN_REFRESHED' && !newSession) {
            logger.error('[AuthContext] Token refresh failed - forcing sign out')
            await authService.signOut()
            setSession(null)
            setUser(null)
            setProfile(null)
            if (mounted && isFirstCheck) {
              setLoading(false)
              isFirstCheck = false
            }
            return
          }

          // Handle SIGNED_OUT
          if (event === 'SIGNED_OUT') {
            logger.log('[AuthContext] User signed out')
            setSession(null)
            setUser(null)
            setProfile(null)
            lastUserIdRef.current = null
            if (mounted && isFirstCheck) {
              setLoading(false)
              isFirstCheck = false
            }
            return
          }

          // Only fetch profile if user actually changed (not just a URL change)
          const currentUserId = newSession?.user?.id
          const userIdChanged = currentUserId !== lastUserIdRef.current

          setSession(newSession)
          setUser(newSession?.user || null)

          if (newSession?.user && userIdChanged) {
            lastUserIdRef.current = currentUserId

            // Wait for Supabase to update auth headers
            await new Promise(resolve => setTimeout(resolve, 300))

            // Retry logic for profile fetch (handles JWT expired)
            let profileData = null
            let profileError = null
            let attempts = 0
            const maxAttempts = 3

            while (attempts < maxAttempts && !profileData && mounted) {
              attempts++
              logger.log(`[AuthContext] Fetching profile (attempt ${attempts}/${maxAttempts})...`)

              const result = await authService.getProfileById(newSession.user.id)

              // Check for JWT expired error (PGRST303)
              if (result.error?.code === 'PGRST303' || result.error?.message?.includes('JWT')) {
                logger.warn('[AuthContext] JWT expired detected, refreshing session...')

                // Try to refresh the session
                const { data: { session: refreshedSession }, error: refreshError } = await authService.refreshSession()

                if (refreshError || !refreshedSession) {
                  logger.error('[AuthContext] Session refresh failed:', refreshError)
                  profileError = result.error
                  break
                }

                logger.log('[AuthContext] Session refreshed successfully, retrying profile fetch...')
                setSession(refreshedSession)
                await new Promise(resolve => setTimeout(resolve, 500))
                continue
              }

              if (result.data) {
                profileData = result.data
              } else if (result.error) {
                profileError = result.error
                // Wait before retry
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
                }
              }
            }

            if (mounted) {
              if (profileData) {
                logger.log('[AuthContext] Profile loaded successfully:', profileData.role)
                setProfile(profileData)
              } else {
                logger.error('[AuthContext] Failed to fetch profile after', attempts, 'attempts:', profileError)
                // Force sign out if profile cannot be loaded
                await authService.signOut()
                setSession(null)
                setUser(null)
                setProfile(null)
              }
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
        logger.error('[AuthContext] Initialization error:', error)
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
