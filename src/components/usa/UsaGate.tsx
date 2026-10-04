import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsaAcceder, useUsaConfigurarPassword, useUsaEstado } from '@/hooks/useUsa'
import { getApiErrorMessage } from '@/lib/apiError'
import { USA_ACCESS_REVOKED_EVENT, clearUsaToken, getUsaToken } from '@/lib/usaAccess'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Puerta de entrada al Módulo USA: además de la sesión del panel, exige la
// contraseña propia del módulo. Si aún no hay contraseña, el administrador la
// configura aquí mismo la primera vez.
export function UsaGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [token, setToken] = useState<string | null>(() => getUsaToken())
  const estadoQ = useUsaEstado()

  // Si cualquier petición del módulo responde "acceso requerido", volvemos a pedir la contraseña.
  useEffect(() => {
    const onRevoked = () => setToken(null)
    window.addEventListener(USA_ACCESS_REVOKED_EVENT, onRevoked)
    return () => window.removeEventListener(USA_ACCESS_REVOKED_EVENT, onRevoked)
  }, [])

  // Token guardado pero ya vencido (p. ej. al recargar horas después): descartarlo.
  useEffect(() => {
    if (token && estadoQ.data && !estadoQ.data.acceso_valido) {
      clearUsaToken()
      setToken(null)
    }
  }, [token, estadoQ.data])

  if (estadoQ.isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-gold" /> Verificando acceso...
        </div>
      </Shell>
    )
  }

  if (estadoQ.isError || !estadoQ.data) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-destructive">No se pudo verificar el acceso al módulo USA</p>
          <Button variant="outline" onClick={() => estadoQ.refetch()}>
            Reintentar
          </Button>
        </div>
      </Shell>
    )
  }

  const estado = estadoQ.data

  if (!estado.password_configurada) {
    return (
      <Shell>
        {user?.esAdmin ? (
          <ConfigurarPasswordInicial />
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Lock className="h-10 w-10 text-gold" />
            <p className="font-semibold text-navy">El módulo USA aún no está habilitado</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Un administrador debe configurar la contraseña del módulo antes de poder usarlo.
            </p>
          </div>
        )}
      </Shell>
    )
  }

  if (!token || !estado.acceso_valido) {
    return (
      <Shell>
        <IngresarPassword onAccess={setToken} />
      </Shell>
    )
  }

  return <>{children}</>
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader title="Módulo USA" subtitle="Acceso protegido con contraseña" />
      <div className="mx-auto flex w-full max-w-md flex-1 items-start p-4 pt-10 sm:p-6 sm:pt-16">
        <div className="w-full rounded-xl border bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}

function IngresarPassword({ onAccess }: { onAccess: (token: string) => void }) {
  const acceder = useUsaAcceder()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!password) return setError('Ingrese la contraseña del módulo')
    try {
      const res = await acceder.mutateAsync(password)
      onAccess(res.usa_token)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo validar la contraseña'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full bg-navy/10 p-3">
          <Lock className="h-6 w-6 text-navy" />
        </div>
        <h2 className="text-lg font-bold text-navy">Módulo USA</h2>
        <p className="text-sm text-muted-foreground">
          Ventas, servicios e inventario de Estados Unidos. Ingrese la contraseña del módulo para continuar.
        </p>
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="usa-password">Contraseña del módulo</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brown" />
          <Input
            id="usa-password"
            type={show ? 'text' : 'password'}
            autoFocus
            autoComplete="off"
            value={password}
            disabled={acceder.isPending}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9 pr-9"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brown"
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" variant="secondary" className="w-full py-5" disabled={acceder.isPending}>
        {acceder.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar al módulo'}
      </Button>
    </form>
  )
}

function ConfigurarPasswordInicial() {
  const configurar = useUsaConfigurarPassword()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (p1.length < 4) return setError('La contraseña debe tener al menos 4 caracteres')
    if (p1 !== p2) return setError('Las contraseñas no coinciden')
    try {
      await configurar.mutateAsync({ passwordNueva: p1 })
      // El estado se refresca solo (invalidación) y el gate pasa a pedir la contraseña.
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full bg-gold/15 p-3">
          <ShieldCheck className="h-6 w-6 text-gold" />
        </div>
        <h2 className="text-lg font-bold text-navy">Habilitar el módulo USA</h2>
        <p className="text-sm text-muted-foreground">
          Defina la contraseña con la que se entrará al módulo. Podrá cambiarla después desde el
          propio módulo.
        </p>
      </div>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="usa-p1">Nueva contraseña</Label>
        <Input
          id="usa-p1"
          type="password"
          autoComplete="new-password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="usa-p2">Confirmar contraseña</Label>
        <Input
          id="usa-p2"
          type="password"
          autoComplete="new-password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
        />
      </div>

      <Button type="submit" variant="secondary" className="w-full py-5" disabled={configurar.isPending}>
        {configurar.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar contraseña'}
      </Button>
    </form>
  )
}
