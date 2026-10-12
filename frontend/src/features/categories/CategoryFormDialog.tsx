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
import type { Category, CategoryRequest } from '../../types'

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  active: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormDialogProps {
  open: boolean
  category: Category | null
  error: string | null
  onClose: () => void
  onSubmit: (data: CategoryRequest) => Promise<void>
}

export default function CategoryFormDialog({
  open,
  category,
  error,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', active: true },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? '',
        description: category?.description ?? '',
        active: category?.active ?? true,
      })
    }
  }, [open, category, reset])

  const submit = (values: CategoryFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      active: values.active,
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
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
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
            />
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={field.onChange} />
                  }
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
            {category ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
