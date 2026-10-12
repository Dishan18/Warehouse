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
import { userApi } from '../api/userApi'
import type { CreateUserRequest, UpdateUserRequest, User, UserRole } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import ConfirmDialog from '../components/common/ConfirmDialog'
import UserFormDialog from '../features/users/UserFormDialog'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../context/AuthContext'

const ROLE_COLORS: Record<UserRole, 'primary' | 'secondary' | 'default'> = {
  ADMIN: 'primary',
  MANAGER: 'secondary',
  EMPLOYEE: 'default',
}

export default function Users() {
  const { email: currentEmail } = useAuth()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const [rows, setRows] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userApi.getAll({
        page,
        size,
        sortBy: 'createdAt',
        direction: 'desc',
        search: debouncedSearch || undefined,
      })
      setRows(res.content)
      setTotal(res.totalElements)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, size, debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreate = () => {
    setEditing(null)
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setEditing(user)
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleCreate = async (data: CreateUserRequest) => {
    try {
      await userApi.create(data)
      setDialogOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      setDialogError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to create user',
      )
    }
  }

  const handleUpdate = async (data: UpdateUserRequest) => {
    if (!editing) return
    try {
      await userApi.update(editing.id, data)
      setDialogOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      setDialogError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to update user',
      )
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await userApi.delete(deleting.id)
      setDeleting(null)
      fetchUsers()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to delete user',
      )
      setDeleting(null)
    }
  }

  const columns: Column<User>[] = [
    {
      id: 'name',
      label: 'Name',
      render: (row) => (
        <b>
          {row.firstName} {row.lastName}
          {row.email === currentEmail && ' (you)'}
        </b>
      ),
    },
    { id: 'email', label: 'Email', render: (row) => row.email },
    { id: 'phoneNumber', label: 'Phone', render: (row) => row.phoneNumber ?? '—' },
    {
      id: 'roles',
      label: 'Roles',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {row.roles.map((role) => (
            <Chip key={role} label={role} color={ROLE_COLORS[role]} size="small" />
          ))}
        </Stack>
      ),
    },
    {
      id: 'enabled',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.enabled ? 'Active' : 'Disabled'}
          color={row.enabled ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    { id: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton size="small" onClick={() => openEdit(row)}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            disabled={row.email === currentEmail}
            title={row.email === currentEmail ? 'You cannot delete your own account' : ''}
            onClick={() => setDeleting(row)}
          >
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
          Users
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New user
        </Button>
      </Toolbar>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ my: 2 }} alignItems="center">
        <TextField
          label="Search"
          placeholder="Search by name or email"
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
          fetchUsers()
        }}
        onPageSizeChange={(newSize) => {
          setSize(newSize)
          setPage(0)
          fetchUsers()
        }}
      />

      <UserFormDialog
        open={dialogOpen}
        user={editing}
        error={dialogError}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user"
        message={`Are you sure you want to delete ${deleting?.firstName} ${deleting?.lastName}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
