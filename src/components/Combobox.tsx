import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
  /** Texto adicional para el filtro de búsqueda (no visible). */
  keywords?: string
  /** Nodo opcional para renderizar la fila de forma enriquecida. */
  node?: React.ReactNode
}

interface Props {
  options: ComboboxOption[]
  value?: string | null
  onSelect: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  /** Si es true, no conserva el valor seleccionado como etiqueta (modo "acción"). */
  actionMode?: boolean
  /**
   * Notifica cada cambio del texto de búsqueda. Actívalo para búsquedas en
   * servidor: al recibirlo, el componente deja de filtrar localmente y muestra
   * exactamente las `options` que le pase el padre.
   */
  onSearchChange?: (query: string) => void
  /** Muestra un indicador de carga mientras llegan resultados del servidor. */
  loading?: boolean
}

// Selector con búsqueda reutilizable (reemplaza dropdown_search de Flutter).
export function Combobox({
  options,
  value,
  onSelect,
  placeholder = 'Seleccione...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Sin resultados',
  disabled,
  className,
  actionMode = false,
  onSearchChange,
  loading = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.find((o) => o.value === value)
  // Con búsqueda en servidor el padre ya envía las opciones filtradas.
  const serverSide = onSearchChange !== undefined

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next && serverSide) {
      setQuery('')
      onSearchChange('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {actionMode ? placeholder : (selected?.label ?? placeholder)}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command
          shouldFilter={!serverSide}
          filter={(value, search, keywords) => {
            const haystack = `${value} ${keywords?.join(' ') ?? ''}`.toLowerCase()
            return haystack.includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            value={serverSide ? query : undefined}
            onValueChange={
              serverSide
                ? (v) => {
                    setQuery(v)
                    onSearchChange(v)
                  }
                : undefined
            }
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                Buscando...
              </div>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                keywords={[option.label, option.keywords ?? '']}
                onSelect={(v) => {
                  onSelect(v)
                  setOpen(false)
                }}
              >
                {!actionMode && (
                  <Check
                    className={cn(
                      'h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )}
                {option.node ?? option.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
