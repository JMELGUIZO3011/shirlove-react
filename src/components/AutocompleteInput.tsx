import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react'
import { Check, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface AutocompleteOption {
  value: string
  /** Texto secundario a la derecha (ej: precio, categoría). */
  detail?: string
}

interface Props extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'list'> {
  value: string
  onChange: (value: string) => void
  options: AutocompleteOption[]
  /** Encabezado del desplegable (ej: "Del catálogo de Colombia"). */
  heading?: string
  /** Máximo de sugerencias visibles. */
  maxItems?: number
  /** Texto para la fila "crear nuevo" cuando lo escrito no coincide con ninguna opción. */
  createLabel?: (texto: string) => string
  /**
   * false cuando las opciones ya vienen filtradas por el servidor (búsqueda remota):
   * se muestran tal cual, sin filtrar localmente.
   */
  filter?: boolean
  /** Muestra "Buscando..." mientras llegan resultados remotos. */
  loading?: boolean
}

function normalizar(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Campo de texto libre con sugerencias estilizadas (reemplaza el <datalist>
// nativo, que no se puede estilizar). Permite elegir una sugerencia o escribir
// un valor nuevo. Navegable con teclado: ↑ ↓ Enter Esc.
export function AutocompleteInput({
  value,
  onChange,
  options,
  heading,
  maxItems = 8,
  createLabel,
  filter = true,
  loading = false,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  ...inputProps
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)

  const query = normalizar(value)
  const filtradas = useMemo(() => {
    const base =
      filter && query ? options.filter((o) => normalizar(o.value).includes(query)) : options
    // Las que empiezan por lo escrito van primero.
    return [...base]
      .sort((a, b) => {
        const sa = normalizar(a.value).startsWith(query) ? 0 : 1
        const sb = normalizar(b.value).startsWith(query) ? 0 : 1
        return sa - sb || a.value.localeCompare(b.value, 'es')
      })
      .slice(0, maxItems)
  }, [options, query, maxItems, filter])

  const coincideExacto = options.some((o) => normalizar(o.value) === query)
  const mostrarCrear = Boolean(createLabel) && query.length > 0 && !coincideExacto
  const totalFilas = filtradas.length + (mostrarCrear ? 1 : 0)
  const visible = open && (totalFilas > 0 || loading)

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  // Mantener la fila resaltada a la vista al navegar con teclado.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  function elegir(texto: string) {
    onChange(texto)
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(e)
    if (e.defaultPrevented) return
    if (!visible) {
      if (e.key === 'ArrowDown') setOpen(true)
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlight((h) => (h + 1) % totalFilas)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlight((h) => (h - 1 + totalFilas) % totalFilas)
        break
      case 'Enter':
        e.preventDefault()
        if (highlight < filtradas.length) elegir(filtradas[highlight].value)
        else setOpen(false) // fila "crear nuevo": se conserva lo escrito
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  return (
    <div className="relative">
      <Input
        {...inputProps}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={(e) => {
          setOpen(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setOpen(false)
          onBlur?.(e)
        }}
        onKeyDown={handleKeyDown}
      />

      {visible && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          // Evita que el input pierda el foco (y se cierre la lista) antes del clic.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {heading && (filtradas.length > 0 || loading) && (
            <li className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</li>
          )}
          {loading && filtradas.length === 0 && (
            <li className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-gold" /> Buscando...
            </li>
          )}
          {filtradas.map((o, i) => {
            const seleccionada = normalizar(o.value) === query
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={i === highlight}
                data-index={i}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => elegir(o.value)}
                className={cn(
                  'flex cursor-pointer select-none items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm',
                  i === highlight && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Check className={cn('h-4 w-4 shrink-0', seleccionada ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{o.value}</span>
                </span>
                {o.detail && (
                  <span className="shrink-0 text-xs text-muted-foreground">{o.detail}</span>
                )}
              </li>
            )
          })}
          {mostrarCrear && (
            <li
              role="option"
              aria-selected={highlight === filtradas.length}
              data-index={filtradas.length}
              onMouseEnter={() => setHighlight(filtradas.length)}
              onClick={() => setOpen(false)}
              className={cn(
                'mt-1 flex cursor-pointer select-none items-center gap-2 rounded-sm border-t px-2 py-1.5 pt-2 text-sm text-navy',
                highlight === filtradas.length && 'bg-accent text-accent-foreground',
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">{createLabel!(value.trim())}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
