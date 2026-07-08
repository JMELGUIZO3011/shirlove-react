import { AxiosError } from 'axios'

// El backend FastAPI devuelve los errores como { detail: string | [...] }.
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      // Errores de validación de Pydantic
      const first = detail[0]
      if (first?.msg) return first.msg
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}
