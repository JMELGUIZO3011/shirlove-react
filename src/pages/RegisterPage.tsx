import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import { authService } from '@/services/authService'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/types/auth'

// Equivalente a lib/pages/register_page.dart
export function RegisterPage() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rol, setRol] = useState<UserRole>('normal')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!nombre) return setError('Por favor ingrese el nombre')
    if (!email || !email.includes('@'))
      return setError('Por favor ingrese un correo electrónico válido')
    if (password.length < 6)
      return setError('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirmPassword)
      return setError('Las contraseñas no coinciden')

    setIsLoading(true)
    try {
      await authService.register({ email, nombre, password, rol })
      setSuccess('Usuario registrado exitosamente')
      setTimeout(() => navigate(-1), 1200)
    } catch (err) {
      setError(`Error al registrar: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gold-light/10">
      <header className="flex items-center gap-3 bg-gold px-4 py-3 text-white shadow">
        <button
          onClick={() => navigate(-1)}
          className="rounded p-1 hover:bg-white/10"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Registrar Usuario</h1>
      </header>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center">
            <Logo className="h-20 w-52" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-xl bg-white p-6 shadow-[0_5px_10px_rgba(0,0,0,0.1)]"
            noValidate
          >
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="rounded-md bg-green-600 px-3 py-2 text-sm text-white">
                {success}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre completo</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" />
                <Input
                  id="nombre"
                  value={nombre}
                  disabled={isLoading}
                  onChange={(e) => setNombre(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Rol del usuario</Label>
              <Select
                value={rol}
                disabled={isLoading}
                onValueChange={(v) => setRol(v as UserRole)}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brown" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Usuario normal</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full py-6">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Registrar Usuario'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
