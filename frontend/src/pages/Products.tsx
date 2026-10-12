import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { productApi } from '../api/productApi'
import { categoryApi } from '../api/categoryApi'
import { reportApi } from '../api/reportApi'
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

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default function Products() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [sortBy, setSortBy] = useState('name')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

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
      } else {
        await productApi.create(data)
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
      setDeleting(null)
      fetchProducts()
    } catch {
      setError('Failed to delete product')
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
    } catch {
      setError('Failed to export products')
    }
  }

  const columns: Column<Product>[] = [
    { id: 'name', label: 'Name', render: (row) => <b>{row.name}</b> },
    { id: 'sku', label: 'SKU', render: (row) => <span style={{ fontFamily: 'monospace' }}>{row.sku}</span> },
    { id: 'categoryName', label: 'Category', render: (row) => row.categoryName ?? '—' },
    { id: 'supplierName', label: 'Supplier', render: (row) => row.supplierName ?? '—' },
    {
      id: 'price',
      label: 'Price',
      align: 'right',
      render: (row) => currency.format(row.price),
    },
    { id: 'quantity', label: 'Qty', align: 'right', render: (row) => row.quantity },
    {
      id: 'status',
      label: 'Status',
      render: (row) => {
        const config = STATUS_CONFIG[row.status]
        return <Chip label={config.label} color={config.color} size="small" />
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton size="small" onClick={() => openEdit(row)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleting(row)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={600}>
          Products
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New product
          </Button>
        </Stack>
      </Toolbar>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ my: 2 }}
        alignItems="center"
        flexWrap="wrap"
      >
        <TextField
          label="Search"
          placeholder="Search by name or SKU"
          size="small"
          sx={{ minWidth: 240 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="IN_STOCK">In stock</MenuItem>
            <MenuItem value="LOW_STOCK">Low stock</MenuItem>
            <MenuItem value="OUT_OF_STOCK">Out of stock</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="sku">SKU</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="quantity">Quantity</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Direction</InputLabel>
          <Select
            value={direction}
            label="Direction"
            onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={size}
        total={total}
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

      <ProductFormDialog
        open={dialogOpen}
        product={editing}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product"
        message={`Are you sure you want to delete "${deleting?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
