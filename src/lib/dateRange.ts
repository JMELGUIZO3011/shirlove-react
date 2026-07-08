// Utilidades de rango de fechas para reportes (en hora local).

export interface DateRange {
  inicio: string // YYYY-MM-DD
  fin: string // YYYY-MM-DD
}

export type RangePreset = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado'

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function presetRange(preset: Exclude<RangePreset, 'personalizado'>): DateRange {
  const now = new Date()
  const hoy = toYMD(now)
  switch (preset) {
    case 'hoy':
      return { inicio: hoy, fin: hoy }
    case 'semana': {
      const inicio = new Date(now)
      inicio.setDate(now.getDate() - 6)
      return { inicio: toYMD(inicio), fin: hoy }
    }
    case 'mes': {
      const inicio = new Date(now.getFullYear(), now.getMonth(), 1)
      return { inicio: toYMD(inicio), fin: hoy }
    }
    case 'anio': {
      const inicio = new Date(now.getFullYear(), 0, 1)
      return { inicio: toYMD(inicio), fin: hoy }
    }
  }
}

// El backend espera 'YYYY-MM-DDTHH:mm:ss' sin zona horaria.
export function toBackendRange(range: DateRange): { inicio: string; fin: string } {
  return {
    inicio: `${range.inicio}T00:00:00`,
    fin: `${range.fin}T23:59:59`,
  }
}
