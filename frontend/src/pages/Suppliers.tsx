import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
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
    { id: 'name', label: 'Name', render: (row) => <b>{row.name}</b> },
    {
      id: 'contactName',
      label: 'Contact',
      render: (row) => row.contactName ?? '—',
    },
    { id: 'email', label: 'Email', render: (row) => row.email ?? '—' },
    { id: 'phone', label: 'Phone', render: (row) => row.phone ?? '—' },
    {
      id: 'productCount',
      label: 'Products',
      align: 'right',
      render: (row) => row.productCount,
    },
    {
      id: 'active',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.active ? 'Active' : 'Inactive'}
          color={row.active ? 'success' : 'default'}
          size="small"
        />
      ),
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
          Suppliers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          New supplier
        </Button>
      </Toolbar>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }} alignItems="center">
        <TextField
          label="Search"
          placeholder="Search by name"
          size="small"
          sx={{ minWidth: 260 }}
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
        title="Delete supplier"
        message={`Are you sure you want to delete "${deleting?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
