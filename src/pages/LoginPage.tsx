import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Equivalente a lib/pages/login_page.dart
export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function validate() {
    const errors: { email?: string; password?: string } = {}
    if (!email) errors.email = 'Por favor ingrese su correo electrónico'
    else if (!email.includes('@'))
      errors.email = 'Por favor ingrese un correo electrónico válido'
    if (!password) errors.password = 'Por favor ingrese su contraseña'
    else if (password.length < 6)
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    try {
      await login(email, password)
    } catch {
      setError('Error al iniciar sesión: Credenciales inválidas')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white to-gold-light/10 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <Logo className="h-24 w-64" />
          <h1 className="mt-12 text-2xl font-bold text-brown">
            Panel Administrativo
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-xl bg-white p-6 shadow-[0_5px_10px_rgba(0,0,0,0.1)]"
          noValidate
        >
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" />
              <Input
                id="email"
                type="email"
                value={email}
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                placeholder="correo@ejemplo.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brown"
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-6">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
