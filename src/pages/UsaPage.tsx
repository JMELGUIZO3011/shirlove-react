import { useState } from 'react'
import {
  Boxes,
  HandCoins,
  History,
  KeyRound,
  LogOut,
  ShoppingCart,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUsaEstado } from '@/hooks/useUsa'
import { revokeUsaAccess } from '@/lib/usaAccess'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/PageHeader'
import { UsaGate } from '@/components/usa/UsaGate'
import { UsaPasswordDialog } from '@/components/usa/UsaPasswordDialog'
import { UsaVentaTab } from '@/components/usa/UsaVentaTab'
import { UsaHistorialTab } from '@/components/usa/UsaHistorialTab'
import { UsaCuentasPorCobrarTab } from '@/components/usa/UsaCuentasPorCobrarTab'
import { UsaInventarioTab } from '@/components/usa/UsaInventarioTab'
import { UsaCatalogoTab } from '@/components/usa/UsaCatalogoTab'
import { Button } from '@/components/ui/button'

type Tab = 'venta' | 'historial' | 'por-cobrar' | 'inventario' | 'catalogo'

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'venta', label: 'Nueva venta', icon: ShoppingCart },
  { key: 'historial', label: 'Historial', icon: History },
  { key: 'por-cobrar', label: 'Por cobrar', icon: HandCoins },
  { key: 'inventario', label: 'Inventario', icon: Boxes },
  { key: 'catalogo', label: 'Catálogo', icon: Tags },
]

// Módulo USA: ventas, servicios e inventario del local en Estados Unidos.
// Datos y contabilidad completamente separados de Colombia (tablas usa_*, USD).
export function UsaPage() {
  return (
    <UsaGate>
      <UsaPageContent />
    </UsaGate>
  )
}

function UsaPageContent() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('venta')
  const [pwOpen, setPwOpen] = useState(false)
  const estadoQ = useUsaEstado()
  const metodosPago = estadoQ.data?.metodos_pago ?? []

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Módulo USA"
        subtitle="Ventas, servicios e inventario de Estados Unidos (USD)"
        actions={
          <>
            {user?.esAdmin && (
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => setPwOpen(true)}
              >
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Contraseña</span>
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={revokeUsaAccess}
              title="Salir del módulo (vuelve a pedir la contraseña)"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir del módulo</span>
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'bg-navy text-white' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'venta' && <UsaVentaTab metodosPago={metodosPago} />}
        {tab === 'historial' && <UsaHistorialTab />}
        {tab === 'por-cobrar' && <UsaCuentasPorCobrarTab metodosPago={metodosPago} />}
        {tab === 'inventario' && <UsaInventarioTab />}
        {tab === 'catalogo' && <UsaCatalogoTab />}
      </div>

      <UsaPasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  )
}
