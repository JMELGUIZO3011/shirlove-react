import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarClock,
  CalendarDays,
  Coins,
  CreditCard,
  HandCoins,
  Loader2,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Tags,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useUsaProductos, useUsaRegistrarVenta, useUsaServicios } from '@/hooks/useUsa'
import { useClientes } from '@/hooks/useClientes'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { nombreCompleto } from '@/types/cliente'
import {
  USA_LISTA_DEFAULT,
  USA_LISTAS_PRECIOS,
  usaCartItemSubtotal,
  usaPrecioEnLista,
  type UsaCartItem,
  type UsaListaPrecio,
  type UsaVentaPayload,
} from '@/types/usa'
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

interface PagoLocal {
  uid: string
  metodo: string
  monto: number
}

const redondear = (n: number) => Math.round(n * 100) / 100

// Punto de venta del Módulo USA: productos y servicios del catálogo USA,
// precios en USD, descuenta el inventario USA. No toca nada de Colombia.
// Pagos mixtos: varios métodos; lo que no se pague queda a crédito (Por cobrar).
export function UsaVentaTab({ metodosPago }: Props) {
  const productosQ = useUsaProductos()
  const serviciosQ = useUsaServicios()
  const registrar = useUsaRegistrarVenta()

  const productos = productosQ.data ?? []
  const servicios = serviciosQ.data ?? []

  const [cliente, setCliente] = useState('')

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
  const [cart, setCart] = useState<UsaCartItem[]>([])
  const [seleccion, setSeleccion] = useState<UsaItemSeleccion | null>(null)
  // Lista de precios de la venta (Particular, Mayorista, Estilista o Beauty Boss).
  // Se preselecciona al agregar cada producto; se puede cambiar por ítem.
  const [lista, setLista] = useState<UsaListaPrecio>(USA_LISTA_DEFAULT)

  // Pagos mixtos
  const [pagos, setPagos] = useState<PagoLocal[]>([])
  const [pagoMetodo, setPagoMetodo] = useState('')
  const [pagoMonto, setPagoMonto] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  // Propina
  const [tipMonto, setTipMonto] = useState('')
  const [tipMetodo, setTipMetodo] = useState('')
  const [tipPara, setTipPara] = useState('')

  const total = useMemo(() => redondear(cart.reduce((s, i) => s + usaCartItemSubtotal(i), 0)), [cart])
  const pagado = useMemo(() => redondear(pagos.reduce((s, p) => s + p.monto, 0)), [pagos])
  const restante = Math.max(0, redondear(total - pagado))
  const quedaCredito = cart.length > 0 && restante > 0.009

  const productoOptions: ComboboxOption[] = productos.map((p) => {
    const precioLista = usaPrecioEnLista(p, lista)
    return {
      value: String(p.id),
      label: p.nombre,
      node: (
        <div className="flex w-full items-center justify-between gap-3">
          <span className="truncate">{p.nombre}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatUSD(precioLista ?? p.precio_venta)}
            {precioLista === null && lista !== 'Particular' && ' (Part.)'} · stock {p.cantidad}
          </span>
        </div>
      ),
    }
  })
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

  function addPago() {
    if (!pagoMetodo) return toast.warning('Seleccione el método de pago')
    const monto = Number(pagoMonto)
    if (!Number.isFinite(monto) || monto <= 0) return toast.warning('Ingrese un monto válido')
    if (monto > restante + 0.009)
      return toast.warning(`El monto no puede superar lo que falta por pagar (${formatUSD(restante)})`)
    setPagos((prev) => [...prev, { uid: `${Date.now()}-${prev.length}`, metodo: pagoMetodo, monto: redondear(monto) }])
    setPagoMetodo('')
    setPagoMonto('')
  }

  function removePago(uid: string) {
    setPagos((prev) => prev.filter((p) => p.uid !== uid))
  }

  function resetForm() {
    setCliente('')
    setFecha('')
    setNotas('')
    setCart([])
    setLista(USA_LISTA_DEFAULT)
    setPagos([])
    setPagoMetodo('')
    setPagoMonto('')
    setFechaVencimiento('')
    setTipMonto('')
    setTipMetodo('')
    setTipPara('')
  }

  async function handleRegistrar() {
    if (cart.length === 0) return toast.warning('Agregue al menos un producto o servicio')
    if (pagado > total + 0.009) return toast.warning('Los pagos superan el total de la venta')
    const tipNum = tipMonto.trim() === '' ? 0 : Number(tipMonto)
    if (!Number.isFinite(tipNum) || tipNum < 0) return toast.warning('La propina no es válida')
    if (tipNum > 0 && !tipMetodo) return toast.warning('Seleccione el método de pago de la propina')

    const payload: UsaVentaPayload = {
      // Siempre enviamos la hora local del dispositivo (la mamá está en USA).
      fecha: fecha ? dateWithCurrentTime(fecha) : toLocalDateTimeISO(),
      cliente_nombre: cliente.trim() || null,
      notas: notas.trim() || null,
      pagos: pagos.map((p) => ({ metodo_pago: p.metodo, monto: p.monto })),
      fecha_vencimiento: quedaCredito && fechaVencimiento ? fechaVencimiento : null,
      tips: tipNum > 0 ? [{ monto: redondear(tipNum), metodo_pago: tipMetodo, para: tipPara.trim() || null }] : [],
      items: cart.map((i) =>
        i.tipo === 'producto'
          ? {
              tipo: 'producto' as const,
              producto_id: i.producto!.id,
              cantidad: i.cantidad,
              precio_unitario: i.precioUnitario,
              lista_precio: i.listaPrecio,
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
          ? `Venta USA #${res.id} registrada. Queda por cobrar ${formatUSD(res.saldo_pendiente)}`
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

          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-navy">
                <Tags className="h-4 w-4" /> Lista de precios
              </Label>
              <div className="flex flex-wrap gap-2">
                {USA_LISTAS_PRECIOS.map((l) => (
                  <button
                    key={l.nombre}
                    type="button"
                    onClick={() => setLista(l.nombre)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      lista === l.nombre ? 'border-navy bg-navy text-white' : 'bg-white text-muted-foreground hover:bg-muted',
                    )}
                    aria-pressed={lista === l.nombre}
                  >
                    {l.nombre}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Precio que se propone al agregar productos; se puede cambiar en cada uno. Los
                servicios no usan listas.
              </p>
            </div>

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
                      {item.listaPrecio && item.listaPrecio !== 'Particular' && (
                        <Badge variant="outline">{item.listaPrecio}</Badge>
                      )}
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

      {/* Columna derecha: pago y resumen */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-semibold text-navy">Total</span>
            <span className="text-2xl font-bold text-navy">{formatUSD(total)}</span>
          </div>

          {/* Pagos (pueden ser varios métodos) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-navy">
              <CreditCard className="h-4 w-4" /> Pagos
            </Label>
            {pagos.length > 0 && (
              <ul className="space-y-1.5">
                {pagos.map((p) => (
                  <li
                    key={p.uid}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{p.metodo}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium tabular-nums">{formatUSD(p.monto)}</span>
                      <button
                        onClick={() => removePago(p.uid)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Quitar pago"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {restante > 0.009 && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select value={pagoMetodo} onValueChange={setPagoMetodo}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Método" />
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
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-9 w-28"
                  placeholder="Monto"
                  value={pagoMonto}
                  onChange={(e) => setPagoMonto(e.target.value)}
                  onFocus={() => {
                    if (!pagoMonto) setPagoMonto(String(restante))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPago()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={addPago}
                  aria-label="Agregar pago"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagado</span>
                <span className="tabular-nums">{formatUSD(pagado)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Falta por pagar</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    restante > 0.009 ? 'text-amber-700' : 'text-green-600',
                  )}
                >
                  {formatUSD(restante)}
                </span>
              </div>
            </div>
          </div>

          {/* Lo que no se pague queda a crédito */}
          {quedaCredito && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                <HandCoins className="h-4 w-4" />
                {pagado > 0 ? 'El resto queda a crédito' : 'Toda la venta queda a crédito'}:{' '}
                <span className="font-bold tabular-nums">{formatUSD(restante)}</span>
              </p>
              <p className="mt-1 text-xs text-amber-800/80">
                Aparecerá en la pestaña «Por cobrar» hasta que se cobre.
              </p>
              <div className="mt-2 space-y-1.5">
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
            </div>
          )}

          {/* Propina (aparte del total de la venta) */}
          <div className="mt-4 space-y-2 rounded-lg border p-3">
            <Label className="flex items-center gap-1.5 text-navy">
              <Coins className="h-4 w-4" /> Propina (opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                step="0.01"
                className="h-9 w-28"
                placeholder="0.00"
                value={tipMonto}
                onChange={(e) => setTipMonto(e.target.value)}
              />
              <div className="flex-1">
                <Select value={tipMetodo} onValueChange={setTipMetodo}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Método" />
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
            <Input
              className="h-9"
              placeholder="Para quién (opcional)"
              value={tipPara}
              onChange={(e) => setTipPara(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              No suma al total de la venta; se lleva aparte en la pestaña «Propinas».
            </p>
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
            {quedaCredito ? 'Registrar venta (resto a crédito)' : 'Registrar venta'}
          </Button>
        </div>
      </div>

      <UsaItemDialog
        seleccion={seleccion}
        listaInicial={lista}
        onClose={() => setSeleccion(null)}
        onAdd={(item) => setCart((prev) => [...prev, item])}
      />
    </div>
  )
}
