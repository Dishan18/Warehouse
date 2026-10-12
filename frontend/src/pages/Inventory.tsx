import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import TuneIcon from '@mui/icons-material/Tune'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { productApi } from '../api/productApi'
import { reportApi } from '../api/reportApi'
import { downloadBlob } from '../utils/download'
import type { MovementType, Product, ProductStatus } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import MovementDialog from '../features/inventory/MovementDialog'
import { useDebounce } from '../hooks/useDebounce'

const STATUS_CONFIG: Record<ProductStatus, { label: string; color: 'success' | 'warning' | 'error' }> = {
  IN_STOCK: { label: 'In stock', color: 'success' },
  LOW_STOCK: { label: 'Low stock', color: 'warning' },
  OUT_OF_STOCK: { label: 'Out of stock', color: 'error' },
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [rows, setRows] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [movementType, setMovementType] = useState<MovementType>('INBOUND')
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productApi.getAll({
        page,
        size,
        sortBy: 'name',
        direction: 'asc',
        search: debouncedSearch || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [page, size, debouncedSearch])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const openMovement = (product: Product, type: MovementType) => {
    setSelected(product)
    setMovementType(type)
    setDialogOpen(true)
  }

  const handleExport = async () => {
    try {
      const blob = await reportApi.exportInventory()
      downloadBlob(blob, 'inventory.csv')
    } catch {
      setError('Failed to export inventory')
    }
  }

  const columns: Column<Product>[] = [
    { id: 'name', label: 'Name', render: (row) => <b>{row.name}</b> },
    { id: 'sku', label: 'SKU', render: (row) => <span style={{ fontFamily: 'monospace' }}>{row.sku}</span> },
    { id: 'categoryName', label: 'Category', render: (row) => row.categoryName ?? '—' },
    { id: 'quantity', label: 'Qty', align: 'right', render: (row) => row.quantity },
    { id: 'minStock', label: 'Min', align: 'right', render: (row) => row.minStock },
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
          <IconButton
            size="small"
            color="success"
            title="Stock in"
            onClick={() => openMovement(row, 'INBOUND')}
          >
            <AddCircleOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            title="Stock out"
            onClick={() => openMovement(row, 'OUTBOUND')}
          >
            <RemoveCircleOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="warning"
            title="Adjust"
            onClick={() => openMovement(row, 'ADJUSTMENT')}
          >
            <TuneIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={600}>
          Inventory
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </Toolbar>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }} alignItems="center">
        <TextField
          label="Search"
          placeholder="Search by name or SKU"
          size="small"
          sx={{ minWidth: 260 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Use the icons to receive, dispatch or adjust stock for a product.
        </Typography>
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

      <MovementDialog
        open={dialogOpen}
        product={selected}
        defaultType={movementType}
        onClose={() => setDialogOpen(false)}
        onSuccess={(message) => {
          setDialogOpen(false)
          setSnackbar(message)
          fetchProducts()
        }}
      />

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
    </Box>
  )
}
