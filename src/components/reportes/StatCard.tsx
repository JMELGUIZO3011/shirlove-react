import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}

const toneText: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-navy',
  positive: 'text-green-600',
  negative: 'text-destructive',
  warning: 'text-orange-600',
}

export function StatCard({ label, value, subtitle, icon: Icon, tone = 'default' }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', toneText[tone])}>
        {value}
      </p>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
