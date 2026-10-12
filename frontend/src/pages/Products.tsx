import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import toast from 'react-hot-toast'
import { productApi } from '../api/productApi'
import { categoryApi } from '../api/categoryApi'
import { reportApi } from '../api/reportApi'
import { settingsApi } from '../api/settingsApi'
import { downloadBlob } from '../utils/download'
import type { Category, Product, ProductRequest, ProductStatus } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import ConfirmDialog from '../components/common/ConfirmDialog'
import ProductFormDialog from '../features/products/ProductFormDialog'
import { useDebounce } from '../hooks/useDebounce'

const STATUS_CONFIG: Record<ProductStatus, { label: string; color: 'success' | 'warning' | 'error' }> = {
  IN_STOCK: { label: 'In stock', color: 'success' },
  LOW_STOCK: { label: 'Low stock', color: 'warning' },
  OUT_OF_STOCK: { label: 'Out of stock', color: 'error' },
}

export default function Products() {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortBy, setSortBy] = useState('name')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    settingsApi.get().then((s) => setCurrencyCode(s.currency)).catch(() => {})
  }, [])

  const [categories, setCategories] = useState<Category[]>([])
  const [rows, setRows] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<Product | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productApi.getAll({
        page,
        size,
        sortBy,
        direction,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        status: (statusFilter as ProductStatus) || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, size, sortBy, direction, debouncedSearch, categoryFilter, statusFilter])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    categoryApi
      .getAll({ page: 0, size: 100, sortBy: 'name', direction: 'asc' })
      .then((res) => setCategories(res.content))
      .catch(() => setCategories([]))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: ProductRequest) => {
    try {
      if (editing) {
        await productApi.update(editing.id, data)
        toast.success(`Updated ${data.name}`)
      } else {
        await productApi.create(data)
        toast.success(`Created ${data.name}`)
      }
      setDialogOpen(false)
      fetchProducts()
    } catch (err: unknown) {
      setDialogError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to save product',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await productApi.delete(deleting.id)
      toast.success(`Deleted ${deleting.name}`)
      setDeleting(null)
      fetchProducts()
    } catch {
      toast.error('Failed to delete product')
      setDeleting(null)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await reportApi.exportProducts({
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        status: (statusFilter as ProductStatus) || undefined,
      })
      downloadBlob(blob, 'products.csv')
      toast.success('Product catalog exported')
    } catch {
      toast.error('Failed to export products')
    }
  }

  const columns: Column<Product>[] = [
    {
      id: 'name',
      label: 'Product Name',
      render: (row) => (
        <Typography variant="body2" fontWeight={600}>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'sku',
      label: 'SKU',
      render: (row) => (
        <Typography
          component="span"
          sx={{
            fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.8rem',
            color: 'text.secondary',
            bgcolor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
            px: 0.85,
            py: 0.35,
            borderRadius: '6px',
          }}
        >
          {row.sku}
        </Typography>
      ),
    },
    {
      id: 'categoryName',
      label: 'Category',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.categoryName || 'None'}
        </Typography>
      ),
    },
    {
      id: 'supplierName',
      label: 'Supplier',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.supplierName || 'None'}
        </Typography>
      ),
    },
    {
      id: 'price',
      label: 'Unit Price',
      align: 'right',
      render: (row) => {
        try {
          return (
            <Typography variant="body2" fontWeight={600}>
              {new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
                style: 'currency',
                currency: currencyCode,
              }).format(row.price)}
            </Typography>
          )
        } catch {
          return `${currencyCode} ${Number(row.price || 0).toFixed(2)}`
        }
      },
    },
    {
      id: 'quantity',
      label: 'Stock',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" fontWeight={700}>
          {row.quantity}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const config = STATUS_CONFIG[row.status]
        return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, height: 22 }} />
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit Product">
            <IconButton
              size="small"
              onClick={() => openEdit(row)}
              sx={{
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', bgcolor: 'rgba(5, 150, 105, 0.08)' },
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Product">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleting(row)}
              sx={{
                borderRadius: '8px',
                '&:hover': { bgcolor: 'rgba(225, 29, 72, 0.08)' },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      {/* Page Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.025em' }}>
            Product Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage SKU listings, pricing, taxonomies, and vendor associations
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
            sx={{ borderRadius: '10px' }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ borderRadius: '10px' }}
          >
            New Product
          </Button>
        </Stack>
      </Stack>

      {/* Filter Toolbar */}
      <Box
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
          boxShadow: isLight ? '0 1px 3px rgba(0, 0, 0, 0.02)' : 'none',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search by product name or SKU..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 170, width: { xs: '100%', md: 'auto' } }}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="IN_STOCK">In Stock</MenuItem>
              <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
              <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Products Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={size}
        total={total}
        emptyMessage="No products found in the catalog."
        onPageChange={(newPage) => {
          setPage(newPage)
          fetchProducts()
        }}
        onPageSizeChange={(newSize) => {
          setSize(newSize)
          setPage(0)
          fetchProducts()
        }}
      />

      {/* Product Form Modal */}
      <ProductFormDialog
        open={dialogOpen}
        editing={editing}
        categories={categories}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
