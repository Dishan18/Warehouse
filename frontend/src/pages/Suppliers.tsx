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
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { supplierApi } from '../api/supplierApi'
import type { Supplier, SupplierRequest } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import ConfirmDialog from '../components/common/ConfirmDialog'
import SupplierFormDialog from '../features/suppliers/SupplierFormDialog'
import { useDebounce } from '../hooks/useDebounce'

export default function Suppliers() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [rows, setRows] = useState<Supplier[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<Supplier | null>(null)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await supplierApi.getAll({
        page,
        size,
        sortBy: 'name',
        direction: 'asc',
        search: debouncedSearch || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }, [page, size, debouncedSearch])

  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  const openCreate = () => {
    setEditing(null)
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier)
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: SupplierRequest) => {
    try {
      if (editing) {
        await supplierApi.update(editing.id, data)
      } else {
        await supplierApi.create(data)
      }
      setDialogOpen(false)
      fetchSuppliers()
    } catch (err: unknown) {
      setDialogError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to save supplier',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await supplierApi.delete(deleting.id)
      setDeleting(null)
      fetchSuppliers()
    } catch {
      setError('Failed to delete supplier')
      setDeleting(null)
    }
  }

  const columns: Column<Supplier>[] = [
    {
      id: 'name',
      label: 'Supplier',
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
              color: 'info.main',
              flexShrink: 0,
            }}
          >
            <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {row.name}
            </Typography>
            {row.address && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 260 }}>
                {row.address}
              </Typography>
            )}
          </Box>
        </Stack>
      ),
    },
    {
      id: 'contactName',
      label: 'Contact Person',
      render: (row) => (
        <Typography variant="body2" color="text.primary">
          {row.contactName || 'Unassigned'}
        </Typography>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      render: (row) =>
        row.email ? (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <EmailOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.primary">
              {row.email}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            None
          </Typography>
        ),
    },
    {
      id: 'phone',
      label: 'Phone',
      render: (row) =>
        row.phone ? (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <PhoneOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.primary">
              {row.phone}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            None
          </Typography>
        ),
    },
    {
      id: 'productCount',
      label: 'Supplied Products',
      align: 'right',
      render: (row) => (
        <Chip
          label={`${row.productCount ?? 0} items`}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            borderRadius: '6px',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'active',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            borderRadius: '6px',
            bgcolor: row.active
              ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)')
              : (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
            color: row.active ? 'primary.main' : 'text.secondary',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit supplier" arrow>
            <IconButton
              size="small"
              onClick={() => openEdit(row)}
              sx={{
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  color: 'primary.main',
                },
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete supplier" arrow>
            <IconButton
              size="small"
              onClick={() => setDeleting(row)}
              sx={{
                borderRadius: '8px',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                  color: 'error.main',
                },
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 0.25 }}>
            Suppliers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vendor contacts, distribution partners, and procurement channels
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreate}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            px: 2,
            py: 0.85,
            '&:hover': {
              boxShadow: 'none',
            },
          }}
        >
          New supplier
        </Button>
      </Stack>

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
          placeholder="Search suppliers by name..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          sx={{
            maxWidth: 360,
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
          fetchSuppliers()
        }}
        onPageSizeChange={(newSize) => {
          setSize(newSize)
          setPage(0)
          fetchSuppliers()
        }}
      />

      <SupplierFormDialog
        open={dialogOpen}
        supplier={editing}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${deleting?.name}"? Linked items will lose their assigned supplier.`}
        confirmText="Delete"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
