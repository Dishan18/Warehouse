import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import type { Supplier, SupplierRequest } from '../../types'

const supplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  contactName: z.string().max(100).optional(),
  email: z
    .string()
    .email('Email must be valid')
    .max(150)
    .optional()
    .or(z.literal('')),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  active: z.boolean(),
})

type SupplierFormInput = z.input<typeof supplierSchema>
type SupplierFormValues = z.output<typeof supplierSchema>

interface SupplierFormDialogProps {
  open: boolean
  supplier: Supplier | null
  error: string | null
  onClose: () => void
  onSubmit: (data: SupplierRequest) => Promise<void>
}

export default function SupplierFormDialog({
  open,
  supplier,
  error,
  onClose,
  onSubmit,
}: SupplierFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormInput, unknown, SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: supplier?.name ?? '',
        contactName: supplier?.contactName ?? '',
        email: supplier?.email ?? '',
        phone: supplier?.phone ?? '',
        address: supplier?.address ?? '',
        active: supplier?.active ?? true,
      })
    }
  }, [open, supplier, reset])

  const submit = (values: SupplierFormValues) => {
    onSubmit({
      name: values.name,
      contactName: values.contactName || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      active: values.active,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{supplier ? 'Edit supplier' : 'New supplier'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              fullWidth
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Contact name"
                fullWidth
                {...register('contactName')}
                error={Boolean(errors.contactName)}
                helperText={errors.contactName?.message}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            </Stack>
            <TextField
              label="Phone"
              fullWidth
              {...register('phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              minRows={2}
              {...register('address')}
              error={Boolean(errors.address)}
              helperText={errors.address?.message}
            />
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Active"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {supplier ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
