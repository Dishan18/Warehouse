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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
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
  product: Product | null
  error: string | null
  onClose: () => void
  onSubmit: (data: ProductRequest) => Promise<void>
}

export default function ProductFormDialog({
  open,
  product,
  error,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
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
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        description: product?.description ?? '',
        categoryId: product?.categoryId ?? '',
        supplierId: product?.supplierId ?? '',
        price: product?.price ?? 0,
        quantity: product?.quantity ?? 0,
        minStock: product?.minStock ?? 0,
        active: product?.active ?? true,
      })
    }
  }, [open, product, reset])

  useEffect(() => {
    if (open) {
      categoryApi
        .getAll({ page: 0, size: 100, sortBy: 'name', direction: 'asc' })
        .then((page) => setCategories(page.content))
        .catch(() => setCategories([]))
      supplierApi
        .getAll({ page: 0, size: 100, sortBy: 'name', direction: 'asc' })
        .then((page) => setSuppliers(page.content))
        .catch(() => setSuppliers([]))
    }
  }, [open])

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
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
                label="SKU"
                fullWidth
                {...register('sku')}
                error={Boolean(errors.sku)}
                helperText={errors.sku?.message}
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
            </Stack>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Price"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
                {...register('price')}
                error={Boolean(errors.price)}
                helperText={errors.price?.message}
              />
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                {...register('quantity')}
                error={Boolean(errors.quantity)}
                helperText={errors.quantity?.message}
              />
              <TextField
                label="Min stock"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                {...register('minStock')}
                error={Boolean(errors.minStock)}
                helperText={errors.minStock?.message}
              />
            </Stack>
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
            {product ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
