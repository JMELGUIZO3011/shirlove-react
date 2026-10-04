import axios from 'axios'
import { API_BASE_URL, ApiEndpoints } from '@/config/api'
import {
  USA_ACCESO_REQUERIDO,
  getUsaToken,
  revokeUsaAccess,
} from '@/lib/usaAccess'

export const TOKEN_STORAGE_KEY = 'token'

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
    return Promise.reject(error)
  },
)
