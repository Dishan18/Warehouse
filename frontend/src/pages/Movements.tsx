import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import toast from 'react-hot-toast'
import { movementApi } from '../api/movementApi'
import { reportApi } from '../api/reportApi'
import { downloadBlob } from '../utils/download'
import type { MovementType, StockMovement } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import { useDebounce } from '../hooks/useDebounce'

const TYPE_CONFIG: Record<MovementType, { label: string; color: 'success' | 'error' | 'warning' }> = {
  INBOUND: { label: 'Inbound', color: 'success' },
  OUTBOUND: { label: 'Outbound', color: 'error' },
  ADJUSTMENT: { label: 'Adjustment', color: 'warning' },
}

export default function Movements() {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [rows, setRows] = useState<StockMovement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await movementApi.getAll({
        page,
        size,
        sortBy: 'createdAt',
        direction: 'desc',
        search: debouncedSearch || undefined,
        type: (typeFilter as MovementType) || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load stock movements')
    } finally {
      setLoading(false)
    }
  }, [page, size, debouncedSearch, typeFilter])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const handleExport = async () => {
    try {
      const blob = await reportApi.exportMovements({
        search: debouncedSearch || undefined,
        type: (typeFilter as MovementType) || undefined,
      })
      downloadBlob(blob, 'movements.csv')
      toast.success('Stock movements exported')
    } catch {
      toast.error('Failed to export movements')
    }
  }

  const columns: Column<StockMovement>[] = [
    {
      id: 'createdAt',
      label: 'Timestamp',
      render: (row) => (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {new Date(row.createdAt).toLocaleString()}
        </Typography>
      ),
    },
    {
      id: 'productName',
      label: 'Product',
      render: (row) => (
        <Typography variant="body2" fontWeight={600}>
          {row.productName}
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
      id: 'type',
      label: 'Type',
      render: (row) => {
        const config = TYPE_CONFIG[row.type]
        return <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 600, height: 22 }} />
      },
    },
    {
      id: 'quantity',
      label: 'Delta Qty',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            color:
              row.type === 'INBOUND'
                ? 'success.main'
                : row.type === 'OUTBOUND'
                  ? 'error.main'
                  : 'text.primary',
          }}
        >
          {row.type === 'INBOUND' ? `+${row.quantity}` : row.type === 'OUTBOUND' ? `-${row.quantity}` : row.quantity}
        </Typography>
      ),
    },
    {
      id: 'beforeAfter',
      label: 'Before to After',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.beforeQuantity} to {row.afterQuantity}
        </Typography>
      ),
    },
    {
      id: 'reason',
      label: 'Reason',
      render: (row) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
          {row.reason || 'Standard operation'}
        </Typography>
      ),
    },
    {
      id: 'performedBy',
      label: 'Operator',
      render: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {row.performedBy}
        </Typography>
      ),
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.025em' }}>
            Stock Movements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Immutable audit record of all physical inventory transactions
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

      {/* Filter Bar */}
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
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
            sx={{ maxWidth: { sm: 380 } }}
          />

          <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Movement Type</InputLabel>
            <Select
              label="Movement Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="">All Movements</MenuItem>
              <MenuItem value="INBOUND">Inbound (Stock In)</MenuItem>
              <MenuItem value="OUTBOUND">Outbound (Stock Out)</MenuItem>
              <MenuItem value="ADJUSTMENT">Adjustment (Recount)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}

      {/* Movements Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        pageSize={size}
        total={total}
        emptyMessage="No stock movements recorded yet."
        onPageChange={(newPage) => {
          setPage(newPage)
          fetchMovements()
        }}
        onPageSizeChange={(newSize) => {
          setSize(newSize)
          setPage(0)
          fetchMovements()
        }}
      />
    </Box>
  )
}
