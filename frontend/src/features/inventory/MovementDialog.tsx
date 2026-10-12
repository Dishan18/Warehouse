import { useEffect, useState } from 'react'
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { MovementType, Product } from '../../types'
import { movementApi } from '../../api/movementApi'

const movementSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND', 'ADJUSTMENT']),
  quantity: z.coerce.number().int('Must be an integer').min(0, 'Must be positive'),
  reason: z.string().min(1, 'Reason is required').max(255),
})

type MovementFormInput = z.input<typeof movementSchema>
type MovementFormValues = z.output<typeof movementSchema>

interface MovementDialogProps {
  open: boolean
  product: Product | null
  defaultType?: MovementType
  onClose: () => void
  onSuccess: (message: string) => void
}

export default function MovementDialog({
  open,
  product,
  defaultType = 'INBOUND',
  onClose,
  onSuccess,
}: MovementDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormInput, unknown, MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: defaultType, quantity: 0, reason: '' },
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const type = watch('type')

  useEffect(() => {
    if (open) {
      reset({ type: defaultType, quantity: 0, reason: '' })
      setSubmitError(null)
    }
  }, [open, defaultType, reset])

  const submit = async (values: MovementFormValues) => {
    if (!product) return
    const payload = { productId: product.id, quantity: values.quantity, reason: values.reason }
    try {
      switch (values.type) {
        case 'INBOUND':
          await movementApi.inbound(payload)
          onSuccess(`${values.quantity} units received for ${product.name}`)
          break
        case 'OUTBOUND':
          await movementApi.outbound(payload)
          onSuccess(`${values.quantity} units dispatched for ${product.name}`)
          break
        case 'ADJUSTMENT':
          await movementApi.adjust({ ...payload, quantity: values.quantity })
          onSuccess(`Stock adjusted to ${values.quantity} for ${product.name}`)
          break
      }
    } catch (err: unknown) {
      setSubmitError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to save movement',
      )
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Stock movement</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Product:{' '}
              <b>
                {product?.name} ({product?.sku})
              </b>
            </Typography>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={field.value} onChange={field.onChange}>
                    <MenuItem value="INBOUND">Stock in</MenuItem>
                    <MenuItem value="OUTBOUND">Stock out</MenuItem>
                    <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              label={type === 'ADJUSTMENT' ? 'New quantity' : 'Quantity'}
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              {...register('quantity')}
              error={Boolean(errors.quantity)}
              helperText={errors.quantity?.message}
            />
            <TextField
              label="Reason"
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g. Supplier delivery, damaged goods, stock count..."
              {...register('reason')}
              error={Boolean(errors.reason)}
              helperText={errors.reason?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Confirm
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
