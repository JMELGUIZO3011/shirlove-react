import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  HandCoins,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react'
import { useUsaProductos, useUsaRegistrarVenta, useUsaServicios } from '@/hooks/useUsa'
import { useClientes } from '@/hooks/useClientes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { nombreCompleto } from '@/types/cliente'
import { usaCartItemSubtotal, type UsaCartItem, type UsaVentaPayload } from '@/types/usa'
import { formatUSD } from '@/lib/format'
import { dateWithCurrentTime, toLocalDateTimeISO } from '@/lib/dateRange'
import { cn } from '@/lib/utils'
import { Combobox, type ComboboxOption } from '@/components/Combobox'
import { AutocompleteInput, type AutocompleteOption } from '@/components/AutocompleteInput'
import { UsaItemDialog, type UsaItemSeleccion } from '@/components/usa/UsaItemDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  metodosPago: string[]
}

// Punto de venta del Módulo USA: productos y servicios del catálogo USA,
// precios en USD, descuenta el inventario USA. No toca nada de Colombia.
export function UsaVentaTab({ metodosPago }: Props) {
  const productosQ = useUsaProductos()
  const serviciosQ = useUsaServicios()
  const registrar = useUsaRegistrarVenta()

  const productos = productosQ.data ?? []
  const servicios = serviciosQ.data ?? []

  const [cliente, setCliente] = useState('')
  const [metodoPago, setMetodoPago] = useState('')

  // Sugerencias de clientas desde la base de clientes de Colombia (búsqueda en
  // servidor con debounce). Solo se copia el nombre: la venta USA guarda texto
  // libre y no queda ligada al registro de Colombia.
  const clienteBusqueda = useDebouncedValue(cliente, 300)
  const clientesQ = useClientes({ search: clienteBusqueda, limit: 8 })
  const clienteOptions: AutocompleteOption[] = useMemo(() => {
    const vistos = new Set<string>()
    const out: AutocompleteOption[] = []
    for (const c of clientesQ.data ?? []) {
      const n = nombreCompleto(c)
      if (!n || vistos.has(n.toLowerCase())) continue
      vistos.add(n.toLowerCase())
      const detalle = c.telefono?.trim() || (c.documentoidentidad ? `CC ${c.documentoidentidad}` : undefined)
      out.push({ value: n, detail: detalle })
    }
    return out
  }, [clientesQ.data])
  const [fecha, setFecha] = useState('')
  const [notas, setNotas] = useState('')
  // Crédito (cuentas por cobrar)
  const [aCredito, setACredito] = useState(false)
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [abonoInicial, setAbonoInicial] = useState('')
  const [cart, setCart] = useState<UsaCartItem[]>([])
  const [seleccion, setSeleccion] = useState<UsaItemSeleccion | null>(null)

  const total = useMemo(() => cart.reduce((s, i) => s + usaCartItemSubtotal(i), 0), [cart])
  const abonoNum = aCredito && abonoInicial.trim() !== '' ? Number(abonoInicial) : 0
  const saldoCredito = Math.max(0, Math.round((total - abonoNum) * 100) / 100)

  const productoOptions: ComboboxOption[] = productos.map((p) => ({
    value: String(p.id),
    label: p.nombre,
    node: (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="truncate">{p.nombre}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatUSD(p.precio_venta)} · stock {p.cantidad}
        </span>
      </div>
    ),
  }))
  const servicioOptions: ComboboxOption[] = servicios.map((s) => ({
    value: String(s.id),
    label: `${s.categoria} — ${s.nombre}`,
    keywords: s.nombre,
    node: (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="truncate">
          {s.categoria} — {s.nombre}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{formatUSD(s.precio)}</span>
      </div>
    ),
  }))

  function removeItem(uid: string) {
    setCart((prev) => prev.filter((i) => i.uid !== uid))
  }

  function resetForm() {
    setCliente('')
    setMetodoPago('')
    setFecha('')
    setNotas('')
    setCart([])
    setACredito(false)
    setFechaVencimiento('')
    setAbonoInicial('')
  }

  async function handleRegistrar() {
    if (cart.length === 0) return toast.warning('Agregue al menos un producto o servicio')
    if (aCredito) {
      if (!Number.isFinite(abonoNum) || abonoNum < 0)
        return toast.warning('El abono inicial no es válido')
      if (abonoNum > total + 0.009)
        return toast.warning('El abono inicial no puede superar el total')
      if (abonoNum > 0 && !metodoPago)
        return toast.warning('Seleccione el método de pago del abono inicial')
    } else if (!metodoPago) {
      return toast.warning('Seleccione el método de pago')
    }

    const payload: UsaVentaPayload = {
      // Siempre enviamos la hora local del dispositivo (la mamá está en USA).
      fecha: fecha ? dateWithCurrentTime(fecha) : toLocalDateTimeISO(),
      cliente_nombre: cliente.trim() || null,
      metodo_pago: aCredito ? undefined : metodoPago,
      notas: notas.trim() || null,
      ...(aCredito
        ? {
            a_credito: true,
            fecha_vencimiento: fechaVencimiento || null,
            abono_inicial: abonoNum > 0 ? abonoNum : null,
            metodo_abono_inicial: abonoNum > 0 ? metodoPago : null,
          }
        : {}),
      items: cart.map((i) =>
        i.tipo === 'producto'
          ? {
              tipo: 'producto' as const,
              producto_id: i.producto!.id,
              cantidad: i.cantidad,
              precio_unitario: i.precioUnitario,
            }
          : {
              tipo: 'servicio' as const,
              servicio_id: i.servicio!.id,
              cantidad: i.cantidad,
              precio_unitario: i.precioUnitario,
            },
      ),
    }

    try {
      const res = await registrar.mutateAsync(payload)
      toast.success(
        res.a_credito
          ? `Venta USA #${res.id} a crédito registrada. Saldo por cobrar: ${formatUSD(res.saldo_pendiente)}`
          : `Venta USA #${res.id} registrada por ${formatUSD(res.total)}`,
      )
      resetForm()
    } catch {
      /* toast lo maneja el hook */
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Columna izquierda: constructor */}
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-navy">
                <User className="h-4 w-4" /> Cliente (opcional)
              </Label>
              <AutocompleteInput
                value={cliente}
                onChange={setCliente}
                options={clienteOptions}
                filter={false}
                loading={clientesQ.isFetching && clienteOptions.length === 0}
                heading="Clientas registradas"
                createLabel={(t) => `Registrar a nombre de «${t}»`}
                placeholder="Nombre de la clienta"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-navy">
                <CreditCard className="h-4 w-4" />{' '}
                {aCredito ? 'Método del abono inicial' : 'Método de pago'}
              </Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={aCredito ? 'Solo si hay abono inicial' : 'Seleccione'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {metodosPago.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-navy">
                <Package className="h-4 w-4" /> Agregar producto
              </Label>
              <Combobox
                actionMode
                options={productoOptions}
                onSelect={(v) => {
                  const p = productos.find((x) => String(x.id) === v)
                  if (p) setSeleccion({ tipo: 'producto', producto: p })
                }}
                placeholder={
                  productosQ.isLoading
                    ? 'Cargando productos...'
                    : productos.length === 0
                      ? 'No hay productos USA (créelos en Catálogo)'
                      : 'Buscar producto...'
                }
                searchPlaceholder="Buscar producto..."
                emptyText="Sin productos"
                disabled={productos.length === 0}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-navy">
                <Sparkles className="h-4 w-4" /> Agregar servicio
              </Label>
              <Combobox
                actionMode
                options={servicioOptions}
                onSelect={(v) => {
                  const s = servicios.find((x) => String(x.id) === v)
                  if (s) setSeleccion({ tipo: 'servicio', servicio: s })
                }}
                placeholder={
                  serviciosQ.isLoading
                    ? 'Cargando servicios...'
                    : servicios.length === 0
                      ? 'No hay servicios USA (créelos en Catálogo)'
                      : 'Buscar servicio...'
                }
                searchPlaceholder="Buscar servicio..."
                emptyText="Sin servicios"
                disabled={servicios.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b p-4 text-navy">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold">Carrito</h2>
            {cart.length > 0 && (
              <span className="text-sm text-muted-foreground">({cart.length})</span>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay productos ni servicios agregados
            </p>
          ) : (
            <ul className="divide-y">
              {cart.map((item) => (
                <li key={item.uid} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{item.descripcion}</span>
                      <Badge variant={item.tipo === 'producto' ? 'secondary' : 'info'}>
                        {item.tipo === 'producto' ? 'Producto' : 'Servicio'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.cantidad} × {formatUSD(item.precioUnitario)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium tabular-nums">
                      {formatUSD(usaCartItemSubtotal(item))}
                    </span>
                    <button
                      onClick={() => removeItem(item.uid)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Quitar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna derecha: resumen */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-semibold text-navy">Total</span>
            <span className="text-2xl font-bold text-navy">{formatUSD(total)}</span>
          </div>

          {/* Venta a crédito: queda en la pestaña "Por cobrar" hasta que se cobre */}
          <div
            className={cn(
              'rounded-lg border p-3 transition-colors',
              aCredito ? 'border-amber-300 bg-amber-50' : 'bg-muted/40',
            )}
          >
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-sm font-medium text-navy">
                <HandCoins className="h-4 w-4" /> Venta a crédito
              </span>
              <Switch checked={aCredito} onCheckedChange={setACredito} />
            </label>
            {aCredito && (
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-navy">
                    <CalendarClock className="h-3.5 w-3.5" /> Fecha límite de pago (opcional)
                  </Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-navy">Abono inicial (USD, opcional)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-9"
                    placeholder="0.00"
                    value={abonoInicial}
                    onChange={(e) => setAbonoInicial(e.target.value)}
                  />
                </div>
                <div className="flex items-baseline justify-between border-t border-amber-200 pt-2 text-sm">
                  <span className="text-muted-foreground">Queda por cobrar</span>
                  <span className="font-bold tabular-nums text-amber-700">
                    {formatUSD(saldoCredito)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1.5">
            <Label className="flex items-center gap-1.5 text-navy">
              <CalendarDays className="h-4 w-4" /> Fecha de venta (opcional)
            </Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Si se deja vacío, se usa la fecha y hora actual.
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label className="flex items-center gap-1.5 text-navy">
              <StickyNote className="h-4 w-4" /> Notas (opcional)
            </Label>
            <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <Button
            variant="secondary"
            className="mt-4 w-full py-6 text-base"
            onClick={handleRegistrar}
            disabled={registrar.isPending}
          >
            {registrar.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            {aCredito ? 'Registrar venta a crédito' : 'Registrar venta'}
          </Button>
        </div>
      </div>

      <UsaItemDialog
        seleccion={seleccion}
        onClose={() => setSeleccion(null)}
        onAdd={(item) => setCart((prev) => [...prev, item])}
      />
    </div>
  )
}
