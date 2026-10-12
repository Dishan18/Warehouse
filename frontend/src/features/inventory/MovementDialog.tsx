import { useEffect, useState } from 'react'
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
          Record Stock Movement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Execute an inventory adjustment, receipt, or dispatch operation
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={2.5}>
            {submitError && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {submitError}
              </Alert>
            )}

            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Target Product
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {product?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  SKU: {product?.sku}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Current On Hand
                </Typography>
                <Typography variant="body1" fontWeight={700} color="primary.main">
                  {product?.quantity ?? 0} units
                </Typography>
              </Box>
            </Box>

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Movement Type</InputLabel>
                  <Select
                    label="Movement Type"
                    value={field.value}
                    onChange={field.onChange}
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="INBOUND">Stock In (Receipt from supplier / return)</MenuItem>
                    <MenuItem value="OUTBOUND">Stock Out (Dispatch / shipment)</MenuItem>
                    <MenuItem value="ADJUSTMENT">Inventory Adjustment (Physical count reconciliation)</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <TextField
              label={type === 'ADJUSTMENT' ? 'New Reconciled Quantity' : 'Units to Transact'}
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              {...register('quantity')}
              error={Boolean(errors.quantity)}
              helperText={
                errors.quantity?.message ||
                (type === 'ADJUSTMENT'
                  ? 'Set the exact physical inventory count'
                  : type === 'INBOUND'
                    ? 'Units to add to current stock'
                    : 'Units to subtract from current stock')
              }
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <TextField
              label="Movement Reason / Memo"
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g. PO-8842 Delivery, damaged package write-off, annual audit"
              {...register('reason')}
              error={Boolean(errors.reason)}
              helperText={errors.reason?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />
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
            Confirm Transaction
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
