// Equivalente a lib/models/cliente_model.dart + schemas/cliente_schema.py
// El backend ya devuelve claves usables en JS (documentoidentidad, generoId, etc.)
export interface Cliente {
  id: number
  nombre: string
  apellido: string
  documentoidentidad: number
  email: string | null
  telefono: string | null
  direccion: string | null
  generoId: number | null
  cumpleanos: string | null // ISO date (YYYY-MM-DD)
  fechaDeCreacion: string // ISO datetime
}

// Payload para crear/actualizar (coincide con ClienteCreate/ClienteUpdate)
export interface ClientePayload {
  nombre: string
  apellido: string
  documentoidentidad: number
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  generoId?: number | null
  cumpleanos?: string | null
}

export const nombreCompleto = (c: Pick<Cliente, 'nombre' | 'apellido'>) =>
  `${c.nombre} ${c.apellido}`.trim()
