import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserSearch,
  X,
} from 'lucide-react'
import { useClientes } from '@/hooks/useClientes'
import type { Cliente } from '@/types/cliente'
import { nombreCompleto } from '@/types/cliente'
import { PageHeader } from '@/components/PageHeader'
import { ClienteFormDialog } from '@/components/clientes/ClienteFormDialog'
import { ClienteDetailsDialog } from '@/components/clientes/ClienteDetailsDialog'
import { DeleteClienteDialog } from '@/components/clientes/DeleteClienteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type SortKey = 'nombre' | 'documento' | 'cumpleanos' | 'recientes'

// Normaliza texto para búsquedas (minúsculas, sin acentos).
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function matchesSearch(cliente: Cliente, terms: string[]): boolean {
  if (terms.length === 0) return true
  const haystack = normalize(
    [
      cliente.nombre,
      cliente.apellido,
      String(cliente.documentoidentidad),
      cliente.email ?? '',
      cliente.telefono ?? '',
    ].join(' '),
  )
  // Todos los términos deben aparecer (AND), igual que el backend /search.
  return terms.every((t) => haystack.includes(t))
}

function birthdayKey(value: string | null): number {
  if (!value) return 9999
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 9999
  return (d.getMonth() + 1) * 100 + d.getDate()
}

function formatCumple(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function ClientesPage() {
  const { data: clientes = [], isLoading, isError, error, refetch } =
    useClientes()

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('nombre')

  // Diálogos
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [details, setDetails] = useState<Cliente | null>(null)
  const [toDelete, setToDelete] = useState<Cliente | null>(null)

  const filtered = useMemo(() => {
    const terms = normalize(search.trim()).split(/\s+/).filter(Boolean)
    const list = clientes.filter((c) => matchesSearch(c, terms))
    const sorted = [...list]
    switch (sortKey) {
      case 'nombre':
        sorted.sort((a, b) =>
          nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'),
        )
        break
      case 'documento':
        sorted.sort((a, b) => a.documentoidentidad - b.documentoidentidad)
        break
      case 'cumpleanos':
        sorted.sort((a, b) => birthdayKey(a.cumpleanos) - birthdayKey(b.cumpleanos))
        break
      case 'recientes':
        sorted.sort(
          (a, b) =>
            new Date(b.fechaDeCreacion).getTime() -
            new Date(a.fechaDeCreacion).getTime(),
        )
        break
    }
    return sorted
  }, [clientes, search, sortKey])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente)
    setFormOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-100 to-white">
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Administra tu cartera de clientes"
      />

      <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {/* Barra de acciones */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, documento, email o teléfono..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Ordenar por nombre</SelectItem>
              <SelectItem value="documento">Ordenar por documento</SelectItem>
              <SelectItem value="cumpleanos">Próximos cumpleaños</SelectItem>
              <SelectItem value="recientes">Más recientes</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="secondary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Contenido */}
        <div className="rounded-xl border bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Cargando clientes...
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-destructive">
                {(error as Error)?.message ?? 'Error al cargar clientes'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
              <UserSearch className="h-10 w-10" />
              <p>
                {clientes.length === 0
                  ? 'Aún no hay clientes registrados'
                  : 'No se encontraron clientes con esa búsqueda'}
              </p>
              {clientes.length === 0 && (
                <Button variant="secondary" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Crear el primero
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="hidden lg:table-cell">Cumpleaños</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="cursor-pointer"
                    onClick={() => setDetails(cliente)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-medium text-white">
                          {cliente.nombre[0]?.toUpperCase()}
                        </span>
                        <span className="font-medium text-foreground">
                          {nombreCompleto(cliente)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {cliente.documentoidentidad}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {cliente.email || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {cliente.telefono || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatCumple(cliente.cumpleanos)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(cliente)}>
                            <Pencil className="text-navy" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setToDelete(cliente)}
                          >
                            <Trash2 />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && !isError && filtered.length > 0 && (
          <p className="mt-3 text-right text-xs text-muted-foreground">
            {filtered.length}
            {filtered.length === 1 ? ' cliente' : ' clientes'}
            {search && ` de ${clientes.length}`}
          </p>
        )}
      </div>

      {/* Diálogos */}
      <ClienteFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={editing}
      />
      <ClienteDetailsDialog
        cliente={details}
        open={details !== null}
        onOpenChange={(o) => !o && setDetails(null)}
        onEdit={openEdit}
      />
      <DeleteClienteDialog
        cliente={toDelete}
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
      />
    </div>
  )
}
