import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authService } from '@/services/authService'
import { TOKEN_STORAGE_KEY } from '@/lib/apiClient'
import type { User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Equivalente a lib/providers/auth_provider.dart
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // Verificar sesión al arrancar (checkAuthStatus)
  useEffect(() => {
    let active = true
    async function checkAuthStatus() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!stored) {
        if (active) setInitializing(false)
        return
      }
      try {
        const current = await authService.getCurrentUser()
        if (active) {
          setUser(current)
          setToken(stored)
        }
      } catch {
        // Token inválido o expirado: cerramos sesión
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        if (active) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (active) setInitializing(false)
      }
    }
    checkAuthStatus()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const auth = await authService.login(email, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, auth.accessToken)
      setToken(auth.accessToken)
      const current = await authService.getCurrentUser()
      setUser(current)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
    setToken(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: token !== null,
      isLoading,
      initializing,
      login,
      logout,
    }),
    [user, token, isLoading, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
