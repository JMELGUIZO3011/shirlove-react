// Formato de moneda para pesos colombianos (COP) sin decimales.
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCOP(value: number): string {
  return copFormatter.format(Number.isFinite(value) ? value : 0)
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatUSD(value: number): string {
  return usdFormatter.format(Number.isFinite(value) ? value : 0)
}

// Formatea según el país (USA → USD, resto → COP).
export function formatMoneyByPais(value: number, paisNombre?: string | null): string {
  return paisNombre === 'USA' ? formatUSD(value) : formatCOP(value)
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

export function formatFecha(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(d.getTime()) ? String(value) : dateFormatter.format(d)
}
