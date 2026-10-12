import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import { auditLogApi } from '../api/auditLogApi'
import type { AuditLogEntry } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import { useDebounce } from '../hooks/useDebounce'

function getActionChip(action: string) {
  switch (action) {
    case 'CREATE':
    case 'INBOUND':
      return {
        bgcolor: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
      }
    case 'UPDATE':
    case 'ADJUSTMENT':
      return {
        bgcolor: 'rgba(59, 130, 246, 0.12)',
        color: '#3b82f6',
      }
    case 'DELETE':
      return {
        bgcolor: 'rgba(239, 68, 68, 0.12)',
        color: '#ef4444',
      }
    case 'OUTBOUND':
      return {
        bgcolor: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
      }
    default:
      return {
        bgcolor: 'rgba(107, 114, 128, 0.12)',
        color: '#6b7280',
      }
  }
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
      label: 'Timestamp',
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }} color="text.primary">
            {dateTime.format(new Date(row.createdAt))}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      render: (row) => {
        const style = getActionChip(row.action)
        return (
          <Chip
            label={row.action}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              borderRadius: '6px',
              bgcolor: style.bgcolor,
              color: style.color,
              border: 'none',
              letterSpacing: '0.02em',
            }}
          />
        )
      },
    },
    {
      id: 'entityType',
      label: 'Entity',
      render: (row) => (
        <Chip
          label={row.entityType}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            borderRadius: '6px',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            color: 'text.primary',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'details',
      label: 'Event Details',
      render: (row) => (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {row.details || 'None'}
        </Typography>
      ),
    },
    {
      id: 'performedBy',
      label: 'Operator',
      render: (row) => (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <PersonOutlineRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'nowrap' }}>
            {row.performedBy}
          </Typography>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.25 }}>
          Activity & Audit Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chronological record of stock operations, catalog changes, and administrative actions
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: '14px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <TextField
          placeholder="Filter audit events by action, entity, user, or details..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          sx={{
            maxWidth: 440,
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 19, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
                  <ClearRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
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
