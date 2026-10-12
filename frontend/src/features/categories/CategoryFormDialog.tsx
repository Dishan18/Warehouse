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
          {category ? 'Edit Category' : 'New Category'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {category ? 'Update classification details and catalog status' : 'Define a new product classification group'}
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
              label="Category Name"
              placeholder="e.g. Peripherals, Audio, Storage"
              fullWidth
              autoFocus
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <TextField
              label="Description"
              placeholder="Brief description of products in this category"
              fullWidth
              multiline
              minRows={3}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
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
                          Active Category
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Inactive categories will be hidden from new product creation
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
            {category ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
