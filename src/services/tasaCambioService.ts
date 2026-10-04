import axios from 'axios'

// Tasa de cambio USD -> COP para mostrar equivalentes en el Módulo USA.
//
// Fuente: open.er-api.com (ExchangeRate-API, gratuita, sin llave, tasa de
// mercado actualizada a diario, CORS abierto). Google no ofrece una API
// pública de tasas, así que esta es la alternativa estable; la UI permite
// además ingresar una tasa manual.
//
// IMPORTANTE: se usa axios "pelado" y NO apiClient, para que el token de
// sesión del panel jamás viaje a un servicio externo.

const ER_API_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_KEY = 'tasa_usd_cop'

export interface TasaCambio {
  tasa: number // COP por 1 USD
  actualizada: string // ISO de la última actualización de la fuente
  proximaActualizacion: string | null
  origen: 'api' | 'cache'
  fuente: string
}

interface ErApiResponse {
  result: 'success' | 'error'
  provider?: string
  time_last_update_utc?: string
  time_next_update_utc?: string
  rates?: Record<string, number>
}

function leerCache(): TasaCambio | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TasaCambio
    if (!Number.isFinite(parsed.tasa) || parsed.tasa <= 0) return null
    return { ...parsed, origen: 'cache' }
  } catch {
    return null
  }
}

function guardarCache(t: TasaCambio) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(t))
  } catch {
    /* sin almacenamiento: se omite la caché */
  }
}

export const tasaCambioService = {
  async getUsdCop(): Promise<TasaCambio> {
    try {
      const { data } = await axios.get<ErApiResponse>(ER_API_URL, { timeout: 10_000 })
      const cop = data.rates?.COP
      if (data.result !== 'success' || !cop || !Number.isFinite(cop)) {
        throw new Error('Respuesta inválida de la fuente de tasas')
      }
      const t: TasaCambio = {
        tasa: cop,
        actualizada: data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString()
          : new Date().toISOString(),
        proximaActualizacion: data.time_next_update_utc
          ? new Date(data.time_next_update_utc).toISOString()
          : null,
        origen: 'api',
        fuente: 'ExchangeRate-API (tasa de mercado)',
      }
      guardarCache(t)
      return t
    } catch (error) {
      // Sin red o fuente caída: usar la última tasa conocida si existe.
      const cache = leerCache()
      if (cache) return cache
      throw error
    }
  },
}
