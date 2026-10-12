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
} from '@mui/material'
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New notification</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
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
                      error={Boolean(errors.recipient)}
                      helperText={errors.recipient?.message}
                    />
                  )}
                />
              )}
            />
            <TextField
              label="Title"
              fullWidth
              {...control.register('title')}
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
            />
            <TextField
              label="Message"
              fullWidth
              multiline
              minRows={3}
              {...control.register('message')}
              error={Boolean(errors.message)}
              helperText={errors.message?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Send
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
