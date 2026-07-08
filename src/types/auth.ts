// Equivalente a lib/models/user_model.dart
export type UserRole = 'admin' | 'normal'

export interface User {
  id: number
  email: string
  nombre: string
  rol: UserRole
  esAdmin: boolean
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
}

// Respuestas crudas del backend (snake_case)
export interface UserApi {
  id: number
  email: string
  nombre: string
  rol: string
  es_admin: boolean
}

export interface AuthResponseApi {
  access_token: string
  token_type: string
}

export function mapUser(json: UserApi): User {
  return {
    id: json.id,
    email: json.email,
    nombre: json.nombre,
    rol: json.rol === 'admin' ? 'admin' : 'normal',
    esAdmin: json.es_admin,
  }
}
