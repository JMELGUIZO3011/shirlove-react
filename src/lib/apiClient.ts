import axios from 'axios'
import { API_BASE_URL, ApiEndpoints } from '@/config/api'
import {
  USA_ACCESO_REQUERIDO,
  clearUsaToken,
  getUsaToken,
  revokeUsaAccess,
} from '@/lib/usaAccess'

export const TOKEN_STORAGE_KEY = 'token'
// Se dispara cuando el backend rechaza la sesión (401): AuthContext cierra sesión y avisa.
export const SESSION_EXPIRED_EVENT = 'session-expired'
// Rutas donde un 401 significa "credenciales incorrectas", no "sesión vencida".
const RUTAS_CON_401_PROPIO = [ApiEndpoints.login, `${ApiEndpoints.usa}/acceso`]

// Cliente HTTP central. Inyecta el token Bearer en cada petición
// (equivalente a ApiConfig.authHeaders del proyecto Flutter).
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Módulo USA: segunda capa de seguridad con su propio token (contraseña del módulo).
  if (config.url?.startsWith(ApiEndpoints.usa)) {
    const usaToken = getUsaToken()
    if (usaToken) config.headers['X-USA-Token'] = usaToken
  }
  return config
})

// Si el backend indica que el token del módulo USA falta o venció, lo
// descartamos y avisamos a la UI para volver a pedir la contraseña del módulo.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string | undefined = error?.config?.url
    const status: number | undefined = error?.response?.status
    const detail = error?.response?.data?.detail
    if (url?.startsWith(ApiEndpoints.usa) && status === 403 && detail === USA_ACCESO_REQUERIDO) {
      revokeUsaAccess()
    }
    // Sesión del panel vencida o inválida: cerrar sesión en toda la app.
    if (status === 401 && url && !RUTAS_CON_401_PROPIO.some((r) => url.startsWith(r))) {
      const habiaSesion = localStorage.getItem(TOKEN_STORAGE_KEY) !== null
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      clearUsaToken()
      if (habiaSesion) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)
