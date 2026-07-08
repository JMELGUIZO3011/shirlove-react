import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCreateCliente, useUpdateCliente } from '@/hooks/useClientes'
import type { Cliente, ClientePayload } from '@/types/cliente'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Reglas alineadas con schemas/cliente_schema.py
const schema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  apellido: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  documentoidentidad: z
    .string()
    .trim()
    .min(1, 'Campo requerido')
    .regex(/^\d+$/, 'Solo números')
    .refine((v) => Number(v) > 0, 'Debe ser mayor que 0'),
  email: z
    .string()
    .trim()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      'Correo electrónico inválido',
    ),
  telefono: z.string().trim().max(20, 'Máximo 20 caracteres').optional(),
  direccion: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  cumpleanos: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  nombre: '',
  apellido: '',
  documentoidentidad: '',
  email: '',
  telefono: '',
  direccion: '',
  cumpleanos: '',
}

function toFormValues(cliente: Cliente): FormValues {
  return {
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    documentoidentidad: String(cliente.documentoidentidad),
    email: cliente.email ?? '',
    telefono: cliente.telefono ?? '',
    direccion: cliente.direccion ?? '',
    cumpleanos: cliente.cumpleanos ?? '',
  }
}

function toPayload(values: FormValues): ClientePayload {
  const clean = (v?: string) => {
    const t = v?.trim()
    return t ? t : null
  }
  return {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    documentoidentidad: Number(values.documentoidentidad),
    email: clean(values.email),
    telefono: clean(values.telefono),
    direccion: clean(values.direccion),
    cumpleanos: clean(values.cumpleanos),
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente | null
}

export function ClienteFormDialog({ open, onOpenChange, cliente }: Props) {
  const isEdit = Boolean(cliente)
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()
  const isSaving = createCliente.isPending || updateCliente.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  // Rellenar el formulario al abrir (crear = vacío, editar = datos del cliente)
  useEffect(() => {
    if (open) {
      reset(cliente ? toFormValues(cliente) : emptyValues)
    }
  }, [open, cliente, reset])

  async function onSubmit(values: FormValues) {
    const payload = toPayload(values)
    try {
      if (cliente) {
        await updateCliente.mutateAsync({ id: cliente.id, payload })
      } else {
        await createCliente.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // El toast de error lo dispara el hook; el diálogo permanece abierto.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">
            {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" error={errors.nombre?.message} required>
              <Input {...register('nombre')} disabled={isSaving} />
            </Field>
            <Field label="Apellido" error={errors.apellido?.message} required>
              <Input {...register('apellido')} disabled={isSaving} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Documento de identidad"
              error={errors.documentoidentidad?.message}
              required
            >
              <Input
                inputMode="numeric"
                {...register('documentoidentidad')}
                disabled={isSaving}
              />
            </Field>
            <Field label="Cumpleaños" error={errors.cumpleanos?.message}>
              <Input type="date" {...register('cumpleanos')} disabled={isSaving} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register('email')} disabled={isSaving} />
            </Field>
            <Field label="Teléfono" error={errors.telefono?.message}>
              <Input {...register('telefono')} disabled={isSaving} />
            </Field>
          </div>

          <Field label="Dirección" error={errors.direccion?.message}>
            <Textarea
              rows={2}
              {...register('direccion')}
              disabled={isSaving}
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
