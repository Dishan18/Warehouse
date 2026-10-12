import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import TuneIcon from '@mui/icons-material/Tune'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import toast from 'react-hot-toast'
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
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
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
      toast.success('Inventory report exported')
    } catch {
      toast.error('Failed to export inventory')
    }
  }

  const columns: Column<Product>[] = [
    {
      id: 'name',
      label: 'Product',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.name}
          </Typography>
        </Box>
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
          {row.categoryName || 'Unassigned'}
        </Typography>
      ),
    },
    {
      id: 'quantity',
      label: 'On Hand',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" fontWeight={700}>
          {row.quantity}
        </Typography>
      ),
    },
    {
      id: 'minStock',
      label: 'Min Threshold',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.minStock}
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
          <Tooltip title="Inbound (Receive stock)">
            <IconButton
              size="small"
              onClick={() => openMovement(row, 'INBOUND')}
              sx={{
                color: 'success.main',
                bgcolor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(52, 211, 153, 0.12)',
                borderRadius: '8px',
                p: 0.65,
                '&:hover': {
                  bgcolor: isLight ? 'rgba(5, 150, 105, 0.16)' : 'rgba(52, 211, 153, 0.22)',
                },
              }}
            >
              <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Outbound (Dispatch stock)">
            <IconButton
              size="small"
              onClick={() => openMovement(row, 'OUTBOUND')}
              sx={{
                color: 'error.main',
                bgcolor: isLight ? 'rgba(225, 29, 72, 0.08)' : 'rgba(244, 63, 94, 0.12)',
                borderRadius: '8px',
                p: 0.65,
                '&:hover': {
                  bgcolor: isLight ? 'rgba(225, 29, 72, 0.16)' : 'rgba(244, 63, 94, 0.22)',
                },
              }}
            >
              <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Stock Adjustment (Recount)">
            <IconButton
              size="small"
              onClick={() => openMovement(row, 'ADJUSTMENT')}
              sx={{
                color: 'warning.main',
                bgcolor: isLight ? 'rgba(217, 119, 6, 0.08)' : 'rgba(245, 158, 11, 0.12)',
                borderRadius: '8px',
                p: 0.65,
                '&:hover': {
                  bgcolor: isLight ? 'rgba(217, 119, 6, 0.16)' : 'rgba(245, 158, 11, 0.22)',
                },
              }}
            >
              <TuneIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      {/* Header bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.025em' }}>
            Live Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inspect real-time balances, receive stock, or log dispatches
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          onClick={handleExport}
          sx={{ borderRadius: '10px' }}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Filter and Search Bar */}
      <Box
        sx={{
          p: 1.75,
          mb: 2.5,
          borderRadius: '14px',
          bgcolor: 'background.paper',
          border: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)'}`,
          boxShadow: isLight ? '0 1px 3px rgba(0, 0, 0, 0.02)' : 'none',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search products by name or SKU..."
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
            sx={{ maxWidth: { sm: 380 } }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            Click action icons on any row to trigger an Inbound, Outbound, or Adjustment operation.
          </Typography>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Main Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={size}
        total={total}
        emptyMessage="No inventory products matched your filter."
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

      {/* Movement Modal */}
      <MovementDialog
        open={dialogOpen}
        product={selected}
        defaultType={movementType}
        onClose={() => setDialogOpen(false)}
        onSuccess={(message) => {
          setDialogOpen(false)
          toast.success(message)
          fetchProducts()
        }}
      />
    </Box>
  )
}
