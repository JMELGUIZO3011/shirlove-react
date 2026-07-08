import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PuntoDia, PuntoMes } from '@/lib/reporteCalculos'
import { formatCOP } from '@/lib/format'

const NAVY = '#002B5C'
const GOLD = '#B5873A'
const GRID = '#e1e0d9'
const AXIS = '#898781'

const compact = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-navy">{title}</h3>
      {children}
    </div>
  )
}

export function VentasDiaChart({ data }: { data: PuntoDia[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.fecha.slice(8, 10) + '/' + d.fecha.slice(5, 7),
  }))
  return (
    <ChartCard title="Ventas por día">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="ventasFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity={0.25} />
              <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => compact.format(v as number)}
          />
          <Tooltip
            formatter={(v) => [formatCOP(v as number), 'Ingresos']}
            labelStyle={{ color: '#0b0b0b' }}
            contentStyle={{ borderRadius: 8, border: '1px solid #e1e0d9', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke={NAVY}
            strokeWidth={2}
            fill="url(#ventasFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function MensualChart({ data }: { data: PuntoMes[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.mes.slice(5, 7) + '/' + d.mes.slice(2, 4),
  }))
  return (
    <ChartCard title="Ingresos vs Ganancia por mes">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS }}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => compact.format(v as number)}
          />
          <Tooltip
            formatter={(v, name) => [formatCOP(v as number), name as string]}
            contentStyle={{ borderRadius: 8, border: '1px solid #e1e0d9', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="ingresos"
            name="Ingresos"
            stroke={NAVY}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="ganancia"
            name="Ganancia neta"
            stroke={GOLD}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

interface BarDatum {
  nombre: string
  valor: number
}

// Barras horizontales simples (top N) — magnitud, una sola serie.
export function TopBars({
  title,
  data,
  color = NAVY,
  formatValue = (v: number) => String(v),
}: {
  title: string
  data: BarDatum[]
  color?: string
  formatValue?: (v: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.valor))
  return (
    <ChartCard title={title}>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.nombre} className="text-sm">
              <div className="mb-0.5 flex justify-between gap-2">
                <span className="truncate text-foreground">{d.nombre}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatValue(d.valor)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(d.valor / max) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}
