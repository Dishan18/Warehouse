import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '18px',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 24px 48px -12px rgba(0, 0, 0, 0.6)'
              : '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
          {supplier ? 'Edit Supplier' : 'New Supplier'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {supplier ? 'Update vendor details and contact information' : 'Register a new vendor or procurement partner'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Supplier Name"
              placeholder="e.g. Acme Logistics, Global Tech Supply"
              fullWidth
              autoFocus
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Contact Person"
                placeholder="Name of account manager"
                fullWidth
                {...register('contactName')}
                error={Boolean(errors.contactName)}
                helperText={errors.contactName?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <TextField
                label="Email"
                type="email"
                placeholder="vendor@company.com"
                fullWidth
                {...register('email')}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
            </Stack>

            <TextField
              label="Phone Number"
              placeholder="+1 (555) 012-3456"
              fullWidth
              {...register('phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <TextField
              label="Physical Address"
              placeholder="Warehouse address, city, country"
              fullWidth
              multiline
              minRows={2}
              {...register('address')}
              error={Boolean(errors.address)}
              helperText={errors.address?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Active Supplier
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Available for product reordering and intake operations
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                  />
                )}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            onClick={onClose}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              px: 3,
            }}
          >
            {supplier ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
