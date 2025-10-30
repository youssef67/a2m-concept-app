import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (email, password) => {
    // Reset error
    setError(null)

    // Validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (!email.includes('@')) {
      setError('Email invalide')
      return
    }

    // Start loading
    setLoading(true)

    try {
      // Attempt login
      const { user: loggedInUser, error: loginError } = await authService.signIn(email, password)

      if (loginError || !loggedInUser) {
        setError('Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      // Don't fetch profile here - AuthContext onAuthStateChange will handle it
      // Just navigate to home and let the router redirect based on role
      navigate('/')
      setLoading(false)

    } catch (error) {
      console.error('[useLogin] Login error:', error)
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    handleLogin
  }
}
