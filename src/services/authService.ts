import { apiClient } from '@/lib/apiClient'
import { ApiEndpoints } from '@/config/api'
import {
  mapUser,
  type AuthResponse,
  type AuthResponseApi,
  type User,
  type UserApi,
  type UserRole,
} from '@/types/auth'

// Equivalente a lib/services/auth_service.dart
export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    // El backend (OAuth2PasswordRequestForm) espera form-urlencoded
    // con el email en el campo 'username'.
    const body = new URLSearchParams()
    body.append('username', email)
    body.append('password', password)

    const { data } = await apiClient.post<AuthResponseApi>(
      ApiEndpoints.login,
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    return { accessToken: data.access_token, tokenType: data.token_type }
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<UserApi>(ApiEndpoints.userProfile)
    return mapUser(data)
  },

  async register(params: {
    email: string
    nombre: string
    password: string
    rol?: UserRole
  }): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponseApi>(
      ApiEndpoints.register,
      {
        email: params.email,
        nombre: params.nombre,
        password: params.password,
        rol: params.rol ?? 'normal',
      },
    )
    return { accessToken: data.access_token, tokenType: data.token_type }
  },
}
