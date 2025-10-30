import React from 'react'
import { useState } from 'react'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Card from '../../../shared/components/ui/Card'
import Alert from '../../../shared/components/ui/Alert'
import { useLogin } from '../hooks/useLogin'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loading, error, handleLogin } = useLogin()

  const onSubmit = async (e) => {
    e.preventDefault()
    await handleLogin(email, password)
  }

  return (
    <Card>
      <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
        Connexion
      </h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>

        <div>
          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>
      </form>
    </Card>
  )
}
