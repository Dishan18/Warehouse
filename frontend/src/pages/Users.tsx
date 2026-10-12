import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
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
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import { userApi } from '../api/userApi'
import type { CreateUserRequest, UpdateUserRequest, User, UserRole } from '../types'
import DataTable, { type Column } from '../components/common/DataTable'
import ConfirmDialog from '../components/common/ConfirmDialog'
import UserFormDialog from '../features/users/UserFormDialog'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../context/AuthContext'

function getRoleBadge(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Admin',
        icon: <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 14 }} />,
        bgcolor: 'rgba(99, 102, 241, 0.12)',
        color: '#6366f1',
      }
    case 'MANAGER':
      return {
        label: 'Manager',
        icon: <SupervisorAccountOutlinedIcon sx={{ fontSize: 14 }} />,
        bgcolor: 'rgba(168, 85, 247, 0.12)',
        color: '#a855f7',
      }
    case 'EMPLOYEE':
    default:
      return {
        label: 'Employee',
        icon: <BadgeOutlinedIcon sx={{ fontSize: 14 }} />,
        bgcolor: 'rgba(107, 114, 128, 0.12)',
        color: '#6b7280',
      }
  }
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
      label: 'Team Member',
      render: (row) => {
        const initials = `${row.firstName?.[0] || ''}${row.lastName?.[0] || ''}`.toUpperCase()
        const isSelf = row.email === currentEmail
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.8rem',
                fontWeight: 600,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)',
                color: 'primary.main',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.2)',
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {row.firstName} {row.lastName}
                </Typography>
                {isSelf && (
                  <Chip
                    label="You"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      bgcolor: 'primary.main',
                      color: '#ffffff',
                    }}
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {row.email}
              </Typography>
            </Box>
          </Stack>
        )
      },
    },
    {
      id: 'phoneNumber',
      label: 'Phone',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.phoneNumber || 'None'}
        </Typography>
      ),
    },
    {
      id: 'roles',
      label: 'Role Access',
      render: (row) => (
        <Stack direction="row" spacing={0.5}>
          {row.roles.map((role) => {
            const badge = getRoleBadge(role)
            return (
              <Chip
                key={role}
                icon={badge.icon}
                label={badge.label}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  borderRadius: '6px',
                  bgcolor: badge.bgcolor,
                  color: badge.color,
                  border: 'none',
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            )
          })}
        </Stack>
      ),
    },
    {
      id: 'enabled',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.enabled ? 'Active' : 'Disabled'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            borderRadius: '6px',
            bgcolor: row.enabled
              ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)')
              : (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
            color: row.enabled ? 'primary.main' : 'text.secondary',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      render: (row) => (
        <Typography variant="caption" color="text.secondary">
          {new Date(row.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const isSelf = row.email === currentEmail
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Edit user" arrow>
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
            <Tooltip title={isSelf ? 'You cannot delete your own account' : 'Delete user'} arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={isSelf}
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
              </span>
            </Tooltip>
          </Stack>
        )
      },
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
            Users & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage warehouse team accounts, role authorizations, and platform credentials
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
          New user
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
          placeholder="Search team members by name or email..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          sx={{
            maxWidth: 380,
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
        title="Delete User"
        message={`Are you sure you want to delete ${deleting?.firstName} ${deleting?.lastName}? This action will permanently revoke all access.`}
        confirmText="Delete"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </Box>
  )
}
