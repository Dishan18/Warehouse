import { useCallback, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { userApi } from '../../api/userApi'
import { useAuth } from '../../context/AuthContext'
import type { SendNotificationRequest, UserOption } from '../../types'

const composeSchema = z.object({
  recipient: z
    .object({
      id: z.string().min(1, 'Recipient is required'),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    })
    .refine((r) => r.id.length > 0, { message: 'Recipient is required' }),
  title: z.string().min(1, 'Title is required').max(150, 'Title must be at most 150 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters'),
})

type ComposeFormValues = z.infer<typeof composeSchema>

interface ComposeNotificationDialogProps {
  open: boolean
  error: string | null
  onClose: () => void
  onSubmit: (data: SendNotificationRequest) => Promise<void>
}

export default function ComposeNotificationDialog({
  open,
  error,
  onClose,
  onSubmit,
}: ComposeNotificationDialogProps) {
  const { email } = useAuth()
  const [options, setOptions] = useState<UserOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  const loadOptions = useCallback(async (search?: string) => {
    setLoadingOptions(true)
    try {
      const results = await userApi.getRecipientOptions(search)
      setOptions(results.filter((option) => option.email !== email))
    } catch {
      setOptions([])
    } finally {
      setLoadingOptions(false)
    }
  }, [email])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: { recipient: null as unknown as UserOption, title: '', message: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ recipient: null as unknown as UserOption, title: '', message: '' })
      loadOptions()
    }
  }, [open, reset, loadOptions])

  const submit = (values: ComposeFormValues) => {
    onSubmit({
      recipientId: values.recipient.id,
      title: values.title,
      message: values.message,
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
          Compose Alert
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dispatch an instant push message to an active warehouse operator
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
            <Controller
              name="recipient"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={options}
                  loading={loadingOptions}
                  value={field.value}
                  getOptionLabel={(option) =>
                    `${option.firstName} ${option.lastName} (${option.email})`
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onInputChange={(_, value) => loadOptions(value || undefined)}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Recipient"
                      placeholder="Select operator..."
                      error={Boolean(errors.recipient)}
                      helperText={errors.recipient?.message}
                      InputProps={{
                        ...params.InputProps,
                        sx: { borderRadius: '10px' },
                      }}
                    />
                  )}
                />
              )}
            />
            <TextField
              label="Notification Title"
              placeholder="e.g. Critical stock reconciliation notice"
              fullWidth
              {...control.register('title')}
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />
            <TextField
              label="Message Body"
              placeholder="Write concise instructions or delivery details..."
              fullWidth
              multiline
              minRows={3}
              {...control.register('message')}
              error={Boolean(errors.message)}
              helperText={errors.message?.message}
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
            endIcon={<SendRoundedIcon sx={{ fontSize: 16 }} />}
            disabled={isSubmitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              px: 3,
            }}
          >
            Send Notification
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
