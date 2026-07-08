import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  Gift,
  Loader2,
  Package,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
  Warehouse,
} from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import { nombreCompleto } from '@/types/cliente'
import {
  useBodegas,
  useCombos,
  useEstilistas,
  useMetodosPago,
  useProductos,
  useRegistrarVenta,
  useServicios,
} from '@/hooks/useVentas'
import {
  cartItemSubtotal,
  type CartItem,
  type Combo,
  type PagoSeleccionado,
  type Producto,
  type Servicio,
  type VentaPayload,
} from '@/types/venta'
import { formatCOP } from '@/lib/format'
import { PageHeader } from '@/components/PageHeader'
import { Combobox, type ComboboxOption } from '@/components/Combobox'
import { AddProductoDialog } from '@/components/ventas/AddProductoDialog'
import { AddServicioDialog } from '@/components/ventas/AddServicioDialog'
import { AddComboDialog } from '@/components/ventas/AddComboDialog'
import { PagosSection } from '@/components/ventas/PagosSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function VentasPage() {
  const clientesQ = useClientes()
  const bodegasQ = useBodegas()
  const productosQ = useProductos()
  const serviciosQ = useServicios()
  const estilistasQ = useEstilistas()
  const combosQ = useCombos()
  const metodosPagoQ = useMetodosPago()
  const registrarVenta = useRegistrarVenta()

  const clientes = clientesQ.data ?? []
  const bodegas = bodegasQ.data ?? []
  const productos = productosQ.data ?? []
  const servicios = serviciosQ.data ?? []
  const estilistas = estilistasQ.data ?? []
  const combos = useMemo(
    () => (combosQ.data ?? []).filter((c) => c.activo),
    [combosQ.data],
  )
  const metodosPago = metodosPagoQ.data ?? []

  const [clienteId, setClienteId] = useState('')
  const [bodegaId, setBodegaId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [pagos, setPagos] = useState<PagoSeleccionado[]>([])
  const [fechaVenta, setFechaVenta] = useState('')

  // Entidades pendientes de configurar en un diálogo
  const [productoSel, setProductoSel] = useState<Producto | null>(null)
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null)
  const [comboSel, setComboSel] = useState<Combo | null>(null)

  const cliente = clientes.find((c) => String(c.id) === clienteId)
  const bodega = bodegas.find((b) => String(b.id) === bodegaId)

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + cartItemSubtotal(item), 0),
    [cart],
  )

  // Opciones de comboboxes
  const clienteOptions: ComboboxOption[] = clientes.map((c) => ({
    value: String(c.id),
    label: nombreCompleto(c),
    keywords: String(c.documentoidentidad),
  }))
  const productoOptions: ComboboxOption[] = productos.map((p) => ({
    value: String(p.id),
    label: p.nombre,
  }))
  const servicioOptions: ComboboxOption[] = servicios.map((s) => ({
    value: String(s.id),
    label: `${s.categoria} — ${s.nombre}`,
    keywords: s.nombre,
  }))
  const comboOptions: ComboboxOption[] = combos.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }))

  function changeBodega(id: string) {
    setBodegaId(id)
    // Los precios dependen del país: al cambiar bodega, quitamos productos y combos.
    setCart((prev) => prev.filter((item) => item.tipo === 'servicio'))
  }

  function addItem(item: CartItem) {
    setCart((prev) => [...prev, item])
  }

  function removeItem(uid: string) {
    setCart((prev) => prev.filter((i) => i.uid !== uid))
  }

  function resetForm() {
    setClienteId('')
    setBodegaId('')
    setCart([])
    setPagos([])
    setFechaVenta('')
  }

  async function handleRegistrar() {
    if (!cliente) return toast.warning('Seleccione un cliente')
    if (cart.length === 0)
      return toast.warning('Agregue al menos un producto, servicio o combo')
    if (pagos.length === 0)
      return toast.warning('Agregue al menos un método de pago')

    const totalPagos = pagos.reduce((s, p) => s + p.monto, 0)
    if (Math.abs(totalPagos - total) > 0.01) {
      return toast.warning(
        `Los pagos (${formatCOP(totalPagos)}) no coinciden con el total (${formatCOP(total)})`,
      )
    }

    const carrito = cart.map((item) => {
      switch (item.tipo) {
        case 'producto':
          return {
            producto_id: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
            tipo_precio_id: item.tipoPrecio.id,
            bodega_id: item.bodegaId,
          }
        case 'servicio':
          return {
            servicio_id: item.servicio.id,
            precio: item.precio,
            estilista_id: item.estilista.id,
            porcentaje_estilista: item.porcentajeEstilista,
            pago_estilista: item.comisionEstilista,
            es_cortesia: item.esCortesia,
          }
        case 'combo':
          return {
            combo_id: item.combo.id,
            cantidad: item.cantidad,
            bodega_id: item.bodegaId,
            precio_unitario: item.precioUnitario,
          }
      }
    })

    const payload: VentaPayload = {
      cliente_id: cliente.id,
      metodos_pago: pagos.map((p) => ({
        metodo_pago_id: p.metodo.id,
        monto: p.monto,
      })),
      carrito,
      ...(fechaVenta ? { fecha_venta: fechaVenta } : {}),
    }

    try {
      const res = await registrarVenta.mutateAsync(payload)
      toast.success(`Venta #${res.venta_id} registrada con éxito`)
      resetForm()
    } catch {
      // toast de error lo dispara el hook
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader title="Nueva Venta" subtitle="Registra una nueva venta" />

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-3">
        {/* Columna izquierda: constructor */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-navy">
                  <User className="h-4 w-4" /> Cliente
                </Label>
                <Combobox
                  options={clienteOptions}
                  value={clienteId}
                  onSelect={setClienteId}
                  placeholder="Seleccione un cliente"
                  searchPlaceholder="Buscar por nombre o documento..."
                  emptyText="Sin clientes"
                  disabled={clientesQ.isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-navy">
                  <Warehouse className="h-4 w-4" /> Bodega
                </Label>
                <Select value={bodegaId} onValueChange={changeBodega}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.nombre} ({b.paisId === 1 ? 'COL' : 'USA'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selectores de items */}
            {cliente && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-navy">
                    <Package className="h-4 w-4" /> Agregar producto
                  </Label>
                  <Combobox
                    actionMode
                    options={productoOptions}
                    onSelect={(v) =>
                      setProductoSel(productos.find((p) => String(p.id) === v) ?? null)
                    }
                    placeholder={
                      bodega ? 'Buscar producto...' : 'Seleccione una bodega primero'
                    }
                    searchPlaceholder="Buscar producto..."
                    emptyText="Sin productos"
                    disabled={!bodega}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-navy">
                    <Sparkles className="h-4 w-4" /> Agregar servicio
                  </Label>
                  <Combobox
                    actionMode
                    options={servicioOptions}
                    onSelect={(v) =>
                      setServicioSel(servicios.find((s) => String(s.id) === v) ?? null)
                    }
                    placeholder="Buscar servicio..."
                    searchPlaceholder="Buscar servicio..."
                    emptyText="Sin servicios"
                  />
                </div>

                {combos.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-navy">
                      <Package className="h-4 w-4" /> Agregar combo
                    </Label>
                    <Combobox
                      actionMode
                      options={comboOptions}
                      onSelect={(v) =>
                        setComboSel(combos.find((c) => String(c.id) === v) ?? null)
                      }
                      placeholder={
                        bodega ? 'Buscar combo...' : 'Seleccione una bodega primero'
                      }
                      searchPlaceholder="Buscar combo..."
                      emptyText="Sin combos"
                      disabled={!bodega}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carrito */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b p-4 text-navy">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="font-semibold">Carrito</h2>
              {cart.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({cart.length})
                </span>
              )}
            </div>
            {cart.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No hay productos, servicios ni combos agregados
              </p>
            ) : (
              <ul className="divide-y">
                {cart.map((item) => (
                  <li
                    key={item.uid}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CartItemLabel item={item} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <CartItemDetail item={item} />
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium tabular-nums">
                        {formatCOP(cartItemSubtotal(item))}
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

        {/* Columna derecha: resumen y pago */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm lg:sticky lg:top-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-navy font-semibold">Total</span>
              <span className="text-2xl font-bold text-navy">
                {formatCOP(total)}
              </span>
            </div>

            <PagosSection
              total={total}
              metodosPago={metodosPago}
              pagos={pagos}
              onChange={setPagos}
            />

            <div className="mt-4 space-y-1.5">
              <Label className="flex items-center gap-1.5 text-navy">
                <CalendarDays className="h-4 w-4" /> Fecha de venta (opcional)
              </Label>
              <Input
                type="date"
                value={fechaVenta}
                onChange={(e) => setFechaVenta(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si se deja vacío, se usa la fecha y hora actual.
              </p>
            </div>

            <Button
              variant="secondary"
              className="mt-4 w-full py-6 text-base"
              onClick={handleRegistrar}
              disabled={registrarVenta.isPending}
            >
              {registrarVenta.isPending && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              Registrar venta
            </Button>
          </div>
        </div>
      </div>

      {/* Diálogos */}
      {bodega && (
        <>
          <AddProductoDialog
            producto={productoSel}
            bodega={bodega}
            onClose={() => setProductoSel(null)}
            onAdd={addItem}
          />
          <AddComboDialog
            combo={comboSel}
            bodega={bodega}
            onClose={() => setComboSel(null)}
            onAdd={addItem}
          />
        </>
      )}
      <AddServicioDialog
        servicio={servicioSel}
        estilistas={estilistas}
        onClose={() => setServicioSel(null)}
        onAdd={addItem}
      />
    </div>
  )
}

function CartItemLabel({ item }: { item: CartItem }) {
  switch (item.tipo) {
    case 'producto':
      return <span className="truncate font-medium">{item.producto.nombre}</span>
    case 'servicio':
      return (
        <>
          <span className="truncate font-medium">{item.servicio.nombre}</span>
          {item.esCortesia && (
            <Badge variant="info" className="gap-1">
              <Gift className="h-3 w-3" /> Cortesía
            </Badge>
          )}
        </>
      )
    case 'combo':
      return (
        <>
          <span className="truncate font-medium">{item.combo.nombre}</span>
          <Badge variant="secondary">Combo</Badge>
        </>
      )
  }
}

function CartItemDetail({ item }: { item: CartItem }) {
  switch (item.tipo) {
    case 'producto':
      return (
        <>
          {item.cantidad} × {formatCOP(item.precioUnitario)} ·{' '}
          {item.tipoPrecio.nombre}
          {item.descuento > 0 ? ` · -${item.descuento}%` : ''}
        </>
      )
    case 'servicio':
      return (
        <>
          {item.estilista.nombre}
          {!item.esCortesia && ` · comisión ${formatCOP(item.comisionEstilista)}`}
        </>
      )
    case 'combo':
      return (
        <>
          {item.cantidad} × {formatCOP(item.precioUnitario)}
        </>
      )
  }
}
