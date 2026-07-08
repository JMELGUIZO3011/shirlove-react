import { CalendarRange } from 'lucide-react'
import {
  presetRange,
  type DateRange,
  type RangePreset,
} from '@/lib/dateRange'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRESETS: { key: Exclude<RangePreset, 'personalizado'>; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Últimos 7 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'anio', label: 'Este año' },
]

function diasEntre(range: DateRange): number {
  const a = new Date(range.inicio)
  const b = new Date(range.fin)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1
}

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeControl({ value, onChange }: Props) {
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.key)
    return r.inicio === value.inicio && r.fin === value.fin
  })?.key

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-navy">
        <CalendarRange className="h-4 w-4" />
        <span className="text-sm font-semibold">
          {value.inicio} a {value.fin}
        </span>
        <span className="text-xs text-muted-foreground">
          ({diasEntre(value)} {diasEntre(value) === 1 ? 'día' : 'días'})
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={activePreset === p.key ? 'secondary' : 'outline'}
            onClick={() => onChange(presetRange(p.key))}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input
            type="date"
            className="h-9 w-40"
            value={value.inicio}
            max={value.fin}
            onChange={(e) => onChange({ ...value, inicio: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input
            type="date"
            className="h-9 w-40"
            value={value.fin}
            min={value.inicio}
            onChange={(e) => onChange({ ...value, fin: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
