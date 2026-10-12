import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { auditLogApi } from '../api/auditLogApi'
import type { AuditLogEntry } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import { useDebounce } from '../hooks/useDebounce'

const ACTION_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  INBOUND: 'success',
  OUTBOUND: 'warning',
  ADJUSTMENT: 'info',
  LOGIN: 'default',
  REGISTER: 'default',
}

const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function Activity() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)

  const [rows, setRows] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await auditLogApi.getAll({
        page,
        size,
        sortBy: 'createdAt',
        direction: 'desc',
        search: debouncedSearch || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }, [page, size, debouncedSearch])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const columns: Column<AuditLogEntry>[] = [
    {
      id: 'createdAt',
      label: 'Time',
      render: (row) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {dateTime.format(new Date(row.createdAt))}
        </Typography>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      render: (row) => (
        <Chip
          label={row.action}
          color={ACTION_COLORS[row.action] ?? 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'entityType',
      label: 'Entity',
      render: (row) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {row.entityType}
        </Typography>
      ),
    },
    {
      id: 'details',
      label: 'Details',
      render: (row) => row.details ?? '—',
    },
    {
      id: 'performedBy',
      label: 'Performed by',
      render: (row) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {row.performedBy}
        </Typography>
      ),
    },
  ]

  return (
    <Box>
      <Toolbar disableGutters>
        <Typography variant="h5" fontWeight={600}>
          Activity log
        </Typography>
      </Toolbar>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }} alignItems="center">
        <TextField
          label="Search"
          placeholder="Search by action, entity, details or user"
          size="small"
          sx={{ minWidth: 300 }}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
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
          fetchLogs()
        }}
        onPageSizeChange={(newSize) => {
          setSize(newSize)
          setPage(0)
          fetchLogs()
        }}
      />
    </Box>
  )
}
