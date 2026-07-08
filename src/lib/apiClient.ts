import axios from 'axios'
import { API_BASE_URL } from '@/config/api'

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
  return config
})
