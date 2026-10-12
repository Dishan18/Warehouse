import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { movementApi } from '../api/movementApi'
import { reportApi } from '../api/reportApi'
import { downloadBlob } from '../utils/download'
import type { MovementType, StockMovement } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import { useDebounce } from '../hooks/useDebounce'

const TYPE_CONFIG: Record<MovementType, { label: string; color: 'success' | 'error' | 'warning' }> = {
  INBOUND: { label: 'Stock in', color: 'success' },
  OUTBOUND: { label: 'Stock out', color: 'error' },
  ADJUSTMENT: { label: 'Adjustment', color: 'warning' },
}

export default function Movements() {
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
      setError('Failed to load movements')
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
    } catch {
      setError('Failed to export movements')
    }
  }

  const columns: Column<StockMovement>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    { id: 'productName', label: 'Product', render: (row) => <b>{row.productName}</b> },
    { id: 'sku', label: 'SKU', render: (row) => <span style={{ fontFamily: 'monospace' }}>{row.sku}</span> },
    {
      id: 'type',
      label: 'Type',
      render: (row) => {
        const config = TYPE_CONFIG[row.type]
        return <Chip label={config.label} color={config.color} size="small" />
      },
    },
    { id: 'quantity', label: 'Qty', align: 'right', render: (row) => row.quantity },
    {
      id: 'beforeAfter',
      label: 'Before → After',
      align: 'right',
      render: (row) => `${row.beforeQuantity} → ${row.afterQuantity}`,
    },
    { id: 'reason', label: 'Reason', render: (row) => row.reason },
    { id: 'performedBy', label: 'User', render: (row) => row.performedBy },
  ]

  return (
    <Box>
      <Toolbar disableGutters>
        <Typography variant="h5" fontWeight={600}>
          Movements
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
          placeholder="Search by product name or SKU"
          size="small"
          sx={{ minWidth: 240 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(0)
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="INBOUND">Stock in</MenuItem>
            <MenuItem value="OUTBOUND">Stock out</MenuItem>
            <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
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
