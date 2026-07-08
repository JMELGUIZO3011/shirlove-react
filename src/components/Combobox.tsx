import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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
}: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          filter={(value, search, keywords) => {
            const haystack = `${value} ${keywords?.join(' ') ?? ''}`.toLowerCase()
            return haystack.includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
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
