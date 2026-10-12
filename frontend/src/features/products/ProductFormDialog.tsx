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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import type { Category, Product, ProductRequest, Supplier } from '../../types'
import { categoryApi } from '../../api/categoryApi'
import { supplierApi } from '../../api/supplierApi'

const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be at most 50 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  quantity: z.coerce.number().int('Quantity must be an integer').min(0, 'Quantity must be positive'),
  minStock: z.coerce
    .number()
    .int('Minimum stock must be an integer')
    .min(0, 'Minimum stock must be positive'),
  active: z.boolean(),
})

type ProductFormInput = z.input<typeof productSchema>
type ProductFormValues = z.output<typeof productSchema>

interface ProductFormDialogProps {
  open: boolean
  product?: Product | null
  editing?: Product | null
  categories?: Category[]
  error: string | null
  onClose: () => void
  onSubmit: (data: ProductRequest) => Promise<void>
}

export default function ProductFormDialog({
  open,
  product,
  editing,
  categories: preloadedCategories,
  error,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  const activeProduct = editing ?? product ?? null
  const [categories, setCategories] = useState<Category[]>(preloadedCategories ?? [])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      categoryId: '',
      supplierId: '',
      price: 0,
      quantity: 0,
      minStock: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: activeProduct?.name ?? '',
        sku: activeProduct?.sku ?? '',
        description: activeProduct?.description ?? '',
        categoryId: activeProduct?.categoryId ?? '',
        supplierId: activeProduct?.supplierId ?? '',
        price: activeProduct?.price ?? 0,
        quantity: activeProduct?.quantity ?? 0,
        minStock: activeProduct?.minStock ?? 0,
        active: activeProduct?.active ?? true,
      })
    }
  }, [open, activeProduct, reset])

  useEffect(() => {
    if (open) {
      if (!preloadedCategories || preloadedCategories.length === 0) {
        categoryApi
          .getAll({ page: 0, size: 100, sortBy: 'name', direction: 'asc' })
          .then((page) => setCategories(page.content))
          .catch(() => setCategories([]))
      }
      supplierApi
        .getAll({ page: 0, size: 100, sortBy: 'name', direction: 'asc' })
        .then((page) => setSuppliers(page.content))
        .catch(() => setSuppliers([]))
    }
  }, [open, preloadedCategories])

  const submit = (values: ProductFormValues) => {
    onSubmit({
      name: values.name,
      sku: values.sku,
      description: values.description || undefined,
      categoryId: values.categoryId,
      supplierId: values.supplierId || undefined,
      price: values.price,
      quantity: values.quantity,
      minStock: values.minStock,
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
          {activeProduct ? 'Edit Product' : 'New Product'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {activeProduct ? 'Update SKU information and inventory parameters' : 'Register a new inventory item in the catalog'}
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
              label="Product Name"
              placeholder="e.g. Wireless Ergonomic Mouse"
              fullWidth
              autoFocus
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="SKU"
                placeholder="e.g. LOG-M-001"
                fullWidth
                {...register('sku')}
                error={Boolean(errors.sku)}
                helperText={errors.sku?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      label="Category"
                      value={field.value}
                      onChange={field.onChange}
                      error={Boolean(errors.categoryId)}
                      sx={{ borderRadius: '10px' }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>

            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    label="Supplier"
                    value={field.value}
                    onChange={field.onChange}
                    displayEmpty
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <TextField
              label="Description"
              placeholder="Product specs, notes, or storage conditions"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Unit Price"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
                {...register('price')}
                error={Boolean(errors.price)}
                helperText={errors.price?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <TextField
                label="Initial Quantity"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                {...register('quantity')}
                error={Boolean(errors.quantity)}
                helperText={errors.quantity?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
              <TextField
                label="Minimum Stock Threshold"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                {...register('minStock')}
                error={Boolean(errors.minStock)}
                helperText={errors.minStock?.message}
                InputProps={{ sx: { borderRadius: '10px' } }}
              />
            </Stack>

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
                          Active in Catalog
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Inactive products are hidden from movements and stock operations
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
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
