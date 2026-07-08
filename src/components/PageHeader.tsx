import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

// Barra superior con degradado reutilizable en las páginas internas.
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="bg-gradient-to-br from-navy to-gold px-4 py-3 text-white shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-white/90">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
