import { supabase } from '../../../lib/supabaseClient'

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { user: data.user, session: data.session, error: null }
    } catch (error) {
      return { user: null, session: null, error: error.message }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session: data.session, error: null }
    } catch (error) {
      console.error('[authService] getSession error:', error)
      return { session: null, error: error.message }
    }
  },

  // Get current user profile with role
  async getCurrentUserProfile() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!userData.user) {
        return { profile: null, error: 'No user logged in' }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single()

      if (error) throw error
      return { profile: data, error: null }
    } catch (error) {
      console.error('[authService] getCurrentUserProfile error:', error)
      return { profile: null, error: error.message }
    }
  },

  // Get profile by user ID (without calling getUser)
  async getProfileById(userId) {
    try {
      // Add timeout to prevent infinite blocking
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout after 5s')), 5000)
      )

      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([query, timeout])

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('[authService] getProfileById error:', error)
      return { data: null, error: error.message }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    const { data: subscription } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}
